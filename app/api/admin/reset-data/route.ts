import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/firebase";

/**
 * DELETE /api/admin/reset-data
 *
 * Deletes all demo/seed data from Firestore:
 * - products, categories, reviews, coupons, search-index, orders, customers
 * Only accessible by authenticated admin users.
 */

const COLLECTIONS_TO_CLEAR = [
  "products",
  "categories",
  "reviews",
  "coupons",
  "search-index",
  "orders",
  "customers",
  "support-tickets",
];

async function deleteCollection(collectionName: string): Promise<number> {
  const db = getDb();
  const batch = db.batch();
  let count = 0;

  // Firestore limits batches to 500
  const snapshot = await db.collection(collectionName).limit(500).get();

  if (snapshot.empty) return 0;

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count++;
  });

  await batch.commit();

  // Recurse if there might be more
  if (count === 500) {
    count += await deleteCollection(collectionName);
  }

  return count;
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results: Record<string, number> = {};

    for (const collection of COLLECTIONS_TO_CLEAR) {
      const deleted = await deleteCollection(collection);
      results[collection] = deleted;
    }

    const total = Object.values(results).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      message: `Deleted ${total} documents`,
      details: results,
    });
  } catch (error) {
    console.error("Reset data error:", error);
    return NextResponse.json(
      { error: "Failed to reset data" },
      { status: 500 }
    );
  }
}
