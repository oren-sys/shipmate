import { translateBatch } from "@/lib/gcp/translate";
import { getExchangeRate, calculatePrice } from "@/lib/pricing";
import { createProduct } from "@/lib/firestore/products";
import { upsertSearchIndex } from "@/lib/firestore/search-index";

export interface RawProductImport {
  aliexpressId: string;
  title: string;
  description: string;
  images: string[];
  costPriceUSD: number;
  shippingDays: number;
  supplierName?: string;
  supplierRating?: number;
  aliexpressUrl?: string;
  category?: string;
  tags?: string[];
}

export async function importProduct(raw: RawProductImport): Promise<string> {
  // Translate title + description to Hebrew
  const [titleHe, descriptionHe] = await translateBatch([raw.title, raw.description]);

  // Calculate ILS pricing
  const rate = await getExchangeRate();
  const { price, compareAtPrice } = calculatePrice(raw.costPriceUSD, rate);

  // Generate slug from Hebrew title
  const slug = generateSlug(titleHe, raw.aliexpressId);

  const productId = await createProduct({
    aliexpressId: raw.aliexpressId,
    title: raw.title,
    titleHe,
    description: raw.description,
    descriptionHe,
    slug,
    price,
    costPrice: raw.costPriceUSD,
    compareAtPrice,
    images: raw.images,
    categoryId: raw.category || "uncategorized",
    categoryName: "",
    categoryNameHe: "",
    tags: raw.tags || [],
    aliexpressUrl: raw.aliexpressUrl,
    supplierName: raw.supplierName,
    supplierRating: raw.supplierRating,
    shippingDays: raw.shippingDays,
    status: "DRAFT",
    salesCount: 0,
    viewCount: 0,
    trendScore: 0,
    reviewCount: 0,
    avgRating: 0,
  });

  // Update search index
  await upsertSearchIndex({
    id: productId,
    title: raw.title,
    titleHe,
    tags: raw.tags || [],
    price,
    images: raw.images,
    categoryId: raw.category || "uncategorized",
    status: "DRAFT",
  });

  return productId;
}

export async function importProducts(rawProducts: RawProductImport[]): Promise<string[]> {
  const ids: string[] = [];
  for (const raw of rawProducts) {
    try {
      const id = await importProduct(raw);
      ids.push(id);
    } catch (error) {
      console.error(`Failed to import product ${raw.aliexpressId}:`, error);
    }
  }
  return ids;
}

function generateSlug(hebrewTitle: string, fallbackId: string): string {
  const cleaned = hebrewTitle
    .replace(/[^\u0590-\u05FF\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return cleaned || `product-${fallbackId}`;
}
