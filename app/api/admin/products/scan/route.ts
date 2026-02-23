import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AE_CATEGORIES, AE_DEFAULT_FEED } from "@/lib/aliexpress/categories";

/**
 * AliExpress Trending Product Scanner API
 *
 * POST /api/admin/products/scan
 *
 * Scans AliExpress for hot/trending products by category.
 * Uses AliExpress Dropshipping API — aliexpress.ds.recommend.feed.get
 *
 * Body: { categoryId?: string, count: number, page?: number }
 */

const AE_APP_KEY = process.env.ALIEXPRESS_APP_KEY || "";
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

/* ── Fetch products from AliExpress Dropshipping API ── */
async function fetchDSProducts(feedName: string, count: number, page: number) {
  if (!AE_APP_KEY || !AE_APP_SECRET) {
    console.error("[AliExpress Scanner] Missing APP_KEY or APP_SECRET");
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[-:T]/g, "").substring(0, 14);

  const params = new URLSearchParams({
    app_key: AE_APP_KEY,
    timestamp,
    sign_method: "hmac-sha256",
    method: "aliexpress.ds.recommend.feed.get",
    feed_name: feedName,
    page_no: String(page),
    page_size: String(Math.min(count, 50)),
    target_currency: "USD",
    target_language: "EN",
    country: "IL",
  });

  const sign = await generateSign(params, AE_APP_SECRET);
  params.set("sign", sign);

  console.log(`[AliExpress Scanner] Fetching feed=${feedName}, count=${count}, page=${page}`);

  const response = await fetch(`${AE_API_BASE}?${params.toString()}`);

  // Read as text first for safe parsing
  const text = await response.text();

  if (!response.ok) {
    console.error("[AliExpress Scanner] HTTP error:", response.status, text.substring(0, 500));
    return null;
  }

  if (!text || text.trim().length === 0) {
    console.error("[AliExpress Scanner] Empty response");
    return null;
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("[AliExpress Scanner] Non-JSON response:", text.substring(0, 500));
    return null;
  }

  // Check for API-level errors
  if (data.error_response) {
    console.error("[AliExpress Scanner] API error:", JSON.stringify(data.error_response));
    return null;
  }

  const result = data?.aliexpress_ds_recommend_feed_get_response?.result;

  if (!result) {
    console.error("[AliExpress Scanner] No result in response:", JSON.stringify(data).substring(0, 500));
    return null;
  }

  return result;
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

    // Get the feed name for this category
    const feedName = categoryId && AE_CATEGORIES[categoryId]
      ? AE_CATEGORIES[categoryId].feedName
      : AE_DEFAULT_FEED;

    // Fetch from AliExpress DS API
    const result = await fetchDSProducts(feedName, count, page);

    if (!result || !result.products) {
      const fallbackProducts = generateFallbackProducts(count, categoryId);
      return NextResponse.json({
        products: fallbackProducts,
        totalCount: fallbackProducts.length,
        currentPage: page,
        source: "fallback",
        message: "AliExpress API לא זמין כרגע — מוצגים מוצרים לדוגמה",
      });
    }

    const products = [];
    const rawProducts = Array.isArray(result.products)
      ? result.products
      : result.products.traffic_product_d_t_o || [];

    for (const p of rawProducts.slice(0, count)) {
      const costPrice = parseFloat(
        p.target_sale_price || p.sale_price || p.original_price || "10"
      );
      const originalPrice = parseFloat(
        p.target_original_price || p.original_price || String(costPrice)
      );
      const { price, compareAt } = calculatePrice(costPrice);

      // Collect images
      const images: string[] = [];
      if (p.product_main_image_url) images.push(p.product_main_image_url);
      if (p.product_small_image_urls?.productSmallImageUrl) {
        images.push(
          ...p.product_small_image_urls.productSmallImageUrl.filter(
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
        commissionRate: "",
        aliexpressUrl: p.product_detail_url || `https://www.aliexpress.com/item/${p.product_id}.html`,
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
    feedName: val.feedName,
    nameEn: val.nameEn,
    nameHe: val.nameHe,
  }));

  return NextResponse.json({ categories });
}

/* ── Category-specific fallback products ── */
const CATEGORY_PRODUCTS: Record<string, { title: string; cost: number; sales: number; rating: number }[]> = {
  electronics: [
    { title: "Wireless Bluetooth Earbuds TWS", cost: 8.5, sales: 15420, rating: 4.8 },
    { title: "Smart Watch Fitness Tracker Waterproof", cost: 12.9, sales: 8930, rating: 4.6 },
    { title: "Wireless Charger Fast 15W Pad", cost: 5.5, sales: 14300, rating: 4.5 },
    { title: "Solar Power Bank 20000mAh", cost: 15.8, sales: 5400, rating: 4.3 },
    { title: "Mini Drone Camera 4K Foldable", cost: 28.9, sales: 4100, rating: 4.4 },
  ],
  fashion: [
    { title: "Oversized Vintage Sunglasses UV400", cost: 3.2, sales: 28400, rating: 4.5 },
    { title: "Canvas Crossbody Bag Casual", cost: 7.8, sales: 12300, rating: 4.4 },
    { title: "Anti-Theft Backpack USB Charging", cost: 15.5, sales: 9800, rating: 4.6 },
  ],
  home: [
    { title: "LED Strip Light RGB 5M Remote Control", cost: 4.2, sales: 22100, rating: 4.7 },
    { title: "Automatic Soap Dispenser Touchless", cost: 6.8, sales: 11200, rating: 4.6 },
    { title: "LED Desk Lamp Touch Dimmable", cost: 8.3, sales: 7800, rating: 4.7 },
  ],
  beauty: [
    { title: "Electric Face Massager Roller", cost: 6.5, sales: 18900, rating: 4.7 },
    { title: "LED Face Mask Light Therapy", cost: 15.8, sales: 7200, rating: 4.5 },
  ],
  kids: [
    { title: "Kids Drawing Tablet LCD Writing Pad", cost: 5.2, sales: 22400, rating: 4.7 },
    { title: "Baby Nail Trimmer Electric Safe", cost: 4.8, sales: 19500, rating: 4.7 },
  ],
  gadgets: [
    { title: "Magnetic Phone Holder Car Mount", cost: 3.5, sales: 31200, rating: 4.4 },
    { title: "USB Rechargeable Portable Blender", cost: 9.8, sales: 18700, rating: 4.9 },
  ],
  sports: [
    { title: "Resistance Bands Set Exercise 5pcs", cost: 4.2, sales: 26800, rating: 4.6 },
    { title: "Yoga Mat Non-Slip Thick 10mm", cost: 8.5, sales: 15400, rating: 4.5 },
  ],
  auto: [
    { title: "Car Vacuum Cleaner Portable Handheld", cost: 12.5, sales: 9800, rating: 4.5 },
    { title: "Dash Cam 1080P Night Vision", cost: 18.9, sales: 7200, rating: 4.6 },
  ],
  jewelry: [
    { title: "Sterling Silver Necklace Chain", cost: 5.8, sales: 18200, rating: 4.6 },
    { title: "Cubic Zirconia Stud Earrings", cost: 3.2, sales: 26400, rating: 4.5 },
  ],
  toys: [
    { title: "RC Car Off-Road Remote Control", cost: 12.5, sales: 11200, rating: 4.5 },
    { title: "Building Blocks Set Creative 1000pcs", cost: 8.5, sales: 15800, rating: 4.7 },
  ],
};

/* ── Fallback products for dev/testing (category-specific) ── */
function generateFallbackProducts(count: number, categoryId?: string) {
  const sampleProducts = categoryId && CATEGORY_PRODUCTS[categoryId]
    ? CATEGORY_PRODUCTS[categoryId]
    : [
        ...Object.values(CATEGORY_PRODUCTS).flatMap((products) => products.slice(0, 2)),
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
