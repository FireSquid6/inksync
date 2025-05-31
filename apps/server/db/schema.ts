import { sqliteTable } from "drizzle-orm/sqlite-core";
import { text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users_table", {
  id: text().notNull().unique().primaryKey(),
  username: text().notNull(),
  hashedPassword: text().notNull(),
});


// TODO - handle AWS vaults
// TODO - handle encrypted vaults
export const vaults = sqliteTable("vaults", {
  name: text().unique().primaryKey(),
  directory: text(),
});
