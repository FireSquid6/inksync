import { z } from "zod";
import fs from "fs";
import YAML from "yaml";

export const configSchema = z.object({
  doAuthentication: z.optional(z.boolean()),
  port: z.optional(z.number()),
  storeDirectory: z.optional(z.string()),
});

export type PartialConfig = z.infer<typeof configSchema>;
export type Config = Required<PartialConfig>;


export function getConfig(filepath?: string): Config {
  let partialConfig: PartialConfig = {};

  if (filepath !== undefined && fs.existsSync(filepath)) {
    const text = fs.readFileSync(filepath).toString();
    const object = YAML.parse(text);
    partialConfig = configSchema.parse(object);
  }

  return {
    doAuthentication: partialConfig.doAuthentication ?? true,
    port: partialConfig.port ?? 3120,
    storeDirectory: partialConfig.storeDirectory ?? "./store",
  }
}
