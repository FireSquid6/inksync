import { Store } from "../store";
import { expect, test } from "bun:test";
import { testdir } from "./setup.test";
import path from "path";

test("test the store", () => {
  const dbPath = path.join(testdir, "test.sqlite");
  const store = new Store(dbPath);

  const startingUpdates = store.getAllRecords();

  expect(startingUpdates.length).toBe(0);

  const filepath: string = "hello/world.txt";
  const hash: string = "ABCDEFG";
  const time = Date.now();


  store.updateRecord(filepath, hash, time);
  const record = store.getRecord(filepath);

  expect(record).not.toBe(null);
  expect(record!.time).toBe(time);
  expect(record!.hash).toBe(hash);

  const newHash = "12345678";
  const newTime = Date.now();
  store.updateRecord(filepath, newHash, newTime);
  const newRecord = store.getRecord(filepath);

  expect(newRecord).not.toBe(null);
  expect(newRecord!.time).toBe(newTime);
  expect(newRecord!.hash).toBe(newHash);

  const secondUpdates = store.getAllRecords();
  expect(secondUpdates.length).toBe(1);

  store.updateRecord("/another/thing.txt", "fjabewj", Date.now());
  const thirdUpdates = store.getAllRecords();
  expect(thirdUpdates.length).toBe(2);

});
