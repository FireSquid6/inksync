import { BunSqliteStore } from "../store/bun-sqlite";
import path from "path";
import fs from "fs"
import { INKSYNC_DIRECTORY_NAME, STORE_DATABASE_FILE } from "../constants";
import { DirectoryFilesystem } from "../filesystem";
import { silentLogger, type Logger } from "../logger";
import { VaultClient } from "./";

export function getDirectoryClient(vaultName: string, address: string, directory: string, logger: Logger = silentLogger()) {
  const filesystem = new DirectoryFilesystem(directory);
  const dbPath = path.join(directory, INKSYNC_DIRECTORY_NAME, STORE_DATABASE_FILE);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });

  const store = new BunSqliteStore(dbPath);

  return new VaultClient(address, store, filesystem, vaultName, logger);
}
