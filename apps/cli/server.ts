import { z } from "zod";
import { Vault, vaultFromDirectory } from "libinksync/vault";


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
  const vaults: Vault[] = await Promise.all(config.vaults.map(async (v) => {
    switch (v.type) {
      case "filesystem":
        return await vaultFromDirectory(v.name, v.directory);
      //...
    }
  }));
  console.log("Need to fix");

}
