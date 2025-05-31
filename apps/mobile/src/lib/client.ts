import { VaultClient } from "libinksync/client";
import type { Connection } from "./connection";
import { getMobileSqlite } from "./store";
import { MobileFilesystem } from "./filesystem";
import { Directory } from "@capacitor/filesystem";
import { getApiFromAddress } from "server/interface";

export async function getClient(connection: Connection): Promise<VaultClient> {
  const store = await getMobileSqlite(connection.address, connection.vaultName);
  const fs = new MobileFilesystem(connection.syncDirectory, Directory.Documents);
  const vaultApi = getApiFromAddress(connection.address, connection.vaultName);

  return new VaultClient(store, fs, vaultApi);

}

