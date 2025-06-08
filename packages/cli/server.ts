import { startApp } from "server";
import { getConfigFromFile } from "server/config";

export async function startServer(configFilepath: string) {
  const config = getConfigFromFile(configFilepath);
  await startApp(config);
}
