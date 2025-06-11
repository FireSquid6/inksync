import { Elysia } from "elysia";
import { Vault } from "libinksync/vault";
import bearer from "@elysiajs/bearer";
import type { Config } from "../config";



export const vaultsPlugin = () => {
  return new Elysia({
    name: "vaults-plugin",
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
}


