import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { sqliteTable } from "drizzle-orm/sqlite-core";
import { text, int } from "drizzle-orm/sqlite-core";

export type PermissionType = 
  | "READ_USERS"
  | "WRITE_USERS"
  | "READ_VAULTS"
  | "WRITE_VAULTS"

export const usersTable = sqliteTable("users_table", {
  id: text().notNull().unique().primaryKey(),
  username: text().notNull(),
  hashedPassword: text().notNull(),
  isAdmin: int({ mode: "boolean" }).notNull().default(false),
});
export type User = InferSelectModel<typeof usersTable>;
export type InsertUser = InferInsertModel<typeof usersTable>;

// TODO - handle AWS vaults
// TODO - handle encrypted vaults
export const vaultsTable = sqliteTable("vaults", {
  name: text().unique().primaryKey(),
  directory: text().notNull(),
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

export const permissionTable = sqliteTable("permissions", {
  userId: text().notNull().references(() => usersTable.id),
  permission: text().notNull().$type<PermissionType>(),
});

export type Permission = InferSelectModel<typeof permissionTable>;
