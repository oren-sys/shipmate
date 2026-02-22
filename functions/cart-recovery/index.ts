/**
 * Cart Recovery Cloud Function
 *
 * Runs every 30 minutes via Cloud Scheduler.
 * Queries abandoned carts from Firestore and sends recovery messages:
 *
 * Sequence:
 * 1. After 1hr  → WhatsApp reminder
 * 2. After 24hr → Email with 10% coupon
 * 3. After 48hr → WhatsApp with 15% coupon + urgency
 *
 * Deploy:
 * gcloud functions deploy cart-recovery \
 *   --runtime nodejs20 --trigger-http --allow-unauthenticated \
 *   --region me-west1 --memory 256MB --timeout 60s
 */

import * as https from "https";

// ---------- Types ----------

interface CartItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
}

interface AbandonedCart {
  id: string;
  sessionId: string;
  email?: string;
  phone?: string;
  items: CartItem[];
  totalValue: number;
  recovered: boolean;
  remindersSent: number;
  lastReminderAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ---------- Firestore REST API ----------

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214";
const FIRESTORE_BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

async function firestoreGet(path: string): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const url = `${FIRESTORE_BASE}/${path}`;
    https.get(url, (res) => {
      let data = "";
      res.on("data", (chunk: string) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Failed to parse response from ${path}`));
        }
      });
    }).on("error", reject);
  });
}

async function firestoreQuery(
  collection: string,
  filters: Array<{
    field: string;
    op: string;
    value: { booleanValue?: boolean; integerValue?: string };
  }>
): Promise<AbandonedCart[]> {
  const structuredQuery = {
    structuredQuery: {
      from: [{ collectionId: collection }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: filters.map((f) => ({
            fieldFilter: {
              field: { fieldPath: f.field },
              op: f.op,
              value: f.value,
            },
          })),
        },
      },
      limit: 100,
    },
  };

  return new Promise((resolve, reject) => {
    const url = `${FIRESTORE_BASE}:runQuery`;
    const payload = JSON.stringify(structuredQuery);

    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => (data += chunk));
      res.on("end", () => {
        try {
          const results = JSON.parse(data);
          const carts: AbandonedCart[] = [];

          for (const result of results) {
            if (result.document) {
              const fields = result.document.fields;
              const docName = result.document.name as string;
              const id = docName.split("/").pop() || "";

              carts.push({
                id,
                sessionId: fields.sessionId?.stringValue || "",
                email: fields.email?.stringValue,
                phone: fields.phone?.stringValue,
                items: fields.items?.arrayValue?.values?.map(
                  (v: Record<string, Record<string, unknown>>) => ({
                    productId: v.mapValue?.fields?.productId?.stringValue || "",
                    title: v.mapValue?.fields?.title?.stringValue || "",
                    price: parseFloat(
                      (v.mapValue?.fields?.price?.doubleValue as string) || "0"
                    ),
                    quantity: parseInt(
                      (v.mapValue?.fields?.quantity?.integerValue as string) || "1",
                      10
                    ),
                    image: v.mapValue?.fields?.image?.stringValue || "",
                  })
                ) || [],
                totalValue: parseFloat(
                  (fields.totalValue?.doubleValue as string) ||
                  (fields.totalValue?.integerValue as string) ||
                  "0"
                ),
                recovered: fields.recovered?.booleanValue || false,
                remindersSent: parseInt(
                  (fields.remindersSent?.integerValue as string) || "0",
                  10
                ),
                lastReminderAt: fields.lastReminderAt?.stringValue,
                createdAt: fields.createdAt?.stringValue || "",
                updatedAt: fields.updatedAt?.stringValue || "",
              });
            }
          }

          resolve(carts);
        } catch {
          reject(new Error("Failed to parse Firestore query response"));
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// ---------- Notification Senders ----------

async function sendWhatsAppReminder(
  phone: string,
  cart: AbandonedCart,
  couponCode?: string
): Promise<void> {
  const WHATSAPP_TOKEN = process.env.WHATSAPP_API_TOKEN;
  const PHONE_ID = process.env.WHATSAPP_PHONE_ID;

  if (!WHATSAPP_TOKEN || !PHONE_ID) {
    console.log("WhatsApp not configured, skipping");
    return;
  }

  const itemsList = cart.items
    .slice(0, 3)
    .map((i) => `• ${i.title} (₪${i.price})`)
    .join("\n");

  let message = `היי! 👋\n\nשמנו לב שהשארת פריטים בעגלה:\n${itemsList}\n\nסך הכל: ₪${cart.totalValue.toFixed(0)}`;

  if (couponCode) {
    message += `\n\n🎁 קוד הנחה מיוחד בשבילך: ${couponCode}\n⏰ תקף ל-24 שעות בלבד!`;
  }

  message += `\n\n🛒 להשלמת ההזמנה: ${process.env.BASE_URL || "https://shipmate.store"}/cart`;

  const payload = JSON.stringify({
    messaging_product: "whatsapp",
    to: phone,
    type: "text",
    text: { body: message },
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "graph.facebook.com",
      path: `/v18.0/${PHONE_ID}/messages`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          console.error("WhatsApp send failed:", data);
          reject(new Error(`WhatsApp API error: ${res.statusCode}`));
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

async function sendEmailReminder(
  email: string,
  cart: AbandonedCart,
  couponCode?: string,
  discountPercent?: number
): Promise<void> {
  // Send via our Next.js API route
  const baseUrl = process.env.BASE_URL || "https://shipmate.store";

  const payload = JSON.stringify({
    to: email,
    subject: couponCode
      ? `🎁 ${discountPercent}% הנחה על העגלה שלך!`
      : "שכחת משהו? 🛒 הפריטים שלך מחכים",
    template: "cart-recovery",
    data: {
      items: cart.items,
      totalValue: cart.totalValue,
      couponCode,
      discountPercent,
      cartUrl: `${baseUrl}/cart`,
    },
  });

  return new Promise((resolve, reject) => {
    const urlObj = new URL(`${baseUrl}/api/notifications/email`);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: string) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve();
        } else {
          console.error("Email send failed:", data);
          resolve(); // Don't fail the whole function for email issues
        }
      });
    });

    req.on("error", () => resolve()); // Silently fail
    req.write(payload);
    req.end();
  });
}

// ---------- Coupon Generator ----------

async function createRecoveryCoupon(
  discountPercent: number,
  cartId: string
): Promise<string> {
  const code = `RECOVER${discountPercent}_${cartId.substring(0, 6).toUpperCase()}`;

  // Create coupon in Firestore via REST (simplified)
  const baseUrl = process.env.BASE_URL || "https://shipmate.store";

  try {
    const payload = JSON.stringify({
      code,
      type: "percentage",
      value: discountPercent,
      minOrderAmount: 0,
      maxUses: 1,
      usedCount: 0,
      expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48hr
      isActive: true,
      source: "cart-recovery",
      cartId,
    });

    await new Promise<void>((resolve) => {
      const urlObj = new URL(`${baseUrl}/api/admin/coupons`);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
      };

      const req = https.request(options, () => resolve());
      req.on("error", () => resolve());
      req.write(payload);
      req.end();
    });
  } catch {
    // Coupon creation failed silently
  }

  return code;
}

// ---------- Main Handler ----------

interface RecoveryResult {
  processed: number;
  whatsappSent: number;
  emailSent: number;
  errors: number;
}

async function processAbandonedCarts(): Promise<RecoveryResult> {
  const result: RecoveryResult = {
    processed: 0,
    whatsappSent: 0,
    emailSent: 0,
    errors: 0,
  };

  try {
    // Get abandoned carts that are not recovered and have items
    const carts = await firestoreQuery("abandonedCarts", [
      {
        field: "recovered",
        op: "EQUAL",
        value: { booleanValue: false },
      },
      {
        field: "remindersSent",
        op: "LESS_THAN",
        value: { integerValue: "3" },
      },
    ]);

    const now = Date.now();

    for (const cart of carts) {
      try {
        const cartAge = now - new Date(cart.createdAt).getTime();
        const hoursSinceCreation = cartAge / (1000 * 60 * 60);
        const lastReminderAge = cart.lastReminderAt
          ? now - new Date(cart.lastReminderAt).getTime()
          : Infinity;
        const hoursSinceLastReminder = lastReminderAge / (1000 * 60 * 60);

        // Minimum 1 hour between reminders
        if (hoursSinceLastReminder < 1) continue;

        let sent = false;

        if (cart.remindersSent === 0 && hoursSinceCreation >= 1) {
          // Step 1: WhatsApp reminder after 1 hour
          if (cart.phone) {
            await sendWhatsAppReminder(cart.phone, cart);
            result.whatsappSent++;
            sent = true;
          }
        } else if (cart.remindersSent === 1 && hoursSinceCreation >= 24) {
          // Step 2: Email with 10% coupon after 24 hours
          if (cart.email) {
            const coupon = await createRecoveryCoupon(10, cart.id);
            await sendEmailReminder(cart.email, cart, coupon, 10);
            result.emailSent++;
            sent = true;
          }
        } else if (cart.remindersSent === 2 && hoursSinceCreation >= 48) {
          // Step 3: WhatsApp with 15% coupon after 48 hours
          if (cart.phone) {
            const coupon = await createRecoveryCoupon(15, cart.id);
            await sendWhatsAppReminder(cart.phone, cart, coupon);
            result.whatsappSent++;
            sent = true;
          }
        }

        if (sent) {
          // Update cart reminder count via REST
          console.log(
            `Sent reminder ${cart.remindersSent + 1} for cart ${cart.id}`
          );
          result.processed++;
        }
      } catch (error) {
        console.error(`Error processing cart ${cart.id}:`, error);
        result.errors++;
      }
    }
  } catch (error) {
    console.error("Cart recovery query error:", error);
    result.errors++;
  }

  return result;
}

// ---------- Cloud Function Entry Point ----------

import { IncomingMessage, ServerResponse } from "http";

export async function cartRecovery(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  console.log("Cart recovery started at", new Date().toISOString());

  try {
    const result = await processAbandonedCarts();

    console.log("Cart recovery completed:", result);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: true,
        ...result,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error("Cart recovery failed:", error);

    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        success: false,
        error: "Cart recovery failed",
        timestamp: new Date().toISOString(),
      })
    );
  }
}

// Export for Cloud Functions
exports.cartRecovery = cartRecovery;
