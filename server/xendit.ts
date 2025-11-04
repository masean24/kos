/**
 * Xendit Payment Integration
 * 
 * This module handles Xendit API interactions for invoice creation and payment processing.
 * To enable: Add XENDIT_API_KEY to environment variables
 */

interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  invoiceDuration?: number; // in seconds, default 24 hours
}

interface XenditInvoiceResponse {
  id: string;
  external_id: string;
  user_id: string;
  status: string;
  merchant_name: string;
  amount: number;
  payer_email: string;
  description: string;
  invoice_url: string;
  expiry_date: string;
  created: string;
}

export async function createXenditInvoice(params: CreateInvoiceParams): Promise<XenditInvoiceResponse | null> {
  const apiKey = process.env.XENDIT_API_KEY;
  
  if (!apiKey) {
    console.warn("[Xendit] API key not configured. Skipping invoice creation.");
    return null;
  }

  try {
    const response = await fetch("https://api.xendit.co/v2/invoices", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        external_id: params.externalId,
        amount: params.amount,
        payer_email: params.payerEmail,
        description: params.description,
        invoice_duration: params.invoiceDuration || 86400, // 24 hours default
        currency: "IDR",
        payment_methods: ["CREDIT_CARD", "BCA", "BNI", "BRI", "MANDIRI", "QRIS", "OVO", "DANA", "LINKAJA"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Xendit] Failed to create invoice:", response.status, errorText);
      return null;
    }

    const data = await response.json();
    return data as XenditInvoiceResponse;
  } catch (error) {
    console.error("[Xendit] Error creating invoice:", error);
    return null;
  }
}

export function verifyXenditCallback(callbackToken: string): boolean {
  const webhookToken = process.env.XENDIT_WEBHOOK_TOKEN;
  
  if (!webhookToken) {
    console.warn("[Xendit] Webhook token not configured. Skipping verification.");
    return true; // Allow in development
  }
  
  return callbackToken === webhookToken;
}

export interface XenditCallbackPayload {
  id: string;
  external_id: string;
  user_id: string;
  status: "PENDING" | "PAID" | "EXPIRED";
  amount: number;
  paid_amount?: number;
  payment_method?: string;
  payment_channel?: string;
  paid_at?: string;
}
