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

    if (!(await ctx.canWriteVault(user, vaultName))) {
      return ctx.status("Unauthorized", "This user cannot access this vault");
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
  .post("/vaults", async (ctx) => {

  }, {
    body: t.Object({
      vaultName: t.String(),
      directory: t.String(),
    })
  })
  .get("/vaults/:vault", async (ctx) => {

  })
  .patch("/vaults/:vault/access", (ctx) => {

  }, {
    body: t.Object({
      vaultName: t.String(),
      permissions: t.Array(t.Object({
        userId: t.String(),
        read: t.Boolean(),
        meta: t.Boolean(),
        write: t.Boolean(),
      }))
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

    if (!(await ctx.canReadVault(user, vaultName))) {
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

    if (!(await ctx.canReadVault(user, vaultName))) {
      return ctx.status("Unauthorized", "This user cannot access this vault");
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
    if (ctx.auth.type !== "authenticated") {
      return ctx.status("Unauthorized", "You must be authenticated.");
    }

    const user = ctx.auth.user;
    const { vault: vaultName, filepath } = ctx.params;
    const vault = ctx.getVaultByName(vaultName);
    if (!vault) {
      return ctx.status(404, `Vault ${vaultName} not found`);
    }

    if (!(await ctx.canReadVault(user, vaultName))) {
      return ctx.status(404, "This user cannot access this vault");
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
    const { joincode, username, password } = ctx.body;

    if (username.length <= 4 || username.length >= 24) {
      return ctx.status(400, "Username must be between 4 and 24 characters");
    }

    if (!isValidPassword(password)) {
      return ctx.status(400, "Password invalid. Must contain captial, lowercase, special, and number. Must be between 12 and 32 characters");
    }

    await waitForRandomAmount();
    const user = await ctx.createUser(username, password, joincode);

    if (user === null) {
      return ctx.status(400, "Joincode was invalid");
    }

    return user;
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

      ctx.set.status = 200;
      return;
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
    const token = await ctx.makeNewToken(userId);

    return token;
  }, {
    body: t.Object({
      username: t.String(),
      password: t.String(),
    })
  })
  .delete("/tokens/:token", async (ctx) => {
    if (ctx.auth.type !== "authenticated") {
      return ctx.status("Unauthorized", "Must be authenticated to access");
    }
    const { user } = ctx.auth;
    const { token } = ctx.params;

    await ctx.deleteToken(user.id, token);

    return ctx.status("OK");
  })
  .post("/joincodes", async (ctx) => {
    if (ctx.auth.type !== "authenticated") {
      return ctx.status("Unauthorized", "Must be authenticated to access");
    }
    const { user } = ctx.auth;
    const { role } = ctx.body;

    const isValid = (user.role === "Superadmin" && (role === "Admin" || role === "User"))
      || (user.role === "Admin" && role === "User");

    if (!isValid) {
      return ctx.status(400, "You do not have permission to create a joincode for that role");
    }

    const joincode = await ctx.createJoincode(role, user.id)
    return joincode;
  }, {
    body: t.Object({
      role: t.String(),
    })
  })
  .delete("joincodes/:code", async (ctx) => {
    if (ctx.auth.type !== "authenticated") {
      return ctx.status("Unauthorized", `Must be authenticated to access, instead ${ctx.auth.type}`);
    }
    const { user } = ctx.auth;
    const joincode = await ctx.getJoincode(ctx.params.code)
    if (joincode === null) {
      return ctx.status("Not Found");
    }

    const canDelete = (user.role === "Superadmin") || (user.role === "Admin" && joincode.creator === user.id)

    if (canDelete) {
      await ctx.deleteJoincode(joincode.code);
      return ctx.status("OK");
    }
    return ctx.status("Unauthorized");
  })
  .get("/joincodes", async (ctx) => {
    if (ctx.auth.type !== "authenticated") {
      return ctx.status("Unauthorized", "Must be authenticated to access");
    }
    const { user } = ctx.auth;
    if (!(user.role === "Admin" || user.role === "Superadmin")) {
      return ctx.status("Unauthorized");
    }

    const joincodes = await ctx.getAllJoincodes();
    return joincodes;
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

function isValidPassword(password: string): boolean {
  if (password.length < 12 || password.length > 32) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecial;
}

// waits for somewhere between 0s and 1.5s
// this is for authentication functions --- prevents an
// attacker from figuring out if something e
async function waitForRandomAmount() {
  const t = Math.random() * 1.5;

  await new Promise((resolve) => setTimeout(resolve, t))
}
