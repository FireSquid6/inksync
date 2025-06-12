import type { Store, Update } from "../store";
import path from "path";
import { DELETED_HASH, IGNOREFILE_NAME, INKSYNC_DIRECTORY_NAME, MAX_FILE_SIZE } from "../constants";
import { type SyncResult } from "./results";
import type { SuccessfulUpdate } from "../vault";
import { hashBlob } from "../vault";
import type { Filesystem } from "../filesystem";
import { silentLogger, type Logger } from "../logger";
import { isIgnored } from "./ignorelist";
import type { VaultApi } from "./api";

export type Status = "PULL NEEDED" | "CONFLICT" | "PUSH NEEDED"

export class VaultClient {
  private fs: Filesystem;
  private store: Store;
  private vault: VaultApi;
  private logger: Logger


  constructor(store: Store, fs: Filesystem, vault: VaultApi, logger: Logger = silentLogger()) {
    this.fs = fs;
    this.vault = vault;

    this.store = store;
    this.logger = logger;
  }

  getAddress() {
    return this.vault.getAddress();
  }

  getVault() {
    return this.vault.getName();
  }

  async status(): Promise<[string, Status][]> {
    const serverUpdates = await this.getFreshServerUpdates();
    const modifiedFiles = await this.getAllModifiedFiles();

    const clientSet = new Set(modifiedFiles);
    const serverSet = new Set(serverUpdates.map((u) => u.filepath));

    const conflicts = clientSet.intersection(serverSet);

    // everything needed to be pulled
    const pushesNeeded = clientSet.difference(serverSet);

    // everything the server updated but is in sync here
    const pullsNeded = serverSet.difference(clientSet);

    const status: [string, Status][] = [];

    for (const conflict of conflicts) {
      status.push([conflict, "CONFLICT"]);
    }
    for (const pullNeeded of pullsNeded) {
      status.push([pullNeeded, "PULL NEEDED"]);
    }
    for (const pushNeeded of pushesNeeded) {
      status.push([pushNeeded, "PUSH NEEDED"]);
    }

    return status;
  }

  async syncAll(): Promise<[string, SyncResult][]> {
    const server = await this.syncServerUpdated();
    const client = await this.syncClientUpdated();

    return [...server, ...client];
  }
  async syncServerUpdated(): Promise<[string, SyncResult][]> {
    const updates = await this.getFreshServerUpdates();

    this.logger.log(`Got ${updates.length} updates from the server`);

    this.logger.log("Syncing from the server...");
    const results = await Promise.all(updates.map(async (u): Promise<[string, SyncResult]> => {
      const syncResult = await this.syncFile(u.filepath, u);
      this.logger.log(`  ${syncResult.type.toUpperCase()} - ${u.filepath}`);

      return [u.filepath, syncResult];
    }));
    this.logger.log("In sync with server!");

    await this.setLastServerPull(Date.now());
    return results;
  }

  async syncClientUpdated(): Promise<[string, SyncResult][]> {
    const files = await this.getAllModifiedFiles();
    this.logger.log("Found updated files on the client:");
    for (const file of files) {
      this.logger.log(`  ${file}`);
    }

    this.logger.log("Pushing from the client...");
    const results = await Promise.all(files.map(async (filepath): Promise<[string, SyncResult]> => {
      const syncResult = await this.syncFile(filepath);

      this.logger.log(`  ${syncResult.type.toUpperCase()} - ${filepath}`);
      return [filepath, syncResult];
    }));
    this.logger.log("Server in sync with client!");

    return results;
  }

  async syncFile(filepath: string, knownServerUpdate?: Update): Promise<SyncResult> {
    try {
      const size = await this.fs.sizeOf(filepath);
      if (size > MAX_FILE_SIZE) {
        return {
          domain: "bad",
          type: "client-error",
          error: `File is ${size} bytes which is too large (${MAX_FILE_SIZE}) needed`,
        }
      }

      const clientUpdate = await this.store.getRecord(filepath) ?? "UNTRACKED";
      const serverUpdate = knownServerUpdate ?? await this.vault.getUpdate(filepath);
      const isModified = await this.isFileModified(filepath, clientUpdate);
      const syncStatus = this.getSyncStatus(clientUpdate, serverUpdate);

      // client doesn't even remotely match server. Need to treat this as a conflict
      if (syncStatus === "fucked") {
        return {
          domain: "bad",
          type: "bad-sync",
        }
      }

      if (isModified === true && syncStatus === "out-of-sync") {
        // conflict
        if (serverUpdate === "UNTRACKED") {
          return {
            domain: "bad",
            type: "client-error",
            error: "Ended up in a state where a server update was untracked but there was a conflict. This should be impossible",
          }
        }

        const newFp = await this.resolveConflict(filepath, serverUpdate)
        return {
          domain: "good",
          type: "conflict",
          conflictFile: newFp,
        }

      } else if (isModified) {
        // push to the server

        const hash = (typeof clientUpdate === "string") ? "" : clientUpdate.hash;
        const res = await this.pushFile(filepath, hash);
        this.store.updateRecord(filepath, res.newHash, res.time);
        return {
          domain: "good",
          type: "pushed",
        }

      } else if (syncStatus === "out-of-sync") {
        // pull from server
        if (serverUpdate === "UNTRACKED") {
          return {
            type: "in-sync",
            domain: "good",
          }
        }
        await this.applyServerUpdate(serverUpdate);
        return {
          domain: "good",
          type: "pulled",
        }

      }

      return {
        domain: "good",
        type: "in-sync",
      }


    } catch (e) {
      return {
        domain: "bad",
        type: "client-error",
        error: e,
      }
    }
  }

