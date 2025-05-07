import { BunSqliteStore } from "../src/store";
import { expect, test } from "bun:test";
import { testdir } from "./setup.test";
import path from "path";

test("test the store", async () => {
  const dbPath = path.join(testdir, "test.sqlite");
  const store = new BunSqliteStore(dbPath);

  const startingUpdates = await store.getAllRecords();

  expect(startingUpdates.length).toBe(0);

  const filepath: string = "hello/world.txt";
  const hash: string = "ABCDEFG";
  const time = Date.now();


  store.updateRecord(filepath, hash, time);
  const record = await store.getRecord(filepath);

  expect(record).not.toBe(null);
  expect(record!.time).toBe(time);
  expect(record!.hash).toBe(hash);

  const newHash = "12345678";
  const newTime = Date.now();
  store.updateRecord(filepath, newHash, newTime);
  const newRecord = await store.getRecord(filepath);

  expect(newRecord).not.toBe(null);
  expect(newRecord!.time).toBe(newTime);
  expect(newRecord!.hash).toBe(newHash);

  const secondUpdates = await store.getAllRecords();
  expect(secondUpdates.length).toBe(1);

  store.updateRecord("/another/thing.txt", "fjabewj", Date.now());
  const thirdUpdates = await store.getAllRecords();
  expect(thirdUpdates.length).toBe(2);

});

test("store store time", async () => {
  const dbPath = path.join(testdir, "test2.sqlite");
  const store = new BunSqliteStore(dbPath);

  const first = await store.getLastPull();

  expect(first).toBe(0);

  await store.setLastPull(102);
  const second = await store.getLastPull();

  expect(second).toBe(102);
});
