import fs from "fs";
import path from "path";
import { beforeAll } from "bun:test";

export const testdir = path.resolve(__dirname, "..", "testdir")

function resetTestDir() {
  if (fs.existsSync(testdir)) {
    fs.rmSync(testdir, { recursive: true });
  }

  fs.mkdirSync(testdir, { recursive: true });
  console.log(`Reset testing directory ${testdir}`);
}


beforeAll(() => {
  resetTestDir();
})
