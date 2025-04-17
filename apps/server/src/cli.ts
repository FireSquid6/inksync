import { Command } from "commander";
import { makeCommit } from "./commit";

const program = new Command();

program
  .command("test-commit")
  .description("Runs a test commit to ensure that everything is working properly")
  .action(() => {
    const directory = process.cwd();
    try {
      makeCommit(directory);
    } catch (e) {
      console.log("Error:");
      console.log(e);
    }

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
