/**
 * Price Updater Cloud Function
 *
 * Daily function triggered by Cloud Scheduler.
 * Fetches current USD/ILS rate from Bank of Israel,
 * recalculates all product prices, and logs changes.
 *
 * Pricing formula (from lib/pricing.ts):
 * - Under $5: 3x markup
 * - $5-15: 2.5x markup
 * - Over $15: 2x markup
 * - Add 17% VAT
 * - Round to X.90
 */

import * as functions from "@google-cloud/functions-framework";
import { Firestore, FieldValue } from "@google-cloud/firestore";

const db = new Firestore();

const VAT_RATE = 0.17;
const BOI_API = "https://edge.boi.gov.il/FusionEdgeServer/sdmx/v2/data/dataflow/BOI/EXR/1.0?startperiod={date}&endperiod={date}&format=sdmx-json";

interface PriceChange {
  productId: string;
  slug: string;
  oldPrice: number;
  newPrice: number;
  costUSD: number;
  exchangeRate: number;
}

/**
 * Fetch current USD/ILS exchange rate from Bank of Israel
 */
async function fetchExchangeRate(): Promise<number> {
  // First try: Bank of Israel SDMX API
  try {
    const today = new Date().toISOString().split("T")[0];
    const url = BOI_API.replace(/{date}/g, today);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (response.ok) {
      const data = await response.json();
      // Navigate SDMX-JSON structure to find USD rate
      const series = data?.data?.dataSets?.[0]?.series;
      if (series) {
        const firstSeries = Object.values(series)[0] as any;
        const observations = firstSeries?.observations;
        if (observations) {
          const lastObs = Object.values(observations).pop() as number[];
          if (lastObs && lastObs[0]) {
            return lastObs[0];
          }
        }
      }
    }
  } catch (error) {
    console.warn("BOI API failed, trying cache:", error);
  }

  // Fallback: cached rate in Firestore
  try {
    const cacheDoc = await db.doc("cache/exchange-rate").get();
    if (cacheDoc.exists) {
      const cached = cacheDoc.data();
      if (cached?.usdIls) {
        console.log(`Using cached exchange rate: ${cached.usdIls}`);
        return cached.usdIls;
      }
    }
  } catch {
    // Continue to hardcoded fallback
  }

  // Last resort fallback
  console.warn("Using hardcoded fallback exchange rate: 3.65");
  return 3.65;
}

/**
 * Calculate ILS price from USD cost
 */
function calculatePrice(costUSD: number, exchangeRate: number): number {
  // Tiered markup
  let markup: number;
  if (costUSD < 5) {
    markup = 3.0;
  } else if (costUSD <= 15) {
    markup = 2.5;
  } else {
    markup = 2.0;
  }

  // Cost in ILS with markup
  const baseILS = costUSD * exchangeRate * markup;

  // Add VAT
  const withVat = baseILS * (1 + VAT_RATE);

  // Round to nearest .90
  const rounded = Math.floor(withVat) + 0.9;

  // Minimum price ₪9.90
  return Math.max(9.9, rounded);
}

/**
 * HTTP Cloud Function — Update Prices
 *
 * Triggered daily by Cloud Scheduler
 */
functions.http("updatePrices", async (req, res) => {
  const startTime = Date.now();
  const changes: PriceChange[] = [];
  let processed = 0;
  let updated = 0;
  let errors = 0;

  try {
    // Verify Cloud Scheduler or Cloud Tasks header
    const schedulerHeader = req.headers["x-cloudscheduler"] || req.headers["x-cloudtasks-taskname"];
    if (!schedulerHeader && process.env.NODE_ENV === "production") {
      res.status(403).json({ error: "Forbidden — Scheduler/Tasks only" });
      return;
    }

    // Fetch exchange rate
    const exchangeRate = await fetchExchangeRate();
    console.log(`Current USD/ILS rate: ${exchangeRate}`);

    // Cache the rate
    await db.doc("cache/exchange-rate").set({
      usdIls: exchangeRate,
      fetchedAt: FieldValue.serverTimestamp(),
      source: "boi",
    });

    // Fetch all active products
    const productsSnap = await db
      .collection("products")
      .where("status", "==", "active")
      .get();

    console.log(`Found ${productsSnap.size} active products to update`);

    // Process in batches of 500 (Firestore batch limit)
    const BATCH_SIZE = 500;
    let batch = db.batch();
    let batchCount = 0;

    for (const doc of productsSnap.docs) {
      processed++;
      const product = doc.data();

      // Skip products without USD cost
      if (!product.costUSD || product.costUSD <= 0) {
        continue;
      }

      try {
        const newPrice = calculatePrice(product.costUSD, exchangeRate);
        const oldPrice = product.price || 0;

        // Only update if price changed
        if (Math.abs(newPrice - oldPrice) >= 0.01) {
          batch.update(doc.ref, {
            price: newPrice,
            previousPrice: oldPrice,
            exchangeRate,
            priceUpdatedAt: FieldValue.serverTimestamp(),
          });

          changes.push({
            productId: doc.id,
            slug: product.slug || "",
            oldPrice,
            newPrice,
            costUSD: product.costUSD,
            exchangeRate,
          });

          updated++;
          batchCount++;

          // Commit batch when limit reached
          if (batchCount >= BATCH_SIZE) {
            await batch.commit();
            batch = db.batch();
            batchCount = 0;
          }
        }
      } catch (error) {
        console.error(`Error updating product ${doc.id}:`, error);
        errors++;
      }
    }

    // Commit remaining batch
    if (batchCount > 0) {
      await batch.commit();
    }

    // Log price update run
    const duration = Date.now() - startTime;
    const logEntry = {
      exchangeRate,
      processed,
      updated,
      errors,
      changes: changes.slice(0, 50), // Limit logged changes
      duration,
      runAt: FieldValue.serverTimestamp(),
    };

    await db.collection("priceUpdateLogs").add(logEntry);

    console.log(
      `Price update complete: ${processed} processed, ${updated} updated, ${errors} errors (${duration}ms)`
    );

    // Log significant changes (>10% price change)
    const significantChanges = changes.filter((c) => {
      const pctChange = Math.abs(c.newPrice - c.oldPrice) / c.oldPrice;
      return pctChange > 0.1;
    });

    if (significantChanges.length > 0) {
      console.warn(
        `${significantChanges.length} products had >10% price change:`,
        significantChanges.map(
          (c) => `${c.slug}: ₪${c.oldPrice} → ₪${c.newPrice}`
        )
      );
    }

    res.json({
      success: true,
      exchangeRate,
      processed,
      updated,
      errors,
      duration,
      significantChanges: significantChanges.length,
    });
  } catch (error) {
    console.error("Price update failed:", error);
    res.status(500).json({
      error: "Price update failed",
      processed,
      updated,
      errors,
    });
  }
});
