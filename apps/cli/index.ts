import { Command } from "@commander-js/extra-typings";
import path from "path";
import fs from "fs";
import YAML from "yaml";
import { serverConfigSchema, startServer } from "./server";
// import { startAppWithVaults, DirectoryVault, getDirectoryClient } from "libinksync";

const server = new Command()
  .name("server")

server
  .command("start")
  .description("Starts an inksync server with the provided config file")
  .option("-c, --config [directory]", "the directory to start the server in. Defaults to ${cwd}/inksync-server.conf")
  .action(({ config: configPath }) => {
    if (typeof configPath === "boolean" || configPath === undefined) {
      configPath = path.join(process.cwd(), "inksync.config.yaml");
    }

    if (!fs.existsSync(configPath)) {
      console.error(`Error: config path ${configPath} not found`);
      return;
    }
    try {
      const text = fs.readFileSync(configPath).toString();
      const yaml = YAML.parse(text);
      const parsed = serverConfigSchema.parse(yaml);
      startServer(parsed);
    } catch (e) {
      e = e as Error;
      console.error("Error reading config:")
      console.error(e);
    }
  })

const sync = new Command()
  .name("sync")

sync
  .command("init")
  .description("Connects to a server and syncs")
  .argument("<address>", "The address of the server")
  .argument("<name>", "The name of the vault")
  .action(async (address, name ) => {
    console.log("initializing with", address, name);
  });

sync
  .command("info")
  .description

const program = new Command()

program.addCommand(sync);
program.addCommand(server);

export async function runCli() {
  await program.parseAsync();
}


runCli();
