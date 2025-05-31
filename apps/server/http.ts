import { type Vault } from "libinksync/server";
import { decodeFilepath } from "./encode";
import { Elysia, t } from "elysia";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { cors } from "@elysiajs/cors";

function logResponse(method: string, path: string, code: number | string) {
  let marker = "+";

  while (method.length < 5) {
    method = method + " ";
  }

  if (typeof code === "number" && code >= 400) {
    if (code < 500) {
      marker = "-";
    } else {
      marker = "!";
    }
  } else {
    if (code === "INTERNAL_SERVER_ERROR" || code === "UNKNOWN" || code === "INVALID_COOKIE_SIGNATURE") {
      marker = "!";
    } else {
      marker = "-";
    }
  }

  console.log(`${marker} ${method} ${path} -> ${code}`);
}

export const app = new Elysia()
  .state("vaults", [] as Vault[])
  .state("tempfiles", new Map<string, number>)
  .use(cors())
  .onAfterResponse((ctx) => {
    const method = ctx.request.method;
    const path = ctx.path;
    const status = ctx.set.status;
    logResponse(method, path, status ?? 500);
  })
  .onError((ctx) => {
    const method = ctx.request.method;
    const path = ctx.path;
    logResponse(method, path, ctx.code)
  })
  .get("/ping", () => {
    return "pong!";
  })
  .get("/server-error", () => {
    throw new Error("fucked");
  })
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
  .post("/upload", async (ctx) => {
    const { lifetime, file } = ctx.body;

    if (lifetime < 0 || lifetime > 7200) {
      return ctx.error(400, `Lifetime must be greater than 0 and less than 7200`);
    }

    const filename = randomUUID();
    const filepath = path.join(`./temp/${filename}`);

    const ws = fs.createWriteStream(filepath);
    const stream = fileToReadable(file);
    const error = await new Promise<Error | "OK">((resolve) => {
      stream.pipe(ws);

      ws.on("finish", () => resolve("OK"))
      ws.on("error", (err) => resolve(err));
      stream.on("error", (err) => resolve(err));
    });

    if (error !== "OK") {
      return ctx.error(500, `Stream error: ${error.message} ${error.stack} ${error.name} ${error.cause}`);
    }

    return filename;
  }, {
    body: t.Object({
      lifetime: t.Number(),
      file: t.File(),
    })
  })
  // TODO - allow user to subscribe to vault events.
  .ws("/stream", {

  })

export type App = typeof app;

export async function startAppWithVaults(vaults: Vault[], port: number): Promise<App> {
  await new Promise<void>((resolve) => {
    app.store.vaults = vaults;
    app.listen(port, () => {
      console.log(`Server started on localhost:${port}`);
      resolve()
    });
  });

  return app;
}

function fileToReadable(file: File): Readable {
  const reader = file.stream().getReader();

  return new Readable({
    async read() {
      try {
        const { done, value } = await reader.read();
        if (done) {
          this.push(null);
        } else {
          this.push(Buffer.from(value));
        }
      } catch (e) {
        const error = e instanceof Error ? e : undefined;
        this.destroy(error);
      }
    }
  });
}
