import { BunSQLiteDatabase, drizzle } from "drizzle-orm/bun-sqlite";
import path from "path";
import type { Config } from "../config";
import { Database } from "bun:sqlite";

export type Db = ReturnType<typeof getDb>;

export function getDb(config: Config) {
  const sqlite = new Database(path.join(config.storeDirectory, "database.sqlite"));
  const db = drizzle({ client: sqlite });
  return db;
}
