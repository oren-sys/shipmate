/**
 * Order Processing Pipeline
 *
 * Cloud Tasks orchestration for the entire order lifecycle:
 * 1. order.confirm   — Create order, send confirmation, fire pixels
 * 2. order.fulfill   — Forward to AliExpress API, save tracking
 * 3. order.track     — Fetch tracking updates, notify customer
 * 4. order.review    — Delayed review request (3 days after delivery)
 *
 * All tasks use exponential backoff retry config.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://shipmate.store";
const PROJECT_ID = process.env.GCP_PROJECT_ID || "dropship-488214";
const LOCATION = process.env.GCP_LOCATION || "me-west1";

// Cloud Tasks queue names
const QUEUES = {
  orderProcessing: `projects/${PROJECT_ID}/locations/${LOCATION}/queues/order-processing`,
  notifications: `projects/${PROJECT_ID}/locations/${LOCATION}/queues/notifications`,
  imageProcessing: `projects/${PROJECT_ID}/locations/${LOCATION}/queues/image-processing`,
};

interface TaskConfig {
  queue: string;
  handler: string;
  payload: Record<string, unknown>;
  delaySeconds?: number;
}

/**
 * Enqueue a Cloud Task
 */
async function enqueueTask(config: TaskConfig): Promise<string | null> {
  // In development, just log the task
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV] Would enqueue task:`, {
      queue: config.queue,
      handler: config.handler,
      payload: config.payload,
      delaySeconds: config.delaySeconds,
    });
    return `dev-task-${Date.now()}`;
  }

  try {
    const { CloudTasksClient } = await import("@google-cloud/tasks");
    const client = new CloudTasksClient();

    const scheduleTime = config.delaySeconds
      ? {
          seconds: Math.floor(Date.now() / 1000) + config.delaySeconds,
        }
      : undefined;

    const [response] = await client.createTask({
      parent: config.queue,
      task: {
        httpRequest: {
          httpMethod: "POST",
          url: `${BASE_URL}${config.handler}`,
          headers: { "Content-Type": "application/json" },
          body: Buffer.from(JSON.stringify(config.payload)).toString("base64"),
        },
        scheduleTime,
      },
    });

    const taskName = response.name || null;
    console.log(`Enqueued task: ${taskName}`);
    return taskName;
  } catch (error) {
    console.error(`Failed to enqueue task to ${config.handler}:`, error);
    return null;
  }
}

/**
 * Step 1: Confirm Order
 *
 * Called after successful payment.
 * Creates the order record, sends confirmation notifications.
 */
export async function confirmOrder(orderId: string): Promise<void> {
  console.log(`[Pipeline] Confirming order ${orderId}`);

  // Enqueue all confirmation tasks in parallel
  await Promise.all([
    // Send confirmation email
    enqueueTask({
      queue: QUEUES.notifications,
      handler: "/api/orders/webhook",
      payload: { action: "send_confirmation_email", orderId },
    }),

    // Send WhatsApp confirmation
    enqueueTask({
      queue: QUEUES.notifications,
      handler: "/api/orders/webhook",
      payload: { action: "send_whatsapp_confirmation", orderId },
    }),

    // Generate invoice
    enqueueTask({
      queue: QUEUES.orderProcessing,
      handler: "/api/orders/webhook",
      payload: { action: "generate_invoice", orderId },
    }),

    // Fire conversion pixels (delayed 5s to ensure order is saved)
    enqueueTask({
      queue: QUEUES.orderProcessing,
      handler: "/api/orders/webhook",
      payload: { action: "fire_pixels", orderId },
      delaySeconds: 5,
    }),

    // Schedule fulfillment (delayed 60s for any cancellations)
    enqueueTask({
      queue: QUEUES.orderProcessing,
      handler: "/api/orders/webhook",
      payload: { action: "fulfill_order", orderId },
      delaySeconds: 60,
    }),
  ]);
}

/**
 * Step 2: Fulfill Order
 *
 * Forward order to AliExpress supplier API.
 */
export async function fulfillOrder(orderId: string): Promise<void> {
  console.log(`[Pipeline] Fulfilling order ${orderId}`);

  // TODO: Fetch order from Firestore
  // const order = await getOrder(orderId);

  // TODO: Call AliExpress DS API to place order
  // const aliResult = await aliexpressPlaceOrder({
  //   productId: order.items[0].supplierProductId,
  //   shippingAddress: order.shippingAddress,
  //   quantity: order.items[0].quantity,
  // });

  // TODO: Save AliExpress order ID
  // await updateOrder(orderId, {
  //   aliexpressOrderId: aliResult.orderId,
  //   status: "PROCESSING",
  //   fulfilledAt: new Date(),
  // });

  // Schedule first tracking check (24 hours later)
  await enqueueTask({
    queue: QUEUES.orderProcessing,
    handler: "/api/orders/webhook",
    payload: { action: "track_order", orderId, attempt: 1 },
    delaySeconds: 24 * 60 * 60, // 24 hours
  });
}

/**
 * Step 3: Track Order
 *
 * Fetch tracking info from AliExpress, update status.
 * Retries every 24h up to 30 times (30 days).
 */
export async function trackOrder(
  orderId: string,
  attempt: number = 1
): Promise<void> {
  console.log(`[Pipeline] Tracking order ${orderId} (attempt ${attempt})`);

  const MAX_ATTEMPTS = 30;

  // TODO: Fetch order from Firestore
  // const order = await getOrder(orderId);

  // TODO: Fetch tracking from AliExpress
  // const tracking = await aliexpressGetTracking(order.aliexpressOrderId);

  // Simulate tracking status check
  const isDelivered = false; // tracking.status === "DELIVERED"
  const isShipped = false; // tracking.status === "SHIPPED"

  if (isDelivered) {
    // TODO: Update order status
    // await updateOrder(orderId, {
    //   status: "DELIVERED",
    //   deliveredAt: new Date(),
    //   trackingNumber: tracking.trackingNumber,
    // });

    // Send delivery notification
    await enqueueTask({
      queue: QUEUES.notifications,
      handler: "/api/orders/webhook",
      payload: { action: "send_delivery_notification", orderId },
    });

    // Schedule review request (3 days after delivery)
    await enqueueTask({
      queue: QUEUES.notifications,
      handler: "/api/orders/webhook",
      payload: { action: "request_review", orderId },
      delaySeconds: 3 * 24 * 60 * 60, // 3 days
    });

    return;
  }

  if (isShipped) {
    // TODO: Update with tracking number
    // await updateOrder(orderId, {
    //   status: "SHIPPED",
    //   trackingNumber: tracking.trackingNumber,
    // });

    // Send shipping notification (only once)
    await enqueueTask({
      queue: QUEUES.notifications,
      handler: "/api/orders/webhook",
      payload: { action: "send_shipping_notification", orderId },
    });
  }

  // Schedule next check if not delivered yet
  if (attempt < MAX_ATTEMPTS) {
    await enqueueTask({
      queue: QUEUES.orderProcessing,
      handler: "/api/orders/webhook",
      payload: { action: "track_order", orderId, attempt: attempt + 1 },
      delaySeconds: 24 * 60 * 60, // Check again in 24h
    });
  } else {
    console.warn(`Order ${orderId} tracking expired after ${MAX_ATTEMPTS} attempts`);
    // TODO: Flag for manual review
  }
}

/**
 * Step 4: Request Review
 *
 * Send review request 3 days after delivery.
 */
export async function requestReview(orderId: string): Promise<void> {
  console.log(`[Pipeline] Requesting review for order ${orderId}`);

  // TODO: Fetch order and check if review already exists
  // const order = await getOrder(orderId);
  // const existingReview = await getReviewByOrder(orderId);
  // if (existingReview) return;

  // Send review request via WhatsApp + Email
  await Promise.all([
    enqueueTask({
      queue: QUEUES.notifications,
      handler: "/api/orders/webhook",
      payload: { action: "send_whatsapp_review_request", orderId },
    }),
    enqueueTask({
      queue: QUEUES.notifications,
      handler: "/api/orders/webhook",
      payload: { action: "send_email_review_request", orderId },
    }),
  ]);
}

/**
 * Pipeline dispatcher — routes webhook actions to handlers
 */
export async function dispatchAction(
  action: string,
  payload: Record<string, unknown>
): Promise<{ success: boolean; message: string }> {
  const orderId = payload.orderId as string;

  if (!orderId) {
    return { success: false, message: "Missing orderId" };
  }

  switch (action) {
    case "confirm_order":
      await confirmOrder(orderId);
      return { success: true, message: `Order ${orderId} confirmation initiated` };

    case "fulfill_order":
      await fulfillOrder(orderId);
      return { success: true, message: `Order ${orderId} fulfillment initiated` };

    case "track_order":
      await trackOrder(orderId, (payload.attempt as number) || 1);
      return { success: true, message: `Order ${orderId} tracking checked` };

    case "request_review":
      await requestReview(orderId);
      return { success: true, message: `Review request sent for order ${orderId}` };

    case "generate_invoice":
      // TODO: Call invoice generator Cloud Function
      console.log(`[Pipeline] Generating invoice for order ${orderId}`);
      return { success: true, message: `Invoice generation queued for ${orderId}` };

    case "fire_pixels":
      // TODO: Fire Facebook/Google conversion pixels server-side
      console.log(`[Pipeline] Firing conversion pixels for order ${orderId}`);
      return { success: true, message: `Pixels fired for ${orderId}` };

    case "send_confirmation_email":
    case "send_shipping_notification":
    case "send_delivery_notification":
    case "send_email_review_request":
      // TODO: Route to email notification service
      console.log(`[Pipeline] Email action ${action} for order ${orderId}`);
      return { success: true, message: `Email ${action} queued for ${orderId}` };

    case "send_whatsapp_confirmation":
    case "send_whatsapp_review_request":
      // TODO: Route to WhatsApp notification service
      console.log(`[Pipeline] WhatsApp action ${action} for order ${orderId}`);
      return { success: true, message: `WhatsApp ${action} queued for ${orderId}` };

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}
