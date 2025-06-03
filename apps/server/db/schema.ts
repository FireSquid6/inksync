import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { text, int } from "drizzle-orm/sqlite-core";

export type Role =
  | "User"
  | "Admin"
  | "Superadmin"

export const usersTable = sqliteTable("users_table", {
  id: text().notNull().unique().primaryKey(),
  username: text().notNull().unique(),
  hashedPassword: text().notNull(),
  role: text().notNull().$type<Role>(),
});
export type User = InferSelectModel<typeof usersTable>;
export type InsertUser = InferInsertModel<typeof usersTable>;

// TODO - handle encrypted vaults
export const vaultsTable = sqliteTable("vaults", {
  name: text().unique().primaryKey(),
  location: text().notNull(),
  createdAt: int().notNull(),
});

export type VaultInfo = InferSelectModel<typeof vaultsTable>;

export const tokensTable = sqliteTable("tokens", {
  token: text().notNull().unique().primaryKey(),
  userId: text().references(() => usersTable.id).notNull(),
  expiresAt: int().notNull(),
});


export type Token = InferSelectModel<typeof tokensTable>;

export const accessTable = sqliteTable("access", {
  userId: text().notNull().references(() => usersTable.id),
  read: int({ mode: "boolean" }).notNull(),
  write: int({ mode: "boolean" }).notNull(),
  vaultName: text().notNull().references(() => vaultsTable.name),
});
export type Access = InferSelectModel<typeof accessTable>;


export const joincodeTable = sqliteTable("joincodes", {
  code: text().notNull(),
  role: text().notNull().$type<Role>(),
  expiresAt: int().notNull(),
  creator: text().notNull().references(() => usersTable.id),
});
export type Joincode = InferSelectModel<typeof joincodeTable>;
