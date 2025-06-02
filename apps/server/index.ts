import { type Config } from "./config";
import { app } from "./http";
import { getDb } from "./db";
import { uiPlugin } from "./ui";

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

  return app;
}

