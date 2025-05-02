import path from "path";
import { BunSqliteStore, type Store, type Update } from "../store";
import { DELETED_HASH, INKSYNC_DIRECTORY_NAME, STORE_DATABASE_FILE } from "../constants";
import type { Filesystem } from "@/filesystem";
import { DirectoryFilesystem } from "@/filesystem";

export interface SuccessfulUpdate {
  type: "success";
  time: number;
  newHash: string;
}

export interface FailedUpdate {
  type: "failure";
  reason: "Non-matching hash";
}

export type UpdateResult = SuccessfulUpdate | FailedUpdate

export interface Vault {
  pushUpdate(fileContents: Blob | "DELETE", filepath: string, currentHash: string): Promise<UpdateResult>;
  getCurrent(filepath: string): Promise<"DELETED" | "NON-EXISTANT" | Blob>;
  getUpdateFor(filepath: string): Promise<Update | null>;
  getUpdatesSince(time: number): Promise<Update[]>; 
  getName(): string;
  isAuthorized(token: string): Promise<boolean>;
}

// TODO - implement a mutex so all of these actions are put into a queue
// TODO - implement a max file size
export class DirectoryVault implements Vault {
  private store: Store;
  private directory: string;
  private name: string;
  private fs: Filesystem;

  constructor(name: string, directory: string) {
    const inksyncPath = path.join(directory, INKSYNC_DIRECTORY_NAME);
    const dbPath = path.join(inksyncPath, STORE_DATABASE_FILE);
    this.name = name;
    this.directory = directory;

    this.fs = new DirectoryFilesystem(this.directory);
    this.fs.mkdir(path.dirname(dbPath));

    this.store = new BunSqliteStore(dbPath);
  }

  getName() {
    return this.name;
  }

  async isAuthorized(_: string): Promise<boolean> {
    return true;
  }

  async getUpdateFor(filepath: string) {
    const update = await this.store.getRecord(filepath);
    return update;
  }
  
  // current hash should be an empty string for an update that doesn't exist
  async pushUpdate(fileContents: Blob | "DELETE", filepath: string, currentHash: string): Promise<UpdateResult> {
    const currentUpdate = await this.store.getRecord(filepath);

    if (currentUpdate === null) {
      if (currentHash !== "") {
        return {
          type: "failure",
          reason: "Non-matching hash",
        }
      }
    } else {
      if (currentHash !== currentUpdate.hash) {
        return {
          type: "failure",
          reason: "Non-matching hash",
        }
      }
    }


    const newHash = hashBlob(fileContents);
    const time = Date.now();

    this.fs.writeTo(filepath, fileContents);
    this.store.updateRecord(filepath, newHash, time);

    return {
      type: "success",
      time,
      newHash,
    }
  }

  async getCurrent(filepath: string): Promise<"DELETED" | "NON-EXISTANT" | Blob> {
    const record = await this.store.getRecord(filepath);

    if (record === null) {
      return "NON-EXISTANT";
    }
    if (record.hash === DELETED_HASH) {
      return "DELETED";
    }

    const blob = await this.fs.readFrom(filepath);
    return blob;
  }

  async getUpdatesSince(timestamp: number): Promise<Update[]> {
    const updates = await this.store.getRecordsNewThan(timestamp);
    return updates;
  }
}


export function hashBlob(blob: Blob | "DELETE"): string {
  if (blob === "DELETE") {
    return DELETED_HASH;
  }
  const hash = new Bun.CryptoHasher("sha256");
  hash.update(blob);
  return hash.digest("base64url");
}
