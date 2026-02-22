import { getDb } from "@/lib/firebase";
import { Order, OrderStatus } from "./types";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION = "orders";

export async function getOrder(id: string): Promise<Order | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } as Order : null;
}

export async function getOrderByNumber(orderNumber: string): Promise<Order | null> {
  const snap = await getDb().collection(COLLECTION)
    .where("orderNumber", "==", orderNumber)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Order;
}

export async function listOrders(opts: {
  status?: OrderStatus;
  customerId?: string;
  sortBy?: "createdAt" | "total";
  sortDir?: "asc" | "desc";
  limit?: number;
  startAfter?: any;
}): Promise<{ orders: Order[]; lastDoc: any }> {
  let q = getDb().collection(COLLECTION) as any;

  if (opts.status) q = q.where("status", "==", opts.status);
  if (opts.customerId) q = q.where("customerId", "==", opts.customerId);

  q = q.orderBy(opts.sortBy || "createdAt", opts.sortDir || "desc");
  if (opts.startAfter) q = q.startAfter(opts.startAfter);
  q = q.limit(opts.limit || 20);

  const snap = await q.get();
  const orders = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Order));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;

  return { orders, lastDoc };
}

export async function createOrder(data: Omit<Order, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = getDb().collection(COLLECTION).doc();
  await ref.set({
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateOrderStatus(id: string, status: OrderStatus, extra?: Partial<Order>): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    status,
    ...extra,
    updatedAt: Timestamp.now(),
  });
}

export async function getRecentOrders(limit = 10): Promise<Order[]> {
  const snap = await getDb().collection(COLLECTION)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}

export async function getOrdersByDateRange(start: Date, end: Date): Promise<Order[]> {
  const snap = await getDb().collection(COLLECTION)
    .where("createdAt", ">=", Timestamp.fromDate(start))
    .where("createdAt", "<=", Timestamp.fromDate(end))
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Order));
}
