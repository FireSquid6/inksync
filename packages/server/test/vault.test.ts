import * as schema from "../db/schema";
import { test, expect } from "bun:test";
import type { Db } from "../db";
import type { Treaty } from "server/interface";
import { startTestApp } from "..";


export async function getSuperadminSession(db: Db, api: Treaty): Promise<string> {
  const joincode = "123456";

  await db
    .insert(schema.joincodeTable)
    .values({
      code: joincode,
      role: "Superadmin",
      creator: "",
      expiresAt: Date.now() + 1000 * 60 * 60 * 24,
    });

  const { data: user } = await api.users.post({
    username: "MrAdminMan",
    password: "C00lAdm1nPa$$w0rd",
    joincode,
  });

  if (user === null) {
    throw new Error("Something is wrong with the user creation function");
  }
  
  const { data: token } = await api.tokens.post({
    username: "MrAdminMan",
    password: "C00lAdm1nPa$$w0rd",
  });

  if (token === null) { 
    throw new Error("Something is wrong with the sign in function");
  }

  return token;
}

test("create a new vault", async () => {
  const { api, db } = startTestApp();
  const token = await getSuperadminSession(db, api);
  
  const result = await api.vaults.post({
    vaultName: "a-cool-vault",
    directory: "store/a-cool-vault",
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
    }
  });

  expect(result.error).toBe(null);
  expect(result.status).toBe(200);

  const vaults = await db
    .select()
    .from(schema.vaultsTable);

  expect(vaults.length).toBe(1);
  expect(vaults[0]!.name).toBe("a-cool-vault");
})
