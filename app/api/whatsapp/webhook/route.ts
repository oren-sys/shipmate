/**
 * WhatsApp Webhook API
 *
 * GET  /api/whatsapp/webhook - Verification (Meta challenge)
 * POST /api/whatsapp/webhook - Incoming messages
 *
 * Handles incoming WhatsApp messages:
 * 1. Parses webhook payload
 * 2. Routes to WhatsApp bot for auto-reply
 * 3. Sends reply back via WhatsApp Cloud API
 */

import { NextRequest, NextResponse } from "next/server";
import {
  handleWhatsAppMessage,
  sendWhatsAppReply,
} from "@/lib/support/whatsapp-bot";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || "shipmate_webhook_verify_2024";

// GET - Webhook verification (Meta challenge-response)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified");
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

// POST - Incoming messages
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract message from webhook payload
    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (!value?.messages?.length) {
      // Status update or other non-message event
      return NextResponse.json({ status: "ok" });
    }

    const message = value.messages[0];
    const contact = value.contacts?.[0];

    console.log(`WhatsApp message from ${contact?.wa_id || message.from}:`, {
      type: message.type,
      text: message.text?.body?.substring(0, 100),
    });

    // Process with bot
    const botResponse = await handleWhatsAppMessage({
      from: message.from,
      id: message.id,
      timestamp: message.timestamp,
      type: message.type,
      text: message.text,
    });

    // Send reply
    const sent = await sendWhatsAppReply(message.from, botResponse.text);

    if (!sent) {
      console.error("Failed to send WhatsApp reply to", message.from);
    }

    // Log for analytics
    console.log("WhatsApp bot response:", {
      to: message.from,
      intent: botResponse.matchedIntent || "unknown",
      ticketCreated: botResponse.ticketCreated,
      ticketId: botResponse.ticketId,
      replySent: sent,
    });

    return NextResponse.json({ status: "ok" });
  } catch (error) {
    console.error("WhatsApp webhook error:", error);
    // Always return 200 to WhatsApp to prevent retries
    return NextResponse.json({ status: "error" }, { status: 200 });
  }
}
