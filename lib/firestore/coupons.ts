import { getDb } from "@/lib/firebase";
import { Coupon } from "./types";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

const COLLECTION = "coupons";

export async function getCoupon(id: string): Promise<Coupon | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } as Coupon : null;
}

export async function getCouponByCode(code: string): Promise<Coupon | null> {
  const snap = await getDb().collection(COLLECTION)
    .where("code", "==", code.toUpperCase())
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Coupon;
}

export async function validateCoupon(code: string, orderAmount: number): Promise<{
  valid: boolean;
  coupon?: Coupon;
  error?: string;
}> {
  const coupon = await getCouponByCode(code);
  if (!coupon) return { valid: false, error: "קוד קופון לא נמצא" };
  if (!coupon.active) return { valid: false, error: "קופון לא פעיל" };
  if (coupon.expiresAt && coupon.expiresAt.toMillis() < Date.now()) {
    return { valid: false, error: "תוקף הקופון פג" };
  }
  if (coupon.usedCount >= coupon.maxUses) {
    return { valid: false, error: "הקופון מוצה" };
  }
  if (orderAmount < coupon.minOrderAmount) {
    return { valid: false, error: `סכום הזמנה מינימלי: ₪${coupon.minOrderAmount}` };
  }
  return { valid: true, coupon };
}

export async function applyCoupon(coupon: Coupon, orderAmount: number): Promise<number> {
  if (coupon.discountType === "PERCENTAGE") {
    return +(orderAmount * (coupon.discountValue / 100)).toFixed(2);
  }
  return Math.min(coupon.discountValue, orderAmount);
}

export async function incrementCouponUsage(id: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    usedCount: FieldValue.increment(1),
  });
}

export async function createCoupon(data: Omit<Coupon, "id" | "createdAt" | "usedCount">): Promise<string> {
  const ref = getDb().collection(COLLECTION).doc();
  await ref.set({
    ...data,
    code: data.code.toUpperCase(),
    usedCount: 0,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function listCoupons(): Promise<Coupon[]> {
  const snap = await getDb().collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Coupon));
}

export async function updateCoupon(id: string, data: Partial<Omit<Coupon, "id" | "createdAt">>): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    ...data,
    ...(data.code && { code: data.code.toUpperCase() }),
    updatedAt: Timestamp.now(),
  });
}

export async function deleteCoupon(id: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).delete();
}
