import { getDb } from "@/lib/firebase";
import { Customer } from "./types";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

const COLLECTION = "customers";

export async function getCustomer(id: string): Promise<Customer | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } as Customer : null;
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const snap = await getDb().collection(COLLECTION)
    .where("email", "==", email.toLowerCase())
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Customer;
}

export async function getCustomerByPhone(phone: string): Promise<Customer | null> {
  const snap = await getDb().collection(COLLECTION)
    .where("phone", "==", phone)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Customer;
}

export async function createCustomer(data: Omit<Customer, "id" | "createdAt" | "totalSpent" | "orderCount">): Promise<string> {
  const ref = getDb().collection(COLLECTION).doc();
  await ref.set({
    ...data,
    email: data.email.toLowerCase(),
    totalSpent: 0,
    orderCount: 0,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<void> {
  if (data.email) data.email = data.email.toLowerCase();
  await getDb().collection(COLLECTION).doc(id).update(data);
}

export async function incrementCustomerStats(id: string, orderTotal: number): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    totalSpent: FieldValue.increment(orderTotal),
    orderCount: FieldValue.increment(1),
  });
}

export async function listCustomers(opts: {
  sortBy?: "createdAt" | "totalSpent" | "orderCount";
  sortDir?: "asc" | "desc";
  limit?: number;
  startAfter?: any;
}): Promise<{ customers: Customer[]; lastDoc: any }> {
  let q = getDb().collection(COLLECTION) as any;
  q = q.orderBy(opts.sortBy || "createdAt", opts.sortDir || "desc");
  if (opts.startAfter) q = q.startAfter(opts.startAfter);
  q = q.limit(opts.limit || 20);

  const snap = await q.get();
  const customers = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Customer));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;

  return { customers, lastDoc };
}

export async function getOrCreateCustomer(data: {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  marketingConsent: boolean;
}): Promise<Customer> {
  const existing = await getCustomerByEmail(data.email);
  if (existing) return existing;

  const id = await createCustomer(data);
  return { id, ...data, totalSpent: 0, orderCount: 0, createdAt: Timestamp.now() };
}
