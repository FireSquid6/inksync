import { treaty, type Treaty } from "@elysiajs/eden";
import { type App } from "../server/http";
import { BunSqliteStore, type Store, type Update } from "../store";
import path from "path";
import fs from "fs"
import { DELETED_HASH, INKSYNC_DIRECTORY_NAME, MAX_FILE_SIZE, STORE_DATABASE_FILE } from "../constants";
import { type SyncResult } from "./results";
import { encodeFilepath } from "../encode";
import { hashBlob, type SuccessfulUpdate } from "../server/vault";
import { DirectoryFilesystem, type Filesystem } from "../filesystem";
import { silentLogger, type Logger } from "../logger";


export class HttpError {
  code: number;
  error: unknown;

  constructor(code: number, error?: unknown) {
    this.code = code;
    this.error = error;
  }
}

export class VaultClient {
  private fs: Filesystem;
  private api: Treaty.Create<App>;
  private store: Store;
  private url: string;
  private vault: string;
  private address: string;
  private logger: Logger


  constructor(address: string, store: Store, fs: Filesystem, vault: string, logger: Logger = silentLogger()) {
    this.fs = fs;
    this.address = address;
    this.vault = vault;
    this.url = getUrlFromAddress(address);

    this.api = treaty<App>(this.url);
    this.store = store;
    this.logger = logger;
  }

  getVault() {
    return this.vault;
  }
  getAddress() {
    return this.address;
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
      this.logger.log("  ", file);
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
      const serverUpdate = knownServerUpdate ?? await this.getServerUpdate(filepath);
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
      if (e instanceof HttpError) {
        return makeError(e.code, e.error);
      } else {
        return {
          domain: "bad",
          type: "client-error",
          error: e,
        }
      }
    }
  }
  peekAtFile(filepath: string): Promise<Blob> {
    return this.fs.readFrom(filepath);
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
    const res = await this.api
      .vaults({ vault: this.vault })
      .updates.get({ query: { since: lastUpdate } });

    if (res.status !== 200 || res.data === null) {
      throw makeError(res.status, res.error);
    }

    return res.data;
  }

  private async getAllModifiedFiles(): Promise<string[]> {
    const modifiedFiles: string[] = []

    const files = await this.fs.listdir("", true);


    const promises = files.map((filepath) => new Promise(async (resolve) => {
      const update = await this.store.getRecord(filepath);

      const isModified = await this.isFileModified(filepath, update ?? "UNTRACKED");

      if (isModified) {
        modifiedFiles.push(filepath);
      }

    }))

    await Promise.all(promises);

    return modifiedFiles;
  }

  private async applyServerUpdate(update: Update) {
    const file = await this.getServerFile(update.filepath);
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

    const res = await this.api
      .vaults({ vault: this.vault })
      .files({ filepath: encodeFilepath(filepath) })
      .post({
        currentHash: hash,
        file,
      })

    if (res.status !== 200 || res.data === null) {
      throw makeError(res.status, res.error);
    }

    return res.data;
  }

  private async getServerUpdate(filepath: string): Promise<"UNTRACKED" | Update> {
    const res = await this.api
      .vaults({ vault: this.vault })
      .updates({ filepath: encodeFilepath(filepath) })
      .get();

    if (res.status !== 200 || res.data === null) {
      throw makeError(res.status, res.error);
    }

    return res.data
  }

  private async getServerFile(filepath: string): Promise<ArrayBuffer | "DELETED" | "NON-EXISTANT"> {
    const res = await this.api
      .vaults({ vault: this.vault })
      .files({ filepath: encodeFilepath(filepath) })
      .get();

    if (res.status !== 200 || res.data === null) {
      throw makeError(res.status, res.error);
    }


    return res.data;
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
      switch ([clientUpdate === "UNTRACKED", serverUpdate === "UNTRACKED"]) {
        case [true, true]:
          return "in-sync";
        case [true, false]:
          return "fucked";
        case [false, true]:
          return "out-of-sync";
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

  async getLastServerPull(): Promise<number> {
    return await this.store.getLastPull();
  }
}


function getUrlFromAddress(address: string) {
  const split = address.split(":");

  const protocol = split[0] === "127.0.0.1" || split[0] === "localhost" ? "http" : "https";

  return `${protocol}://${address}`;
}

function makeError(status: number, error: unknown): SyncResult {
  if (status >= 500) {
    return {
      domain: "bad",
      type: "server-error",
      error,
    }
  } else {
    return {
      domain: "bad",
      type: "client-error",
      error,
    }
  }
}


export function getDirectoryClient(vaultName: string, address: string, directory: string) {
  const filesystem = new DirectoryFilesystem(directory);
  const dbPath = path.join(directory, INKSYNC_DIRECTORY_NAME, STORE_DATABASE_FILE);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const store = new BunSqliteStore(dbPath);

  return new VaultClient(address, store, filesystem, vaultName);
}

function formatDate(date: Date | number): string {
  if (typeof date === "number") {
    date = new Date(date);
  }

  return `${date.getUTCFullYear()}-${date.getUTCMonth() + 1}-${date.getUTCDate()}-${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}.${date.getUTCMilliseconds()}`;
}
