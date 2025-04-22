import { Command } from "commander";
import { startApp } from "inksync-sdk/server";

const program = new Command();

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
  });

async function readLine(): Promise<string> {
  for await (const line of console) {
    return line;
  }
  return ""; // Return an empty string if no input is received
}


export async function runCli() {
  await program.parseAsync();
}


runCli();
