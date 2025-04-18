import { Command } from "commander";
import { getDirectoryTracker } from "./track";

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
    console.log("starting the server!");
  });


export async function runCli() {
  await program.parseAsync();
}
