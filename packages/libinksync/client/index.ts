import { treaty, type Treaty } from "@elysiajs/eden";
import { type App } from "../server/http";
import { Store, type Update } from "../store";
import path from "path";
import fs from "fs";
import { DELETED_HASH, INKSYNC_DIRECTORY_NAME, LAST_SYNC_FILE, STORE_DATABASE_FILE } from "../constants";
import { type SyncResult } from "./results";
import { encodeFilepath } from "../encode";
import type { UpdateResult } from "@/server/vault";

export interface VaultClient {
  syncAll(): Promise<SyncResult[]>;
  syncSpecificFile(filepath: string): Promise<SyncResult>;
  // TODO - forceRollbackToServer(filepath: string)
}

class HttpError {
  code: number;
  error: unknown;

  constructor(code: number, error?: unknown) {
    this.code = code;
    this.error = error;
  }
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

    const result = await Promise.all(filepathsToSync.map(({ filepath, knownToBeUpdated }) => this.syncSpecificFile(filepath, knownToBeUpdated)));

    this.setFullSync(Date.now());

    return result;
  }

  async syncSpecificFile(filepath: string, isModified?: boolean, serverUpdate?: Update | "UNTRACKED"): Promise<SyncResult> {
  }

  private async getChangedFiles(): Promise<string[]> {
    // TODO
    return [];
  }

  private async isModified(filepath: string, clientUpdate?: Update): Promise<boolean> {
    // TODO
    return true;
  }

  private async getServerUpdate(filepath: string): Promise<"UNTRACKED" | Update | HttpError> {
    const r = await this.api
      .vaults({ vault: this.vault })
      .updates({ filepath: encodeFilepath(filepath) })
      .get()

    if (r.status !== 200 || r.data === null) {
      return new HttpError(r.status, r.error);
    }

    return r.data;
  }

  private async pushUpdate(filepath: string, currentHash?: string): Promise<UpdateResult | HttpError> {
    const absoluteFilepath = path.join(this.rootDirectory, filepath);
    const file = Bun.file(absoluteFilepath);
    let data: "DELETE" | File = "DELETE";

    if (await file.exists()) {
      const arrayBuffer = await file.arrayBuffer();
      data = new File([arrayBuffer], filepath, { type: file.type });
    }

    if (!currentHash) {
      const update = this.store.getRecord(filepath);
      currentHash = update === null ? "" : update.hash;
    }

    const res = await this.api
      .vaults({ vault: this.vault })
      .files({filepath: encodeFilepath(filepath)})
      .post({
        file: data,
        currentHash: currentHash,
      });

    if (res.status !== 200 || res.data === null) {
      return new HttpError(res.status, res.error);
    }

    return res.data;
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
