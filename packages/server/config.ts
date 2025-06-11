import { z } from "zod";
import fs from "fs";
import YAML from "yaml";
import path from "path";
import type { Vault } from "libinksync/vault";
import { vaultFromDirectory } from "libinksync/vault/directory";

export const baseVaultSchema = z.object({
  name: z.string(),
  encrypted: z.boolean(),
});

export const vaultSchema = z.discriminatedUnion("type", [
  baseVaultSchema.extend({
    type: z.literal("directory"),
    directory: z.string(),
  }),
  baseVaultSchema.extend({
    type: z.literal("bucket"),
    //... TODO
  }),
]);

export type VaultInfo = z.infer<typeof vaultSchema>;

export const configSchema = z.object({
  port: z.optional(z.number()),
  vaultsDirectory: z.optional(z.string()),
  vaults: z.optional(z.array(vaultSchema)),
  keyfilePath: z.optional(z.string()),
});

export type PartialConfig = z.infer<typeof configSchema>;
export type Config = Required<PartialConfig>;



export function getConfigFromFile(filepath?: string): Config {
  let partialConfig: PartialConfig = {};

  if (filepath !== undefined && fs.existsSync(filepath)) {
    const text = fs.readFileSync(filepath).toString();
    const object = YAML.parse(text);
    partialConfig = configSchema.parse(object);
  }

  return getConfigFromPartial(partialConfig);
}

export function getConfigFromPartial(partialConfig: PartialConfig): Config {
  return {
    port: partialConfig.port ?? 3120,
    vaultsDirectory: partialConfig.vaultsDirectory ?? "store/vaults",
    vaults: partialConfig.vaults ?? [],
    keyfilePath: partialConfig.keyfilePath ?? "./keyfile.txt",
  }
}


export async function vaultFromInfo(vaultInfo: VaultInfo, config: Config): Promise<Vault> {
  switch (vaultInfo.type) {
    case "directory":
      const fullDirectory = path.join(config.vaultsDirectory, vaultInfo.directory);
      return await vaultFromDirectory(vaultInfo.name, fullDirectory);
    case "bucket":
      throw new Error("Bucket vaults are not implemented yet");
  }

}
