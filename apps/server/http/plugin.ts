import { Elysia } from "elysia";
import { Vault } from "libinksync/vault";
import { getVaultFromInfo, type Db } from "../db";
import * as schema from "../db/schema";
import bearer from "@elysiajs/bearer";
import { and, eq } from "drizzle-orm";
import type { Config } from "../config";
import { randomUUID } from "crypto";
import words from "an-array-of-english-words";
import { localDate } from "drizzle-orm/gel-core";


export type AuthStatus =
  | Authenticated
  | NoToken
  | BadToken
  | ExpiredToken

export interface Authenticated {
  type: "authenticated";
  user: schema.User;
  token: string;
}

export interface NoToken {
  type: "no-token";
}

export interface BadToken {
  type: "bad-token";
}

export interface ExpiredToken {
  type: "expired-token";
}


export const vaultsPlugin = () => {
  return new Elysia({
    name: "vaults-plugin",
  })
    .state("vaults", [] as Vault[])
    .state("tempfiles", new Map<string, number>)
    .state("db", {} as Db)
    .state("config", {} as Config)
    .use(bearer())
    .derive({ as: "global" }, (ctx) => {
      const { db, vaults, config } = ctx.store
      return {
        getVaultByName(name: string): Vault | null {
          const vault = vaults.find((v) => v.getName() === name);
          return vault ?? null;
        },
        async addVault(vaultInfo: schema.VaultInfo) {
          await db
            .insert(schema.vaultsTable)
            .values(vaultInfo)

          const vault = await getVaultFromInfo(vaultInfo);
          vaults.push(vault);
        },
        getAllNames(): string[] {
          return ctx.store.vaults.map((v) => v.getName());
        },
        async regenerateVaults() {
          const vaultInfos = await db
            .select()
            .from(schema.vaultsTable)

          const newVaults = await Promise.all(vaultInfos.map((i) => getVaultFromInfo(i)));
          ctx.store.vaults = newVaults;
        },
        async canReadVault(user: schema.User, vaultName: string): Promise<boolean> {
          if (user.role === "Superadmin" || user.role === "Admin") {
            return true;
          }

          const access = (await db
            .select()
            .from(schema.accessTable)
            .where(and(
              eq(schema.accessTable.userId, user.id),
              eq(schema.accessTable.vaultName, vaultName),
            )))[0];

          if (access === undefined) {
            return false;
          }

          return access.read;
        },
        async canWriteVault(user: schema.User, vaultName: string): Promise<boolean> {
          if (user.role === "Superadmin" || user.role === "Admin") {
            return true;
          }

          const access = (await db
            .select()
            .from(schema.accessTable)
            .where(and(
              eq(schema.accessTable.userId, user.id),
              eq(schema.accessTable.vaultName, vaultName),
            )))[0];

          if (access === undefined) {
            return false;
          }

          return access.write;
        },
        async getUser(userId: string): Promise<schema.User | null> {
          const users = await db
            .select()
            .from(schema.usersTable)
            .where(eq(schema.usersTable.id, userId));

          if (users.length === 1) {
            return users[0]!;
          }
          return null;
        },
        async deleteUser(userId: string) {
          await db
            .delete(schema.usersTable)
            .where(eq(schema.usersTable.id, userId));

          await db
            .delete(schema.tokensTable)
            .where(eq(schema.tokensTable.userId, userId));
        },
        async changeUserRole(userId: string, newRole: schema.Role) {
          await db
            .update(schema.usersTable)
            .set({ role: newRole })
            .where(eq(schema.usersTable.id, userId));
        },
        async validateUsernamePassword(username: string, password: string): Promise<string | null> {
          const users = await db
            .select()
            .from(schema.usersTable)
            .where(eq(schema.usersTable.username, username));

          if (users.length !== 1) {
            return null;
          }

          const user = users[0]!;
          if (await verifyPassword(password, user.hashedPassword)) {
            return user.id;
          }
          return null;
        },
        async makeNewToken(userId: string): Promise<string> {
          const token = newRandomToken();
          const expirationTime = Date.now() + 30 * 24 * 60 * 60 * 1000;

          await db
            .insert(schema.tokensTable)
            .values({
              token,
              userId,
              expiresAt: expirationTime,
            })

          return token;
        },
        async deleteToken(userId: string, token: string) {
          await db
            .delete(schema.tokensTable)
            .where(and(
              eq(schema.tokensTable.userId, userId),
              eq(schema.tokensTable.token, token),
            ));
        },
        async createUser(username: string, password: string, code: string): Promise<schema.User | null> {
          const joincodes = await db
            .select()
            .from(schema.joincodeTable)
            .where(eq(schema.joincodeTable.code, code));

          if (joincodes.length !== 1) {
            return null;
          }
          const joincode = joincodes[0]!;
          const hashedPassword = await hashPassword(password);
          const id = randomUUID();

          await db
            .insert(schema.usersTable)
            .values({
              id,
              username,
              hashedPassword,
              role: joincode.role,
            });

          await db
            .delete(schema.joincodeTable)
            .where(eq(schema.joincodeTable.code, code));

          return {
            id,
            username,
            hashedPassword,
            role: joincode.role,
          }
        },
        async createJoincode(role: schema.Role, creator: string, expiresAt?: number): Promise<schema.Joincode> {
          const code = generateJoincode();
          expiresAt = expiresAt === undefined ? Date.now() + 24 * 60 * 60 * 1000 : expiresAt;

          await db
            .insert(schema.joincodeTable)
            .values({
              code,
              role,
              expiresAt,
              creator,
            });

          return {
            code,
            role,
            expiresAt,
            creator
          };
        },
        async getJoincode(code: string): Promise<schema.Joincode | null> {
          const codes = await db
            .select()
            .from(schema.joincodeTable)
            .where(eq(schema.joincodeTable.code, code));

          if (codes.length !== 1) {
            return null;
          }

          return codes[0]!;
        },
        async deleteJoincode(code: string) {
          await db
            .delete(schema.joincodeTable)
            .where(eq(schema.joincodeTable.code, code));
        },
        async getAllJoincodes(): Promise<schema.Joincode[]> {
          return await db
            .select()
            .from(schema.joincodeTable);
        },
        async createVault(vaultName: string, directory: string): Promise<schema.VaultInfo> {
          const info: schema.VaultInfo = {
            name: vaultName,
            location: directory,
            createdAt: Date.now(),
          }
          await db
            .insert(schema.vaultsTable)
            .values(info);

          const vault = await getVaultFromInfo(info);
          vaults.push(vault);

          return info;
        },
        async getPersmissionsFor(vault: string, userId: string): Promise<schema.Access> {
          const accesses = await db
            .select()
            .from(schema.accessTable)
            .where(and(
              eq(schema.accessTable.userId, userId),
              eq(schema.accessTable.vaultName, vault),
            ))

          if (accesses.length !== 1) {
            return {
              vaultName: vault,
              userId,
              read: false,
              write: false,
            }
          }

          return accesses[0]!;
        },
        async updatePermission(access: Access) {

        },
      }
    })
    .derive({ as: "global" }, async (ctx): Promise<{ auth: AuthStatus }> => {
      const { db } = ctx.store;

      if (typeof ctx.bearer !== "string") {
        return {
          auth: {
            type: !ctx.bearer ? "no-token" : "bad-token",
          }
        }
      }

      const token = (await db
        .select()
        .from(schema.tokensTable)
        .where(eq(schema.tokensTable.token, ctx.bearer))
        .limit(1))[0];

      if (!token) {
        return {
          auth: {
            type: "bad-token",
          }
        }
      }

      if (token.expiresAt <= Date.now()) {
        return {
          auth: {
            type: "expired-token",
          }
        }
      }

      const user = (await db
        .select()
        .from(schema.usersTable)
        .where(eq(schema.usersTable.id, token.userId))
        .limit(1))[0];

      if (!user) {
        return {
          auth: {
            type: "bad-token",
          }
        }
      }

      return {
        auth: {
          type: "authenticated",
          user,
          token: token.token,
        }
      }
    });
}


function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password);
}

function verifyPassword(givenPassword: string, hashedPassword: string) {
  return Bun.password.verify(givenPassword, hashedPassword);
}

function newRandomToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function generateJoincode(): string {
  const filteredWords = words.filter(word => word.length >= 4 && word.length <= 8);

  const selectedWords = [];
  for (let i = 0; i < 4; i++) {
    const randomIndex = Math.floor(Math.random() * filteredWords.length);
    selectedWords.push(filteredWords[randomIndex]);
  }

  return selectedWords.join("-");
}
