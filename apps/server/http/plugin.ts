import { Elysia } from "elysia";
import { Vault } from "libinksync/server";
import { getVaultFromInfo, type Db } from "../db";
import { accessTable, tokensTable, usersTable, vaultsTable, type User, type VaultInfo } from "../db/schema";
import bearer from "@elysiajs/bearer";
import { and, eq } from "drizzle-orm";
import type { Config } from "../config";


export type AuthStatus =
  | Authenticated
  | NoToken
  | BadToken
  | ExpiredToken

export interface Authenticated {
  type: "authenticated";
  user: User;
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
    const { db, vaults } = ctx.store
    return {
      getVaultByName(name: string): Vault | null {
        const vault = vaults.find((v) => v.getName() === name);
        return vault ?? null;
      },
      async addVault(vaultInfo: VaultInfo) {
        await db
          .insert(vaultsTable)
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
          .from(vaultsTable)

        const newVaults = await Promise.all(vaultInfos.map((i) => getVaultFromInfo(i)));
        ctx.store.vaults = newVaults;
      },
      async canAccessVault(user: User, vaultName: string): Promise<boolean> {
        const { db } = ctx.store;
        if (user.isAdmin) {
          return true;
        }

        const access = await db
          .select()
          .from(accessTable)
          .where(and(
            eq(accessTable.userId, user.id),
            eq(accessTable.vaultName, vaultName),
          ))

        return access.length === 1;
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
      .from(tokensTable)
      .where(eq(tokensTable.token, ctx.bearer))
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
      .from(usersTable)
      .where(eq(usersTable.id, token.userId))
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

