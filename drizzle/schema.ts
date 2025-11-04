import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extended with kost-specific fields for tenants and admins.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "penghuni"]).default("penghuni").notNull(),
  nomorHp: varchar("nomorHp", { length: 20 }),
  kamarId: int("kamarId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Issues/complaints reported by tenants
 */
export const issues = mysqlTable("issues", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  kamarId: int("kamarId"),
  judul: varchar("judul", { length: 255 }).notNull(),
  deskripsi: text("deskripsi").notNull(),
  status: mysqlEnum("status", ["open", "in_progress", "resolved"]).default("open").notNull(),
  prioritas: mysqlEnum("prioritas", ["low", "medium", "high"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  resolvedAt: timestamp("resolvedAt"),
});

export type Issue = typeof issues.$inferSelect;
export type InsertIssue = typeof issues.$inferInsert;

/**
 * Tracks room availability and occupancy
 */
export const kamar = mysqlTable("kamar", {
  id: int("id").autoincrement().primaryKey(),
  nomorKamar: varchar("nomorKamar", { length: 10 }).notNull().unique(),
  status: mysqlEnum("status", ["kosong", "terisi"]).default("kosong").notNull(),
  penghuniId: int("penghuniId"),
  hargaSewa: int("hargaSewa").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Kamar = typeof kamar.$inferSelect;
export type InsertKamar = typeof kamar.$inferInsert;

/**
 * Invoice table
 * Tracks monthly rent payments for each tenant
 */
export const invoice = mysqlTable("invoice", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  kamarId: int("kamarId").notNull(),
  bulan: varchar("bulan", { length: 7 }).notNull(), // Format: "2025-01"
  jumlahTagihan: int("jumlahTagihan").notNull(),
  status: mysqlEnum("status", ["pending", "paid"]).default("pending").notNull(),
  xenditInvoiceId: varchar("xenditInvoiceId", { length: 255 }),
  xenditInvoiceUrl: text("xenditInvoiceUrl"),
  tanggalJatuhTempo: timestamp("tanggalJatuhTempo").notNull(),
  tanggalDibayar: timestamp("tanggalDibayar"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Invoice = typeof invoice.$inferSelect;
export type InsertInvoice = typeof invoice.$inferInsert;
