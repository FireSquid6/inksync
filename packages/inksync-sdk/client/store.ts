import type { InksyncConnection } from ".";
import path from "path";
import fs from "fs";
import { Database } from "bun:sqlite";
import { DELETED_CONTENT, INKSYNC_DIRECTORY_NAME, STORE_NAME, STORE_TABLE_NAME } from "../server/constants";
import type { Update } from "..";
import { z } from "zod";

export interface Conflict {
  filepath: string;
  conflictFilepath: string;
}

export interface ClientUpdate {
  filepath: string;
  hash: string;
}


export class ClientStore {
  rootDirectory: string;
  db: Database;
  connection: InksyncConnection;

  constructor(directory: string, connection: InksyncConnection) {
    this.rootDirectory = directory;
    const inksyncDirectory = path.join(directory, INKSYNC_DIRECTORY_NAME);
    fs.mkdirSync(inksyncDirectory, { recursive: true });
    this.db = new Database(path.join(inksyncDirectory, STORE_NAME));
    this.connection = connection;

    this.db.query(`CREATE TABLE IF NOT EXISTS ${STORE_TABLE_NAME}(filepath TEXT PRIMARY KEY, hash TEXT, last_updated DATETIME default current_timestamp);`).run()

  }

  async syncAll() {
    const conflicts = await this.pullUpdates();

    if (conflicts.length !== 0) {
      // output conflict messages
    }

    this.pushCurrentUpdate();
  }

  async syncSpecificFile(filepath: string) {

  }

  private async pullUpdates(): Promise<Conflict[]> {
    return [];
  }

  private async pushCurrentUpdate(): Promise<"SUCCESS" | Error> {
    const updates = this.getStagedUpdates();

    const res = await this.connection.sendAndRecieve({
      type: "PUSH_UPDATES",
      updates,
    });

    switch (res.type) {
      case "UPDATE_SUCCESSFUL":
        return "SUCCESS";
      case "ERROR":
        return new Error(`Error pushing updates: ${res.info}`);
      default:
        throw new Error(`Recieved unexpected message ${res.type}: ${res}`);
    }
  }

  private getStagedUpdates(): Update[] {

    return [];
  }

  private getUpdateForFile(relativePath: string): ClientUpdate | null {
    const fullPath = path.join(this.rootDirectory, relativePath);
    const newHash = getFileHash(fullPath);

    const row = this.db.query(`SELECT hash FROM ${STORE_TABLE_NAME} WHERE filepath = ${relativePath}`).all();
    const hashes = z.array(z.object({
      hash: z.string()
    })).parse(row);


    if (hashes.length === 0) {
      return {
        filepath: relativePath,
        hash: newHash,
      }
    }

    if (hashes.length > 1) {
      throw new Error(`More than one row in db with filepath ${relativePath}`);
    }

    const oldHash = hashes[0]!.hash;

    // no change!
    if (oldHash === newHash) {
      return null;

    }

    return {
      filepath: relativePath,
      hash: newHash,
    }

  }
}



export function getFileHash(filepath: string): string {
  if (!fs.existsSync(filepath)) {
    return DELETED_CONTENT;
  }

  const text = fs.readFileSync(filepath);
  const hasher = new Bun.CryptoHasher("sha512");

  hasher.update(text);
  return hasher.digest().toString();

}

