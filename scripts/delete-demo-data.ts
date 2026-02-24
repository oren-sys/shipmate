/**
 * Delete all demo/seed data from Firestore.
 * Keeps: categories, settings, real imported products (with aliexpressId).
 * Deletes: demo products, orders, customers, reviews, coupons, supportTickets.
 *
 * Run: npx tsx scripts/delete-demo-data.ts
 */
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214",
  });
}

const db = admin.firestore();

async function deleteCollection(name: string, filter?: (doc: admin.firestore.QueryDocumentSnapshot) => boolean) {
  const snapshot = await db.collection(name).get();
  if (snapshot.empty) {
    console.log(`  ${name}: empty, skipping`);
    return 0;
  }

  const docsToDelete = filter ? snapshot.docs.filter(filter) : snapshot.docs;
  let deleted = 0;

  // Batch delete (max 500 per batch)
  for (let i = 0; i < docsToDelete.length; i += 500) {
    const batch = db.batch();
    const chunk = docsToDelete.slice(i, i + 500);
    chunk.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += chunk.length;
  }

  console.log(`  ${name}: deleted ${deleted} documents`);
  return deleted;
}

async function main() {
  console.log("Deleting demo data...\n");

  // Delete all orders
  await deleteCollection("orders");

  // Delete all customers
  await deleteCollection("customers");

  // Delete all reviews
  await deleteCollection("reviews");

  // Delete all support tickets
  await deleteCollection("supportTickets");

  // Delete demo coupons
  await deleteCollection("coupons");

  // Delete demo products (those WITHOUT aliexpressId)
  await deleteCollection("products", (doc) => !doc.data().aliexpressId);

  // Delete viral posts (demo)
  await deleteCollection("viralPosts");

  console.log("\nDone! Demo data deleted. Categories and settings preserved.");
}

main().catch(console.error);
