import { getConfigFromPartial, type Config } from "./config";
import { app } from "./http";
import { getDb } from "./db";
import { uiPlugin } from "./http/ui";
import { treaty } from "@elysiajs/eden";

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

  const db = getDb(config);
  const api = treaty(app);

  app.store.db = db;
  app.store.config = config;

  return {
    app,
    db,
    api,
  };
}
