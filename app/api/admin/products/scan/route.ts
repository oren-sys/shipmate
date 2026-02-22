import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AE_CATEGORIES } from "@/lib/aliexpress/categories";

/**
 * AliExpress Trending Product Scanner API
 *
 * POST /api/admin/products/scan
 *
 * Scans AliExpress for hot/trending products by category.
 * Uses AliExpress Affiliate API — aliexpress.affiliate.hotproduct.query
 *
 * Body: { categoryId?: string, count: number, page?: number }
 */

const AE_APP_KEY = process.env.ALIEXPRESS_APP_KEY || "528274";
const AE_APP_SECRET = process.env.ALIEXPRESS_APP_SECRET || "";
const AE_API_BASE = "https://api-sg.aliexpress.com/sync";

/* ── Price calculator ── */
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

/* ── HMAC-SHA256 Signature ── */
async function generateSign(params: URLSearchParams, secret: string): Promise<string> {
  if (!secret) return "dev-placeholder-sign";

  const sortedEntries = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
  const signString = sortedEntries.map(([k, v]) => `${k}${v}`).join("");

  const { createHmac } = await import("crypto");
  const hmac = createHmac("sha256", secret);
  hmac.update(signString);
  return hmac.digest("hex").toUpperCase();
}

/* ── Translate to Hebrew using GCP ── */
async function translateToHebrew(text: string): Promise<string> {
  try {
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

/* ── Fetch hot products from AliExpress API ── */
async function fetchHotProducts(categoryId: string, count: number, page: number) {
  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").substring(0, 14);

  const params = new URLSearchParams({
    app_key: AE_APP_KEY,
    timestamp,
    sign_method: "hmac-sha256",
    method: "aliexpress.affiliate.hotproduct.query",
    category_ids: categoryId,
    page_no: String(page),
    page_size: String(Math.min(count, 50)),
    target_currency: "USD",
    target_language: "EN",
    sort: "SALE_PRICE_ASC",
    fields:
      "product_id,product_title,product_main_image_url,product_small_image_urls,original_price,sale_price,discount,evaluate_rate,lastest_volume,commission_rate,shop_url",
  });

  const sign = await generateSign(params, AE_APP_SECRET);
  params.set("sign", sign);

  const response = await fetch(`${AE_API_BASE}?${params.toString()}`);

  if (!response.ok) {
    console.error("AliExpress API error:", response.status, await response.text());
    return null;
  }

  const data = await response.json();
  return data?.aliexpress_affiliate_hotproduct_query_resp?.resp_result?.result;
}

/* ── POST Handler ── */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { categoryId, count = 10, page = 1, autoTranslate = true } = await req.json();

    // Validate
    if (count < 1 || count > 50) {
      return NextResponse.json({ error: "Count must be 1-50" }, { status: 400 });
    }

    const aeCategoryId = categoryId
      ? AE_CATEGORIES[categoryId]?.id || categoryId
      : "";

    // Fetch from AliExpress
    const result = await fetchHotProducts(aeCategoryId, count, page);

    if (!result || !result.products) {
      // Return fallback products for development / if API is unreachable
      const fallbackProducts = generateFallbackProducts(count, categoryId);
      return NextResponse.json({
        products: fallbackProducts,
        totalCount: fallbackProducts.length,
        currentPage: page,
        source: "fallback",
      });
    }

    const products = [];
    const rawProducts = Array.isArray(result.products)
      ? result.products
      : result.products.product || [];

    for (const p of rawProducts.slice(0, count)) {
      const costPrice = parseFloat(
        p.sale_price?.amount || p.original_price?.amount || "10"
      );
      const originalPrice = parseFloat(p.original_price?.amount || String(costPrice));
      const { price, compareAt } = calculatePrice(costPrice);

      // Collect images
      const images: string[] = [];
      if (p.product_main_image_url) images.push(p.product_main_image_url);
      if (p.product_small_image_urls?.string) {
        images.push(
          ...p.product_small_image_urls.string.filter(
            (img: string) => img !== p.product_main_image_url
          )
        );
      }

      let titleHe = "";
      if (autoTranslate && p.product_title) {
        try {
          titleHe = await translateToHebrew(p.product_title);
        } catch {
          titleHe = "";
        }
      }

      products.push({
        aliexpressId: String(p.product_id),
        titleEn: p.product_title || "AliExpress Product",
        titleHe,
        descriptionEn: p.product_title || "",
        costPriceUSD: costPrice,
        originalPriceUSD: originalPrice,
        priceILS: price,
        compareAtILS: compareAt,
        discount: p.discount || "",
        images,
        salesVolume: p.lastest_volume || 0,
        rating: p.evaluate_rate ? parseFloat(p.evaluate_rate) : 0,
        commissionRate: p.commission_rate || "",
        aliexpressUrl: `https://www.aliexpress.com/item/${p.product_id}.html`,
        category: categoryId || "",
      });
    }

    return NextResponse.json({
      products,
      totalCount: result.total_record_count || products.length,
      currentPage: page,
      source: "aliexpress",
    });
  } catch (error) {
    console.error("Scan error:", error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}

/* ── GET: Return available categories ── */
export async function GET() {
  const categories = Object.entries(AE_CATEGORIES).map(([key, val]) => ({
    id: key,
    aliexpressId: val.id,
    nameEn: val.nameEn,
    nameHe: val.nameHe,
  }));

  return NextResponse.json({ categories });
}

/* ── Fallback products for dev/testing ── */
function generateFallbackProducts(count: number, categoryId?: string) {
  const sampleProducts = [
    { title: "Wireless Bluetooth Earbuds TWS", cost: 8.5, sales: 15420, rating: 4.8 },
    { title: "Smart Watch Fitness Tracker Waterproof", cost: 12.9, sales: 8930, rating: 4.6 },
    { title: "LED Strip Light RGB 5M Remote Control", cost: 4.2, sales: 22100, rating: 4.7 },
    { title: "Portable Mini Projector HD 1080P", cost: 38.5, sales: 3200, rating: 4.5 },
    { title: "USB Rechargeable Portable Blender", cost: 9.8, sales: 18700, rating: 4.9 },
    { title: "Magnetic Phone Holder Car Mount", cost: 3.5, sales: 31200, rating: 4.4 },
    { title: "Ring Light LED Selfie Streaming 10 inch", cost: 7.2, sales: 9800, rating: 4.6 },
    { title: "Wireless Charger Fast 15W Pad", cost: 5.5, sales: 14300, rating: 4.5 },
    { title: "Electric Neck Massager Pulse", cost: 11.2, sales: 6700, rating: 4.7 },
    { title: "Solar Power Bank 20000mAh", cost: 15.8, sales: 5400, rating: 4.3 },
    { title: "Mini Drone Camera 4K Foldable", cost: 28.9, sales: 4100, rating: 4.4 },
    { title: "Automatic Soap Dispenser Touchless", cost: 6.8, sales: 11200, rating: 4.6 },
    { title: "Bluetooth Speaker Waterproof Portable", cost: 9.5, sales: 13600, rating: 4.5 },
    { title: "LED Desk Lamp Touch Dimmable", cost: 8.3, sales: 7800, rating: 4.7 },
    { title: "Air Purifier Mini USB Desktop", cost: 12.5, sales: 4900, rating: 4.3 },
    { title: "Electric Toothbrush Sonic Rechargeable", cost: 7.9, sales: 16200, rating: 4.8 },
    { title: "WiFi Smart Plug Socket Remote Control", cost: 4.8, sales: 21500, rating: 4.4 },
    { title: "Foldable Laptop Stand Adjustable", cost: 6.2, sales: 9100, rating: 4.6 },
    { title: "Reusable Water Bottle Stainless Steel", cost: 5.3, sales: 19800, rating: 4.5 },
    { title: "Night Light Projector Star Galaxy", cost: 11.7, sales: 8200, rating: 4.7 },
  ];

  return sampleProducts.slice(0, count).map((p, i) => {
    const { price, compareAt } = calculatePrice(p.cost);
    return {
      aliexpressId: `fallback-${categoryId || "all"}-${i}`,
      titleEn: p.title,
      titleHe: "",
      descriptionEn: `High quality ${p.title.toLowerCase()}. Free shipping worldwide.`,
      costPriceUSD: p.cost,
      originalPriceUSD: p.cost * 1.3,
      priceILS: price,
      compareAtILS: compareAt,
      discount: "30%",
      images: [],
      salesVolume: p.sales,
      rating: p.rating,
      commissionRate: "3%",
      aliexpressUrl: `https://www.aliexpress.com/item/${1000000000 + i}.html`,
      category: categoryId || "",
    };
  });
}
