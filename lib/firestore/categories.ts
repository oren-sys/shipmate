import { getDb } from "@/lib/firebase";
import { Category } from "./types";

const COLLECTION = "categories";

export async function getCategory(id: string): Promise<Category | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } as Category : null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const snap = await getDb().collection(COLLECTION)
    .where("slug", "==", slug)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Category;
}

export async function listCategories(): Promise<Category[]> {
  const snap = await getDb().collection(COLLECTION)
    .orderBy("order", "asc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Category));
}

export async function createCategory(data: Omit<Category, "id">): Promise<string> {
  const ref = getDb().collection(COLLECTION).doc();
  await ref.set(data);
  return ref.id;
}

export async function updateCategory(id: string, data: Partial<Category>): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update(data);
}
