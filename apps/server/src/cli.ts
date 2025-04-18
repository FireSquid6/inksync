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


export async function runCli() {
  await program.parseAsync();
}
