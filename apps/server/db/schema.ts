import type { InferSelectModel } from "drizzle-orm";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { text } from "drizzle-orm/sqlite-core";

export const usersTable = sqliteTable("users_table", {
  id: text().notNull().unique().primaryKey(),
  username: text().notNull(),
  hashedPassword: text().notNull(),
});
export type User = InferSelectModel<typeof usersTable>;

// TODO - handle AWS vaults
// TODO - handle encrypted vaults
export const vaultsTable = sqliteTable("vaults", {
  name: text().unique().primaryKey(),
  directory: text().notNull(),
});

export type VaultInfo = InferSelectModel<typeof vaultsTable>;

export const tokensTable = sqliteTable("tokens", {
  id: text().notNull().unique().primaryKey(),
  token: text().notNull(),
  user: text().references(() => usersTable.id).notNull(),
});

