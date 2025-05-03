import { type Store, type Update, updateSchema } from "libinksync";
import { CapacitorSQLite, SQLiteConnection } from "@capacitor-community/sqlite";
import { Capacitor } from "@capacitor/core";
import { z } from "zod";


export async function getMobileSqlite(address: string, vault: string): Promise<Store> {
  const updateTable = `updates-${address}-${vault}`;
  const pullTable = `pulls-${address}-${vault}`;
  const dbName = `db-${address}-${vault}`;
  const sqlite = new SQLiteConnection(CapacitorSQLite);
  const platform = Capacitor.getPlatform();

  if (platform === "web") {
    await sqlite.initWebStore();
  }

  const isExists = await sqlite.isDatabase(dbName);
  const db = isExists.result
    ? await sqlite.createConnection(dbName, false, "no-encryption", 1, false)
    : await sqlite.createConnection(dbName, true, "no-encryption", 1, false)

  await db.open();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${updateTable}(
      filepath TEXT PRIMARY KEY, 
      hash TEXT, 
      time DATETIME default current_timestamp
    );
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ${pullTable}(
      id TEXT PRIMARY KEY,
      time DATETIME default current_timestamp
    );
  `);



  return {
    async updateRecord(filepath: string, hash: string, time: number): Promise<void> {
      const { changes } = await db.execute(`
        INSERT OR REPLACE INTO ${updateTable} (filepath, hash time)
        VALUES (${filepath}, ${hash}, ${time})
      `);

      if (changes?.changes !== 1) {
        throw new Error(`Tried to apply update to ${filepath} but got ${changes?.changes} changes instead of 1`);
      }
    },
    async getAllRecords(): Promise<Update[]> {
      const result = await db.query(`
        SELECT filepath, time, hash FROM ${updateTable}
      `)
      const updates = z.array(updateSchema).parse(result.values);
      return updates;
    },
    async updateRecordObject(update: Update): Promise<void> {
      const { filepath, hash, time } = update;

      const { changes } = await db.execute(`
        INSERT OR REPLACE INTO ${updateTable} (filepath, hash time)
        VALUES (${filepath}, ${hash}, ${time})
      `);

      if (changes?.changes !== 1) {
        throw new Error(`Tried to apply update to ${filepath} but got ${changes?.changes} changes instead of 1`);
      }
    },
    async getRecordsNewThan(timestamp: number): Promise<Update[]> {
      const result = await db.query(`
        SELECT filepath, time, hash FROM ${updateTable}
        WHERE time > ?;
      `, [timestamp]);

      const updates = z.array(updateSchema).parse(result.values);
      return updates;
    },
    async getRecord(filepath: string): Promise<Update | null> {
      const result = await db.query(`
      SELECT filepath, time, hash FROM ${updateTable}
      WHERE filepath = ?;
    `, [filepath]);
      const updates = z.array(updateSchema).parse(result.values);

      if (updates.length === 0) {
        return null;
      }

      if (updates.length !== 1) {
        throw new Error(`Got ${updates.length} updates (should be 1 or 0) for ${filepath}`);
      }

      return updates[0]!;
    },
    async setLastPull(t: number): Promise<void> {
      const { changes } = await db.execute(`
      INSERT OR REPLACE INTO ${pullTable} (id, time)
      VALUES (last_update, ${t})
    `,);

      if (changes?.changes !== 1) {
        throw new Error(`Tried to set the last pull but got ${changes?.changes} changes instead of 1`);
      }
    },
    async getLastPull(): Promise<number> {
      const result = await db.query(`
        SELECT id, time FROM ${pullTable}
      `);

      const lastPull = z.array(z.object({
        id: z.string(),
        time: z.number(),
      })).parse(result.values);

      if (lastPull.length < 1) {
        return 0;
      }
      
      return lastPull[0]!.time;
    },
  }
}
