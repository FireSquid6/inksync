import { startApp } from ".";
import { getConfigFromFile } from "./config";

const configPath = process.env.INKSYNC_CONFIG_PATH ?? "./inksync-server-config.yaml";
const config = getConfigFromFile(configPath);

startApp(config);
