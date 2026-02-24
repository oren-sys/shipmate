/**
 * Sync AliExpress categories to Firestore categories collection.
 * Run: npx tsx scripts/sync-categories.ts
 *
 * The site seed script creates 6 categories, but AliExpress mapping
 * (lib/aliexpress/categories.ts) defines 10. This script ensures all
 * 10 exist in Firestore. Uses { merge: true } so existing category
 * data (description, image, productCount) is preserved.
 */
import * as admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214",
  });
}

const db = admin.firestore();

const categories = [
  { slug: "electronics", name: "Electronics", nameHe: "אלקטרוניקה", order: 1 },
  { slug: "fashion", name: "Fashion & Accessories", nameHe: "אופנה ואביזרים", order: 2 },
  { slug: "home", name: "Home & Garden", nameHe: "בית וגן", order: 3 },
  { slug: "beauty", name: "Beauty & Health", nameHe: "יופי וטיפוח", order: 4 },
  { slug: "kids", name: "Kids & Babies", nameHe: "ילדים ותינוקות", order: 5 },
  { slug: "gadgets", name: "Phones & Gadgets", nameHe: "גאדג׳טים וסלולר", order: 6 },
  { slug: "sports", name: "Sports & Outdoors", nameHe: "ספורט ופנאי", order: 7 },
  { slug: "auto", name: "Automotive", nameHe: "רכב", order: 8 },
  { slug: "jewelry", name: "Jewelry & Watches", nameHe: "תכשיטים ושעונים", order: 9 },
  { slug: "toys", name: "Toys & Hobbies", nameHe: "צעצועים ומשחקים", order: 10 },
];

async function syncCategories() {
  const batch = db.batch();
  for (const cat of categories) {
    const ref = db.collection("categories").doc(cat.slug);
    batch.set(ref, {
      ...cat,
      active: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    }, { merge: true });
  }
  await batch.commit();
  console.log(`Synced ${categories.length} categories`);
}

syncCategories().catch(console.error);
