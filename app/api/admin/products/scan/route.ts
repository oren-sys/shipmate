import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AE_CATEGORIES } from "@/lib/aliexpress/categories";
import { getDb } from "@/lib/firebase";

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

/* ── Read stored OAuth access token from Firestore ── */
async function getAccessToken(): Promise<string | null> {
  try {
    const db = getDb();
    const doc = await db.collection("settings").doc("aliexpress").get();
    if (!doc.exists) return null;
    const data = doc.data();
    return data?.accessToken || null;
  } catch (error) {
    console.error("[AliExpress] Failed to read access token:", error);
    return null;
  }
}

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
async function fetchHotProducts(categoryId: string, count: number, page: number, accessToken?: string | null) {
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

  // Add access token if available (required for authorized API access)
  if (accessToken) {
    params.set("access_token", accessToken);
  }

  const sign = await generateSign(params, AE_APP_SECRET);
  params.set("sign", sign);

  console.log(`[AliExpress Scanner] Fetching category=${categoryId}, count=${count}, page=${page}`);
  const response = await fetch(`${AE_API_BASE}?${params.toString()}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AliExpress API error:", response.status, errorText);
    return null;
  }

  const data = await response.json();
  const result = data?.aliexpress_affiliate_hotproduct_query_resp?.resp_result?.result;

  if (!result) {
    console.error("AliExpress API: No result in response", JSON.stringify(data).substring(0, 500));
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

    const aeCategoryId = categoryId
      ? AE_CATEGORIES[categoryId]?.id || categoryId
      : "";

    // Read stored OAuth access token
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.warn("[AliExpress Scanner] No access token found in Firestore settings/aliexpress");
    }

    // Fetch from AliExpress
    const result = await fetchHotProducts(aeCategoryId, count, page, accessToken);

    if (!result || !result.products) {
      // If no token → tell the user to authorize first
      if (!accessToken) {
        const fallbackProducts = generateFallbackProducts(count, categoryId);
        return NextResponse.json({
          products: fallbackProducts,
          totalCount: fallbackProducts.length,
          currentPage: page,
          source: "no_token",
          message: "יש לחבר את חשבון AliExpress כדי לטעון מוצרים אמיתיים",
        });
      }
      // Token exists but API still failed → fallback
      const fallbackProducts = generateFallbackProducts(count, categoryId);
      return NextResponse.json({
        products: fallbackProducts,
        totalCount: fallbackProducts.length,
        currentPage: page,
        source: "fallback",
        message: "AliExpress API unavailable — showing sample products",
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

/* ── Category-specific fallback products ── */
const CATEGORY_PRODUCTS: Record<string, { title: string; cost: number; sales: number; rating: number }[]> = {
  electronics: [
    { title: "Wireless Bluetooth Earbuds TWS", cost: 8.5, sales: 15420, rating: 4.8 },
    { title: "Smart Watch Fitness Tracker Waterproof", cost: 12.9, sales: 8930, rating: 4.6 },
    { title: "Wireless Charger Fast 15W Pad", cost: 5.5, sales: 14300, rating: 4.5 },
    { title: "Solar Power Bank 20000mAh", cost: 15.8, sales: 5400, rating: 4.3 },
    { title: "Mini Drone Camera 4K Foldable", cost: 28.9, sales: 4100, rating: 4.4 },
    { title: "Bluetooth Speaker Waterproof Portable", cost: 9.5, sales: 13600, rating: 4.5 },
    { title: "Electric Toothbrush Sonic Rechargeable", cost: 7.9, sales: 16200, rating: 4.8 },
    { title: "WiFi Smart Plug Socket Remote Control", cost: 4.8, sales: 21500, rating: 4.4 },
    { title: "USB C Hub Multiport Adapter 8-in-1", cost: 11.2, sales: 7800, rating: 4.6 },
    { title: "Noise Cancelling Headphones Over Ear", cost: 18.5, sales: 6200, rating: 4.7 },
  ],
  fashion: [
    { title: "Oversized Vintage Sunglasses UV400", cost: 3.2, sales: 28400, rating: 4.5 },
    { title: "Canvas Crossbody Bag Casual", cost: 7.8, sales: 12300, rating: 4.4 },
    { title: "Anti-Theft Backpack USB Charging", cost: 15.5, sales: 9800, rating: 4.6 },
    { title: "Stainless Steel Watch Minimalist", cost: 9.9, sales: 11200, rating: 4.3 },
    { title: "Silk Scarf Square Print Elegant", cost: 4.5, sales: 15600, rating: 4.5 },
    { title: "Baseball Cap Embroidered Cotton", cost: 3.8, sales: 22100, rating: 4.4 },
    { title: "Leather Belt Automatic Buckle", cost: 6.2, sales: 18700, rating: 4.6 },
    { title: "Warm Winter Beanie Knitted Hat", cost: 3.5, sales: 19400, rating: 4.3 },
    { title: "Travel Wallet RFID Blocking", cost: 5.8, sales: 13500, rating: 4.7 },
    { title: "Sports Shoes Running Breathable", cost: 14.9, sales: 8900, rating: 4.5 },
  ],
  home: [
    { title: "LED Strip Light RGB 5M Remote Control", cost: 4.2, sales: 22100, rating: 4.7 },
    { title: "Automatic Soap Dispenser Touchless", cost: 6.8, sales: 11200, rating: 4.6 },
    { title: "LED Desk Lamp Touch Dimmable", cost: 8.3, sales: 7800, rating: 4.7 },
    { title: "Air Purifier Mini USB Desktop", cost: 12.5, sales: 4900, rating: 4.3 },
    { title: "Night Light Projector Star Galaxy", cost: 11.7, sales: 8200, rating: 4.7 },
    { title: "Foldable Laptop Stand Adjustable", cost: 6.2, sales: 9100, rating: 4.6 },
    { title: "Kitchen Scale Digital Precision", cost: 4.5, sales: 16800, rating: 4.5 },
    { title: "Plant Pot Self Watering Smart", cost: 5.8, sales: 7600, rating: 4.4 },
    { title: "Vacuum Storage Bags Space Saver", cost: 3.9, sales: 21300, rating: 4.3 },
    { title: "Shower Head Rain High Pressure", cost: 7.2, sales: 14500, rating: 4.6 },
  ],
  beauty: [
    { title: "Electric Face Massager Roller", cost: 6.5, sales: 18900, rating: 4.7 },
    { title: "LED Face Mask Light Therapy", cost: 15.8, sales: 7200, rating: 4.5 },
    { title: "Hair Straightener Brush 2-in-1", cost: 11.2, sales: 9800, rating: 4.6 },
    { title: "Makeup Mirror LED Light Magnifying", cost: 8.3, sales: 12400, rating: 4.4 },
    { title: "Jade Roller Gua Sha Set", cost: 3.8, sales: 25600, rating: 4.5 },
    { title: "Electric Nail File Manicure Set", cost: 7.9, sales: 11300, rating: 4.3 },
    { title: "Facial Steamer Nano Mist Sprayer", cost: 9.5, sales: 8700, rating: 4.6 },
    { title: "Hair Removal IPL Device Home", cost: 22.5, sales: 5400, rating: 4.4 },
    { title: "Makeup Brush Set 12pcs Professional", cost: 5.2, sales: 19800, rating: 4.7 },
    { title: "Eyelash Curler Heated Electric", cost: 4.8, sales: 14200, rating: 4.3 },
  ],
  kids: [
    { title: "Baby Monitor WiFi Camera Night Vision", cost: 18.5, sales: 6800, rating: 4.6 },
    { title: "Kids Drawing Tablet LCD Writing Pad", cost: 5.2, sales: 22400, rating: 4.7 },
    { title: "Stroller Organizer Bag Universal", cost: 6.8, sales: 14200, rating: 4.5 },
    { title: "Baby Bottle Warmer Fast Heating", cost: 9.5, sales: 8900, rating: 4.4 },
    { title: "Children Backpack Dinosaur Cartoon", cost: 7.2, sales: 16800, rating: 4.6 },
    { title: "Baby Safety Gate Door Extra Wide", cost: 15.8, sales: 5600, rating: 4.3 },
    { title: "Kids Play Mat Foam Puzzle", cost: 8.5, sales: 12300, rating: 4.5 },
    { title: "Baby Nail Trimmer Electric Safe", cost: 4.8, sales: 19500, rating: 4.7 },
    { title: "Sippy Cup Stainless Steel Insulated", cost: 5.5, sales: 11200, rating: 4.4 },
    { title: "Baby Car Mirror Back Seat", cost: 6.2, sales: 13800, rating: 4.6 },
  ],
  gadgets: [
    { title: "Magnetic Phone Holder Car Mount", cost: 3.5, sales: 31200, rating: 4.4 },
    { title: "USB Rechargeable Portable Blender", cost: 9.8, sales: 18700, rating: 4.9 },
    { title: "Ring Light LED Selfie Streaming 10 inch", cost: 7.2, sales: 9800, rating: 4.6 },
    { title: "Phone Case MagSafe Compatible Clear", cost: 3.2, sales: 28900, rating: 4.3 },
    { title: "Portable Mini Projector HD 1080P", cost: 38.5, sales: 3200, rating: 4.5 },
    { title: "Screen Protector Tempered Glass", cost: 1.8, sales: 45200, rating: 4.4 },
    { title: "Wireless Keyboard Mouse Combo Mini", cost: 8.5, sales: 11600, rating: 4.5 },
    { title: "Phone Gimbal Stabilizer 3-Axis", cost: 25.8, sales: 4100, rating: 4.7 },
    { title: "Cable Organizer Box Desktop Tidy", cost: 4.5, sales: 16300, rating: 4.3 },
    { title: "Selfie Stick Tripod Bluetooth Remote", cost: 5.8, sales: 21800, rating: 4.6 },
  ],
  sports: [
    { title: "Resistance Bands Set Exercise 5pcs", cost: 4.2, sales: 26800, rating: 4.6 },
    { title: "Yoga Mat Non-Slip Thick 10mm", cost: 8.5, sales: 15400, rating: 4.5 },
    { title: "Jump Rope Speed Bearing Weighted", cost: 3.8, sales: 19200, rating: 4.4 },
    { title: "Gym Gloves Weight Lifting Padded", cost: 5.5, sales: 12100, rating: 4.3 },
    { title: "Water Bottle Sports Large 1L", cost: 4.8, sales: 22500, rating: 4.5 },
    { title: "Fitness Tracker Band Heart Rate", cost: 9.8, sales: 8700, rating: 4.6 },
    { title: "Foam Roller Muscle Massage Deep", cost: 7.2, sales: 11300, rating: 4.7 },
    { title: "Running Armband Phone Holder", cost: 3.2, sales: 18600, rating: 4.3 },
    { title: "Camping Headlamp LED Rechargeable", cost: 5.5, sales: 14200, rating: 4.5 },
    { title: "Bicycle Phone Mount Waterproof", cost: 4.5, sales: 16800, rating: 4.4 },
  ],
  auto: [
    { title: "Car Vacuum Cleaner Portable Handheld", cost: 12.5, sales: 9800, rating: 4.5 },
    { title: "Dash Cam 1080P Night Vision", cost: 18.9, sales: 7200, rating: 4.6 },
    { title: "Car Phone Holder Gravity Auto", cost: 3.5, sales: 28400, rating: 4.4 },
    { title: "Tire Inflator Portable Air Compressor", cost: 15.8, sales: 6100, rating: 4.5 },
    { title: "Car Seat Organizer Back Storage", cost: 5.8, sales: 16300, rating: 4.3 },
    { title: "LED Car Interior Ambient Light Strip", cost: 4.2, sales: 21500, rating: 4.4 },
    { title: "Car Charger USB C Fast PD", cost: 3.2, sales: 25800, rating: 4.6 },
    { title: "Blind Spot Mirror Wide Angle 2pcs", cost: 2.5, sales: 32100, rating: 4.3 },
    { title: "Car Air Freshener Aromatherapy Clip", cost: 3.8, sales: 19200, rating: 4.5 },
    { title: "Steering Wheel Cover Leather", cost: 7.5, sales: 12400, rating: 4.4 },
  ],
  jewelry: [
    { title: "Sterling Silver Necklace Chain", cost: 5.8, sales: 18200, rating: 4.6 },
    { title: "Cubic Zirconia Stud Earrings", cost: 3.2, sales: 26400, rating: 4.5 },
    { title: "Adjustable Ring Gold Plated Set", cost: 4.5, sales: 15800, rating: 4.4 },
    { title: "Pearl Bracelet Elegant Women", cost: 6.2, sales: 12300, rating: 4.6 },
    { title: "Minimalist Watch Women Mesh Band", cost: 8.9, sales: 9200, rating: 4.5 },
    { title: "Anklet Chain Gold Summer Beach", cost: 2.8, sales: 22100, rating: 4.3 },
    { title: "Hair Clip Crystal Rhinestone Set", cost: 3.5, sales: 19600, rating: 4.4 },
    { title: "Pendant Necklace Heart Shaped", cost: 4.8, sales: 16500, rating: 4.7 },
    { title: "Charm Bracelet DIY Beads Silver", cost: 7.5, sales: 11200, rating: 4.5 },
    { title: "Brooch Pin Vintage Elegant", cost: 3.2, sales: 14800, rating: 4.3 },
  ],
  toys: [
    { title: "RC Car Off-Road Remote Control", cost: 12.5, sales: 11200, rating: 4.5 },
    { title: "Building Blocks Set Creative 1000pcs", cost: 8.5, sales: 15800, rating: 4.7 },
    { title: "Fidget Spinner Metal Premium", cost: 3.2, sales: 28400, rating: 4.3 },
    { title: "Puzzle 3D Wooden Brain Teaser", cost: 4.8, sales: 16200, rating: 4.5 },
    { title: "Slime Kit DIY Making Supplies", cost: 5.5, sales: 22100, rating: 4.6 },
    { title: "Magic Cube Speed 3x3 Smooth", cost: 3.8, sales: 19800, rating: 4.4 },
    { title: "Water Gun Electric Automatic", cost: 9.2, sales: 8900, rating: 4.5 },
    { title: "Board Game Family Strategy Fun", cost: 7.5, sales: 12400, rating: 4.7 },
    { title: "Plush Toy Giant Stuffed Animal", cost: 8.8, sales: 14500, rating: 4.6 },
    { title: "Bubble Machine Automatic Kids", cost: 6.2, sales: 18600, rating: 4.4 },
  ],
};

/* ── Fallback products for dev/testing (category-specific) ── */
function generateFallbackProducts(count: number, categoryId?: string) {
  // Get category-specific products, or mix from all
  const sampleProducts = categoryId && CATEGORY_PRODUCTS[categoryId]
    ? CATEGORY_PRODUCTS[categoryId]
    : [
        // Default mix if no category match
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
