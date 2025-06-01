import { test, expect } from "bun:test";
import { getDirectoryClient } from "../client/directory";
import { vaultFromDirectory } from "../server";
import path from "path";
import fs from "fs";
import { testdir } from "./setup.test";
import type { Conflict } from "../client/results";
import { directApi } from "../client/api";

test("basic client update", async () => {
  const vaultDir = path.join(testdir, "server-a");
  const clientDir = path.join(testdir, "client-a-1");

  const vault = await vaultFromDirectory("vault", vaultDir);
  const api = directApi(vault);

  const client = getDirectoryClient(api, clientDir);

  const newFilePath = path.join(clientDir, "my-file.txt");
  fs.writeFileSync(newFilePath, "Hello, world!");

  const clientRes = await client.syncFile("my-file.txt");
  expect(clientRes).toEqual({ type: "pushed", domain: "good" });

  let file = await vault.getCurrent("my-file.txt");
  expect(typeof file).not.toBe("string");
  file = file as Blob
  expect(await file.text()).toBe("Hello, world!");

  // do the same thing. It should just be boring
  const res2 = await client.syncFile("my-file.txt");
  expect(res2).toEqual({ type: "in-sync", domain: "good" });
});


test("mulitple clients syncing a file", async () => {
  const vaultDir = path.join(testdir, "server-b");
  const client1Dir = path.join(testdir, "client-b-1");
  const client2Dir = path.join(testdir, "client-b-2");

  const vault = await vaultFromDirectory("vault", vaultDir);

  const api = directApi(vault);
  const client1 = getDirectoryClient(api, client1Dir);
  const client2 = getDirectoryClient(api, client2Dir);

  const newFilePath = path.join(client1Dir, "my-file.txt");
  fs.writeFileSync(newFilePath, "Hello, world!");

  const res1 = await client1.syncFile("my-file.txt");
  expect(res1).toEqual({ type: "pushed", domain: "good" });

  let file = await vault.getCurrent("my-file.txt");
  expect(typeof file).not.toBe("string");
  file = file as Blob
  expect(await file.text()).toBe("Hello, world!");

  const res2 = await client2.syncServerUpdated();
  expect(res2.length).toBe(1);
  const [filepath, syncRes] = res2[0]!;

  expect(filepath).toBe("my-file.txt");
  expect(syncRes).toEqual({ type: "pulled", domain: "good" });

  const peeked = await client2.peekAtFile("my-file.txt");
  expect(await peeked.text()).toBe("Hello, world!");

});


test("conflict resolution", async () => {
  const vaultDir = path.join(testdir, "server-c");
  const client1Dir = path.join(testdir, "client-c-1");
  const client2Dir = path.join(testdir, "client-c-2");

  const vault = await vaultFromDirectory("vault", vaultDir);

  const api = directApi(vault);
  const client1 = getDirectoryClient(api, client1Dir);
  const client2 = getDirectoryClient(api, client2Dir);

  fs.writeFileSync(path.join(client1Dir, "my-file.txt"), "Hello, world!");

  const res1 = await client1.syncFile("my-file.txt");
  expect(res1).toEqual({ type: "pushed", domain: "good" });

  fs.writeFileSync(path.join(client2Dir, "my-file.txt"), "Goodbye, world!");

  const res2 = await client2.syncServerUpdated();
  expect(res2.length).toBe(1);
  let [filepath, syncRes] = res2[0]!;

  expect(filepath).toBe("my-file.txt");
  expect(syncRes.type).toBe("conflict");
  expect(syncRes.domain).toBe("good");

  syncRes = syncRes as Conflict;

  const text = fs.readFileSync(path.join(client2Dir, syncRes.conflictFile)).toString();
  expect(text).toBe("Goodbye, world!");

});
