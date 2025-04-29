import { z } from "zod";
import Sqlite from "better-sqlite3";

const TABLE_NAME = "updates";

export const updateSchema = z.object({
  filepath: z.string(),
  hash: z.string(),
  time: z.number(),
})
export type Update = z.infer<typeof updateSchema>;

export class Store {
  private db: Sqlite.Database;

  constructor(dbFile: string) {
    this.db = Sqlite(dbFile);
    this.db.pragma("journal_mode = WAL")
    this.db.prepare(`
      CREATE TABLE IF NOT EXISTS ${TABLE_NAME}(
        filepath TEXT PRIMARY KEY, 
        hash TEXT, 
        time DATETIME default current_timestamp
      );
    `).run();
  }

  updateRecord(filepath: string, hash: string, time: number) {
    const result = this.db.prepare(`
      INSERT OR REPLACE INTO ${TABLE_NAME} (filepath, hash, time)
      VALUES (?, ?, ?)
    `).run(filepath, hash, time);

    if (result.changes !== 1) {
      throw new Error(`Tried to apply update to ${filepath} but got ${result.changes} changes instead of 1`);
    }
  }

  updateRecordObject(update: Update) {
    this.updateRecord(update.filepath, update.hash, update.time);
  }

  getRecord(filepath: string): Update | null {
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

  getRecordsNewThan(timestamp: number): Update[] {
    const result = this.db.prepare(`
      SELECT filepath, time, hash FROM ${TABLE_NAME}
      WHERE time > ?;
    `).all(timestamp);

    const updates = z.array(updateSchema).parse(result);
    return updates;
  }

  getAllRecords(): Update[] {
    const result = this.db.prepare(`
      SELECT filepath, time, hash FROM ${TABLE_NAME}
    `).all();
    const updates = z.array(updateSchema).parse(result);
    return updates;
  }
}

