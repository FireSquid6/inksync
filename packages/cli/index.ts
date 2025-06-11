import { Command } from "@commander-js/extra-typings";
import path from "path";
import fs from "fs";
import { startServer } from "./server";
import { getClient, logResults, logResult, setConnectfile } from "./client";
import { INKSYNC_DIRECTORY_NAME } from "libinksync/constants";

const server = new Command()
  .name("server")
  .description("Subcommand for operating on the server")

server
  .command("start")
  .description("Starts an inksync server with the provided config file")
  .option("-c, --config [directory]", "The filepath to the config file. Defaults to {cwd}/inskync.conf.ts")
  .action(({ config: configPath }) => {
    if (typeof configPath === "boolean" || configPath === undefined) {
      configPath = path.join(process.cwd(), "inksync-server-config.yaml");
    }

    if (!fs.existsSync(configPath)) {
      console.error(`Error: config path ${configPath} not found`);
      return;
    }
    startServer(configPath);
  })

const sync = new Command()
  .name("sync")
  .description("Subcommand for syncing to an existing server")

sync
  .command("connect")
  .description("Connects the current working directory to a vault")
  .requiredOption("-a, --address <address>", "The address of the server")
  .requiredOption("-n, --name <name>", "The name of the server")
  .requiredOption("-k, --key <key>", "Key to use to connect to the server")
  .action((options) => {
    const { address, name, key } = options;
    const directory = process.cwd()
    setConnectfile(directory, name, address, key);

    console.log(`Setup ${directory} to connect to ${name}@${address}`)
  });

sync
  .command("disconnect")
  .description("Disconnects the cwd from any connected vault")
  .action(async ()=> {
    const client = getClient(process.cwd());

    if (client === null) {
      console.log(`${process.cwd()} not connected to any vaults`);
      return;
    }

    fs.rmSync(`./${INKSYNC_DIRECTORY_NAME}`);

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

    console.log(`Success. ${result}ms round trip.`);
  })

sync
  .command("status")
  .description("Get the status of the sync")
  .action(async () => {
    const directory = process.cwd()
    const client = getClient(directory);
    if (client === null) {
      console.log(`${directory} not connected to any vaults`);
      return;
    }

    const result = await client.status();

    if (result.length === 0) {
      console.log("In sync.");
    }

    for (const [filepath, status] of result) {
      console.log(`${filepath} -> ${status}`);
    }
  })

const program = new Command()

program
  .command("generate-key")
  .description("Generates a new key for use with the keyfile")
  .action(() => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";

    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    console.log(result);
  })

program.addCommand(sync);
program.addCommand(server);


export async function runCli() {
  await program.parseAsync();
}


runCli();
