import { getConfigFromPartial, type Config, type PartialConfig } from "./config";
import { app } from "./http";
import { getDb } from "./db";
import { uiPlugin } from "./http/ui";
import { getTreaty } from "./interface";

export function startApp(config: Config) {
  const db = getDb(config);
  app.store.db = db;
  app.store.config = config;

  if (config.serveUI) {
    app.use(uiPlugin());
  }

  app.listen(config.port, () => {
    console.log(`App started on ${config.port} with config:`);
    console.log(config);
  })

  return { app, db };
}


export function startTestApp() {
  const config = getConfigFromPartial({
    port: 8173,
    databasePath: ":memory:",
    serveUI: false,
  });

  const { app, db } = startApp(config);

  return {
    app,
    db,
    api: getTreaty("http://localhost:8173")
  };
}
