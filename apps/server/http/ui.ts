import path from "path";
import Elysia from "elysia";
import type { BunFile } from "bun";

function buildUi(directory: string) {
  const cwd = process.cwd();
  process.chdir(directory);
  Bun.spawnSync(["bun", "run", "build"], {
    stdin: "ignore",
    stdout: "inherit",
    stderr: "inherit",
  });
  process.chdir(cwd);
}

function getFile(staticDir: string, httpPath: string): BunFile {
  const filepath = path.join(staticDir, httpPath);

  if (filepath.split(".").length === 1) {
    return Bun.file(path.join(staticDir, "index.html"));
  }

  return Bun.file(filepath);
}

export function uiPlugin() {
  const directory = path.resolve(import.meta.dir, "../../../packages/admin-ui");
  buildUi(directory);
  const staticDir = path.join(directory, "dist");

  return new Elysia({
    name: "ui-plugin",
  })
    .get("/admin", () => {
      return getFile(staticDir, "");

    })
    .get("/admin/*", (ctx) => {
      return getFile(staticDir, ctx.params["*"]);
    })
  
}
