import { treaty, type Treaty } from "@elysiajs/eden";
import { App } from "../server/http";
import { Store, Update } from "../store";
import path from "path";
import fs from "fs";
import { DELETED_HASH, INKSYNC_DIRECTORY_NAME, LAST_SYNC_FILE, STORE_DATABASE_FILE } from "../constants";
import { SyncResult } from "./results";
import { encodeFilepath } from "../encode";

export interface VaultClient {
  syncAll(): Promise<SyncResult[]>;
  syncSpecificFile(filepath: string): Promise<SyncResult>;
  // TODO - forceRollbackToServer(filepath: string)
}

export class DirectoryClient implements VaultClient {
  private rootDirectory: string;
  private url: string;
  private api: Treaty.Create<App>;
  private store: Store;
  vault: string;

  constructor(rootDirectory: string, address: string, vault: string) {
    this.url = getUrlFromAddress(address);
    this.rootDirectory = rootDirectory;
    this.api = treaty<App>(this.url);
    this.vault = vault;


    const inksyncPath = path.join(rootDirectory, INKSYNC_DIRECTORY_NAME);
    fs.mkdirSync(inksyncPath, { recursive: true });
    const dbPath = path.join(inksyncPath, STORE_DATABASE_FILE);
    this.store = new Store(dbPath);
  }

  async syncAll(): Promise<SyncResult[]> {
    const lastFullSync = this.getLastFullSync();

    const updatedSince = await this.api.vaults({ vault: this.vault }).updates.get({
      query: {
        since: lastFullSync,
      }
    });

    if (updatedSince.status !== 200 || updatedSince.data === null) {
      return [makeError(updatedSince.status, updatedSince.error)];
    }

    const updated = updatedSince.data;
    const changedFiles = this.getChangedFiles();

    const filepathsToSync: { filepath: string, knownToBeUpdated: boolean | undefined, update: Update | undefined }[] = [];

    updated.map((u) => filepathsToSync.push({ filepath: u.filepath, knownToBeUpdated: undefined, update: u }));
    changedFiles.map((f) => filepathsToSync.push({ filepath: f, knownToBeUpdated: true, update: undefined }));

    const result = await Promise.all(filepathsToSync.map(({filepath, knownToBeUpdated}) => this.syncSpecificFile(filepath, knownToBeUpdated)));

    this.setFullSync(Date.now());

    return result;
  }

  async syncSpecificFile(filepath: string, isModified?: boolean, serverUpdate?: Update | "UNTRACKED"): Promise<SyncResult> {
    const encodedFilepath = encodeFilepath(filepath);
    if (serverUpdate === undefined) {
      const r = await this.api
        .vaults({ vault: this.vault })
        .updates({ filepath: encodedFilepath })
        .get()

      if (r.status !== 200 || r.data === null) {
        return makeError(r.status, r.error);
      }
      serverUpdate = r.data;
    }
    const clientUpdate = this.store.getRecord(filepath);

    // this means the client is NEWER than the server which should never happen!
    if ((serverUpdate !== "UNTRACKED") && (clientUpdate?.time ?? 0 > serverUpdate.time)) {
      return {
        type: "client-error",
        error: new Error("Super duper bad state reached where client has newer state than server."),
      }
    }

    // TODO - check this line
    const inSync = (clientUpdate === null || serverUpdate === "UNTRACKED")
      ? (serverUpdate === "UNTRACKED")
      : clientUpdate.time === serverUpdate.time;

    if (isModified === undefined) {
      isModified = this.isModified(filepath, clientUpdate ?? undefined);
    }

    switch ([inSync, isModified]) {
      // case 1 - in-sync update made, push to server
      case [true, true]:

        break;
      // case 2 - out-of-sunc update made, we have a conflict
      case [false, true]:

        break;
      // case 3 - do nothing! Everything is fine!
      case [true, false]:
        return {
          type: "in-sync",
        }
      // case 4 - need to pull from server, but no conflict
      case [false, false]:
        const serverFile = await this.api
          .vaults({ vault: this.vault })
          .files({ filepath: encodedFilepath })
          .get();

        if (serverFile.data === null || serverFile.status !== 200) {
          return makeError(serverFile.status, serverFile.data);
        }
        
        // have to update our store
        
    }
  }

  private getChangedFiles(): string[] {
    // TODO
    return [];
  }

  private isModified(filepath: string, clientUpdate?: Update): boolean {
    return true;
  }


  private getLastFullSync(): number {
    const syncPath = path.join(this.rootDirectory, INKSYNC_DIRECTORY_NAME, LAST_SYNC_FILE);
    if (!fs.existsSync(syncPath)) {
      return 0;
    }

    const text = fs.readFileSync(syncPath).toString();
    const number = parseInt(text);

    if (isNaN(number)) {
      fs.rmSync(syncPath);
      return 0;
    }
    return number;
  }

  private setFullSync(time: number) {
    const syncPath = path.join(this.rootDirectory, INKSYNC_DIRECTORY_NAME, LAST_SYNC_FILE);
    fs.writeFileSync(syncPath, time.toString());
  }

}

function getUrlFromAddress(address: string) {
  const split = address.split(":");

  const protocol = split[0] === "127.0.0.1" || split[0] === "localhost" ? "ws" : "wss";

  return `${protocol}://${address}/listen`
}



function makeError(status: number, error: unknown): SyncResult {
  if (status >= 500) {
    return {
      type: "server-error",
      error,
    }
  } else {
    return {
      type: "client-error",
      error,
    }
  }
}

async function getFileHash(filepath: string): string {


  if (!fs.existsSync(filepath)) {
    return DELETED_HASH;
  }

  const hash = new Bun.CryptoHasher("sha256");
  const stream = fs.createReadStream()


  return hash.digest("base64url");
}
