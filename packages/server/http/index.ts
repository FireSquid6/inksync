import { decodeFilepath } from "../encode";
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { loggerPlugin } from "./logger";
import { vaultsPlugin } from "./plugin";
import { rateLimit } from "elysia-rate-limit";


export const routes = () => new Elysia({
  name: "routes",
})
  .use(vaultsPlugin())
  .post("/vaults/:vault/files/:filepath", async (ctx) => {
    const { vault: vaultName, filepath } = ctx.params;
    const vault = ctx.getVaultByName(vaultName);
    if (!vault) {
      return ctx.status(404, `Vault ${vaultName} not found`);
    }

    const fp = decodeFilepath(filepath);
    const { file, currentHash } = ctx.body;

    const result = await vault.pushUpdate(file, fp, currentHash);
    if (result.type === "success") {
      return result;
    }

    return ctx.status(400, `Failed to upload: ${result.reason}`);
  }, {
    params: t.Object({
      vault: t.String(),
      filepath: t.String(),
    }),
    body: t.Object({
      currentHash: t.String(),
      file: t.Union([t.File(), t.Literal("DELETE")]),
    })
  })
  .get("/vaults", async (ctx) => {
    const { config } = ctx.store;

    return config.vaults;
  })
  .get("/vaults/:vault", async (ctx) => {
    const { vaults } = ctx.store;
    const vault = vaults.find((v) => v.getName() === ctx.params.vault);

    if (vault === undefined) {
      return ctx.status("Not Found",)
    }

    return vault;
  })
  .get("/vaults/:vault/files/:filepath", async (ctx) => {

    const { vault: vaultName, filepath } = ctx.params;
    const vault = ctx.getVaultByName(vaultName);
    if (!vault) {
      return ctx.status(404, `Vault ${vaultName} not found`);
    }

    const fp = decodeFilepath(filepath);

    const result = await vault.getCurrent(fp);
    if (typeof result === "string") {
      return result;
    }

    return ctx.status("OK", await result.arrayBuffer());
  }, {
    params: t.Object({
      vault: t.String(),
      filepath: t.String(),
    })

  })
  .get("/vaults/:vault/updates", async (ctx) => {
    const { vault: vaultName } = ctx.params;
    const vault = ctx.getVaultByName(vaultName);
    const timestamp = ctx.query.since ?? 0;

    if (!vault) {
      return ctx.status(404, `Vault ${vaultName} not found`);
    }

    const updates = vault.getUpdatesSince(timestamp);
    return updates;
  }, {
    query: t.Optional(t.Object({
      since: t.Number(),
    })),
    params: t.Object({
      vault: t.String(),
    }),
  })
  .get("/vaults/:vault/updates/:filepath", async (ctx) => {
    const { vault: vaultName, filepath } = ctx.params;
    const vault = ctx.getVaultByName(vaultName);
    if (!vault) {
      return ctx.status(404, `Vault ${vaultName} not found`);
    }

    const fp = decodeFilepath(filepath);

    const result = vault.getUpdateFor(fp);
    return result ?? "UNTRACKED";
  }, {
    params: t.Object({
      vault: t.String(),
      filepath: t.String(),
    }),
  })
  .ws("/stream", () => {

  })

export const app = new Elysia({
  serve: {
    maxRequestBodySize: 1024 * 1024 * 512  // 512 MB
  }
})
  .use(rateLimit({
    max: 100000,
    duration: 1000,
    errorResponse: "Rate limited",
  }))
  .use(loggerPlugin)
  .use(cors())
  .use(vaultsPlugin())
  .get("/ping", () => {
    return "pong!";
  })
  .guard({
      beforeHandle(ctx) {
        if (!ctx.authenticated) {
          return ctx.status("Unauthorized", "You must be authenticated to do this");
        }
      }
    },(app) => app 
    .use(routes)
  )

export type App = typeof app;
