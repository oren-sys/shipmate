/**
 * WhatsApp Bot - Hebrew Auto-Reply System
 *
 * Handles incoming WhatsApp messages with Hebrew keyword matching:
 * - הזמנה / מעקב → Order tracking info
 * - החזרה / החלפה → Return policy
 * - משלוח → Shipping info
 * - מחיר / הנחה → Deals info
 * - Unknown → Creates support ticket
 *
 * Integrates with WhatsApp Business Cloud API
 */

import { getDb } from "@/lib/firebase";

// ---------- Types ----------

export interface WhatsAppMessage {
  from: string;        // Phone number
  id: string;          // Message ID
  timestamp: string;
  type: "text" | "image" | "document" | "interactive";
  text?: { body: string };
}

export interface BotResponse {
  text: string;
  ticketCreated: boolean;
  ticketId?: string;
  matchedIntent?: string;
}

// ---------- Hebrew Intent Matching ----------

interface Intent {
  name: string;
  keywords: string[];
  response: string;
}

const intents: Intent[] = [
  {
    name: "order_tracking",
    keywords: ["הזמנה", "מעקב", "tracking", "איפה ההזמנה", "סטטוס", "הגיע", "נשלח"],
    response: `📦 מעקב הזמנה

שלחו לנו את מספר ההזמנה (מתחיל ב-IL-) ונעדכן אתכם!

💡 מספר ההזמנה נשלח אליכם במייל אישור ההזמנה.

אם אין לכם את המספר, שלחו "נציג" ונחבר אתכם לשירות.`,
  },
  {
    name: "return_policy",
    keywords: ["החזרה", "החלפה", "ביטול", "כסף בחזרה", "refund", "return"],
    response: `🔄 מדיניות החזרות

✅ 14 ימי החזרה מרגע הקבלה
✅ המוצר חייב להיות באריזה המקורית
✅ החזר כספי תוך 5 ימי עסקים

📝 לפתיחת בקשת החזרה:
1. שלחו מספר הזמנה
2. צלמו את המוצר
3. נחזור אליכם תוך 24 שעות

או בקרו: shipmate.store/returns`,
  },
  {
    name: "shipping",
    keywords: ["משלוח", "delivery", "זמן משלוח", "כמה זמן", "עלות משלוח"],
    response: `🚚 מידע על משלוחים

📦 משלוח חינם מעל ₪199!
⏰ זמן אספקה: 7-14 ימי עסקים
📍 לכל רחבי ישראל

💰 משלוח רגיל: ₪29
🚀 משלוח מהיר (3-5 ימים): ₪49

📱 תקבלו מספר מעקב ברגע שההזמנה נשלחה!`,
  },
  {
    name: "deals",
    keywords: ["מחיר", "הנחה", "מבצע", "קופון", "coupon", "sale", "דיל"],
    response: `🎁 מבצעים והנחות

🔥 מבצעי השבוע באתר!
💰 קוד WELCOME15 - 15% הנחה להזמנה ראשונה
🚚 משלוח חינם מעל ₪199
🎉 הפנו חברים וקבלו 15% הנחה!

🛒 לכל המבצעים: shipmate.store`,
  },
  {
    name: "catalog",
    keywords: ["מוצרים", "קטלוג", "מה יש", "catalog", "חדש"],
    response: `✨ הקטלוג שלנו

גלו מאות מוצרים באיכות מעולה!

🏠 לבית - עיצוב, מטבח, ארגון
📱 טכנולוגיה - גאדג׳טים, אביזרים
👗 אופנה - תיקים, שעונים, תכשיטים
💪 בריאות - כושר, ספורט
🧒 ילדים - צעצועים, משחקים

🛒 קפצו לאתר: shipmate.store`,
  },
  {
    name: "agent",
    keywords: ["נציג", "אדם", "agent", "עזרה", "help", "בעיה", "תקלה"],
    response: `👤 חיבור לנציג

פנייתכם התקבלה! 🙏
נציג שלנו יחזור אליכם בהקדם.

⏰ שעות מענה: א׳-ה׳ 9:00-18:00
📧 תמיכה: support@shipmate.store

בינתיים, אולי תמצאו תשובה באתר:
❓ shipmate.store/faq`,
  },
];

// ---------- Intent Detection ----------

function detectIntent(text: string): Intent | null {
  const normalizedText = text.toLowerCase().trim();

  for (const intent of intents) {
    for (const keyword of intent.keywords) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        return intent;
      }
    }
  }

  return null;
}

// ---------- Order Lookup ----------

