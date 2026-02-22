/**
 * WhatsApp Business Cloud API Client
 *
 * Sends templated messages via WhatsApp Business API.
 * Hebrew templates for order lifecycle notifications.
 *
 * Requirements:
 * - WHATSAPP_TOKEN: Business API access token
 * - WHATSAPP_PHONE_ID: WhatsApp Business phone number ID
 * - Templates must be pre-approved in WhatsApp Business Manager
 */

const WHATSAPP_API = "https://graph.facebook.com/v18.0";

interface WhatsAppConfig {
  token: string;
  phoneId: string;
  sandbox: boolean;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

interface TemplateComponent {
  type: "header" | "body" | "button";
  parameters: Array<{
    type: "text" | "currency" | "date_time" | "image";
    text?: string;
    currency?: { code: string; amount_1000: number; fallback_value: string };
    image?: { link: string };
  }>;
}

function getConfig(): WhatsAppConfig {
  return {
    token: process.env.WHATSAPP_TOKEN || "",
    phoneId: process.env.WHATSAPP_PHONE_ID || "",
    sandbox: process.env.WHATSAPP_SANDBOX !== "false",
  };
}

/**
 * Format Israeli phone to international format (+972)
 * Accepts: 050-1234567, 0501234567, +972501234567, 972501234567
 */
export function formatPhoneNumber(phone: string): string | null {
  // Remove all non-digits
  let cleaned = phone.replace(/\D/g, "");

  // Remove leading +
  if (phone.startsWith("+")) {
    cleaned = phone.replace(/\D/g, "");
  }

  // Israeli mobile: starts with 05
  if (cleaned.startsWith("05") && cleaned.length === 10) {
    return `972${cleaned.substring(1)}`; // 972501234567
  }

  // Already international format
  if (cleaned.startsWith("972") && cleaned.length === 12) {
    return cleaned;
  }

  // Invalid
  console.warn(`Invalid Israeli phone number: ${phone}`);
  return null;
}

/**
 * Send a WhatsApp template message
 */
async function sendTemplate(
  to: string,
  templateName: string,
  languageCode: string = "he",
  components?: TemplateComponent[]
): Promise<SendResult> {
  const config = getConfig();

  if (!config.token || !config.phoneId) {
    console.warn("WhatsApp not configured — skipping message");
    return { success: false, error: "WhatsApp not configured" };
  }

  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) {
    return { success: false, error: `Invalid phone number: ${to}` };
  }

  if (config.sandbox) {
    console.log(`[WhatsApp Sandbox] Would send template "${templateName}" to ${formattedPhone}`, {
      components,
    });
    return { success: true, messageId: `sandbox-${Date.now()}` };
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API}/${config.phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
            components: components || [],
          },
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.messages?.[0]?.id) {
      return {
        success: true,
        messageId: data.messages[0].id,
      };
    }

    return {
      success: false,
      error: data.error?.message || "Failed to send message",
    };
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send a free-form text message (only within 24h window)
 */
