import { test, expect } from "bun:test";
import { testdir } from "./setup.test";
import { DirectoryVault, type FailedUpdate, type SuccessfulUpdate } from "../server/vault";
import path from "path";
import { Readable } from "stream";


test("pushing updates", async () => {
  const dir = path.join(testdir, "test-vault");
  const vault = new DirectoryVault("vault", dir);
  const filepath = "students/jdeiss/information.json";
  const contentsString = `
  {
    "name": "Jonathan Deiss",
    "birthday": "2006/04/13",
    "major": "Computer Science",
    "id": 12417
  }
  `;

  // get a file
  const res1 = vault.getCurrent(filepath);
  expect(res1).toBe("NON-EXISTANT");

  // create a file
  const contents = Readable.from(contentsString);
  let updateRes = await vault.pushUpdate(contents, filepath, "");
  expect(updateRes.type).toBe("success");
  updateRes = updateRes as SuccessfulUpdate;

  // get status of that file
  let res2 = vault.getCurrent(filepath);
  expect(typeof res2).not.toBe("string");
  res2 = res2 as Bun.BunFile; 
  const text = await res2.text();
  expect(text).toBe(contentsString);


  // delete the file
  const deleteRes = await vault.pushUpdate("DELETE", filepath, updateRes.newHash);
  expect(deleteRes.type).toBe("success");

  // get status of that file
  const res3 = vault.getCurrent(filepath);
  expect(res3).toBe("DELETED");
})

test("tracking updates", async () => {
  const dir = path.join(testdir, "test-vault2");
  const contentsString1 = `
  {
    "name": "Jonathan Deiss",
    "birthday": "2006/04/13",
    "major": "Computer Science",
    "id": 12417
  }
  `;

  const contentsString2 = `
  {
    "name": "Jonathan Deiss",
    "birthday": "2006/04/13",
    "major": "Computer Science",
    "id": 12418
  }
  `;

  const contents1 = Readable.from(contentsString1);
  const contents2 = Readable.from(contentsString2);
  const vault = new DirectoryVault("vault", dir);
  const filepath = "students/jdeiss/information.json";

  let firstUpdate = await vault.pushUpdate(contents1, filepath, "");
  expect(firstUpdate.type).toBe("success");
  firstUpdate = firstUpdate as SuccessfulUpdate;

  let secondUpdate = await vault.pushUpdate(contents2, filepath, firstUpdate.newHash);
  expect(secondUpdate.type).toBe("success");
  secondUpdate = secondUpdate as SuccessfulUpdate;

  expect(firstUpdate.newHash).not.toBe(secondUpdate.newHash);
  const file = vault.getCurrent(filepath);

  if (typeof file === "string") {
    throw new Error(`Got ${file} instead of a file`);
  }

  const text = await file.text();

  expect(text).toBe(contentsString2);
})

test("tracking updates that are the same", async () => {
  const dir = path.join(testdir, "test-vault3");
  const contentsString = `
  {
    "name": "Jonathan Deiss",
    "birthday": "2006/04/13",
    "major": "Computer Science"
  }
  `;

  // readable is consumed!
  const contents1 = Readable.from(contentsString);
  const contents2 = Readable.from(contentsString);

  const vault = new DirectoryVault("vault", dir);
  const filepath = "students/jdeiss/information.json";

  let firstUpdate = await vault.pushUpdate(contents1, filepath, "");
  expect(firstUpdate.type).toBe("success");
  firstUpdate = firstUpdate as SuccessfulUpdate;

  let secondUpdate = await vault.pushUpdate(contents2, filepath, firstUpdate.newHash);
  expect(secondUpdate.type).toBe("success");
  secondUpdate = secondUpdate as SuccessfulUpdate;

  expect(firstUpdate.newHash).toBe(secondUpdate.newHash);
})

test("making bad updates", async () => {
  const dir = path.join(testdir, "test-vault4");
  const firstWriteAttempt = Readable.from("hello!");
  const secondWriteAttempt = Readable.from("goodbye!");
  const vault = new DirectoryVault("vault", dir);
  const filepath = "message.txt";
  
  let firstUpdate = await vault.pushUpdate(firstWriteAttempt, filepath, "");
  expect(firstUpdate.type).toBe("success");
  firstUpdate = firstUpdate as SuccessfulUpdate;

  // we use a bad hash!
  let secondUpdate = await vault.pushUpdate(secondWriteAttempt, filepath, "");
  expect(secondUpdate.type).toBe("failure");
  secondUpdate = secondUpdate as FailedUpdate;
  expect(secondUpdate.reason).toBe("Non-matching hash");
})
