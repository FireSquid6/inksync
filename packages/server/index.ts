import { vaultFromInfo, type Config } from "./config";
import { app } from "./http";
import fs from "fs";

export async function startApp(config: Config) {
  fs.mkdirSync(config.vaultsDirectory, { recursive: true });

  app.store.config = config;
  app.store.vaults = await Promise.all(config.vaults.map((v) => vaultFromInfo(v, config)));


  app.listen(config.port, () => {
    console.log(`App started on ${config.port} with config:`);
    console.log(config);
  })

  return { app };
}

