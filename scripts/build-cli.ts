#!/usr/bin/env bun


process.chdir(import.meta.dir);
process.chdir("../packages/cli");


const targets: string[] = [
  "bun-linux-x64",
  "bun-linux-arm64",
  "bun-darwin-arm64",
  "bun-darwin-x64",
];

for (const target of targets) {
  build(target);
}


function build(target: string) {
  const command = `bun build ./index.ts --compile --outfile build/inksync-${target} --target=${target}`;
  console.log(`------ Building for ${target}:`)
  Bun.spawnSync(command.split(" "), {
    stdout: "inherit",
    stdin: "ignore",
    stderr: "inherit",
  });
}

