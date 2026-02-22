import { CloudTasksClient } from "@google-cloud/tasks";

const client = new CloudTasksClient();
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214";
const REGION = "me-west1";
const BASE_URL = process.env.BASE_URL || "https://shipmate.store";

export async function enqueueTask(
  queue: string,
  path: string,
  payload: Record<string, any>,
  delaySeconds?: number
): Promise<void> {
  const parent = client.queuePath(PROJECT, REGION, queue);

  const task: any = {
    httpRequest: {
      httpMethod: "POST" as const,
      url: `${BASE_URL}${path}`,
      headers: { "Content-Type": "application/json" },
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
    },
  };

  if (delaySeconds) {
    task.scheduleTime = {
      seconds: Math.floor(Date.now() / 1000) + delaySeconds,
    };
  }

  await client.createTask({ parent, task });
}

export const QUEUES = {
  orderProcessing: "order-processing",
  imageProcessing: "image-processing",
  notifications: "notifications",
};