async function lookupOrder(orderNumber: string): Promise<string> {
  try {
    const db = getDb();

    // Try finding by order number (IL-XXXXX format)
    const snapshot = await db
      .collection("orders")
      .where("orderNumber", "==", orderNumber.toUpperCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return `❌ לא מצאנו הזמנה עם מספר ${orderNumber}.\n\nבדקו שהמספר נכון ונסו שוב, או שלחו "נציג" לעזרה.`;
    }

    const order = snapshot.docs[0].data();
    const statusMap: Record<string, string> = {
      pending: "⏳ ממתינה לאישור",
      confirmed: "✅ אושרה",
      processing: "📦 בהכנה",
      shipped: "🚚 נשלחה",
      delivered: "✅ הגיעה!",
      cancelled: "❌ בוטלה",
    };

    const status = statusMap[order.status as string] || order.status;
    let response = `📦 הזמנה ${orderNumber}\n\nסטטוס: ${status}\nסכום: ₪${order.total}`;

    if (order.trackingNumber) {
      response += `\n📍 מספר מעקב: ${order.trackingNumber}`;
    }

    if (order.estimatedDelivery) {
      response += `\n⏰ משלוח צפוי: ${order.estimatedDelivery}`;
    }

    return response;
  } catch {
    return "⚠️ שגיאה בחיפוש ההזמנה. נסו שוב מאוחר יותר או שלחו \"נציג\".";
  }
}

// ---------- Support Ticket Creation ----------

async function createSupportTicket(
  phone: string,
  message: string
): Promise<string> {
  try {
    const db = getDb();

    // Check for existing open ticket from this phone
    const existing = await db
      .collection("supportTickets")
      .where("phone", "==", phone)
      .where("status", "in", ["open", "pending"])
      .limit(1)
      .get();

    if (!existing.empty) {
      // Add message to existing ticket
      const ticketRef = existing.docs[0].ref;
      const ticketData = existing.docs[0].data();
      const messages = (ticketData.messages as Array<Record<string, unknown>>) || [];

      messages.push({
        from: "customer",
        text: message,
        timestamp: new Date().toISOString(),
      });

      await ticketRef.update({
        messages,
        updatedAt: new Date().toISOString(),
      });

      return existing.docs[0].id;
    }

    // Create new ticket
    const ref = db.collection("supportTickets").doc();
    await ref.set({
      phone,
      channel: "whatsapp",
      subject: message.substring(0, 100),
      messages: [
        {
          from: "customer",
          text: message,
          timestamp: new Date().toISOString(),
        },
      ],
      status: "open",
      priority: "medium",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return ref.id;
  } catch (error) {
    console.error("Failed to create support ticket:", error);
    return "";
  }
}

// ---------- Main Bot Handler ----------

export async function handleWhatsAppMessage(
  message: WhatsAppMessage
): Promise<BotResponse> {
  const text = message.text?.body || "";

  if (!text.trim()) {
    return {
      text: "👋 שלום! שלחו הודעת טקסט ונשמח לעזור.\n\nנסו: הזמנה, משלוח, החזרה, מבצעים",
      ticketCreated: false,
    };
  }

  // Check for order number pattern (IL-XXXXX)
  const orderMatch = text.match(/IL-\d{4,}/i);
  if (orderMatch) {
    const orderResponse = await lookupOrder(orderMatch[0]);
    return {
      text: orderResponse,
      ticketCreated: false,
      matchedIntent: "order_lookup",
    };
  }

  // Try intent matching
  const intent = detectIntent(text);

  if (intent) {
    // For "agent" intent, also create a ticket
    if (intent.name === "agent") {
      const ticketId = await createSupportTicket(message.from, text);
      return {
        text: intent.response,
        ticketCreated: true,
        ticketId,
        matchedIntent: intent.name,
      };
    }

    return {
      text: intent.response,
      ticketCreated: false,
      matchedIntent: intent.name,
    };
  }

  // Unknown intent — create ticket
  const ticketId = await createSupportTicket(message.from, text);

  return {
    text: `תודה על הפנייה! 🙏

ההודעה שלכם התקבלה ונציג יחזור אליכם בהקדם.

⏰ זמן תגובה ממוצע: עד 2 שעות
📧 לחלופין: support@shipmate.store

בינתיים, אולי אוכל לעזור עם:
📦 מעקב הזמנה - שלחו "הזמנה"
🚚 מידע על משלוח - שלחו "משלוח"
🔄 החזרות - שלחו "החזרה"
🎁 מבצעים - שלחו "הנחה"`,
    ticketCreated: true,
    ticketId,
  };
}

// ---------- WhatsApp API Reply ----------

export async function sendWhatsAppReply(
  to: string,
  text: string
): Promise<boolean> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;

  if (!token || !phoneId) {
    console.error("WhatsApp API not configured");
    return false;
  }

  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: { body: text },
        }),
      }
    );

    return response.ok;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}
