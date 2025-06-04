import { getConfigFromPartial, type Config } from "./config";
import { app } from "./http";
import { getDb, type Db } from "./db";
import * as schema from "./db/schema";
import { uiPlugin } from "./http/ui";
import { treaty } from "@elysiajs/eden";
import { generateJoincode } from "./http/plugin";

export async function startApp(config: Config) {
  const db = getDb(config);

  if (config.ensureJoinable) {
    await ensureJoinable(db);
  }

  app.store.db = db;
  app.store.config = config;
  app.store.vaults = [];

  if (config.serveUI) {
    app.use(uiPlugin());
  }

  app.listen(config.port, () => {
    console.log(`App started on ${config.port} with config:`);
    console.log(config);
  })

  return { app, db };
}

async function ensureJoinable(db: Db) {
  const users = await db
    .select()
    .from(schema.usersTable);

  if (users.length > 0) {
    return;
  }
  // delete all joincodes
  await db
    .delete(schema.joincodeTable);

  const code = generateJoincode();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

  await db
    .insert(schema.joincodeTable)
    .values({
      code,
      role: "Superadmin",
      expiresAt,
      creator: "virgin birth joincode",
    });

  console.log("No users detected. Here's a joincode to create your superadmin:");
  console.log(code);
}

export function startTestApp() {
  const config = getConfigFromPartial({
    port: 8173,
    databasePath: ":memory:",
    serveUI: false,
  });

  const db = getDb(config);
  const api = treaty(app);

  app.store.vaults = [];
  app.store.db = db;
  app.store.config = config;

  return {
    app,
    db,
    api,
  };
}
