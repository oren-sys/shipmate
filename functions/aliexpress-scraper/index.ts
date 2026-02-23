import * as ff from "@google-cloud/functions-framework";
import { Storage } from "@google-cloud/storage";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214" });
}

const db = getFirestore();
const storage = new Storage();
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214";
const PRODUCTS_BUCKET = `${PROJECT}-products`;

// Rate limiting
const RATE_LIMIT_MS = 2000; // 2 seconds between requests
let lastRequestTime = 0;

interface AliExpressProduct {
  productId: string;
  title: string;
  description: string;
  images: string[];
  price: number; // USD
  shippingDays: number;
  supplierName: string;
  supplierRating: number;
  url: string;
  category: string;
  tags: string[];
}

interface ScrapeRequest {
  action: "scrape_url" | "search" | "bulk_import";
  url?: string;
  query?: string;
  productUrls?: string[];
  categoryId?: string;
  maxResults?: number;
}

ff.http("aliexpressScraper", async (req, res) => {
  try {
    const body: ScrapeRequest = req.body;

    if (!body.action) {
      res.status(400).json({ error: "Missing action field" });
      return;
    }

    let results: AliExpressProduct[] = [];

    switch (body.action) {
      case "scrape_url":
        if (!body.url) {
          res.status(400).json({ error: "Missing url for scrape_url action" });
          return;
        }
        const product = await scrapeProduct(body.url);
        if (product) results = [product];
        break;

      case "search":
        if (!body.query) {
          res.status(400).json({ error: "Missing query for search action" });
          return;
        }
        results = await searchProducts(body.query, body.maxResults || 20);
        break;

      case "bulk_import":
        if (!body.productUrls || body.productUrls.length === 0) {
          res.status(400).json({ error: "Missing productUrls for bulk_import" });
          return;
        }
        results = await bulkScrape(body.productUrls);
        break;

      default:
        res.status(400).json({ error: `Unknown action: ${body.action}` });
        return;
    }

    // Download and upload images to Cloud Storage
    const processed = await Promise.all(
      results.map(async (product) => {
        const uploadedImages = await downloadAndUploadImages(
          product.productId,
          product.images
        );
        return { ...product, images: uploadedImages };
      })
    );

    res.json({
      success: true,
      count: processed.length,
      products: processed,
    });
  } catch (error: any) {
    console.error("Scraper error:", error);
    res.status(500).json({ error: error.message || "Scraper failed" });
  }
});

async function scrapeProduct(url: string): Promise<AliExpressProduct | null> {
  await rateLimit();

  const productId = extractProductId(url);
  if (!productId) return null;

  // Try AliExpress API first
  const apiKey = process.env.ALIEXPRESS_APP_KEY;
  const apiSecret = process.env.ALIEXPRESS_APP_SECRET;

  if (apiKey && apiKey !== "placeholder") {
    return await fetchViaAPI(productId, apiKey, apiSecret || "");
  }

  // Fallback: return structured placeholder for manual entry
  console.warn("No AliExpress API key configured, returning placeholder");
  return {
    productId,
    title: `Product ${productId}`,
    description: "Description pending - please update via admin",
    images: [],
    price: 0,
    shippingDays: 14,
    supplierName: "Unknown",
    supplierRating: 0,
    url,
    category: "uncategorized",
    tags: [],
  };
}

async function fetchViaAPI(
  productId: string,
  apiKey: string,
  apiSecret: string
): Promise<AliExpressProduct> {
  const endpoint = "https://api-sg.aliexpress.com/sync";
  const params = new URLSearchParams({
    method: "aliexpress.ds.product.get",
    app_key: apiKey,
    product_id: productId,
    target_currency: "USD",
    target_language: "en",
    sign_method: "sha256",
  });

  // Generate signature
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}${v}`)
    .join("");

  const crypto = await import("crypto");
  const sign = crypto
    .createHmac("sha256", apiSecret)
    .update(sortedParams)
    .digest("hex")
    .toUpperCase();

  params.set("sign", sign);

  const response = await fetch(`${endpoint}?${params.toString()}`);
  const data = await response.json();

  if (!data.aliexpress_ds_product_get_response?.result) {
    throw new Error(`API returned no result for product ${productId}`);
  }

  const result = data.aliexpress_ds_product_get_response.result;

  return {
    productId,
    title: result.ae_item_base_info_dto?.subject || "",
    description: result.ae_item_base_info_dto?.detail || "",
    images: (result.ae_multimedia_info_dto?.image_urls || "")
      .split(";")
      .filter(Boolean),
    price: parseFloat(
      result.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o?.[0]?.offer_sale_price || "0"
    ),
    shippingDays: 14,
    supplierName: result.ae_store_info?.store_name || "",
    supplierRating: parseFloat(result.ae_store_info?.positiveRate || "0"),
    url: `https://www.aliexpress.com/item/${productId}.html`,
    category: result.ae_item_base_info_dto?.category_id?.toString() || "uncategorized",
    tags: [],
  };
}

async function searchProducts(
  query: string,
  maxResults: number
): Promise<AliExpressProduct[]> {
  const apiKey = process.env.ALIEXPRESS_APP_KEY;
  if (!apiKey || apiKey === "placeholder") {
    console.warn("No API key for search");
    return [];
  }

  // Use AliExpress affiliate search API
  await rateLimit();

  // Placeholder — real implementation uses aliexpress.affiliate.product.query
  console.log(`Searching for: ${query}, max: ${maxResults}`);
  return [];
}

async function bulkScrape(urls: string[]): Promise<AliExpressProduct[]> {
  const results: AliExpressProduct[] = [];
  for (const url of urls) {
    try {
      const product = await scrapeProduct(url);
      if (product) results.push(product);
    } catch (error) {
      console.error(`Failed to scrape ${url}:`, error);
    }
  }
  return results;
}

async function downloadAndUploadImages(
  productId: string,
  imageUrls: string[]
): Promise<string[]> {
  const uploaded: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      await rateLimit();
      const response = await fetch(imageUrls[i]);
      if (!response.ok) continue;

      const buffer = Buffer.from(await response.arrayBuffer());
      const filePath = `products/${productId}/original-${i}.jpg`;
      const file = storage.bucket(PRODUCTS_BUCKET).file(filePath);

      await file.save(buffer, {
        contentType: "image/jpeg",
        resumable: false,
      });

      uploaded.push(`https://storage.googleapis.com/${PRODUCTS_BUCKET}/${filePath}`);
    } catch (error) {
      console.error(`Failed to download image ${i} for ${productId}:`, error);
    }
  }

  return uploaded;
}

function extractProductId(url: string): string | null {
  // Match /item/NUMBERS.html or /item/NUMBERS
  const match = url.match(/\/item\/(\d+)/);
  if (match) return match[1];

  // Match product_id parameter
  const urlObj = new URL(url);
  const pid = urlObj.searchParams.get("productId") || urlObj.searchParams.get("product_id");
  return pid || null;
}

async function rateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise((resolve) => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastRequestTime = Date.now();
}
