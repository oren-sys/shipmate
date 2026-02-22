import { redirect } from "next/navigation";
import { getDb } from "@/lib/firebase";

/**
 * AliExpress OAuth Callback Page
 *
 * URL: /callback
 *
 * AliExpress redirects here after the user authorizes the app.
 * Receives ?code=XXX and exchanges it for an access token,
 * which is stored in Firestore for future API calls.
 */

const AE_APP_KEY = process.env.ALIEXPRESS_APP_KEY || "528274";
const AE_APP_SECRET = process.env.ALIEXPRESS_APP_SECRET || "";

export const dynamic = "force-dynamic";

async function exchangeCodeForToken(code: string) {
  // Build the token request to AliExpress
  const { createHmac } = await import("crypto");

  const timestamp = new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);

  const params = new URLSearchParams({
    app_key: AE_APP_KEY,
    timestamp,
    sign_method: "hmac-sha256",
    code,
    method: "taobao.top.auth.token.create",
  });

  // Generate HMAC signature
  const sortedEntries = Array.from(params.entries()).sort(([a], [b]) =>
    a.localeCompare(b)
  );
  const signString = sortedEntries.map(([k, v]) => `${k}${v}`).join("");
  const hmac = createHmac("sha256", AE_APP_SECRET);
  hmac.update(signString);
  const sign = hmac.digest("hex").toUpperCase();

  params.append("sign", sign);

  // Call AliExpress API
  const response = await fetch(
    `https://api-sg.aliexpress.com/sync?${params.toString()}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }
  );

  const data = await response.json();
  return data;
}

interface CallbackPageProps {
  searchParams: { code?: string; state?: string; sp?: string; error?: string };
}

export default async function CallbackPage({ searchParams }: CallbackPageProps) {
  const { code, error } = searchParams;

  // If there's an error or no code, show error page
  if (error || !code) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cream"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-charcoal mb-2">
            ההרשאה נכשלה
          </h1>
          <p className="text-charcoal-light mb-6">
            {error || "לא התקבל קוד הרשאה מ-AliExpress"}
          </p>
          <a
            href="/admin"
            className="inline-block bg-coral text-white px-6 py-3 rounded-lg font-medium hover:bg-coral/90 transition"
          >
            חזרה לניהול
          </a>
        </div>
      </div>
    );
  }

  // Exchange code for token
  let tokenResult: Record<string, unknown> | null = null;
  let tokenError: string | null = null;

  try {
    tokenResult = await exchangeCodeForToken(code);

    // Check for API error
    if (
      tokenResult?.error_response ||
      !tokenResult?.token_result
    ) {
      tokenError =
        (tokenResult?.error_response as Record<string, string>)?.msg ||
        JSON.stringify(tokenResult);
    } else {
      // Parse the token_result (it comes as a JSON string)
      const tokenData =
        typeof tokenResult.token_result === "string"
          ? JSON.parse(tokenResult.token_result)
          : tokenResult.token_result;

      // Store token in Firestore
      const db = getDb();
      await db
        .collection("settings")
        .doc("aliexpress")
        .set(
          {
            accessToken: tokenData.access_token || "",
            refreshToken: tokenData.refresh_token || "",
            expiresIn: tokenData.expire_time || tokenData.expires_in || 0,
            refreshExpiresIn:
              tokenData.refresh_token_valid_time ||
              tokenData.refresh_expires_in ||
              0,
            userId: tokenData.user_id || "",
            accountPlatform: tokenData.account_platform || "ae",
            grantedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
    }
  } catch (err) {
    tokenError = err instanceof Error ? err.message : "Unknown error";
  }

  // If token exchange failed, show error
  if (tokenError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-cream"
        dir="rtl"
      >
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-charcoal mb-2">
            שגיאה בחילופי טוקן
          </h1>
          <p className="text-charcoal-light mb-4 text-sm break-all">
            {tokenError}
          </p>
          <a
            href="/admin"
            className="inline-block bg-coral text-white px-6 py-3 rounded-lg font-medium hover:bg-coral/90 transition"
          >
            חזרה לניהול
          </a>
        </div>
      </div>
    );
  }

  // Success — redirect to admin
  redirect("/admin?aliexpress=connected");
}
