/**
 * Automatic Monthly Invoice Generation
 * 
 * This script should be run via cron job on the 1st of every month
 * Example cron: 0 0 1 * * (runs at midnight on the 1st of each month)
 * 
 * Usage: node --import tsx server/cron-invoice.ts
 */

import { getAllActiveTenants, createInvoice, getKamarById } from "./db";

async function generateMonthlyInvoices() {
  console.log("[CRON] Starting automatic monthly invoice generation...");
  
  try {
    // Get current month in YYYY-MM format
    const now = new Date();
    const bulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    
    // Set due date to 10th of current month
    const tanggalJatuhTempo = new Date(now.getFullYear(), now.getMonth(), 10);
    
    // Get all active tenants (users with kamarId)
    const tenants = await getAllActiveTenants();
    
    if (tenants.length === 0) {
      console.log("[CRON] No active tenants found");
      return;
    }
    
    console.log(`[CRON] Found ${tenants.length} active tenants`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const tenant of tenants) {
      try {
        if (!tenant.kamarId) {
          console.log(`[CRON] Skipping user ${tenant.id} - no room assigned`);
          continue;
        }
        
        const kamar = await getKamarById(tenant.kamarId);
        if (!kamar) {
          console.log(`[CRON] Skipping user ${tenant.id} - room not found`);
          continue;
        }
        
        await createInvoice({
          userId: tenant.id,
          kamarId: tenant.kamarId,
          bulan,
          jumlahTagihan: kamar.hargaSewa,
          status: "pending",
          tanggalJatuhTempo,
        });
        
        successCount++;
        console.log(`[CRON] Created invoice for user ${tenant.id} (${tenant.name})`);
      } catch (error) {
        errorCount++;
        console.error(`[CRON] Error creating invoice for user ${tenant.id}:`, error);
      }
    }
    
    console.log(`[CRON] Invoice generation completed: ${successCount} success, ${errorCount} errors`);
  } catch (error) {
    console.error("[CRON] Fatal error during invoice generation:", error);
    process.exit(1);
  }
  
  process.exit(0);
}

// Run the script
generateMonthlyInvoices();
