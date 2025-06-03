import { test, expect } from "bun:test";
import { startTestApp } from "..";
import { joincodeTable, usersTable } from "../db/schema";


test("user creation with a joincode", async () => {
  const { db, api } = startTestApp();

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
})

test("creating joincodes", async () => {
  const { db, api } = startTestApp();

  // First create a superadmin user
  await db
    .insert(joincodeTable)
    .values({
      code: "superadmin123",
      role: "Superadmin",
      expiresAt: Date.now() + 60 * 60 * 1000,
      creator: "",
    });

  const userResult = await api.users.post({
    joincode: "superadmin123",
    username: "AdminUser",
    password: "AdminPass@123456#",
  });

  expect(userResult.error).toBe(null);

  // Get auth token for the superadmin
  const tokenResult = await api.tokens.post({
    username: "AdminUser",
    password: "AdminPass@123456#",
  });

  expect(tokenResult.error).toBe(null);
  const token = tokenResult.data;

  // Create a new joincode as superadmin
  const joincodeResult = await api.joincodes.post({
    role: "User",
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(joincodeResult.error).toBe(null);
  expect(joincodeResult.data).not.toBe(null);
  expect(joincodeResult.data!.role).toBe("User");
  expect(joincodeResult.data!.code).toBeDefined();

  // Verify joincode was created in database
  const joincodesResult = await db
    .select()
    .from(joincodeTable);

  expect(joincodesResult.length).toBe(1);
  expect(joincodesResult[0]?.role).toBe("User");
})

test("deleting joincodes", async () => {
  const { db, api } = startTestApp();

  // Create a superadmin user
  await db
    .insert(joincodeTable)
    .values({
      code: "superadmin456",
      role: "Superadmin",
      expiresAt: Date.now() + 60 * 60 * 1000,
      creator: "",
    });

  const userResult = await api.users.post({
    joincode: "superadmin456",
    username: "AdminUser2",
    password: "AdminPass@123456",
  });

  expect(userResult.error).toBe(null);

  // Get auth token
  const tokenResult = await api.tokens.post({
    username: "AdminUser2",
    password: "AdminPass@123456",
  });

  expect(tokenResult.error).toBe(null);
  const token = tokenResult.data!;

  // Create a joincode to delete
  const joincodeResult = await api.joincodes.post({
    role: "User",
  }, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(joincodeResult.error).toBe(null);
  const createdCode = joincodeResult.data!.code;

  // Verify joincode exists
  let joincodesResult = await db
    .select()
    .from(joincodeTable);

  expect(joincodesResult.length).toBe(1);

  // Delete the joincode
  const deleteResult = await api.joincodes({ code: createdCode }).delete({}, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  expect(deleteResult.error).toBe(null);

  // Verify joincode was deleted
  joincodesResult = await db
    .select()
    .from(joincodeTable);

  console.log(joincodesResult);
  expect(joincodesResult.length).toBe(0);
})