async function sendText(to: string, text: string): Promise<SendResult> {
  const config = getConfig();

  if (!config.token || !config.phoneId) {
    return { success: false, error: "WhatsApp not configured" };
  }

  const formattedPhone = formatPhoneNumber(to);
  if (!formattedPhone) {
    return { success: false, error: `Invalid phone number: ${to}` };
  }

  if (config.sandbox) {
    console.log(`[WhatsApp Sandbox] Would send text to ${formattedPhone}: ${text}`);
    return { success: true, messageId: `sandbox-${Date.now()}` };
  }

  try {
    const response = await fetch(
      `${WHATSAPP_API}/${config.phoneId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedPhone,
          type: "text",
          text: { body: text },
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.messages?.[0]?.id) {
      return { success: true, messageId: data.messages[0].id };
    }

    return {
      success: false,
      error: data.error?.message || "Failed to send text",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// ===================================================================
// Hebrew Message Templates
// These correspond to pre-approved templates in WhatsApp Business Manager
// ===================================================================

/**
 * Order Confirmation — sent after successful payment
 *
 * Template: shipmate_order_confirmed
 * Variables: {{1}} = customer name, {{2}} = order number, {{3}} = total
 */
export async function sendOrderConfirmation(
  phone: string,
  customerName: string,
  orderNumber: string,
  total: number
): Promise<SendResult> {
  return sendTemplate(phone, "shipmate_order_confirmed", "he", [
    {
      type: "body",
      parameters: [
        { type: "text", text: customerName },
        { type: "text", text: orderNumber },
        {
          type: "currency",
          currency: {
            code: "ILS",
            amount_1000: Math.round(total * 1000),
            fallback_value: `₪${total.toFixed(0)}`,
          },
        },
      ],
    },
  ]);
}

/**
 * Order Shipped — sent when tracking number is available
 *
 * Template: shipmate_order_shipped
 * Variables: {{1}} = customer name, {{2}} = order number, {{3}} = tracking URL
 */
export async function sendShippingNotification(
  phone: string,
  customerName: string,
  orderNumber: string,
  trackingUrl: string
): Promise<SendResult> {
  return sendTemplate(phone, "shipmate_order_shipped", "he", [
    {
      type: "body",
      parameters: [
        { type: "text", text: customerName },
        { type: "text", text: orderNumber },
        { type: "text", text: trackingUrl },
      ],
    },
  ]);
}

/**
 * Order Delivered — sent when package is delivered
 *
 * Template: shipmate_order_delivered
 * Variables: {{1}} = customer name, {{2}} = order number
 */
export async function sendDeliveryNotification(
  phone: string,
  customerName: string,
  orderNumber: string
): Promise<SendResult> {
  return sendTemplate(phone, "shipmate_order_delivered", "he", [
    {
      type: "body",
      parameters: [
        { type: "text", text: customerName },
        { type: "text", text: orderNumber },
      ],
    },
  ]);
}

/**
 * Cart Reminder — sent to recover abandoned carts
 *
 * Template: shipmate_cart_reminder
 * Variables: {{1}} = customer name, {{2}} = item count, {{3}} = cart URL
 *
 * Respects marketingConsent flag.
 */
export async function sendCartReminder(
  phone: string,
  customerName: string,
  itemCount: number,
  marketingConsent: boolean = false
): Promise<SendResult> {
  if (!marketingConsent) {
    console.log(`Skipping cart reminder for ${phone} — no marketing consent`);
    return { success: false, error: "No marketing consent" };
  }

  return sendTemplate(phone, "shipmate_cart_reminder", "he", [
    {
      type: "body",
      parameters: [
        { type: "text", text: customerName },
        { type: "text", text: String(itemCount) },
        { type: "text", text: "https://shipmate.store/cart" },
      ],
    },
  ]);
}

/**
 * Discount Offer — promotional message
 *
 * Template: shipmate_discount_offer
 * Variables: {{1}} = customer name, {{2}} = discount %, {{3}} = coupon code
 *
 * Respects marketingConsent flag.
 */
export async function sendDiscountOffer(
  phone: string,
  customerName: string,
  discountPercent: number,
  couponCode: string,
  marketingConsent: boolean = false
): Promise<SendResult> {
  if (!marketingConsent) {
    console.log(`Skipping discount offer for ${phone} — no marketing consent`);
    return { success: false, error: "No marketing consent" };
  }

  return sendTemplate(phone, "shipmate_discount_offer", "he", [
    {
      type: "body",
      parameters: [
        { type: "text", text: customerName },
        { type: "text", text: `${discountPercent}%` },
        { type: "text", text: couponCode },
      ],
    },
  ]);
}

/**
 * Review Request — sent 3 days after delivery
 *
 * Template: shipmate_review_request
 * Variables: {{1}} = customer name, {{2}} = product name, {{3}} = review URL
 */
export async function sendReviewRequest(
  phone: string,
  customerName: string,
  productName: string,
  reviewUrl: string
): Promise<SendResult> {
  return sendTemplate(phone, "shipmate_review_request", "he", [
    {
      type: "body",
      parameters: [
        { type: "text", text: customerName },
        { type: "text", text: productName },
        { type: "text", text: reviewUrl },
      ],
    },
  ]);
}

// Export for use in pipeline
export {
  sendTemplate,
  sendText,
  formatPhoneNumber as formatPhone,
};
