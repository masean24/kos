/**
 * WhatsApp Bot Service using Baileys
 * 
 * This module handles WhatsApp connection and message sending for payment reminders.
 * To enable: Set ENABLE_WHATSAPP_BOT=true in environment variables
 */

import makeWASocket, { DisconnectReason, useMultiFileAuthState, WASocket } from '@whiskeysockets/baileys';
// import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import * as fs from 'fs';
import * as path from 'path';

let sock: WASocket | null = null;
let isConnected = false;

const AUTH_DIR = path.join(process.cwd(), 'wa-auth');

// Ensure auth directory exists
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

/**
 * Initialize WhatsApp connection
 */
export async function initWhatsAppBot() {
  const enabled = process.env.ENABLE_WHATSAPP_BOT === 'true';
  
  if (!enabled) {
    console.log('[WhatsApp Bot] Disabled. Set ENABLE_WHATSAPP_BOT=true to enable.');
    return;
  }

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      printQRInTerminal: true,
    });

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('[WhatsApp Bot] Scan QR code to connect:');
        qrcode.generate(qr, { small: true });
      }

      if (connection === 'close') {
        const shouldReconnect = (lastDisconnect?.error as any)?.output?.statusCode !== DisconnectReason.loggedOut;
        console.log('[WhatsApp Bot] Connection closed. Reconnecting:', shouldReconnect);
        
        if (shouldReconnect) {
          setTimeout(() => initWhatsAppBot(), 3000);
        } else {
          isConnected = false;
        }
      } else if (connection === 'open') {
        console.log('[WhatsApp Bot] Connected successfully!');
        isConnected = true;
      }
    });

    sock.ev.on('creds.update', saveCreds);

  } catch (error) {
    console.error('[WhatsApp Bot] Failed to initialize:', error);
  }
}

/**
 * Send WhatsApp message
 */
export async function sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
  if (!sock || !isConnected) {
    console.warn('[WhatsApp Bot] Not connected. Message not sent.');
    return false;
  }

  try {
    // Format phone number (remove +, spaces, dashes)
    const formattedNumber = phoneNumber.replace(/[^0-9]/g, '');
    
    // Add country code if not present (default Indonesia +62)
    let jid = formattedNumber;
    if (!jid.startsWith('62')) {
      jid = '62' + jid.replace(/^0/, ''); // Remove leading 0 and add 62
    }
    jid = jid + '@s.whatsapp.net';

    await sock.sendMessage(jid, { text: message });
    console.log(`[WhatsApp Bot] Message sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('[WhatsApp Bot] Failed to send message:', error);
    return false;
  }
}

/**
 * Send payment reminder to tenant
 */
export async function sendPaymentReminder(
  tenantName: string,
  phoneNumber: string,
  roomNumber: string,
  amount: number,
  dueDate: Date
): Promise<boolean> {
  const formattedAmount = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
  }).format(amount);

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dueDate);

  const message = `Halo ${tenantName},

Ini pengingat pembayaran kos kamar ${roomNumber}.
Total: ${formattedAmount}
Jatuh tempo: ${formattedDate}

Mohon segera lakukan pembayaran sebelum tanggal jatuh tempo ya 😊

Terima kasih!`;

  return await sendWhatsAppMessage(phoneNumber, message);
}

/**
 * Check if WhatsApp bot is connected
 */
export function isWhatsAppConnected(): boolean {
  return isConnected;
}

/**
 * Get WhatsApp connection status
 */
export function getWhatsAppStatus(): { enabled: boolean; connected: boolean } {
  const enabled = process.env.ENABLE_WHATSAPP_BOT === 'true';
  return {
    enabled,
    connected: isConnected,
  };
}
