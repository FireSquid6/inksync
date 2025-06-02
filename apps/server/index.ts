import { type Config } from "./config";
import { app } from "./http";
import { getDb } from "./db";
import { elysiaVite } from "./http/vite";

export function startApp(config: Config) {
  const db = getDb(config);
  app.store.db = db;
  app.store.config = config;
  
  if (config.serveUI) {
    console.log("Using vite");
    app.use(elysiaVite({
      viteConfigFilePath: `${import.meta.dir}/ui/vite.config.ts`,
      entryHtmlFile: `${import.meta.dir}/ui/index.html`,
      entryClientFile: `${import.meta.dir}/ui/index.tsx`,
      isReact: true,
    }));
  }

  app.listen(config.port, () => {
    console.log(`App started on ${config.port} with config:`);
    console.log(config);
  })

  return app;
}

