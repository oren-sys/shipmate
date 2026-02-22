import * as ff from "@google-cloud/functions-framework";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

if (getApps().length === 0) {
  initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214" });
}

const db = getFirestore();

interface ProductTrendData {
  id: string;
  salesCount: number;
  viewCount: number;
  reviewCount: number;
  avgRating: number;
  createdAt: Timestamp;
}

ff.http("trendDetector", async (req, res) => {
  try {
    console.log("Starting trend detection...");

    // Get all active products
    const snap = await db.collection("products")
      .where("status", "==", "ACTIVE")
      .get();

    if (snap.empty) {
      res.json({ success: true, message: "No active products", updated: 0 });
      return;
    }

    const products: ProductTrendData[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<ProductTrendData, "id">),
    }));

    // Calculate trend scores
    const scored = products.map((p) => ({
      id: p.id,
      score: calculateTrendScore(p),
    }));

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Update scores in batches
    const batch = db.batch();
    let updateCount = 0;

    for (const item of scored) {
      batch.update(db.collection("products").doc(item.id), {
        trendScore: item.score,
        updatedAt: Timestamp.now(),
      });
      updateCount++;

      // Firestore batch limit is 500
      if (updateCount % 450 === 0) {
        await batch.commit();
      }
    }

    await batch.commit();

    // Cache top 20 trending products
    const top20 = scored.slice(0, 20).map((s) => s.id);
    await db.collection("cache").doc("trending-products").set({
      value: top20,
      expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
      updatedAt: Timestamp.now(),
    });

    console.log(`Updated ${updateCount} product trend scores`);
    res.json({
      success: true,
      updated: updateCount,
      top5: scored.slice(0, 5),
    });
  } catch (error: any) {
    console.error("Trend detection error:", error);
    res.status(500).json({ error: error.message });
  }
});

function calculateTrendScore(product: ProductTrendData): number {
  const now = Date.now();
  const ageMs = now - product.createdAt.toMillis();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  // Recency boost: newer products get a boost
  const recencyBoost = Math.max(0, 30 - ageDays) / 30; // 1.0 for new, 0 after 30 days

  // Sales velocity (sales per day)
  const salesVelocity = ageDays > 0 ? product.salesCount / ageDays : 0;

  // View-to-sale conversion signal
  const conversionSignal = product.viewCount > 0
    ? (product.salesCount / product.viewCount) * 100
    : 0;

  // Review quality signal
  const reviewSignal = product.reviewCount > 0
    ? (product.avgRating / 5) * Math.min(product.reviewCount, 50)
    : 0;

  // Weighted score
  const score =
    salesVelocity * 40 +       // Sales velocity is most important
    conversionSignal * 25 +     // Conversion rate
    reviewSignal * 20 +         // Review quality
    recencyBoost * 15;          // Recency

  return Math.round(score * 100) / 100;
}
