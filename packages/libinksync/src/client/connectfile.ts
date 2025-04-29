import { z } from "zod";
import fs from "fs";
import path from "path";

export const connectfileSchema = z.object({
  address: z.string(),
  name: z.string(),
});

export type Connectfile = z.infer<typeof connectfileSchema>;

export function readConnectfile(filepath: string): Connectfile {
  const text = fs.readFileSync(filepath).toString();
  const json = JSON.parse(text);

  return connectfileSchema.parse(json);
}

export function writeConnectfile(filepath: string, connectfile: Connectfile): void {
  const text = JSON.stringify(connectfile);
  fs.mkdirSync(path.dirname(filepath), { recursive: true });
  fs.writeFileSync(filepath, text);
}
