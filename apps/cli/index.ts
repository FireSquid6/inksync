import { Command } from "@commander-js/extra-typings";
import { startAppWithVaults } from "libinksync/server/http";
import { DirectoryVault } from "libinksync/server/vault";
import { getDirectoryClient } from "libinksync/client";

const program = new Command();

program
  .command("start")
  .argument("<name>", "The name of the vault to use")
  .description("Starts the server")
  .action((name) => {
    const directory = process.cwd();
    const vault = new DirectoryVault(name, directory);
    startAppWithVaults([vault], 8700);
  });

program
  .command("sync-file")
  .description("Connects to a server and syncs")
  .argument("<address>", "The address of the server")
  .argument("<name>", "The name of the vault")
  .argument("<file>", "The file to sync")
  .action(async (address, name, file) => {
    const directory = process.cwd();
    console.log(address, name, directory);
    const client = getDirectoryClient(name, address, directory);
    const res = await client.syncFile(file);

    console.log(res);
  });



export async function runCli() {
  await program.parseAsync();
}


runCli();
