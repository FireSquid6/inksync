import { Command } from "commander";
import { startApp } from "inksync-sdk/server";
import { InksyncConnection, DirectoryStore } from "inksync-sdk/client";

const program = new Command();

program
  .command("start")
  .description("Starts the server")
  .action(() => {
    const directory = process.cwd();
    startApp(directory);
  });

program
  .command("sync")
  .description("Connects to a server and syncs")
  .argument("<address>", "The address of the server")
  .action(async (address) => {
    const directory = process.cwd();
    const connection = new InksyncConnection(address);

    await connection.waitForConnection();

    const res = await connection.sendAndRecieve({
      type: "AUTHENTICATE",
      token: "token1",
    })

    if (res.type !== "AUTHENTICATED") {
      console.log("Failed to authenticated. Got message:")
      console.log(res);
      return;
    }

    const store = new DirectoryStore(directory, connection);

    store.syncAll();
  });



export async function runCli() {
  await program.parseAsync();
}


runCli();
