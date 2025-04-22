import type { InksyncConnection } from "./connection";
import path from "path";
import fs from "fs";
import { Database } from "bun:sqlite";
import { DELETED_CONTENT, IGNOREFILE_NAME, INKSYNC_DIRECTORY_NAME, STORE_NAME, STORE_TABLE_NAME } from "../server/constants";
import type { Update } from "..";
import { z } from "zod";
import { compressFile, decompressFile } from "../compress";
import { getIgnorePaths, isIgnored, readDirectoryRecursively } from "./ignorelist";

export interface Conflict {
  filepath: string;
  conflictFilepath: string;
}

export const clientUpdateSchema = z.object({
  filepath: z.string(),
  hash: z.string(),
  last_updated: z.number(),
});

export type ClientUpdate = z.infer<typeof clientUpdateSchema>;


export class ClientStore {
  rootDirectory: string;
  db: Database;
  connection: InksyncConnection;
  ignoreList: string[];

  constructor(directory: string, connection: InksyncConnection) {
    this.rootDirectory = directory;
    const inksyncDirectory = path.join(directory, INKSYNC_DIRECTORY_NAME);
    fs.mkdirSync(inksyncDirectory, { recursive: true });
    this.db = new Database(path.join(inksyncDirectory, STORE_NAME));
    this.connection = connection;

    this.db.query(`CREATE TABLE IF NOT EXISTS ${STORE_TABLE_NAME}(filepath TEXT PRIMARY KEY, hash TEXT, last_updated DATETIME default current_timestamp);`).all()

    const ignoreFilepath = path.join(directory, IGNOREFILE_NAME);
    this.ignoreList = getIgnorePaths(ignoreFilepath);

  }

  async syncAll() {
    console.log("Starting a sync...");
    try {
      const conflicts = await this.pullUpdates();

      for (const conflict of conflicts) {
        console.log(`Conflict in ${conflict.filepath}, moved to ${conflict.conflictFilepath}`);
      }

      await this.pushCurrentUpdate();

    } catch (e) {
      console.error("Error syncing files:")
      console.error(e);
    }
    console.log("Successfully synced with the server");
  }

  // TODO
  async syncSpecificFile(filepath: string) {
    console.log(`Syncing ${filepath}`);
    console.error("Error syncing file:");
    console.error("sync specific file not implemented.");
  }

  private async pullUpdates(): Promise<Conflict[]> {
    const row = this.db.query(`SELETCT * FROM ${STORE_TABLE_NAME} ORDER BY last_updated ASC LIMIT 1`).all();
    const oldestUpdate = z.array(clientUpdateSchema).parse(row)[0];
    const conflicts: Conflict[] = [];

    const requestTime = oldestUpdate?.last_updated ?? 0;

    const updateMessage = await this.connection.sendAndRecieve({
      type: "FETCH_UPDATED_SINCE",
      timestamp: requestTime,
    });


    switch (updateMessage.type) {
      case "UPDATED":
        for (const update of updateMessage.updates) {
          const conflict = this.applyUpdate(update);

          if (conflict !== null) {
            conflicts.push(conflict);
          }
        }
        break;
      case "ERROR":
        throw new Error(`Error fetching updates since ${requestTime}: ${updateMessage.info}`)
      default:
        throw new Error(`Got ${updateMessage.type} response from a pull`);
    }

    return conflicts;
  }

  private applyUpdate(update: Update): Conflict | null {
    // update the file
    const filepath = path.join(this.rootDirectory, update.filepath);
    const decompressed = decompressFile(update.content);
    const dirname = path.dirname(filepath);

    const hash = hashText(decompressed);
    const currentHash = getFileHash(filepath);
    let conflict: Conflict | null = null;

    if (hash === currentHash) {
      const base64Hash = btoa(currentHash);
      const newFilename = "." + base64Hash + "-" + path.basename(filepath) + ".conflict";
      const dirname = path.dirname(filepath);

      const newFilepath = path.join(dirname, newFilename);

      fs.copyFileSync(filepath, newFilepath);
      conflict = {
        filepath: filepath,
        conflictFilepath: newFilepath,
      }
    }

    fs.mkdirSync(dirname, { recursive: true });
    fs.writeFileSync(filepath, decompressed);

    // update the database
    const result = this.db.query(`
      INSERT OR REPLACE INTO ${STORE_TABLE_NAME} (filepath, hash, last_updated)
      VALUES (?, ?, ?)
    `).run(update.filepath, hash, update.lastUpdate,)

    if (result.changes !== 1) {
      throw new Error(`Tried to apply an update but made ${result.changes} changes instead of 1`);
    }

    console.log(`Pulled file ${update.filepath}`);
    return conflict;
  }

  private async pushCurrentUpdate(): Promise<void> {
    const updates = this.getStagedUpdates();
    console.log("Pushing updates for file:");
    for (const update of updates) {
      console.log(`  ${update.filepath}`);
    }

    const res = await this.connection.sendAndRecieve({
      type: "PUSH_UPDATES",
      updates,
    });



    switch (res.type) {
      case "UPDATE_SUCCESSFUL":
        return;
      case "ERROR":
        throw new Error(`Error pushing updates: ${res.info}`);
      case "OUTDATED":
        throw new Error("Outdated. Need to sync. This is a very rare edge case.");
      default:
        throw new Error(`Recieved unexpected message ${res.type}: ${res}`);
    }
  }

  // gets server updates
  private getStagedUpdates(): Update[] {
    const updates: Update[] = [];

    const filepaths = readDirectoryRecursively(this.rootDirectory, this.ignoreList);
    for (const filepath of filepaths) {
      const update = this.getUpdateForFile(filepath)

      if (update !== null) {
        const absoluteFilepath = path.join(this.rootDirectory, filepath);
        const content = compressFile(fs.readFileSync(absoluteFilepath).toString());

        updates.push({
          lastUpdate: update.last_updated,
          filepath: update.filepath,
          content,
        });
      }
    }

    return [];
  }

  // TOOD - add special trackers for dealing with large files (> 50 MB)
  private getUpdateForFile(relativePath: string): ClientUpdate | null {
    const fullPath = path.join(this.rootDirectory, relativePath);
    const newHash = getFileHash(fullPath);

    const row = this.db.query(`SELECT hash, filepath, last_updated FROM ${STORE_TABLE_NAME} WHERE filepath = ${relativePath}`).all();
    const hashes = z.array(clientUpdateSchema).parse(row);


    if (hashes.length === 0) {
      return {
        filepath: relativePath,
        hash: newHash,
        last_updated: Date.now(),
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
      last_updated: Date.now(),
    }

  }
}



export function getFileHash(filepath: string): string {
  if (!fs.existsSync(filepath)) {
    return DELETED_CONTENT;
  }

  const text = fs.readFileSync(filepath).toString();
  return hashText(text);
}

function hashText(text: string): string {
  const hasher = new Bun.CryptoHasher("sha256");

  hasher.update(text);
  return hasher.digest().toString();

}
