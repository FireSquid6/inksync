import { z } from "zod";
import YAML from "yaml";
import fs from "fs";

export const configSchema = z.object({
  storeDirectory: z.string(),
  filesystemSources: z.array(z.string()),
});

export type Config = z.infer<typeof configSchema>;


export function readConfigFromFile(filepath: string): Config {
  const text = fs.readFileSync(filepath).toString();
  const data = YAML.parse(text);
  return configSchema.parse(data);
}

