import { getDb } from "@/lib/firebase";
import { Invoice } from "./types";
import { Timestamp } from "firebase-admin/firestore";

const COLLECTION = "invoices";

export async function getInvoice(id: string): Promise<Invoice | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } as Invoice : null;
}

export async function getInvoiceByOrder(orderId: string): Promise<Invoice | null> {
  const snap = await getDb().collection(COLLECTION)
    .where("orderId", "==", orderId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Invoice;
}

export async function createInvoice(data: Omit<Invoice, "id" | "createdAt">): Promise<string> {
  const ref = getDb().collection(COLLECTION).doc();
  await ref.set({
    ...data,
    createdAt: Timestamp.now(),
  });
  return ref.id;
}

export async function listInvoices(opts?: {
  limit?: number;
  startAfter?: any;
}): Promise<{ invoices: Invoice[]; lastDoc: any }> {
  let q = getDb().collection(COLLECTION)
    .orderBy("createdAt", "desc") as any;
  if (opts?.startAfter) q = q.startAfter(opts.startAfter);
  q = q.limit(opts?.limit || 20);

  const snap = await q.get();
  const invoices = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Invoice));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;

  return { invoices, lastDoc };
}
