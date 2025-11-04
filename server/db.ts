import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, kamar, InsertKamar, Kamar, invoice, InsertInvoice, Invoice } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod", "nomorHp"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }
    if (user.kamarId !== undefined) {
      values.kamarId = user.kamarId;
      updateSet.kamarId = user.kamarId;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ===== KAMAR (ROOM) QUERIES =====

export async function getAllKamar(): Promise<Kamar[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(kamar).orderBy(kamar.nomorKamar);
}

export async function getKamarById(id: number): Promise<Kamar | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(kamar).where(eq(kamar.id, id)).limit(1);
  return result[0];
}

export async function getKamarByNomor(nomorKamar: string): Promise<Kamar | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(kamar).where(eq(kamar.nomorKamar, nomorKamar)).limit(1);
  return result[0];
}

export async function createKamar(data: InsertKamar): Promise<Kamar> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(kamar).values(data);
  const insertedId = Number(result[0].insertId);
  const newKamar = await getKamarById(insertedId);
  if (!newKamar) throw new Error("Failed to retrieve created room");
  return newKamar;
}

export async function updateKamar(id: number, data: Partial<InsertKamar>): Promise<Kamar> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(kamar).set(data).where(eq(kamar.id, id));
  const updated = await getKamarById(id);
  if (!updated) throw new Error("Failed to retrieve updated room");
  return updated;
}

export async function deleteKamar(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(kamar).where(eq(kamar.id, id));
}

export async function assignKamarToPenghuni(kamarId: number, penghuniId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(kamar).set({
    status: "terisi",
    penghuniId: penghuniId
  }).where(eq(kamar.id, kamarId));
  
  await db.update(users).set({
    kamarId: kamarId
  }).where(eq(users.id, penghuniId));
}

// ===== INVOICE QUERIES =====

export async function getAllInvoices(): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(invoice).orderBy(desc(invoice.createdAt));
}

export async function getInvoicesByUserId(userId: number): Promise<Invoice[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(invoice).where(eq(invoice.userId, userId)).orderBy(desc(invoice.createdAt));
}

export async function getInvoiceById(id: number): Promise<Invoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoice).where(eq(invoice.id, id)).limit(1);
  return result[0];
}

export async function getInvoiceByUserAndMonth(userId: number, bulan: string): Promise<Invoice | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(invoice)
    .where(and(eq(invoice.userId, userId), eq(invoice.bulan, bulan)))
    .limit(1);
  return result[0];
}

export async function createInvoice(data: InsertInvoice): Promise<Invoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(invoice).values(data);
  const insertedId = Number(result[0].insertId);
  const newInvoice = await getInvoiceById(insertedId);
  if (!newInvoice) throw new Error("Failed to retrieve created invoice");
  return newInvoice;
}

export async function updateInvoiceStatus(id: number, status: "pending" | "paid", tanggalDibayar?: Date): Promise<Invoice> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status };
  if (tanggalDibayar) {
    updateData.tanggalDibayar = tanggalDibayar;
  }
  
  await db.update(invoice).set(updateData).where(eq(invoice.id, id));
  const updated = await getInvoiceById(id);
  if (!updated) throw new Error("Failed to retrieve updated invoice");
  return updated;
}

export async function updateInvoiceXenditData(id: number, xenditInvoiceId: string, xenditInvoiceUrl: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(invoice).set({
    xenditInvoiceId,
    xenditInvoiceUrl
  }).where(eq(invoice.id, id));
}

// ===== USER QUERIES =====

export async function getAllPenghuni(): Promise<typeof users.$inferSelect[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).where(eq(users.role, "penghuni"));
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}
