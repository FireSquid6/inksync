import { Elysia } from "elysia";
import { Vault } from "libinksync/vault";
import type { Config } from "../config";
import bearer from "@elysiajs/bearer";
import { hasKey } from "../auth";


export const vaultsPlugin = () => new Elysia({
  name: "vault-plugin"
})
  .state("vaults", [] as Vault[])
  .state("tempfiles", new Map<string, number>)
  .state("config", {} as Config)
  .use(bearer())
  .derive({ as: "global" }, (ctx) => {
    const { vaults } = ctx.store
    return {
      getVaultByName(name: string): Vault | null {
        const vault = vaults.find((v) => v.getName() === name);
        return vault ?? null;
      },
      getAllNames(): string[] {
        return ctx.store.vaults.map((v) => v.getName());
      }
    }
  })
  .derive({ as: "global" }, async (ctx): Promise<{ authenticated: boolean }> => {
    const bearer = ctx.bearer;
    const { config } = ctx.store;
    if (bearer === undefined || bearer === null || bearer === "") {
      return notAuthenticated()
    }

    if (typeof bearer !== "string") {
      return notAuthenticated();
    }

    if (await hasKey(bearer, config.keyfilePath)) {
      return authenticated();
    }

    return notAuthenticated();
  })

function notAuthenticated() {
  return {
    authenticated: false,
  }
}

function authenticated() {
  return {
    authenticated: true,
  }
}
