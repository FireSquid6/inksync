import { drizzle } from "drizzle-orm/bun-sqlite";
import path from "path";
import type { Config } from "../config";
import { Database } from "bun:sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { Vault, vaultFromDirectory } from "libinksync/vault";
import { type VaultInfo } from "./schema";

export type Db = ReturnType<typeof getDb>;

export function getDb(config: Config) {
  const sqlite = new Database(config.databasePath);
  const db = drizzle({ client: sqlite });
  
  const myDirectory = path.resolve(import.meta.dir, "..");

  console.log("in directory:");
  console.log(myDirectory);
  migrate(db, {
    migrationsFolder: path.join(myDirectory, "drizzle"),
    migrationsSchema: path.join(myDirectory, "db/schema.ts"),
  });
  console.log("Database migrated!");
  return db;
}


export function getVaultFromInfo(info: VaultInfo): Promise<Vault> {
  return vaultFromDirectory(info.name, info.location);
}