  peekAtFile(filepath: string): Promise<Blob> {
    return this.fs.readFrom(filepath);
  }

  async ping(): Promise<number | string> {
    const start = Date.now();
    await this.vault.ping();
    const end = Date.now();

    return end - start;
  }

  private async resolveConflict(filepath: string, serverUpdate: Update) {
    // move the file to its own thing
    const extension = path.extname(filepath);
    const ending = `${formatDate(Date.now())}.${extension}.conflict`;
    const basename = path.basename(filepath, extension);
    const dirname = path.dirname(filepath);

    const newFilepath = path.join(dirname, `${basename}-${ending}`)
    this.fs.copyTo(filepath, newFilepath);

    await this.applyServerUpdate(serverUpdate)
    return newFilepath;
  }

  private async getFreshServerUpdates(): Promise<Update[]> {
    const lastUpdate = await this.getLastServerPull();
    const updates = await this.vault.updatesSince(lastUpdate);

    return updates;
  }

  private async getAllModifiedFiles(): Promise<string[]> {
    const modifiedFiles: string[] = []
    const ignoreList = await this.getIgnorePaths();

    const files = await this.fs.listdir("", true);


    const promises = files.map((filepath) => new Promise<void>(async (resolve) => {
      const update = await this.store.getRecord(filepath);
      if (await this.fs.isDir(filepath) || isIgnored(filepath, ignoreList)) {
        resolve();
        return;
      }

      const isModified = await this.isFileModified(filepath, update ?? "UNTRACKED");

      if (isModified) {
        modifiedFiles.push(filepath);
      }

      resolve();
    }))

    await Promise.all(promises);

    return modifiedFiles;
  }

  private async applyServerUpdate(update: Update) {
    const file = await this.vault.getFile(update.filepath);

    if (typeof file === "string") {
      if (await this.fs.exists(update.filepath)) {
        await this.fs.remove(update.filepath);
      }
    } else {
      this.fs.writeTo(update.filepath, file);
    }

    this.store.updateRecord(update.filepath, update.hash, update.time);
  }

  private async pushFile(filepath: string, hash: string): Promise<SuccessfulUpdate> {
    let file: "DELETE" | File = "DELETE";
    if (await this.fs.exists(filepath)) {
      const blob = await this.fs.readFrom(filepath);
      const filename = path.basename(filepath);

      file = new File([blob], filename, { type: blob.type, lastModified: Date.now() });
    }

    return await this.vault.uploadFile(filepath, hash, file);
  }



  private async isFileModified(filepath: string, clientUpdate: Update | "UNTRACKED"): Promise<boolean> {
    if (!(await this.fs.exists(filepath))) {
      return false;
    }

    const blob = await this.fs.readFrom(filepath);
    const hash = hashBlob(blob);

    if (clientUpdate === "UNTRACKED") {
      return hash !== DELETED_HASH;
    }

    return hash !== clientUpdate.hash;
  }

  private getSyncStatus(clientUpdate: Update | "UNTRACKED", serverUpdate: Update | "UNTRACKED"): "in-sync" | "out-of-sync" | "fucked" {
    if (clientUpdate === "UNTRACKED" || serverUpdate === "UNTRACKED") {
      // TODO - why is this working?
      // TODO - test with an untracked client update or server update
      switch ([clientUpdate === "UNTRACKED", serverUpdate === "UNTRACKED"]) {
        case [true, true]:
          console.log("already in sync")
          return "in-sync";
        case [true, false]:
          console.log("fucked")
          return "fucked";
        case [false, true]:
          console.log("out of sync")
          return "out-of-sync";
        default:
          break;
      }
    }

    // we know that neither are "UNTRACKED"
    clientUpdate = clientUpdate as Update;
    serverUpdate = serverUpdate as Update;

    // client should never be newer than server!
    if (clientUpdate.time > serverUpdate.time) {
      return "fucked";
    }

    return clientUpdate.hash === serverUpdate.hash ? "in-sync" : "out-of-sync";
  }

  private async setLastServerPull(t: number): Promise<void> {
    this.store.setLastPull(t);
  }

  private async getIgnorePaths(): Promise<string[]> {
    const ignorePaths: string[] = [];

    if (await this.fs.exists(IGNOREFILE_NAME)) {
      const blob = await this.fs.readFrom(IGNOREFILE_NAME);
      const text = await blob.text();
      const lines = text.split("\n");

      for (const line of lines) {
        if (line.startsWith("#")) {
          continue;
        }

        ignorePaths.push(line);
      }
    }

    if (ignorePaths.find((v) => v === ".conflicts") === undefined) {
      ignorePaths.push(".conflicts");
    }

    if (ignorePaths.find((v) => v === INKSYNC_DIRECTORY_NAME) === undefined) {
      ignorePaths.push(INKSYNC_DIRECTORY_NAME);
    }


    return ignorePaths;
  }

  async getLastServerPull(): Promise<number> {
    return await this.store.getLastPull();
  }
}


function formatDate(date: Date | number): string {
  if (typeof date === "number") {
    date = new Date(date);
  }

  return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}-${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}.${date.getUTCMilliseconds()}`;
}
