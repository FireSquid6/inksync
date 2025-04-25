import path from "path";
import fs from "fs";
import { Store, type Update } from "../store";
import { DELETED_HASH, INKSYNC_DIRECTORY_NAME, STORE_DATABASE_FILE } from "../constants";
import { Readable } from "stream";

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
  pushUpdate(fileContents: Readable | "DELETE", filepath: string, currentHash: string): Promise<UpdateResult>;
  getCurrent(filepath: string): "DELETED" | "NON-EXISTANT" | fs.ReadStream;
  getUpdateFor(filepath: string): Update | null;
  getUpdatesSince(time: number): Update[]; 
  getName(): string;
  isAuthorized(token: string): Promise<boolean>;
}

// TODO - implement a mutex so all of these actions are put into a queue
export class DirectoryVault implements Vault {
  private store: Store;
  private directory: string;
  private name: string;

  constructor(name: string, directory: string) {
    const inksyncPath = path.join(directory, INKSYNC_DIRECTORY_NAME);
    fs.mkdirSync(inksyncPath, { recursive: true });

    const dbPath = path.join(inksyncPath, STORE_DATABASE_FILE);
    this.name = name;
    this.store = new Store(dbPath);
    this.directory = directory;
  }

  getName() {
    return this.name;
  }

  async isAuthorized(_: string): Promise<boolean> {
    return true;
  }

  getUpdateFor(filepath: string) {
    const update = this.store.getRecord(filepath);
    return update;
  }
  
  // current hash should be an empty string for an update that doesn't exist
  async pushUpdate(fileContents: Readable | "DELETE", filepath: string, currentHash: string): Promise<UpdateResult> {
    const currentUpdate = this.store.getRecord(filepath);

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

    const absoluteFilepath = path.join(this.directory, filepath);
    const absoluteDirectory = path.dirname(absoluteFilepath);

    fs.mkdirSync(absoluteDirectory, { recursive: true });
    const newHash = await writeFileStream(fileContents, absoluteFilepath);
    const time = Date.now();
    this.store.updateRecord(filepath, newHash, time);

    return {
      type: "success",
      time,
      newHash,
    }
  }

  getCurrent(filepath: string): "DELETED" | "NON-EXISTANT" | fs.ReadStream {
    const record = this.store.getRecord(filepath);
    if (record === null) {
      return "NON-EXISTANT";
    }
    if (record.hash === DELETED_HASH) {
      return "DELETED";
    }
    const fullPath = path.join(this.directory, filepath);
    const stream = fs.createReadStream(fullPath);

    return stream;
  }

  getUpdatesSince(timestamp: number): Update[] {
    const updates = this.store.getRecordsNewThan(timestamp);
    return updates;
  }
}

export async function writeFileStream(file: Readable | "DELETE", filepath: string): Promise<string> {
  const dirname = path.dirname(filepath);
  fs.mkdirSync(dirname, { recursive: true });

  const writeStream = fs.createWriteStream(filepath);

  if (file === "DELETE") {
    fs.rmSync(filepath);
    return DELETED_HASH;
  }

  const hash = new Bun.CryptoHasher("sha256");

  for await (const chunk of file) {
    hash.update(chunk);
    writeStream.write(chunk);
  }

  return hash.digest("base64url");
}
