import { test, expect } from "bun:test";
import { testdir } from "./setup.test";
import { DirectoryVault, type SuccessfulUpdate } from "../server/vault";
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

test("tracking updates", () => {

})

test("making bad updates", () => {

})
