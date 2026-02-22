import { getDb } from "@/lib/firebase";
import { Product, ProductStatus } from "./types";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

const COLLECTION = "products";

export async function getProduct(id: string): Promise<Product | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } as Product : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const snap = await getDb().collection(COLLECTION)
    .where("slug", "==", slug)
    .where("status", "==", "ACTIVE")
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Product;
}

export async function listProducts(opts: {
  status?: ProductStatus;
  categoryId?: string;
  sortBy?: "trendScore" | "salesCount" | "createdAt" | "price";
  sortDir?: "asc" | "desc";
  limit?: number;
  startAfter?: any;
}): Promise<{ products: Product[]; lastDoc: any }> {
  let q = getDb().collection(COLLECTION) as any;

  if (opts.status) q = q.where("status", "==", opts.status);
  if (opts.categoryId) q = q.where("categoryId", "==", opts.categoryId);

  q = q.orderBy(opts.sortBy || "createdAt", opts.sortDir || "desc");
  if (opts.startAfter) q = q.startAfter(opts.startAfter);
  q = q.limit(opts.limit || 20);

  const snap = await q.get();
  const products = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Product));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;

  return { products, lastDoc };
}

export async function createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = getDb().collection(COLLECTION).doc();
  await ref.set({
    ...data,
    salesCount: data.salesCount || 0,
    viewCount: data.viewCount || 0,
    trendScore: data.trendScore || 0,
    reviewCount: data.reviewCount || 0,
    avgRating: data.avgRating || 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function incrementProductSales(id: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    salesCount: FieldValue.increment(1),
    updatedAt: Timestamp.now(),
  });
}

export async function incrementProductViews(id: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    viewCount: FieldValue.increment(1),
  });
}
