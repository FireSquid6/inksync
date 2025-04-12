import { Command } from "commander";

const program = new Command();

program
  .command("test-commit")
  .description("Runs a test commit to ensure that everything is working properly")
  .action(() => {
    console.log("running an example commit!");
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
