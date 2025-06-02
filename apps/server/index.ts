import { getConfigFromFile } from "./config";
import { app } from "./http";
import { getDb } from "./db";

export function startApp() {
  const configPath = process.env.INKSYNC_CONFIG_PATH ?? "./inksync-server-config.yaml";
  const config = getConfigFromFile(configPath);

  const db = getDb(config);
  app.store.db = db;

  app.listen(config.port, () => {
    console.log(`App started on ${config.port}`);
  })

  return app;
}

