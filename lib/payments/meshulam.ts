/**
 * Meshulam Payment Gateway Client
 *
 * Meshulam (משולם) is an Israeli payment service provider.
 * Docs: https://meshulam.co.il/api-docs
 *
 * Flow:
 * 1. Create payment page → get redirect URL
 * 2. Customer completes payment on Meshulam page
 * 3. Meshulam sends webhook (IPN) to our server
 * 4. We verify signature and update order
 */

interface MeshulamConfig {
  apiUrl: string;
  pageCode: string; // Business page code
  apiKey: string; // API secret key
  successUrl: string;
  failureUrl: string;
  notifyUrl: string; // Webhook URL (IPN)
  sandbox: boolean;
}

interface CreatePaymentParams {
  amount: number; // Total in ILS
  description: string; // Hebrew description
  orderId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  maxPayments?: number; // Installments (1 = single, 3 = 3 payments, etc.)
}

interface MeshulamPaymentResponse {
  success: boolean;
  paymentUrl?: string;
  transactionId?: string;
  error?: string;
}

interface MeshulamWebhookPayload {
  transaction_id: string;
  order_id: string;
  amount: string;
  status: string; // "success", "failure", "pending"
  payment_method: string;
  installments: string;
  last4: string;
  approval_num: string;
  signature: string;
  timestamp: string;
}

function getConfig(): MeshulamConfig {
  const sandbox = process.env.MESHULAM_SANDBOX !== "false";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://shipmate.store";

  return {
    apiUrl: sandbox
      ? "https://sandbox.meshulam.co.il/api/light/server/1.0"
      : "https://secure.meshulam.co.il/api/light/server/1.0",
    pageCode: process.env.MESHULAM_PAGE_CODE || "",
    apiKey: process.env.MESHULAM_API_KEY || "",
    successUrl: `${baseUrl}/order-confirmation`,
    failureUrl: `${baseUrl}/checkout?error=payment_failed`,
    notifyUrl: `${baseUrl}/api/payments/meshulam-webhook`,
    sandbox,
  };
}

/**
 * Create a Meshulam payment page and return the redirect URL
 */
export async function createPaymentPage(
  params: CreatePaymentParams
): Promise<MeshulamPaymentResponse> {
  const config = getConfig();

  if (!config.pageCode || !config.apiKey) {
    console.warn("Meshulam credentials not configured — skipping payment creation");
    return {
      success: false,
      error: "Payment gateway not configured",
    };
  }

  try {
    const formData = new FormData();
    formData.append("pageCode", config.pageCode);
    formData.append("apiKey", config.apiKey);
    formData.append("sum", params.amount.toFixed(2));
    formData.append("description", params.description);
    formData.append("pageField[fullName]", params.customerName);
    formData.append("pageField[phone]", params.customerPhone);
    formData.append("pageField[email]", params.customerEmail);
    formData.append("successUrl", `${config.successUrl}/${params.orderId}`);
    formData.append("cancelUrl", config.failureUrl);
    formData.append("notifyUrl", config.notifyUrl);
    formData.append("cField1", params.orderId); // Custom field for order ID
    formData.append("maxPayments", String(params.maxPayments || 3));

    const response = await fetch(`${config.apiUrl}/createPaymentProcess`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.status === 1 && data.data?.url) {
      return {
        success: true,
        paymentUrl: data.data.url,
        transactionId: data.data.processId,
      };
    }

    return {
      success: false,
      error: data.err?.message || "Failed to create payment page",
    };
  } catch (error) {
    console.error("Meshulam createPaymentPage error:", error);
    return {
      success: false,
      error: "Payment service unavailable",
    };
  }
}

/**
 * Verify Meshulam webhook signature
 * Meshulam signs webhooks with HMAC-SHA256
 */
export function verifyWebhookSignature(
  payload: Record<string, string>,
  receivedSignature: string
): boolean {
  const config = getConfig();

  if (!config.apiKey) {
    console.warn("Cannot verify webhook — API key not configured");
    return false;
  }

  // In sandbox mode, skip signature verification
  if (config.sandbox) {
    console.log("Sandbox mode — skipping signature verification");
    return true;
  }

  try {
    // Meshulam signature = HMAC-SHA256(sorted_params, apiKey)
    // We need the Web Crypto API or Node crypto for this
    // For now, we do basic validation
    const crypto = require("crypto");
    const sortedKeys = Object.keys(payload)
      .filter((k) => k !== "signature")
      .sort();
    const dataString = sortedKeys.map((k) => `${k}=${payload[k]}`).join("&");
    const expectedSignature = crypto
      .createHmac("sha256", config.apiKey)
      .update(dataString)
      .digest("hex");

    return expectedSignature === receivedSignature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

/**
 * Parse webhook payload from Meshulam
 */
export function parseWebhookPayload(body: Record<string, string>): MeshulamWebhookPayload {
  return {
    transaction_id: body.transaction_id || body.processId || "",
    order_id: body.cField1 || body["customFields[cField1]"] || "",
    amount: body.sum || body.amount || "0",
    status: body.status === "1" ? "success" : body.status === "0" ? "failure" : "pending",
    payment_method: body.paymentMethod || "",
    installments: body.numberOfPayments || "1",
    last4: body.cardSuffix || body.last4 || "",
    approval_num: body.asmachta || body.approvalNum || "",
    signature: body.signature || "",
    timestamp: body.timestamp || new Date().toISOString(),
  };
}

/**
 * Get payment status for a transaction
 */
export async function getPaymentStatus(
  transactionId: string
): Promise<{ status: string; amount: number } | null> {
  const config = getConfig();

  if (!config.pageCode || !config.apiKey) {
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("pageCode", config.pageCode);
    formData.append("apiKey", config.apiKey);
    formData.append("processId", transactionId);

    const response = await fetch(`${config.apiUrl}/getPaymentProcessInfo`, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.status === 1) {
      return {
        status: data.data?.processStatus === 1 ? "success" : "pending",
        amount: parseFloat(data.data?.sum || "0"),
      };
    }

    return null;
  } catch (error) {
    console.error("getPaymentStatus error:", error);
    return null;
  }
}
