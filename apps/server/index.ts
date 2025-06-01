import { getConfigFromFile, getConfigFromPartial } from "./config";
import { app } from "./http";
import { getDb, getVaultFromInfo } from "./db";
import { vaultsTable, type VaultInfo } from "./db/schema";
import type { Vault } from "libinksync/server";


export function startApp() {
  // TODO
  const configPath = process.env.INKSYNC_CONFIG_PATH ?? "./inksync-server-config.yaml";
  const config = getConfigFromFile(configPath);

  const db = getDb(config);
  app.store.db = db;

  app.listen(config.port, () => {
    console.log(`App started on ${config.port}`);
  })

  return app;
}

export async function startAppWithVaults(vaultInfos: VaultInfo[], port: number) {
  const config = getConfigFromPartial({
    port,
    doAuthentication: false,
    databasePath: ":memory:",
  });
  const db = getDb(config); 

  await db
    .insert(vaultsTable)
    .values(vaultInfos);

  const vaults: Vault[] = await Promise.all(vaultInfos.map((i) => getVaultFromInfo(i)));
  app.store.db = db;
  app.store.vaults = vaults;

  app.listen(config.port, () => {
    console.log(`App started on ${config.port}`);
  });

  return app;
}
