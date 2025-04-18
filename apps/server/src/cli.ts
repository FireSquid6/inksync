import { Command } from "commander";
import { getDirectoryTracker } from "./track";
import { startApp } from ".";

const program = new Command();

program
  .command("test")
  .description("Runs a test thingy")
  .action(() => {
    const directory = process.cwd();
    const tracker = getDirectoryTracker(directory);

    tracker.getPathsUpdatedSince(0);
  });

program
  .command("start")
  .description("Starts the server")
  .action(() => {
    const directory = process.cwd();
    startApp(directory);
  });

program
  .command("connect")
  .description("Connects to a provided server as a client")
  .argument("<address>", "The address of the server")
  .action((address) => {
    if (typeof address !== "string") {
      throw new Error(`Address was ${address} (${typeof address}) and not a string`);
    }

    const socket = new WebSocket(`ws://${address}/listen`);
  });


export async function runCli() {
  await program.parseAsync();
}
