/**
 * Scheduler Dispatcher Cloud Function
 *
 * Single Cloud Scheduler job triggers this every 30 minutes.
 * It checks the current time (IST) and fans out to appropriate tasks:
 *
 * Every 30 min:  Cart recovery
 * Every 6 hours: Order tracking update
 * Daily 2:00 AM: Trend detection
 * Daily 6:00 AM: Price update
 * Daily 8:00 AM: Admin summary email
 *
 * Deploy:
 * gcloud functions deploy scheduler-dispatcher \
 *   --runtime nodejs20 --trigger-http --allow-unauthenticated \
 *   --region me-west1 --memory 256MB --timeout 120s
 */

import * as https from "https";
import { IncomingMessage, ServerResponse } from "http";

// ---------- Config ----------

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214";
const REGION = "me-west1";
const BASE_URL = process.env.BASE_URL || "https://shipmate.store";

// Cloud Function URLs (set after deployment)
function getFunctionUrl(name: string): string {
  return `https://${REGION}-${PROJECT_ID}.cloudfunctions.net/${name}`;
}

// ---------- Task Definitions ----------

interface ScheduledTask {
  name: string;
  url: string;
  schedule: "every30min" | "every6h" | "daily";
  dailyHour?: number; // IST hour (0-23) for daily tasks
  dailyMinute?: number;
  enabled: boolean;
}

const tasks: ScheduledTask[] = [
  {
    name: "cart-recovery",
    url: getFunctionUrl("cart-recovery"),
    schedule: "every30min",
    enabled: true,
  },
  {
    name: "order-tracking-update",
    url: `${BASE_URL}/api/orders/update-tracking`,
    schedule: "every6h",
    enabled: true,
  },
  {
    name: "trend-detection",
    url: `${BASE_URL}/api/admin/products/trend-update`,
    schedule: "daily",
    dailyHour: 2,
    dailyMinute: 0,
    enabled: true,
  },
  {
    name: "price-update",
    url: `${BASE_URL}/api/admin/products/price-update`,
    schedule: "daily",
    dailyHour: 6,
    dailyMinute: 0,
    enabled: true,
  },
  {
    name: "daily-summary",
    url: getFunctionUrl("daily-summary"),
    schedule: "daily",
    dailyHour: 8,
    dailyMinute: 0,
    enabled: true,
  },
];

// ---------- Time Helpers ----------

function getIST(): Date {
  // Israel Standard Time = UTC+2 (or UTC+3 during DST)
  const now = new Date();
  const utcOffset = now.getTimezoneOffset() * 60000;
  const istOffset = 2 * 60 * 60000; // UTC+2 (standard)

  // Simple DST check for Israel (last Friday in March to last Sunday in October)
  const month = now.getUTCMonth();
  const isDST = month >= 2 && month <= 9; // Approximate

  const offset = isDST ? 3 * 60 * 60000 : istOffset;
  return new Date(now.getTime() + utcOffset + offset);
}

function shouldRunTask(task: ScheduledTask, ist: Date): boolean {
  const hour = ist.getHours();
  const minute = ist.getMinutes();

  switch (task.schedule) {
    case "every30min":
      return true; // Always run

    case "every6h":
      return hour % 6 === 0 && minute < 30; // Run at 0, 6, 12, 18 IST

    case "daily":
      return (
        hour === (task.dailyHour || 0) &&
        minute >= (task.dailyMinute || 0) &&
        minute < (task.dailyMinute || 0) + 30
      );

    default:
      return false;
  }
}

// ---------- Task Executor ----------

async function executeTask(task: ScheduledTask): Promise<{
  name: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  durationMs: number;
}> {
  const startTime = Date.now();

  return new Promise((resolve) => {
    try {
      const urlObj = new URL(task.url);
      const options = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Scheduler-Source": "shipmate-dispatcher",
        },
        timeout: 60000,
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk: string) => (data += chunk));
        res.on("end", () => {
          resolve({
            name: task.name,
            success: (res.statusCode || 500) < 400,
            statusCode: res.statusCode,
            durationMs: Date.now() - startTime,
          });
        });
      });

      req.on("error", (error: Error) => {
        resolve({
          name: task.name,
          success: false,
          error: error.message,
          durationMs: Date.now() - startTime,
        });
      });

      req.on("timeout", () => {
        req.destroy();
        resolve({
          name: task.name,
          success: false,
          error: "Timeout",
          durationMs: Date.now() - startTime,
        });
      });

      req.write(JSON.stringify({ source: "scheduler-dispatcher", timestamp: new Date().toISOString() }));
      req.end();
    } catch (error) {
      resolve({
        name: task.name,
        success: false,
        error: String(error),
        durationMs: Date.now() - startTime,
      });
    }
  });
}

// ---------- Main Handler ----------

export async function schedulerDispatcher(
  _req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const startTime = Date.now();
  const ist = getIST();

  console.log(`Scheduler dispatcher started at IST: ${ist.toISOString()}`);
  console.log(`IST time: ${ist.getHours()}:${String(ist.getMinutes()).padStart(2, "0")}`);

  // Determine which tasks to run
  const tasksToRun = tasks.filter(
    (task) => task.enabled && shouldRunTask(task, ist)
  );

  console.log(`Tasks to run: ${tasksToRun.map((t) => t.name).join(", ") || "none"}`);

  // Execute tasks in parallel
  const results = await Promise.all(tasksToRun.map(executeTask));

  // Log results
  for (const result of results) {
    if (result.success) {
      console.log(`✅ ${result.name}: ${result.statusCode} (${result.durationMs}ms)`);
    } else {
      console.error(`❌ ${result.name}: ${result.error || result.statusCode} (${result.durationMs}ms)`);
    }
  }

  const response = {
    success: true,
    timestamp: new Date().toISOString(),
    istTime: `${ist.getHours()}:${String(ist.getMinutes()).padStart(2, "0")}`,
    tasksScheduled: tasksToRun.length,
    results,
    totalDurationMs: Date.now() - startTime,
  };

  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(response));
}

// Export for Cloud Functions
exports.schedulerDispatcher = schedulerDispatcher;
