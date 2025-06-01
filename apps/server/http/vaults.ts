import { Elysia } from "elysia";
import { Vault } from "libinksync/server";
import { getVaultFromInfo, type Db } from "../db";
import { vaultsTable, type VaultInfo } from "../db/schema";


export const vaultsPlugin = new Elysia()
  .state("vaults", [] as Vault[])
  .state("tempfiles", new Map<string, number>)
  .state("db", {} as Db)
  .derive({ as: "global" },(ctx) => {
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
    }
  });

