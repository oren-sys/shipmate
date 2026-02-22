import { getDb } from "@/lib/firebase";
import { Review } from "./types";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION = "reviews";

export async function getReview(id: string): Promise<Review | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } as Review : null;
}

export async function listProductReviews(productId: string, opts?: {
  approved?: boolean;
  limit?: number;
  startAfter?: any;
}): Promise<{ reviews: Review[]; lastDoc: any }> {
  let q = getDb().collection(COLLECTION)
    .where("productId", "==", productId) as any;

  if (opts?.approved !== undefined) {
    q = q.where("approved", "==", opts.approved);
  }

  q = q.orderBy("createdAt", "desc");
  if (opts?.startAfter) q = q.startAfter(opts.startAfter);
  q = q.limit(opts?.limit || 10);

  const snap = await q.get();
  const reviews = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Review));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;

  return { reviews, lastDoc };
}

export async function createReview(data: Omit<Review, "id" | "createdAt">): Promise<string> {
  const ref = getDb().collection(COLLECTION).doc();
  await ref.set({
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function approveReview(id: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({ approved: true });
}

export async function getRecentApprovedReviews(limit = 10): Promise<Review[]> {
  const snap = await getDb().collection(COLLECTION)
    .where("approved", "==", true)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
}
