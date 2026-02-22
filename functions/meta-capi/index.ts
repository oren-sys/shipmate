/**
 * Meta Conversions API (CAPI) Cloud Function
 *
 * Server-side event tracking for Meta/Facebook for improved iOS accuracy.
 * Receives events from the client-side and forwards them to Meta's server-side API.
 *
 * Environment:
 * - META_PIXEL_ID: Facebook Pixel ID
 * - META_ACCESS_TOKEN: Conversions API access token
 *
 * Deploy:
 * gcloud functions deploy meta-capi \
 *   --runtime nodejs20 \
 *   --trigger-http \
 *   --allow-unauthenticated \
 *   --region me-west1 \
 *   --memory 256MB \
 *   --timeout 30s
 */

import { createHmac } from "crypto";

const PIXEL_ID = process.env.META_PIXEL_ID || "";
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || "";
const API_VERSION = "v18.0";
const API_BASE = `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events`;

interface ServerEvent {
  event_name: string;
  event_time: number;
  event_id: string;
  event_source_url: string;
  action_source: "website";
  user_data: {
    em?: string[];      // Hashed email
    ph?: string[];      // Hashed phone
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;       // Facebook click ID
    fbp?: string;       // Facebook browser ID
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_ids?: string[];
    content_type?: string;
    num_items?: number;
    order_id?: string;
  };
}

// Hash PII with SHA-256 for Meta CAPI
function hashValue(value: string): string {
  return createHmac("sha256", "")
    .update(value.toLowerCase().trim())
    .digest("hex");
}

interface RequestBody {
  eventName: string;
  data: {
    orderId?: string;
    total?: number;
    items?: Array<{ id: string }>;
    email?: string;
    phone?: string;
  };
  sourceUrl?: string;
  userAgent?: string;
  clientIp?: string;
  fbc?: string;
  fbp?: string;
}

export async function handler(req: { body: RequestBody; headers?: Record<string, string> }) {
  if (!PIXEL_ID || !ACCESS_TOKEN) {
    console.warn("Meta CAPI: Missing PIXEL_ID or ACCESS_TOKEN");
    return { statusCode: 200, body: "Skipped — not configured" };
  }

  try {
    const { eventName, data, sourceUrl, userAgent, clientIp, fbc, fbp } = req.body;

    // Build server event
    const event: ServerEvent = {
      event_name: eventName,
      event_time: Math.floor(Date.now() / 1000),
      event_id: `${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      event_source_url: sourceUrl || "https://shipmate.store",
      action_source: "website",
      user_data: {
        client_ip_address: clientIp || req.headers?.["x-forwarded-for"] || "",
        client_user_agent: userAgent || req.headers?.["user-agent"] || "",
      },
    };

    // Add hashed PII if available
    if (data.email) {
      event.user_data.em = [hashValue(data.email)];
    }
    if (data.phone) {
      event.user_data.ph = [hashValue(data.phone)];
    }
    if (fbc) event.user_data.fbc = fbc;
    if (fbp) event.user_data.fbp = fbp;

    // Add custom data for purchase events
    if (eventName === "Purchase" && data.orderId) {
      event.custom_data = {
        currency: "ILS",
        value: data.total || 0,
        content_ids: data.items?.map((i) => i.id) || [],
        content_type: "product",
        num_items: data.items?.length || 0,
        order_id: data.orderId,
      };
    }

    // Send to Meta CAPI
    const response = await fetch(`${API_BASE}?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        data: [event],
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("Meta CAPI error:", result);
      return { statusCode: response.status, body: JSON.stringify(result) };
    }

    console.log("Meta CAPI success:", result);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error("Meta CAPI exception:", error);
    return { statusCode: 500, body: "Internal error" };
  }
}
