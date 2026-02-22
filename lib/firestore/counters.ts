import { getDb } from "@/lib/firebase";

export async function getNextOrderNumber(): Promise<string> {
  const ref = getDb().collection("counters").doc("orders");
  const result = await getDb().runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const current = doc.exists ? doc.data()!.value : 10000;
    const next = current + 1;
    tx.set(ref, { value: next });
    return next;
  });
  return `IL-${result}`;
}

export async function getNextInvoiceNumber(): Promise<number> {
  const ref = getDb().collection("counters").doc("invoices");
  return await getDb().runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    const current = doc.exists ? doc.data()!.value : 1000;
    const next = current + 1;
    tx.set(ref, { value: next });
    return next;
  });
}
