import type { Treaty } from "@/lib/treaty";
import { VaultClient } from "libinksync/client";
import { getMobileSqlite } from "./store";
import { getApiFromTreaty } from "server/interface";
import { MobileFilesystem } from "./filesystem";
import { Directory } from "@capacitor/filesystem";
import { consoleLogger } from "libinksync/logger";

export async function getVaultClient(treaty: Treaty, vaultName: string, directory: string): Promise<VaultClient> {
  const randomString = btoa(directory);
  const api = getApiFromTreaty(treaty, vaultName);
  const filesystem = new MobileFilesystem(directory, Directory.Documents);
  const store = await getMobileSqlite(randomString, vaultName)

  return new VaultClient(store, filesystem, api, consoleLogger());
}
