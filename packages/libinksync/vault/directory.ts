import path from "path";
import { BunSqliteStore } from "../store/bun-sqlite";
import { INKSYNC_DIRECTORY_NAME, STORE_DATABASE_FILE } from "../constants";
import { DirectoryFilesystem } from "../filesystem";
import { Vault } from "./";

export async function vaultFromDirectory(name: string, directory: string) {
  const inksyncPath = path.join(directory, INKSYNC_DIRECTORY_NAME);
  const dbPath = path.join(inksyncPath, STORE_DATABASE_FILE);

  const fs = new DirectoryFilesystem(directory);
  await fs.mkdir(path.dirname(dbPath));

  const store = new BunSqliteStore(dbPath);

  return new Vault(name, store, fs);
}
