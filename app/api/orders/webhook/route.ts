import { NextRequest, NextResponse } from "next/server";
import { dispatchAction } from "@/lib/orders/pipeline";

/**
 * Order Processing Webhook
 *
 * Receives tasks from Cloud Tasks queue and dispatches
 * them to the appropriate pipeline handler.
 *
 * Security: In production, validates Cloud Tasks headers.
 */
export async function POST(request: NextRequest) {
  try {
    // Verify Cloud Tasks header in production
    const taskName = request.headers.get("x-cloudtasks-taskname");
    const queueName = request.headers.get("x-cloudtasks-queuename");

    if (process.env.NODE_ENV === "production" && !taskName) {
      console.error("Missing Cloud Tasks header — rejecting request");
      return NextResponse.json(
        { error: "Forbidden — Cloud Tasks only" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...payload } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Missing action field" },
        { status: 400 }
      );
    }

    console.log(`[Webhook] Processing action: ${action}`, {
      taskName,
      queueName,
      orderId: payload.orderId,
    });

    const result = await dispatchAction(action, payload);

    if (result.success) {
      // Return 200 so Cloud Tasks doesn't retry
      return NextResponse.json(result);
    } else {
      // Return 400 for permanent failures (no retry)
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    console.error("[Webhook] Processing error:", error);

    // Return 500 so Cloud Tasks will retry with backoff
    return NextResponse.json(
      { error: "Internal processing error" },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  return NextResponse.json({
    status: "Order webhook active",
    timestamp: new Date().toISOString(),
  });
}
