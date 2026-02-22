/**
 * Facebook Page Auto-Poster
 *
 * Posts viral Hebrew content to the ShipMate Facebook page
 * when a new product is created.
 *
 * Uses Facebook Graph API v21.0
 * Requires FACEBOOK_PAGE_TOKEN env var
 */

import { getDb } from "@/lib/firebase";
import { generateFacebookPost, type ProductInput } from "./viral-generator";

const GRAPH_API = "https://graph.facebook.com/v21.0";

interface FacebookPostResponse {
  id: string;
}

interface FacebookError {
  error: {
    message: string;
    type: string;
    code: number;
  };
}

/**
 * Post a message to the Facebook Page feed
 */
export async function postToFacebookPage(
  message: string,
  link?: string
): Promise<{ success: boolean; postId?: string; error?: string }> {
  const token = process.env.FACEBOOK_PAGE_TOKEN;

  if (!token) {
    console.warn("FACEBOOK_PAGE_TOKEN not set — skipping Facebook post");
    return { success: false, error: "FACEBOOK_PAGE_TOKEN not configured" };
  }

  try {
    const body: Record<string, string> = {
      message,
      access_token: token,
    };

    if (link) {
      body.link = link;
    }

    const res = await fetch(`${GRAPH_API}/me/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      const fbError = data as FacebookError;
      console.error("Facebook post failed:", fbError.error?.message);
      return {
        success: false,
        error: fbError.error?.message || "Unknown Facebook error",
      };
    }

    const result = data as FacebookPostResponse;
    console.log("Facebook post published:", result.id);
    return { success: true, postId: result.id };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("Facebook post error:", msg);
    return { success: false, error: msg };
  }
}

/**
 * Generate viral content + post to Facebook + save to Firestore
 *
 * Called automatically when a new product is created.
 */
export async function autoPostProduct(
  product: ProductInput & { id?: string; slug?: string; image?: string }
): Promise<{ success: boolean; postId?: string; viralPostId?: string }> {
  // 1. Generate viral Hebrew content
  const viral = generateFacebookPost(product);
  const hashtags = viral.hashtags.map((h) => `#${h}`).join(" ");
  const fullMessage = `${viral.caption}\n\n${hashtags}`;

  // 2. Build product link
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://shipmate.store";
  const productLink = product.slug
    ? `${baseUrl}/product/${product.slug}`
    : baseUrl;

  // 3. Post to Facebook
  const result = await postToFacebookPage(fullMessage, productLink);

  // 4. Save to Firestore viralPosts collection
  const db = getDb();
  const ref = db.collection("viralPosts").doc();

  await ref.set({
    platform: "facebook",
    productId: product.id || null,
    caption: fullMessage,
    hashtags: viral.hashtags,
    productLink,
    facebookPostId: result.postId || null,
    status: result.success ? "posted" : "failed",
    error: result.error || null,
    engagement: { likes: 0, shares: 0, comments: 0 },
    createdAt: new Date().toISOString(),
  });

  console.log(
    `Viral post ${ref.id}: ${result.success ? "✅ posted" : "❌ failed"} for product "${product.titleHe}"`
  );

  return {
    success: result.success,
    postId: result.postId,
    viralPostId: ref.id,
  };
}
