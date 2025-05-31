import { drizzle } from "drizzle-orm/bun-sqlite";
import path from "path";
import type { Config } from "../config";
import { Database } from "bun:sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

export type Db = ReturnType<typeof getDb>;

export function getDb(config: Config) {
  const sqlite = new Database(path.join(config.storeDirectory, "database.sqlite"));
  const db = drizzle({ client: sqlite });
  console.log("Migrating database...");
  migrate(db, {
    migrationsFolder: "drizzle",
    migrationsSchema: "db/schema.ts",
  });
  console.log("Database migrated!");
  return db;
}
