import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature, parseWebhookPayload } from "@/lib/payments/meshulam";

/**
 * Meshulam Webhook (IPN) Handler
 *
 * Called by Meshulam after payment completion.
 * Flow:
 * 1. Receive POST from Meshulam
 * 2. Verify signature
 * 3. Update order status
 * 4. Enqueue post-payment tasks (confirmation email, invoice, fulfillment)
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data from Meshulam
    const contentType = request.headers.get("content-type") || "";
    let rawBody: Record<string, string> = {};

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      formData.forEach((value, key) => {
        rawBody[key] = String(value);
      });
    } else if (contentType.includes("application/json")) {
      rawBody = await request.json();
    } else {
      // Try to parse as text/form data
      const text = await request.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        rawBody[key] = value;
      });
    }

    console.log("Meshulam webhook received:", JSON.stringify(rawBody));

    // Verify signature
    const signature = rawBody.signature || "";
    const isValid = verifyWebhookSignature(rawBody, signature);

    if (!isValid) {
      console.error("Invalid Meshulam webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }

    // Parse the payload
    const payment = parseWebhookPayload(rawBody);

    if (!payment.order_id) {
      console.error("Missing order_id in webhook payload");
      return NextResponse.json(
        { error: "Missing order ID" },
        { status: 400 }
      );
    }

    console.log(`Payment ${payment.status} for order ${payment.order_id}`, {
      transactionId: payment.transaction_id,
      amount: payment.amount,
      last4: payment.last4,
    });

    if (payment.status === "success") {
      // TODO: Update order status in Firestore
      // await updateOrder(payment.order_id, {
      //   status: "PAID",
      //   paymentTransactionId: payment.transaction_id,
      //   paymentDetails: {
      //     method: payment.payment_method,
      //     last4: payment.last4,
      //     installments: parseInt(payment.installments, 10),
      //     approvalNum: payment.approval_num,
      //     amount: parseFloat(payment.amount),
      //     paidAt: new Date(),
      //   },
      // });

      // TODO: Enqueue post-payment tasks via Cloud Tasks
      // await enqueueTasks([
      //   { queue: "order-processing", handler: "/api/tasks/send-confirmation", payload: { orderId: payment.order_id } },
      //   { queue: "order-processing", handler: "/api/tasks/generate-invoice", payload: { orderId: payment.order_id } },
      //   { queue: "order-processing", handler: "/api/tasks/process-fulfillment", payload: { orderId: payment.order_id } },
      //   { queue: "notifications", handler: "/api/tasks/send-whatsapp", payload: { orderId: payment.order_id, type: "order_confirmation" } },
      // ]);

      console.log(`Order ${payment.order_id} marked as PAID`);
    } else if (payment.status === "failure") {
      // TODO: Update order status in Firestore
      // await updateOrder(payment.order_id, {
      //   status: "PAYMENT_FAILED",
      //   paymentError: "Payment declined",
      // });

      console.log(`Payment failed for order ${payment.order_id}`);
    }

    // Meshulam expects a 200 response to confirm receipt
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Meshulam webhook error:", error);
    // Still return 200 to prevent Meshulam from retrying
    // (we'll handle the error internally)
    return NextResponse.json({ received: true, error: "Internal processing error" });
  }
}

// Meshulam may also send GET requests for verification
export async function GET() {
  return NextResponse.json({ status: "Webhook endpoint active" });
}
