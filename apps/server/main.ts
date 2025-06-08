import { startApp } from ".";
import { getConfigFromFile } from "./config";

const configPath = process.env.INKSYNC_CONFIG_PATH ?? "./inksync-server-config.yaml";
const config = getConfigFromFile(configPath);

console.log(`Using config path ${configPath}`)

startApp(config);
