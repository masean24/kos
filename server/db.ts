import { eq, desc, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, kamar, invoice, issues, InsertIssue, InsertInvoice, Invoice, InsertKamar, Kamar } from "../drizzle/schema";
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

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(users).values(user);
  const insertedId = Number(result[0].insertId);
  return await getUserById(insertedId);
}

export async function getUserByUsername(username: string) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
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

export async function getAllInvoices() {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      id: invoice.id,
      userId: invoice.userId,
      kamarId: invoice.kamarId,
      bulan: invoice.bulan,
      jumlahTagihan: invoice.jumlahTagihan,
      status: invoice.status,
      tanggalJatuhTempo: invoice.tanggalJatuhTempo,
      tanggalDibayar: invoice.tanggalDibayar,
      xenditInvoiceId: invoice.xenditInvoiceId,
      xenditInvoiceUrl: invoice.xenditInvoiceUrl,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      tenantName: users.name,
      tenantEmail: users.email,
      paymentProof: invoice.paymentProof,
      paymentMethod: invoice.paymentMethod,
      approvalStatus: invoice.approvalStatus,
      approvedBy: invoice.approvedBy,
      approvedAt: invoice.approvedAt,
      rejectionReason: invoice.rejectionReason,
    })
    .from(invoice)
    .leftJoin(users, eq(invoice.userId, users.id))
    .orderBy(desc(invoice.createdAt));
  
  return results;
}

export async function getInvoicesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const results = await db
    .select({
      id: invoice.id,
      userId: invoice.userId,
      kamarId: invoice.kamarId,
      bulan: invoice.bulan,
      jumlahTagihan: invoice.jumlahTagihan,
      status: invoice.status,
      tanggalJatuhTempo: invoice.tanggalJatuhTempo,
      tanggalDibayar: invoice.tanggalDibayar,
      xenditInvoiceId: invoice.xenditInvoiceId,
      xenditInvoiceUrl: invoice.xenditInvoiceUrl,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
      tenantName: users.name,
      tenantEmail: users.email,
      paymentProof: invoice.paymentProof,
      paymentMethod: invoice.paymentMethod,
      approvalStatus: invoice.approvalStatus,
      approvedBy: invoice.approvedBy,
      approvedAt: invoice.approvedAt,
      rejectionReason: invoice.rejectionReason,
    })
    .from(invoice)
    .leftJoin(users, eq(invoice.userId, users.id))
    .where(eq(invoice.userId, userId))
    .orderBy(desc(invoice.createdAt));
  
  return results;
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

export async function getAllActiveTenants() {
  const db = await getDb();
  if (!db) return [];
  // Get all tenants who have a room assigned (kamarId is not null)
  const result = await db.select().from(users).where(
    and(
      eq(users.role, "penghuni"),
      // kamarId is not null - we need to check it's defined
    )
  );
  return result.filter(u => u.kamarId !== null);
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

// ===== ISSUE MANAGEMENT =====

export async function createIssue(issue: InsertIssue) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(issues).values(issue);
  return result;
}

export async function getAllIssues() {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(issues).orderBy(desc(issues.createdAt));
}

export async function getIssuesByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select().from(issues).where(eq(issues.userId, userId)).orderBy(desc(issues.createdAt));
}

export async function getIssueById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const result = await db.select().from(issues).where(eq(issues.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateIssueStatus(id: number, status: "open" | "in_progress" | "resolved") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const updateData: any = { status, updatedAt: new Date() };
  if (status === "resolved") {
    updateData.resolvedAt = new Date();
  }
  
  await db.update(issues).set(updateData).where(eq(issues.id, id));
}
