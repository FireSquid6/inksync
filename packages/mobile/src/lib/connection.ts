import { Directory } from "@capacitor/filesystem"
import path from "path";
import { MobileFilesystem } from "./filesystem";
import { v4 as uuid } from "uuid";
import { getMobileSqlite } from "./store";
import { getApiFromAddress } from "server/interface";
import { VaultClient } from "libinksync/client";
import { consoleLogger } from "libinksync/logger";
import type { SyncResult } from "libinksync/client/results";

export interface Connection {
  id: string;
  address: string;
  name: string;
  key: string;
}

export type PartialConnection = Omit<Connection, "id">;

export interface ConnectionStatus {
  id: string;
  currentlySyncing: boolean;
  syncs: {
    results: [string, SyncResult][];
    time: number;
    type: "good" | "bad";
  }[];
}

export function getConnectionDirectory(connection: Connection) {
  return path.join("inksync-vaults", connection.address, connection.name);
}

export async function clientFromConnection(connection: Connection): Promise<VaultClient> {
  const directory = getConnectionDirectory(connection);
  const filesystem = new MobileFilesystem(directory, Directory.Documents);
  const api = getApiFromAddress(connection.address, connection.name, connection.key);
  const store = await getMobileSqlite(connection.address, connection.name);

  return new VaultClient(store, filesystem, api, consoleLogger());
}


export function fillConnection(c: PartialConnection): Connection {
  const id = uuid();
  return {
    id,
    ...c,
  }
}
