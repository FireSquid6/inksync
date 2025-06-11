import { vaultFromInfo, type Config } from "./config";
import { app } from "./http";
import fs from "fs";
import path from "path";

export async function startApp(config: Config) {
  const dbDirectory = path.dirname(config.databasePath);
  fs.mkdirSync(dbDirectory, { recursive: true });
  fs.mkdirSync(config.vaultsDirectory, { recursive: true });

  app.store.config = config;
  app.store.vaults = await Promise.all(config.vaults.map((v) => vaultFromInfo(v, config)));


  app.listen(config.port, () => {
    console.log(`App started on ${config.port} with config:`);
    console.log(config);
  })

  return { app };
}

