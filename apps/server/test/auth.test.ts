import { test, expect } from "bun:test";
import { startTestApp } from "..";
import { joincodeTable, usersTable } from "../db/schema";


test("autentication with a joincode", async () => {
  const { app, db, api } = startTestApp();

  await db
    .insert(joincodeTable)
    .values({
      code: "123456",
      role: "Superadmin",
      expiresAt: Date.now() + 60 * 60 * 1000,
      creator: "",
    });


  const result = await api.users.post({
    joincode: "123456",
    username: "Jonathan",
    password: "FootBall@123467890",
  });

  expect(result.error).toBe(null);
  expect(result.data).not.toBe(null);
  expect(result.status).toBe(200);

  const usersResult = await db
    .select()
    .from(usersTable)

  expect(usersResult.length).toBe(1);
  expect(usersResult[0]?.username).toBe("Jonathan");

  const joincodesResult = await db
    .select()
    .from(joincodeTable)

  expect(joincodesResult.length).toBe(0);

  app.stop();

})

// joincode creation tests
