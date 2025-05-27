import { z } from "zod";
import { DirectoryVault } from "libinksync/server/directory";
import type { Vault } from "libinksync/server";
import { startAppWithVaults } from "libinksync/server/http";


export const baseVaultSchema = z.object({
  name: z.string(),
  adminKeyfile: z.string(),
});

export const serverConfigSchema = z.object({
  port: z.optional(z.number()),
  vaults: z.array(z.discriminatedUnion("type", [
    baseVaultSchema.extend({ type: z.literal("filesystem"), directory: z.string() }),
    // TODO - aws, google drive, etc.
  ])),
});

export type ServerConfig = z.infer<typeof serverConfigSchema>;

export async function startServer(config: ServerConfig) {
  const port = config.port ?? 8320;
  const vaults: Vault[] = config.vaults.map((v) => {
    switch (v.type) {
      case "filesystem":
        return new DirectoryVault(v.name, v.directory);
      //...
    }
  });

  await startAppWithVaults(vaults, port);
}
