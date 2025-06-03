import { decodeFilepath } from "../encode";
import { Elysia, t } from "elysia";
import { Readable } from "stream";
import { cors } from "@elysiajs/cors";
import { loggerPlugin } from "./logger";
import { vaultsPlugin } from "./plugin";

export const app = new Elysia()
  .use(loggerPlugin)
  .use(vaultsPlugin())
  .use(cors())
  .get("/ping", () => {
    return "pong!";
  })
  .post("/vaults/:vault/files/:filepath", async (ctx) => {
    if (ctx.auth.type !== "authenticated") {
      return ctx.status("Unauthorized", "You must be authenticated.");
    }
    const user = ctx.auth.user;
    
    const { vault: vaultName, filepath } = ctx.params;
    const vault = ctx.getVaultByName(vaultName);
    if (!vault) {
      return ctx.status(404, `Vault ${vaultName} not found`);
    }
    
    if (!(await ctx.canAccessVault(user, vaultName))) {
      return ctx.status("Unauthorized", "This user cannot access this vault");
    }

    const fp = decodeFilepath(filepath);
    const { file, currentHash } = ctx.body;

    const result = await vault.pushUpdate(file, fp, currentHash);
    if (result.type === "success") {
      return ctx.status("OK", result);
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
  .get("/vaults/:vault/files/:filepath", async (ctx) => {
    if (ctx.auth.type !== "authenticated") {
      return ctx.status("Unauthorized", "You must be authenticated.");
    }
    const user = ctx.auth.user;
    
    const { vault: vaultName, filepath } = ctx.params;
    const vault = ctx.getVaultByName(vaultName);
    if (!vault) {
      return ctx.status(404, `Vault ${vaultName} not found`);
    }
    
    if (!(await ctx.canAccessVault(user, vaultName))) {
      return ctx.status("Unauthorized", "This user cannot access this vault");
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
    if (ctx.auth.type !== "authenticated") {
      return ctx.status("Unauthorized", "You must be authenticated.");
    }
    const { vault: vaultName } = ctx.params;
    const vault = ctx.getVaultByName(vaultName);
    const timestamp = ctx.query.since ?? 0;
    const user = ctx.auth.user;

    if (!vault) {
      return ctx.status(404, `Vault ${vaultName} not found`);
    }

    if (!(await ctx.canAccessVault(user, vaultName))) {
      return ctx.status("Unauthorized", "This user cannot access this vault");
    }

    const updates = vault.getUpdatesSince(timestamp);
    return ctx.status("OK", updates);
  }, {
    query: t.Optional(t.Object({
      since: t.Number(),
    })),
    params: t.Object({
      vault: t.String(),
    }),
  })
  .get("/vaults/:vault/updates/:filepath", async (ctx) => {
    if (ctx.auth.type !== "authenticated") {
      return ctx.status("Unauthorized", "You must be authenticated.");
    }

    const user = ctx.auth.user;
    const { vault: vaultName, filepath } = ctx.params;
    const vault = ctx.getVaultByName(vaultName);
    if (!vault) {
      return ctx.status(404, `Vault ${vaultName} not found`);
    }

    if (!(await ctx.canAccessVault(user, vaultName))) {
      return ctx.status(404, "This user cannot access this vault");
    }
    const fp = decodeFilepath(filepath);

    const result = vault.getUpdateFor(fp);
    return ctx.status("OK", result ?? "UNTRACKED");
  }, {
    params: t.Object({
      vault: t.String(),
      filepath: t.String(),
    }),
  })
  // TODO - add vault guard to upload
  // TODO - instead just put readable streams on the other post thing? This really won't work
  //
  // .post("/upload", async (ctx) => {
  //   const { lifetime, file } = ctx.body;
  //
  //   if (lifetime < 0 || lifetime > 7200) {
  //     return ctx.status(400, `Lifetime must be greater than 0 and less than 7200`);
  //   }
  //
  //   const filename = randomUUID();
  //   const filepath = path.join(`./temp/${filename}`);
  //
  //   const ws = fs.createWriteStream(filepath);
  //   const stream = fileToReadable(file);
  //   const error = await new Promise<Error | "OK">((resolve) => {
  //     stream.pipe(ws);
  //
  //     ws.on("finish", () => resolve("OK"))
  //     ws.on("error", (err) => resolve(err));
  //     stream.on("error", (err) => resolve(err));
  //   });
  //
  //   if (error !== "OK") {
  //     return ctx.status(500, `Stream error: ${error.message} ${error.stack} ${error.name} ${error.cause}`);
  //   }
  //
  //   return filename;
  // }, {
  //   body: t.Object({
  //     lifetime: t.Number(),
  //     file: t.File(),
  //   })
  // })
  // TODO - allow user to subscribe to vault events.
  .ws("/stream", () => {

  })
  .post("/users", async (ctx) => {

  }, {
    body: t.Object({
      joincode: t.String(),
      username: t.String(),
      password: t.String(),
    }),
  })
  .patch("/users/:id", async (ctx) => {
    if (ctx.auth.type !== "authenticated") {
      return ctx.status("Unauthorized");
    }

    if (ctx.auth.user.role !== "Superadmin") {
      return ctx.status("Unauthorized", "Must be a superadmin to modify user roles");
    }
    const otherUser = await ctx.getUser(ctx.params.id);

    if (otherUser === null) {
      return ctx.status("Not Found");
    }

    switch (ctx.body.role) {
      case "Admin":
        await ctx.changeUserRole(otherUser.id, "Admin");
        break;
      case "User":
        await ctx.changeUserRole(otherUser.id, "User");
        break;
      default:
        return ctx.status(400, `${ctx.body.role} is not a role you can promote to`)
    }
  }, {
    body: t.Object({
      role: t.String(),
    })
  })
  .delete("/users/:id", async (ctx) => {
    if (ctx.auth.type !== "authenticated") {
      return ctx.status("Unauthorized");
    }

    const deletingUser = await ctx.getUser(ctx.params.id);
    const myRole = ctx.auth.user.role;

    if (deletingUser === null) {
      return ctx.status("Not Found");
    }

    const canDelete = 
      (myRole === "Superadmin" && deletingUser.role !== "Superadmin") 
        || (myRole === "Admin" && deletingUser.role === "User");


    if (canDelete) {
      await ctx.deleteUser(deletingUser.id);
      return ctx.status("OK");
    }

    return ctx.status("Unauthorized");
  })
  .get("/users/:id", async (ctx) => {
    if (ctx.auth.type !== "authenticated") {
      return ctx.status("Unauthorized", "Must be authenticated to access");
    }

    const user = ctx.getUser(ctx.params.id);
    if (user === null) {
      return ctx.status("Not Found", `User ${ctx.params.id} not found`);
    }

    return ctx.status("OK", user);
  })
  .post("/tokens", async (ctx) => {
    await waitForRandomAmount();
    const { username, password } = ctx.body;

    const userId = await ctx.validateUsernamePassword(username, password);

    if (userId == null) {
      return ctx.status("Unauthorized");
    }


  }, {
    body: t.Object({
      username: t.String(),
      password: t.String(),
    })
  })
  .delete("/tokens/:id", async () => {

  })

export type App = typeof app;

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

// waits for somewhere between 0s and 1.5s
// this is for authentication functions --- prevents an
// attacker from figuring out if something e
async function waitForRandomAmount() {
  const t = Math.random() * 1.5;

  await new Promise((resolve) => setTimeout(resolve, t))
}
