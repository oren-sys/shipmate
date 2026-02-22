import { getDb } from "@/lib/firebase";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION = "cache";

export async function getCacheValue<T = any>(key: string): Promise<T | null> {
  const doc = await getDb().collection(COLLECTION).doc(key).get();
  if (!doc.exists) return null;

  const data = doc.data()!;
  if (data.expiresAt && data.expiresAt.toMillis() < Date.now()) {
    // Expired — delete and return null
    await doc.ref.delete();
    return null;
  }

  return data.value as T;
}

export async function setCacheValue<T = any>(
  key: string,
  value: T,
  ttlMs: number = 24 * 60 * 60 * 1000 // default 24h
): Promise<void> {
  await getDb().collection(COLLECTION).doc(key).set({
    value,
    expiresAt: Timestamp.fromMillis(Date.now() + ttlMs),
    updatedAt: Timestamp.now(),
  });
}

export async function deleteCacheValue(key: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(key).delete();
}
