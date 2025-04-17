import { Command } from "commander";
import { makeCommit } from "./commit";
import { restoreTreeIndex } from "./restore";

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
  .command("pop-tree")
  .description("pops a tree at the specified index")
  .argument("treeIndex", "the index to pop the tree at")
  .action((treeIndex) => {
    if (typeof treeIndex !== "string") {
      throw new Error("Expected treeIndex to be a string");
    }

    const index = parseInt(treeIndex);
    const directory = process.cwd();

    restoreTreeIndex(index, directory);
  })

program
  .command("start")
  .description("Starts the server")
  .action(() => {
    console.log("starting the server!");
  });


export async function runCli() {
  await program.parseAsync();
}
