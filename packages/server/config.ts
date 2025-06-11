import { z } from "zod";
import fs from "fs";
import YAML from "yaml";

export const configSchema = z.object({
  port: z.optional(z.number()),
  databasePath: z.optional(z.string()),
  serveUI: z.optional(z.boolean()),
  ensureJoinable: z.optional(z.boolean()),
  vaultsDirectory: z.optional(z.string()),
});

export type PartialConfig = z.infer<typeof configSchema>;
export type Config = Required<PartialConfig>;


export const vaults = z.object({

})

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
  }
}

