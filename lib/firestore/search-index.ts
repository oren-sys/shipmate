import { getDb } from "@/lib/firebase";
import { SearchIndexEntry } from "./types";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0590-\u05FF]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export async function upsertSearchIndex(product: {
  id: string; title: string; titleHe: string; tags: string[];
  price: number; images: string[]; categoryId: string; status: string;
}): Promise<void> {
  const tokens = [
    ...tokenize(product.title),
    ...tokenize(product.titleHe),
    ...product.tags.flatMap((t) => tokenize(t)),
  ];
  const unique = Array.from(new Set(tokens));

  await getDb().collection("searchIndex").doc(product.id).set({
    productId: product.id,
    tokens: unique,
    titleHe: product.titleHe,
    price: product.price,
    image: product.images[0] || "",
    categoryId: product.categoryId,
    status: product.status,
  });
}

export async function searchProducts(query: string, limit = 20): Promise<SearchIndexEntry[]> {
  const queryTokens = tokenize(query).slice(0, 10); // Firestore array-contains-any max 30
  if (queryTokens.length === 0) return [];

  const snap = await getDb().collection("searchIndex")
    .where("status", "==", "ACTIVE")
    .where("tokens", "array-contains-any", queryTokens)
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as SearchIndexEntry);
}

export async function removeFromSearchIndex(productId: string): Promise<void> {
  await getDb().collection("searchIndex").doc(productId).delete();
}
