import { Command } from "commander";
import { getDirectoryTracker } from "inksync-sdk/server/tracker";
import { startApp } from "inksync-sdk/server";
import { InksyncClient } from "inksync-sdk/client";

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
      throw new Error("Got bad type for address. Should be string");
    }

    const client = new InksyncClient(address);
    client.onMessage((m) => {
      console.log("Got message:");
      console.log(m);
    })
  });


export async function runCli() {
  await program.parseAsync();
}
