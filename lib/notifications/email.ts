/**
 * Email Notification Client
 *
 * Sends emails via Gmail API with OAuth2.
 * All emails use Hebrew RTL templates with ShipMate branding.
 *
 * Requirements:
 * - GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN
 * - GMAIL_FROM_EMAIL (e.g. noreply@shipmate.store)
 */

interface EmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  fromEmail: string;
  fromName: string;
  sandbox: boolean;
}

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

interface SendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

function getConfig(): EmailConfig {
  return {
    clientId: process.env.GMAIL_CLIENT_ID || "",
    clientSecret: process.env.GMAIL_CLIENT_SECRET || "",
    refreshToken: process.env.GMAIL_REFRESH_TOKEN || "",
    fromEmail: process.env.GMAIL_FROM_EMAIL || "noreply@shipmate.store",
    fromName: "ShipMate שיפמייט",
    sandbox: process.env.EMAIL_SANDBOX !== "false",
  };
}

/**
 * Get OAuth2 access token from refresh token
 */
async function getAccessToken(config: EmailConfig): Promise<string> {
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      refresh_token: config.refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    throw new Error(`Failed to get access token: ${data.error_description || data.error}`);
  }

  return data.access_token;
}

/**
 * Encode email as base64url RFC 2822 message
 */
function encodeEmail(params: SendEmailParams, config: EmailConfig): string {
  const boundary = `boundary_${Date.now()}`;

  const message = [
    `From: ${config.fromName} <${config.fromEmail}>`,
    `To: ${params.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(params.subject).toString("base64")}?=`,
    params.replyTo ? `Reply-To: ${params.replyTo}` : "",
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: base64",
    "",
    Buffer.from(params.html).toString("base64"),
    "",
    `--${boundary}--`,
  ]
    .filter(Boolean)
    .join("\r\n");

  // Gmail API needs base64url encoding
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Send email via Gmail API
 */
export async function sendEmail(params: SendEmailParams): Promise<SendResult> {
  const config = getConfig();

  if (!config.clientId || !config.refreshToken) {
    console.warn("Gmail API not configured — skipping email");

    if (config.sandbox) {
      console.log(`[Email Sandbox] Would send to ${params.to}:`, {
        subject: params.subject,
        htmlLength: params.html.length,
      });
      return { success: true, messageId: `sandbox-${Date.now()}` };
    }

    return { success: false, error: "Gmail API not configured" };
  }

  if (config.sandbox) {
    console.log(`[Email Sandbox] Would send to ${params.to}: "${params.subject}"`);
    return { success: true, messageId: `sandbox-${Date.now()}` };
  }

  try {
    const accessToken = await getAccessToken(config);
    const encodedMessage = encodeEmail(params, config);

    const response = await fetch(
      "https://www.googleapis.com/gmail/v1/users/me/messages/send",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    );

    const data = await response.json();

    if (response.ok && data.id) {
      console.log(`Email sent to ${params.to}: ${data.id}`);
      return { success: true, messageId: data.id };
    }

    const error = data.error?.message || "Failed to send email";
    console.error(`Email send failed for ${params.to}:`, error);
    return { success: false, error };
  } catch (error) {
    console.error("Email send error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Send email with retry (up to 3 attempts)
 */
export async function sendEmailWithRetry(
  params: SendEmailParams,
  maxRetries: number = 3
): Promise<SendResult> {
  let lastError: string | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await sendEmail(params);

    if (result.success) return result;

    lastError = result.error;
    console.warn(`Email attempt ${attempt}/${maxRetries} failed: ${lastError}`);

    // Wait before retry (exponential backoff)
    if (attempt < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
    }
  }

  return { success: false, error: `Failed after ${maxRetries} attempts: ${lastError}` };
}

// Re-export templates for convenience
export { orderConfirmationEmail } from "@/lib/email-templates/order-confirmation";
export { shippingNotificationEmail } from "@/lib/email-templates/shipping-notification";
export { deliveryConfirmationEmail } from "@/lib/email-templates/delivery-confirmation";
export { cartAbandonmentStage1, cartAbandonmentStage2, cartAbandonmentStage3 } from "@/lib/email-templates/cart-abandonment";
export { welcomeEmail } from "@/lib/email-templates/welcome";
export { weeklyDealsEmail } from "@/lib/email-templates/weekly-deals";
