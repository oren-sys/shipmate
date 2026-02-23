import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/firebase";

/**
 * AliExpress Integration Status Check
 * GET /api/admin/aliexpress/status
 *
 * Returns diagnostic info about the AliExpress API connection.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appKey = process.env.ALIEXPRESS_APP_KEY || "";
  const appSecret = process.env.ALIEXPRESS_APP_SECRET || "";

  // Check OAuth token in Firestore
  let accessToken: string | null = null;
  let tokenError: string | null = null;
  try {
    const db = getDb();
    const doc = await db.collection("settings").doc("aliexpress").get();
    if (doc.exists) {
      const data = doc.data();
      accessToken = data?.accessToken || null;
    }
  } catch (err: unknown) {
    tokenError = err instanceof Error ? err.message : String(err);
  }

  // Test API call
  let apiTestResult: unknown = null;
  let apiTestError: string | null = null;
  try {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").substring(0, 14);
    const params = new URLSearchParams({
      app_key: appKey,
      timestamp,
      sign_method: "hmac-sha256",
      method: "aliexpress.affiliate.hotproduct.query",
      page_no: "1",
      page_size: "1",
      target_currency: "USD",
      target_language: "EN",
    });

    if (accessToken) {
      params.set("access_token", accessToken);
    }

    // Generate signature
    let sign = "no-secret";
    if (appSecret) {
      const sortedEntries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
      const signString = sortedEntries.map(([k, v]) => `${k}${v}`).join("");
      const { createHmac } = await import("crypto");
      const hmac = createHmac("sha256", appSecret);
      hmac.update(signString);
      sign = hmac.digest("hex").toUpperCase();
    }
    params.set("sign", sign);

    const response = await fetch(`https://api-sg.aliexpress.com/sync?${params.toString()}`);
    const text = await response.text();

    try {
      apiTestResult = JSON.parse(text);
    } catch {
      apiTestResult = text.substring(0, 1000);
    }
  } catch (err: unknown) {
    apiTestError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json({
    credentials: {
      appKey: appKey ? `${appKey.substring(0, 3)}***` : "NOT SET",
      appKeyRaw: appKey,  // temporary for debugging
      appSecret: appSecret ? `${appSecret.substring(0, 4)}***` : "NOT SET",
      appSecretLength: appSecret.length,
    },
    oauthToken: {
      hasToken: !!accessToken,
      tokenPreview: accessToken ? `${accessToken.substring(0, 10)}...` : null,
      error: tokenError,
    },
    apiTest: {
      result: apiTestResult,
      error: apiTestError,
    },
  });
}
