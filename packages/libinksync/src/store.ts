import { z } from "zod";
import { Database } from "bun:sqlite";

const TABLE_NAME = "updates";
const LAST_UPDATE_TABLE = "last_update_timestamp";

export const updateSchema = z.object({
  filepath: z.string(),
  hash: z.string(),
  time: z.number(),
})
export type Update = z.infer<typeof updateSchema>;

export interface Store {
  updateRecord(filepath: string, hash: string, time: number): Promise<void>;
  getAllRecords(): Promise<Update[]>;
  updateRecordObject(update: Update): Promise<void>;
  getRecordsNewThan(timestamp: number): Promise<Update[]>;
  getRecord(filepath: string): Promise<Update | null>;
  setLastPull(t: number): Promise<void>;
  getLastPull(): Promise<number>;
}

export class BunSqliteStore implements Store {
  private db: Database;

  constructor(dbFile: string) {
    this.db = new Database(dbFile);
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME}(
        filepath TEXT PRIMARY KEY, 
        hash TEXT, 
        time DATETIME default current_timestamp
      );
    `).run();
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS ${LAST_UPDATE_TABLE}(
        id TEXT PRIMARY KEY,
        time DATETIME default current_timestamp
      );
    `).run();
  }

  async updateRecord(filepath: string, hash: string, time: number) {
    const result = this.db.prepare(`
      INSERT OR REPLACE INTO ${TABLE_NAME} (filepath, hash, time)
      VALUES (?, ?, ?)
    `).run(filepath, hash, time);

    if (result.changes !== 1) {
      throw new Error(`Tried to apply update to ${filepath} but got ${result.changes} changes instead of 1`);
    }
  }

  async updateRecordObject(update: Update) {
    this.updateRecord(update.filepath, update.hash, update.time);
  }

  async getRecord(filepath: string): Promise<Update | null> {
    const result = this.db.prepare(`
      SELECT filepath, time, hash FROM ${TABLE_NAME}
      WHERE filepath = ?;
    `).all(filepath);
    const updates = z.array(updateSchema).parse(result);

    if (updates.length === 0) {
      return null;
    }

    if (updates.length !== 1) {
      throw new Error(`Got ${updates.length} updates (should be 1 or 0) for ${filepath}`);
    }

    return updates[0]!;
  }

  async getRecordsNewThan(timestamp: number): Promise<Update[]> {
    const result = this.db.prepare(`
      SELECT filepath, time, hash FROM ${TABLE_NAME}
      WHERE time > ?;
    `).all(timestamp);

    const updates = z.array(updateSchema).parse(result);
    return updates;
  }

  async getAllRecords(): Promise<Update[]> {
    const result = this.db.prepare(`
      SELECT filepath, time, hash FROM ${TABLE_NAME}
    `).all();
    const updates = z.array(updateSchema).parse(result);
    return updates;
  }

  async setLastPull(t: number): Promise<void> {
    const result = this.db.prepare(`
      INSERT OR REPLACE INTO ${LAST_UPDATE_TABLE} (id, time)
      VALUES (?, ?)
    `).run("last_update", t);

    if (result.changes !== 1) {
      throw new Error(`Tried to set the last pull but got ${result.changes} changes instead of 1`);
    }
  }

  async getLastPull(): Promise<number> {
    const result = this.db.prepare(`
      SELECT id, time FROM ${LAST_UPDATE_TABLE}
    `).all();

    const lastPull = z.array(z.object({
      id: z.string(),
      time: z.number(),
    })).parse(result);

    if (lastPull.length < 1) {
      return 0;
    }
    
    return lastPull[0]!.time;
  }
}

