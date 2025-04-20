import { Command } from "commander";
import { startApp } from "inksync-sdk/server";
import { InksyncClient } from "inksync-sdk/client";

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
    interactive(client);
  });

async function readLine(): Promise<string> {
  for await (const line of console) {
    return line;
  }
  return ""; // Return an empty string if no input is received
}

async function interactive(client: InksyncClient) {
  client.onMessage((m) => {
    console.log("Recieved message:");
    console.log(m);
  });

  while (true) {
    const line = await readLine();
    switch (line) {
      case "FETCH":

        break;
      case "PUSH":

        break;
    }
  }
}

export async function runCli() {
  await program.parseAsync();
}


runCli();
