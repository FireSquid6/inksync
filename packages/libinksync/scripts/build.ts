import path from "path";

async function main() {

  const buildDir = path.resolve(__dirname, "../build");
  const entrypoint = path.resolve(__dirname, "../src/index.ts");

  const result = await Bun.build({
    entrypoints: [entrypoint],
    outdir: buildDir,
    minify: false,
    target: "node",
  });


  if (!result.success) {
    console.log("Build failed:");
    console.log(result);
    return;
  }

  console.log("Build succeeded!");
}


main();
