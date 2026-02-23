import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/firebase";

/**
 * AliExpress Product Import API
 *
 * POST /api/admin/products/import
 *
 * Uses AliExpress Affiliate API to fetch product data.
 * AppKey and Secret from environment variables.
 *
 * Body: { urls: string[], autoTranslate: boolean }
 */

const AE_APP_KEY = process.env.ALIEXPRESS_APP_KEY || "";
const AE_APP_SECRET = process.env.ALIEXPRESS_APP_SECRET || "";
const AE_API_BASE = "https://api-sg.aliexpress.com/sync";

/* ── Read stored OAuth access token from Firestore ── */
async function getAccessToken(): Promise<string | null> {
  try {
    const db = getDb();
    const doc = await db.collection("settings").doc("aliexpress").get();
    if (!doc.exists) return null;
    const data = doc.data();
    return data?.accessToken || null;
  } catch (error) {
    console.error("[AliExpress Import] Failed to read access token:", error);
    return null;
  }
}

// Tiered markup pricing
function calculatePrice(costUSD: number, exchangeRate: number = 3.6) {
  let markup: number;
  if (costUSD < 5) markup = 3.0;
  else if (costUSD <= 15) markup = 2.5;
  else markup = 2.0;

  const costILS = costUSD * exchangeRate;
  const basePrice = costILS * markup;
  const withVAT = basePrice * 1.17;
  const price = Math.ceil(withVAT / 10) * 10 - 0.1;
  const compareAt = Math.ceil((price * 1.3) / 10) * 10 - 0.1;

  return { price, compareAt };
}

// Extract product ID from various AliExpress URL formats
function extractProductId(url: string): string | null {
  const patterns = [
    /\/item\/(\d+)\.html/,
    /\/item\/(\d+)/,
    /productId=(\d+)/,
    /\/(\d{10,})(?:\.html)?/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { urls, autoTranslate = true } = await req.json();

    if (!Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "No URLs provided" },
        { status: 400 }
      );
    }

    if (urls.length > 20) {
      return NextResponse.json(
        { error: "Maximum 20 products per import" },
        { status: 400 }
      );
    }

    const products = [];

    for (const url of urls) {
      try {
        const productId = extractProductId(url);
        if (!productId) {
          console.warn("Could not extract product ID from:", url);
          continue;
        }

        const accessToken = await getAccessToken();
        const productData = await fetchAliExpressProduct(productId, accessToken);

        if (productData) {
          const { price, compareAt } = calculatePrice(productData.costPrice);

          let titleHe = "";
          if (autoTranslate && productData.titleEn) {
            titleHe = await translateToHebrew(productData.titleEn);
          }

          products.push({
            titleEn: productData.titleEn,
            titleHe,
            descriptionEn: productData.descriptionEn,
            costPrice: productData.costPrice,
            price,
            compareAtPrice: compareAt,
            images: productData.images,
            aliexpressUrl: url,
            aliexpressId: productId,
            category: "",
            status: "draft",
          });
        }
      } catch (err) {
        console.error("Error processing URL:", url, err);
      }
    }

    return NextResponse.json({ products, count: products.length });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Import failed" },
      { status: 500 }
    );
  }
}

/**
 * Fetch product details from AliExpress Dropshipping API
 * Uses aliexpress.ds.product.get (requires access_token)
 */
async function fetchAliExpressProduct(productId: string, accessToken?: string | null) {
  try {
    const timestamp = new Date().toISOString().replace(/[-:T]/g, "").substring(0, 14);

    const params = new URLSearchParams({
      app_key: AE_APP_KEY,
      timestamp,
      sign_method: "hmac-sha256",
      method: "aliexpress.ds.product.get",
      product_id: productId,
      target_currency: "USD",
      target_language: "EN",
      country: "IL",
    });

    // Access token is required for DS product detail
    if (accessToken) {
      params.set("access_token", accessToken);
    } else {
      console.warn("[AliExpress Import] No access token — ds.product.get requires OAuth");
      return getFallbackProduct(productId);
    }

    // Generate API signature
    const sign = await generateSign(params, AE_APP_SECRET);
    params.set("sign", sign);

    const response = await fetch(`${AE_API_BASE}?${params.toString()}`);
    const text = await response.text();

    if (!response.ok) {
      console.error("[AliExpress Import] HTTP error:", response.status, text.substring(0, 500));
      return getFallbackProduct(productId);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error("[AliExpress Import] Non-JSON response:", text.substring(0, 500));
      return getFallbackProduct(productId);
    }

    if (data.error_response) {
      console.error("[AliExpress Import] API error:", JSON.stringify(data.error_response));
      return getFallbackProduct(productId);
    }

    const product = data?.aliexpress_ds_product_get_response?.result;

    if (!product) {
      return getFallbackProduct(productId);
    }

    // DS API returns images in a different structure
    const images: string[] = [];
    if (product.ae_multimedia_info_dto?.image_urls) {
      images.push(...product.ae_multimedia_info_dto.image_urls.split(";").filter(Boolean));
    }

    // Get price from SKU info
    let costPrice = 10;
    const skuList = product.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o;
    if (skuList && skuList.length > 0) {
      costPrice = parseFloat(skuList[0].offer_sale_price || skuList[0].sku_price || "10");
    }

    return {
      titleEn: product.ae_item_base_info_dto?.subject || "AliExpress Product",
      descriptionEn: product.ae_item_base_info_dto?.detail || product.ae_item_base_info_dto?.subject || "",
      costPrice,
      images,
    };
  } catch (error) {
    console.error("[AliExpress Import] Error:", error);
    return getFallbackProduct(productId);
  }
}

/**
 * Generate HMAC-SHA256 signature for AliExpress API
 */
async function generateSign(params: URLSearchParams, secret: string): Promise<string> {
  if (!secret) return "dev-placeholder-sign";

  // Sort parameters alphabetically
  const sortedEntries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const signString = sortedEntries.map(([k, v]) => `${k}${v}`).join("");

  // HMAC-SHA256 in Node.js
  const { createHmac } = await import("crypto");
  const hmac = createHmac("sha256", secret);
  hmac.update(signString);
  return hmac.digest("hex").toUpperCase();
}

/**
 * Translate text to Hebrew using Google Translate API
 */
async function translateToHebrew(text: string): Promise<string> {
  try {
    const projectId = process.env.GCP_PROJECT_ID || "dropship-488214";
    const url = `https://translation.googleapis.com/language/translate/v2`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: "he",
        format: "text",
        key: process.env.GOOGLE_TRANSLATE_API_KEY || "",
      }),
    });

    if (!res.ok) return text;

    const data = await res.json();
    return data?.data?.translations?.[0]?.translatedText || text;
  } catch {
    return text;
  }
}

/**
 * Fallback product for development (when API unavailable)
 */
function getFallbackProduct(productId: string) {
  return {
    titleEn: `AliExpress Product #${productId}`,
    descriptionEn: "Product imported from AliExpress. Edit description in Hebrew.",
    costPrice: 8 + Math.random() * 20,
    images: [],
  };
}
