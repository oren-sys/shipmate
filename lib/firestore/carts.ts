import { getDb } from "@/lib/firebase";
import { Cart, CartItem } from "./types";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION = "carts";

export async function getCart(sessionId: string): Promise<Cart | null> {
  const doc = await getDb().collection(COLLECTION).doc(sessionId).get();
  return doc.exists ? { sessionId: doc.id, ...doc.data() } as Cart : null;
}

export async function saveCart(sessionId: string, items: CartItem[], extra?: { email?: string; phone?: string }): Promise<void> {
  const totalValue = items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);
  await getDb().collection(COLLECTION).doc(sessionId).set({
    items,
    totalValue,
    email: extra?.email,
    phone: extra?.phone,
    recovered: false,
    remindersSent: 0,
    updatedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  }, { merge: true });
}

export async function deleteCart(sessionId: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(sessionId).delete();
}

export async function markCartRecovered(sessionId: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(sessionId).update({
    recovered: true,
    updatedAt: Timestamp.now(),
  });
}

export async function getAbandonedCarts(olderThanMinutes: number): Promise<Cart[]> {
  const cutoff = Timestamp.fromMillis(Date.now() - olderThanMinutes * 60 * 1000);
  const snap = await getDb().collection(COLLECTION)
    .where("recovered", "==", false)
    .where("updatedAt", "<", cutoff)
    .where("remindersSent", "<", 3)
    .limit(50)
    .get();
  return snap.docs.map((d) => ({ sessionId: d.id, ...d.data() } as Cart));
}

export async function incrementCartReminders(sessionId: string): Promise<void> {
  const { FieldValue } = await import("firebase-admin/firestore");
  await getDb().collection(COLLECTION).doc(sessionId).update({
    remindersSent: FieldValue.increment(1),
    lastReminderAt: Timestamp.now(),
  });
}

export async function captureCartEmail(sessionId: string, email: string, phone?: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(sessionId).update({
    email,
    ...(phone && { phone }),
    updatedAt: Timestamp.now(),
  });
}
