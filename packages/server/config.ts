import { z } from "zod";
import fs from "fs";
import YAML from "yaml";
import path from "path";
import type { Vault } from "libinksync/vault";
import { vaultFromDirectory } from "libinksync/vault/directory";

export const baseVaultSchema = z.object({
  name: z.string(),
  public: z.boolean(),
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
  databasePath: z.optional(z.string()),
  serveUI: z.optional(z.boolean()),
  ensureJoinable: z.optional(z.boolean()),
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
    databasePath: partialConfig.databasePath ?? ":memory:",
    serveUI: partialConfig.serveUI ?? true,
    vaultsDirectory: partialConfig.vaultsDirectory ?? "store/vaults",
    ensureJoinable: partialConfig.ensureJoinable ?? false,
    vaults: partialConfig.vaults ?? [],
    keyfilePath: partialConfig.keyfilePath ?? "./keyfile.json",
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
