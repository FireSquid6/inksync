import { test, expect } from "bun:test";
import { getDirectoryClient } from "@/client";
import { startAppWithVaults } from "@/server/http";
import { DirectoryVault } from "@/server/vault";
import path from "path";
import fs from "fs";
import { testdir } from "./setup.test";

test("basic client update", async () => {
  const vaultDir = path.join(testdir, "server-a");
  const clientDir = path.join(testdir, "client-a-1");

  const vault = new DirectoryVault("vault", vaultDir);

  const app = await startAppWithVaults([vault], 8471);
  const client = getDirectoryClient("vault", "localhost:8471", clientDir);

  const newFilePath = path.join(clientDir, "my-file.txt");
  fs.writeFileSync(newFilePath, "Hello, world!");

  const clientRes = await client.syncFile("my-file.txt");
  expect(clientRes).toEqual({ type: "pushed", domain: "good" });

  let file = await vault.getCurrent("my-file.txt");
  expect(typeof file).not.toBe("string");
  file = file as Blob
  expect(await file.text()).toBe("Hello, world!");

  app.stop();
});

