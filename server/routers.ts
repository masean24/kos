import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { getDb } from "./db";
import { invoice, issues } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import { createXenditInvoice, XenditCallbackPayload } from "./xendit";
import { sendPaymentReminder, getWhatsAppStatus } from "./whatsapp";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ===== KAMAR (ROOM) MANAGEMENT =====
  kamar: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllKamar();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getKamarById(input.id);
      }),

    create: adminProcedure
      .input(z.object({
        nomorKamar: z.string().min(1),
        hargaSewa: z.number().min(0),
      }))
      .mutation(async ({ input }) => {
        // Check if room number already exists
        const existing = await db.getKamarByNomor(input.nomorKamar);
        if (existing) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nomor kamar sudah ada' });
        }

        return await db.createKamar({
          nomorKamar: input.nomorKamar,
          hargaSewa: input.hargaSewa,
          status: "kosong",
        });
      }),

    update: adminProcedure
      .input(z.object({
        id: z.number(),
        nomorKamar: z.string().min(1).optional(),
        hargaSewa: z.number().min(0).optional(),
        status: z.enum(["kosong", "terisi"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        
        // If changing room number, check uniqueness
        if (data.nomorKamar) {
          const existing = await db.getKamarByNomor(data.nomorKamar);
          if (existing && existing.id !== id) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nomor kamar sudah ada' });
          }
        }

        return await db.updateKamar(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const room = await db.getKamarById(input.id);
        if (room?.status === "terisi") {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Tidak bisa hapus kamar yang terisi' });
        }
        await db.deleteKamar(input.id);
        return { success: true };
      }),

    checkAvailability: publicProcedure
      .input(z.object({ nomorKamar: z.string() }))
      .query(async ({ input }) => {
        const room = await db.getKamarByNomor(input.nomorKamar);
        if (!room) {
          return { available: false, message: "Nomor kamar tidak ditemukan" };
        }
        if (room.status === "terisi") {
          return { available: false, message: "Kamar sudah terisi, hubungi admin" };
        }
        return { available: true, room };
      }),
  }),

  // ===== TENANT REGISTRATION =====
  tenant: router({
    register: publicProcedure
      .input(z.object({
        openId: z.string(),
        name: z.string().min(1),
        email: z.string().email(),
        nomorHp: z.string().min(1),
        nomorKamar: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        // Check room availability
        const room = await db.getKamarByNomor(input.nomorKamar);
        if (!room) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nomor kamar tidak ditemukan' });
        }
        if (room.status === "terisi") {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Kamar sudah terisi, hubungi admin' });
        }

        // Create user
        await db.upsertUser({
          openId: input.openId,
          name: input.name,
          email: input.email,
          nomorHp: input.nomorHp,
          role: "penghuni",
        });

        // Get the created user
        const user = await db.getUserByOpenId(input.openId);
        if (!user) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create user' });
        }

        // Assign room
        await db.assignKamarToPenghuni(room.id, user.id);

        return { success: true, user, room };
      }),

    list: adminProcedure.query(async () => {
      return await db.getAllPenghuni();
    }),

    createByAdmin: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        nomorHp: z.string().min(1),
        nomorKamar: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        // Check room availability
        const room = await db.getKamarByNomor(input.nomorKamar);
        if (!room) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nomor kamar tidak ditemukan' });
        }
        if (room.status === "terisi") {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Kamar sudah terisi' });
        }

        // Generate unique openId for manually created tenant
        const openId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Create user
        await db.upsertUser({
          openId,
          name: input.name,
          email: input.email,
          nomorHp: input.nomorHp,
          role: "penghuni",
        });

        // Get the created user
        const user = await db.getUserByOpenId(openId);
        if (!user) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create user' });
        }

        // Assign room
        await db.assignKamarToPenghuni(room.id, user.id);

        return { success: true, user, room };
      }),
  }),

  // ===== INVOICE MANAGEMENT =====
  invoice: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === 'admin') {
        return await db.getAllInvoices();
      }
      return await db.getInvoicesByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const invoice = await db.getInvoiceById(input.id);
        if (!invoice) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice tidak ditemukan' });
        }
        
        // Non-admin can only view their own invoices
        if (ctx.user.role !== 'admin' && invoice.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Akses ditolak' });
        }
        
        return invoice;
      }),

    create: adminProcedure
      .input(z.object({
        userId: z.number(),
        kamarId: z.number(),
        bulan: z.string(), // Format: "2025-01"
        jumlahTagihan: z.number().min(0),
        tanggalJatuhTempo: z.date(),
      }))
      .mutation(async ({ input }) => {
        // Check if invoice already exists for this month
        const existing = await db.getInvoiceByUserAndMonth(input.userId, input.bulan);
        if (existing) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invoice bulan ini sudah ada' });
        }

        return await db.createInvoice({
          ...input,
          status: "pending",
        });
      }),

    generateMonthly: adminProcedure
      .input(z.object({
        bulan: z.string(), // Format: "2025-01"
        tanggalJatuhTempo: z.date(),
      }))
      .mutation(async ({ input }) => {
        const penghuni = await db.getAllPenghuni();
        const generated = [];

        for (const user of penghuni) {
          if (!user.kamarId) continue;

          // Check if invoice already exists
          const existing = await db.getInvoiceByUserAndMonth(user.id, input.bulan);
          if (existing) continue;

          const room = await db.getKamarById(user.kamarId);
          if (!room) continue;

          const invoice = await db.createInvoice({
            userId: user.id,
            kamarId: room.id,
            bulan: input.bulan,
            jumlahTagihan: room.hargaSewa,
            tanggalJatuhTempo: input.tanggalJatuhTempo,
            status: "pending",
          });

          generated.push(invoice);
        }

        return { success: true, count: generated.length, invoices: generated };
      }),

    uploadPaymentProof: protectedProcedure
      .input(z.object({
        invoiceId: z.number(),
        proofUrl: z.string(),
      }))
    .mutation(async ({ input, ctx }) => {
      const dbInstance = await getDb();
      if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
      
      // Verify invoice belongs to user
      const inv = await db.getInvoiceById(input.invoiceId);
      if (!inv || inv.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
      }
      
      // Store base64 directly in database (proofUrl is actually base64 data)
      await dbInstance.update(invoice).set({
        paymentProof: input.proofUrl,
        paymentMethod: "manual",
        approvalStatus: "pending",
      }).where(eq(invoice.id, input.invoiceId));
      
      return { success: true, message: "Bukti pembayaran berhasil diupload" };
    }),
    
    approvePayment: adminProcedure
      .input(z.object({
        invoiceId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        await dbInstance.update(invoice).set({
          status: "paid",
          approvalStatus: "approved",
          approvedBy: ctx.user.id,
          approvedAt: new Date(),
          tanggalDibayar: new Date(),
        }).where(eq(invoice.id, input.invoiceId));
        
        return { success: true, message: "Pembayaran telah disetujui" };
      }),
    
    rejectPayment: adminProcedure
      .input(z.object({
        invoiceId: z.number(),
        reason: z.string(),
      }))
      .mutation(async ({ input }) => {
        const dbInstance = await getDb();
        if (!dbInstance) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });
        
        await dbInstance.update(invoice).set({
          approvalStatus: "rejected",
          rejectionReason: input.reason,
          paymentProof: null,
        }).where(eq(invoice.id, input.invoiceId));
        
        return { success: true, message: "Pembayaran ditolak" };
      }),
    
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "paid"]),
      }))
      .mutation(async ({ input }) => {
        const tanggalDibayar = input.status === "paid" ? new Date() : undefined;
        return await db.updateInvoiceStatus(input.id, input.status, tanggalDibayar);
      }),

    createPayment: protectedProcedure
      .input(z.object({ invoiceId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice tidak ditemukan' });
        }

        // Non-admin can only pay their own invoices
        if (ctx.user.role !== 'admin' && invoice.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Akses ditolak' });
        }

        if (invoice.status === "paid") {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invoice sudah dibayar' });
        }

        const user = await db.getUserById(invoice.userId);
        if (!user || !user.email) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Data pengguna tidak lengkap' });
        }

        // Create Xendit invoice
        const xenditInvoice = await createXenditInvoice({
          externalId: `INV-${invoice.id}-${Date.now()}`,
          amount: invoice.jumlahTagihan,
          payerEmail: user.email,
          description: `Pembayaran sewa kamar bulan ${invoice.bulan}`,
        });

        if (xenditInvoice) {
          await db.updateInvoiceXenditData(invoice.id, xenditInvoice.id, xenditInvoice.invoice_url);
          return { 
            success: true, 
            paymentUrl: xenditInvoice.invoice_url,
            xenditInvoiceId: xenditInvoice.id 
          };
        } else {
          // Xendit not configured, return placeholder
          return { 
            success: false, 
            message: "Xendit belum dikonfigurasi. Silakan hubungi admin.",
            paymentUrl: null 
          };
        }
      }),
  }),

  // ===== XENDIT WEBHOOK =====
  payment: router({
    webhook: publicProcedure
      .input(z.object({
        id: z.string(),
        external_id: z.string(),
        status: z.enum(["PENDING", "PAID", "EXPIRED"]),
        paid_at: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        if (input.status !== "PAID") {
          return { success: true, message: "Status not paid, ignored" };
        }

        // Extract invoice ID from external_id (format: INV-{id}-{timestamp})
        const match = input.external_id.match(/^INV-(\d+)-/);
        if (!match) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid external_id format' });
        }

        const invoiceId = parseInt(match[1]);
        const invoice = await db.getInvoiceById(invoiceId);
        
        if (!invoice) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
        }

        if (invoice.status === "paid") {
          return { success: true, message: "Invoice already paid" };
        }

        // Update invoice status
        await db.updateInvoiceStatus(
          invoiceId, 
          "paid", 
          input.paid_at ? new Date(input.paid_at) : new Date()
        );

        return { success: true, message: "Invoice updated to paid" };
      }),
  }),

  // ===== ISSUE REPORTING =====
  issue: router({    // Tenant: Create new issue
    create: protectedProcedure
      .input(z.object({
        judul: z.string().min(1),
        deskripsi: z.string().min(1),
        prioritas: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = ctx.user;
        
        // Get user's room
        const userWithRoom = await db.getUserById(user.id);
        if (!userWithRoom || !userWithRoom.kamarId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Anda belum terdaftar di kamar manapun' });
        }

        await db.createIssue({
          userId: user.id,
          kamarId: userWithRoom.kamarId,
          judul: input.judul,
          deskripsi: input.deskripsi,
          prioritas: input.prioritas || "medium",
          status: "open",
        });

        return { success: true, message: "Laporan berhasil dikirim" };
      }),

    // List issues (filtered by role)
    list: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user.role === 'admin') {
        return await db.getAllIssues();
      }
      return await db.getIssuesByUserId(ctx.user.id);
    }),

    // Admin: Update issue status
    updateStatus: adminProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["open", "in_progress", "resolved"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateIssueStatus(input.id, input.status);
        return { success: true, message: "Status issue berhasil diupdate" };
      }),
  }),

  // ===== WHATSAPP BOT =====
  whatsapp: router({    status: adminProcedure.query(async () => {
      return getWhatsAppStatus();
    }),

    sendReminder: adminProcedure
      .input(z.object({ invoiceId: z.number() }))
      .mutation(async ({ input }) => {
        const invoice = await db.getInvoiceById(input.invoiceId);
        if (!invoice) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice tidak ditemukan' });
        }

        if (invoice.status === "paid") {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invoice sudah dibayar' });
        }

        const user = await db.getUserById(invoice.userId);
        if (!user || !user.nomorHp) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Nomor HP penghuni tidak ditemukan' });
        }

        const room = await db.getKamarById(invoice.kamarId);
        if (!room) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Data kamar tidak ditemukan' });
        }

        const sent = await sendPaymentReminder(
          user.name || "Penghuni",
          user.nomorHp,
          room.nomorKamar,
          invoice.jumlahTagihan,
          new Date(invoice.tanggalJatuhTempo)
        );

        if (sent) {
          return { success: true, message: "Reminder berhasil dikirim via WhatsApp" };
        } else {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Gagal mengirim reminder. Pastikan WhatsApp bot sudah terkoneksi.' });
        }
      }),
  }),

  // ===== DASHBOARD STATS =====
  dashboard: router({
    stats: adminProcedure.query(async () => {
      const allRooms = await db.getAllKamar();
      const allInvoices = await db.getAllInvoices();
      const allTenants = await db.getAllPenghuni();

      const totalRooms = allRooms.length;
      const occupiedRooms = allRooms.filter(r => r.status === "terisi").length;
      const emptyRooms = totalRooms - occupiedRooms;

      const pendingInvoices = allInvoices.filter(i => i.status === "pending").length;
      const paidInvoices = allInvoices.filter(i => i.status === "paid").length;

      // Calculate monthly revenue (current month)
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const currentMonthRevenue = allInvoices
        .filter(i => i.bulan === currentMonth && i.status === "paid")
        .reduce((sum, i) => sum + i.jumlahTagihan, 0);

      return {
        totalRooms,
        occupiedRooms,
        emptyRooms,
        totalTenants: allTenants.length,
        pendingInvoices,
        paidInvoices,
        currentMonthRevenue,
      };
    }),

    revenueChart: adminProcedure
      .input(z.object({ months: z.number().min(1).max(12).default(6) }))
      .query(async ({ input }) => {
        const allInvoices = await db.getAllInvoices();
        const now = new Date();
        const chartData = [];

        for (let i = input.months - 1; i >= 0; i--) {
          const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          const revenue = allInvoices
            .filter(inv => inv.bulan === monthStr && inv.status === "paid")
            .reduce((sum, inv) => sum + inv.jumlahTagihan, 0);

          chartData.push({
            month: monthStr,
            revenue,
          });
        }

      return chartData;
    }),
    
    notifications: adminProcedure.query(async () => {
      const dbInstance = await getDb();
      if (!dbInstance) return { pendingPayments: 0, openIssues: 0 };
      
      // Count pending manual payments
      const pendingPayments = await dbInstance
        .select({ count: sql<number>`count(*)` })
        .from(invoice)
        .where(
          sql`${invoice.paymentMethod} = 'manual' AND ${invoice.approvalStatus} = 'pending'`
        );
      
      // Count open issues
      const openIssues = await dbInstance
        .select({ count: sql<number>`count(*)` })
        .from(issues)
        .where(sql`${issues.status} = 'open'`);
      
      return {
        pendingPayments: Number(pendingPayments[0]?.count || 0),
        openIssues: Number(openIssues[0]?.count || 0),
      };
    }),
  }),

  // ===== FILE UPLOAD =====
  upload: protectedProcedure
    .input(z.object({
      key: z.string(),
      data: z.string(),
      contentType: z.string(),
    }))
    .mutation(async ({ input }) => {
      const { storagePut } = await import("./storage");
      const buffer = Buffer.from(input.data, 'base64');
      const result = await storagePut(input.key, buffer, input.contentType);
      return result;
    }),
});

export type AppRouter = typeof appRouter;
