import { Command } from "@commander-js/extra-typings";
import path from "path";
import fs from "fs";
import YAML from "yaml";
import { serverConfigSchema, startServer } from "./server";
import { getClient, logResults, logResult, setConnectfile } from "./client";

const server = new Command()
  .name("server")
  .description("Subcommand for operating on the server")

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
  .description("Subcommand for syncing to an existing server")

sync
  .command("connect")
  .description("Connects the current workind directory to a vault")
  .argument("<address>", "The address of the server")
  .argument("<name>", "The name of the vault")
  .action(async (address, name ) => {
    // TODO - ping the address to confirm it works
    const directory = process.cwd()
    setConnectfile(directory, name, address);
    console.log(`Setup ${directory} to connect to ${name}@${address}`)
  });

sync
  .command("info")
  .description("Lists current info on the connected vault for this directory")
  .action(async () => {
    const directory = process.cwd();
    const client = getClient(directory);
    if (client === null) {
      console.log(`${directory} not connected to any vaults`);
      return;
    }

    const lastPullTimestamp = await client.getLastServerPull();
    const date = new Date(lastPullTimestamp);

    console.log(`${directory} <-> ${client.getVault()}@${client.getAddress()}`);
    console.log(`Last full sync: ${date.toUTCString()}`);
  });

sync
  .command("pull")
  .description("Pulls all unknown changes from the server to this directory")
  .action(async () => {
    const directory = process.cwd();
    const client = getClient(directory);
    if (client === null) {
      console.log(`${directory} not connected to any vaults`);
      return;
    }

    const results = await client.syncServerUpdated();
    logResults(results);
  })

sync
  .command("all")
  .description("Pulls and pushes all necessary updates to this directory")
  .action(async () => {
    const directory = process.cwd();
    const client = getClient(directory);
    if (client === null) {
      console.log(`${directory} not connected to any vaults`);
      return;
    }

    const results = await client.syncAll();
    logResults(results);
  })

sync
  .command("push")
  .description("Pushes all changed files to this directory")
  .action(async () => {
    const directory = process.cwd();
    const client = getClient(directory);
    if (client === null) {
      console.log(`${directory} not connected to any vaults`);
      return;
    }

    const results = await client.syncClientUpdated();
    logResults(results);
  })

sync
  .command("file")
  .description("Syncs a single file")
  .argument("<file>", "The file to sync. Relative path to the current dir")
  .action(async (file) => {
    const directory = process.cwd();
    const client = getClient(directory);
    if (client === null) {
      console.log(`${directory} not connected to any vaults`);
      return;
    }

    const result = await client.syncFile(file);
    logResult(file, result);
  })

sync
  .command("ping")
  .description("Pings the sync server")
  .action(async () => {
    const directory = process.cwd();
    const client = getClient(directory);
    if (client === null) {
      console.log(`${directory} not connected to any vaults`);
      return;
    }

    const result = await client.ping();

    if (typeof result === "string") {
      console.log(result);
    } else {
      console.log(`Success. ${result}ms round trip.`);
    }
  })

const program = new Command()

program.addCommand(sync);
program.addCommand(server);

export async function runCli() {
  await program.parseAsync();
}


runCli();
