import { type Vault } from "./vault";
import { Logestic } from "logestic";
import { decodeFilepath } from "../encode";
import { Elysia, t } from "elysia";
// import { randomUUID } from "crypto";
// import path from "path";
// import fs from "fs";
// import { rejects } from "assert";

// TODO - encode and decode filepaths into base 64
export const app = new Elysia()
  .state("vaults", [] as Vault[])
  .state("tempfiles", new Map<string, number>)
  .get("/vaults", (ctx) => {
    const names = ctx.store.vaults.map((v) => v.getName());
    return names;
  })
  .post("/vaults/:vault/files/:filepath", async (ctx) => {
    const { vault: vaultName, filepath } = ctx.params;
    const vault = ctx.store.vaults.find((v) => v.getName() === vaultName);
    if (!vault) {
      return ctx.error(404, `Vault ${vaultName} not found`);
    }
    const fp = decodeFilepath(filepath);
    const { file, currentHash } = ctx.body;

    const result = await vault.pushUpdate(file, fp, currentHash);
    if (result.type === "success") {
      return result;
    }

    return ctx.error(400, `Failed to upload: ${result.reason}`);
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
  .get("/vaults/:vault/files/:filepath", async (ctx) => {
    const { vault: vaultName, filepath } = ctx.params;
    const vault = ctx.store.vaults.find((v) => v.getName() === vaultName);
    if (!vault) {
      return ctx.error(404, `Vault ${vaultName} not found`);
    }
    const fp = decodeFilepath(filepath);

    const result = await vault.getCurrent(fp);
    if (typeof result === "string") {
      return result;
    } 

    return await result.arrayBuffer();
  }, {
    params: t.Object({
      vault: t.String(),
      filepath: t.String(),
    })

  })
  .get("/vaults/:vault/updates", (ctx) => {
    const { vaults } = ctx.store;
    const { vault: vaultName } = ctx.params;
    const vault = vaults.find((v) => v.getName() === vaultName);
    const timestamp = ctx.query.since ?? 0;

    if (!vault) {
      return ctx.error(404, `Vault ${vaultName} not found`);
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
  .get("/vaults/:vault/updates/:filepath", (ctx) => {
    const { vault: vaultName, filepath } = ctx.params;
    const vault = ctx.store.vaults.find((v) => v.getName() === vaultName);
    if (vault === undefined) {
      return ctx.error(404, `Vault ${vaultName} not found`);
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
  // TODO - add vault guard to upload
  // .post("/upload", async (ctx) => {
  //   const { lifetime, file } = ctx.body;
  //   
  //   if (lifetime < 0 || lifetime > 7200) {
  //     return ctx.error(400, `Lifetime must be greater than 0 and less than 7200`);
  //   }
  //
  //   const filename = randomUUID();
  //   const stream = file.stream();
  //   const filepath = path.join(`./temp/${filename}`);
  //
  //   const ws = fs.createWriteStream(filepath);
  //
  //   ws.on("error", (error) => {
  //     return ctx.error(500, `Writestream error: ${error}`);
  //   });
  //
  //   for await (const chunk of stream) {
  //     // TODO - is there a way this fails with large files?
  //     // need to wait for "drain" events?
  //     // really not sure how a stream works under the hood
  //     ws.write(chunk);
  //   }
  //
  //   return filename;
  // }, {
  //   body: t.Object({
  //     lifetime: t.Number(),
  //     file: t.File(),
  //   })
  // })
  .get("/vaults/:vault/stream", (ctx) => {

  })
// TODO: /vaults/:vault/stream

export type App = typeof app;

export async function startAppWithVaults(vaults: Vault[], port: number): Promise<App> {
  await new Promise<void>((resolve) => {
    app.store.vaults = vaults;
    app.use(Logestic.preset("common"));
    app.listen(port, () => {
      console.log(`Server started on localhost:${port}`);
      resolve()
    });
  });

  return app;
}
