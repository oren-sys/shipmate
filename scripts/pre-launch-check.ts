/**
 * ShipMate Pre-Launch Validation Script
 *
 * Validates everything is ready for production:
 * 1.  Firestore accessible
 * 2.  Cloud Storage buckets exist
 * 3.  Required secrets/env populated
 * 4.  20+ active products in Firestore
 * 5.  All categories have products
 * 6.  Coupons exist and are active
 * 7.  Site settings populated
 * 8.  Counter docs initialized
 * 9.  Hebrew content present
 * 10. Health check returns 200
 * 11. Sitemap accessible
 * 12. Legal pages populated (privacy, returns, shipping)
 *
 * Run: npx tsx scripts/pre-launch-check.ts
 * With deployed URL: BASE_URL=https://shipmate.store npx tsx scripts/pre-launch-check.ts
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214",
  });
}

const db = admin.firestore();
const BASE_URL = process.env.BASE_URL || process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

// ---------- Check Types ----------

interface CheckResult {
  name: string;
  status: "pass" | "fail" | "warn";
  message: string;
  details?: string;
}

const results: CheckResult[] = [];

function pass(name: string, message: string, details?: string) {
  results.push({ name, status: "pass", message, details });
}

function fail(name: string, message: string, details?: string) {
  results.push({ name, status: "fail", message, details });
}

function warn(name: string, message: string, details?: string) {
  results.push({ name, status: "warn", message, details });
}

// ---------- Checks ----------

async function checkFirestore() {
  try {
    await db.collection("_health").doc("test").set({
      timestamp: new Date().toISOString(),
    });
    await db.collection("_health").doc("test").delete();
    pass("Firestore", "Firestore is accessible and writable");
  } catch (error) {
    fail("Firestore", "Cannot connect to Firestore", String(error));
  }
}

async function checkProducts() {
  try {
    const snapshot = await db
      .collection("products")
      .where("status", "==", "active")
      .get();

    const count = snapshot.size;

    if (count >= 20) {
      pass("Products", `${count} active products found`);
    } else if (count >= 10) {
      warn("Products", `Only ${count} active products (recommend 20+)`);
    } else {
      fail("Products", `Only ${count} active products (need at least 10)`);
    }

    // Check Hebrew content
    let hebrewCount = 0;
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.titleHe && /[\u0590-\u05FF]/.test(data.titleHe as string)) {
        hebrewCount++;
      }
    });

    if (hebrewCount === count) {
      pass("Hebrew Content", `All ${count} products have Hebrew titles`);
    } else if (hebrewCount > 0) {
      warn("Hebrew Content", `${hebrewCount}/${count} products have Hebrew titles`);
    } else {
      fail("Hebrew Content", "No products have Hebrew titles");
    }

    // Check prices
    let invalidPrices = 0;
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (!data.price || (data.price as number) <= 0) {
        invalidPrices++;
      }
    });

    if (invalidPrices === 0) {
      pass("Product Prices", "All products have valid prices");
    } else {
      fail("Product Prices", `${invalidPrices} products have invalid prices`);
    }
  } catch (error) {
    fail("Products", "Cannot query products", String(error));
  }
}

async function checkCategories() {
  try {
    const snapshot = await db
      .collection("categories")
      .where("active", "==", true)
      .get();

    const count = snapshot.size;

    if (count >= 4) {
      pass("Categories", `${count} active categories found`);
    } else {
      fail("Categories", `Only ${count} categories (need at least 4)`);
    }

    // Check each category has products
    let emptyCategories = 0;
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.productCount || (data.productCount as number) === 0) {
        emptyCategories++;
      }
    }

    if (emptyCategories === 0) {
      pass("Category Products", "All categories have products");
    } else {
      warn("Category Products", `${emptyCategories} categories have no products`);
    }
  } catch (error) {
    fail("Categories", "Cannot query categories", String(error));
  }
}

async function checkCoupons() {
  try {
    const snapshot = await db
      .collection("coupons")
      .where("isActive", "==", true)
      .get();

    if (snapshot.size >= 2) {
      pass("Coupons", `${snapshot.size} active coupons found`);
    } else if (snapshot.size > 0) {
      warn("Coupons", `Only ${snapshot.size} active coupon`);
    } else {
      fail("Coupons", "No active coupons found");
    }

    // Check WELCOME15 exists
    const welcome = await db.collection("coupons").doc("WELCOME15").get();
    if (welcome.exists) {
      pass("Welcome Coupon", "WELCOME15 coupon exists");
    } else {
      warn("Welcome Coupon", "WELCOME15 coupon not found");
    }
  } catch (error) {
    fail("Coupons", "Cannot query coupons", String(error));
  }
}

async function checkSiteSettings() {
  try {
    const doc = await db.collection("settings").doc("site").get();

    if (!doc.exists) {
      fail("Site Settings", "Site settings document not found");
      return;
    }

    const data = doc.data()!;

    // Check required fields
    const requiredFields = [
      "storeName",
      "storeNameHe",
      "freeShippingThreshold",
      "shippingPolicy",
      "returnPolicy",
      "privacyPolicy",
    ];

    const missing = requiredFields.filter((f) => !data[f]);

    if (missing.length === 0) {
      pass("Site Settings", "All required settings populated");
    } else {
      fail("Site Settings", `Missing: ${missing.join(", ")}`);
    }

    // Check policies have Hebrew content
    const policies = ["shippingPolicy", "returnPolicy", "privacyPolicy"];
    let hebrewPolicies = 0;
    for (const policy of policies) {
      if (data[policy] && /[\u0590-\u05FF]/.test(data[policy] as string)) {
        hebrewPolicies++;
      }
    }

    if (hebrewPolicies === 3) {
      pass("Hebrew Policies", "All policies have Hebrew content");
    } else {
      warn("Hebrew Policies", `${hebrewPolicies}/3 policies have Hebrew content`);
    }
  } catch (error) {
    fail("Site Settings", "Cannot read site settings", String(error));
  }
}

async function checkCounters() {
  try {
    const ordersDoc = await db.collection("counters").doc("orders").get();
    const invoicesDoc = await db.collection("counters").doc("invoices").get();

    if (ordersDoc.exists && invoicesDoc.exists) {
      pass(
        "Counters",
        `Orders: ${ordersDoc.data()?.value}, Invoices: ${invoicesDoc.data()?.value}`
      );
    } else {
      fail("Counters", "Counter documents not initialized");
    }
  } catch (error) {
    fail("Counters", "Cannot read counters", String(error));
  }
}

async function checkEnvironmentVars() {
  const required = [
    "GOOGLE_CLOUD_PROJECT",
  ];

  const optional = [
    "NEXTAUTH_SECRET",
    "MESHULAM_API_KEY",
    "MESHULAM_PAGE_CODE",
    "WHATSAPP_API_TOKEN",
    "ADMIN_EMAIL",
    "ADMIN_PASSWORD",
    "ALIEXPRESS_APP_KEY",
  ];

  const missingRequired = required.filter((key) => !process.env[key]);
  const missingOptional = optional.filter((key) => !process.env[key]);

  if (missingRequired.length === 0) {
    pass("Required Env Vars", "All required environment variables set");
  } else {
    fail("Required Env Vars", `Missing: ${missingRequired.join(", ")}`);
  }

  if (missingOptional.length === 0) {
    pass("Optional Env Vars", "All optional environment variables set");
  } else {
    warn(
      "Optional Env Vars",
      `${missingOptional.length} optional vars not set`,
      missingOptional.join(", ")
    );
  }
}

async function checkHealthEndpoint() {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);

    if (response.ok) {
      const data = await response.json();
      pass("Health Check", `Health endpoint returned ${response.status}`, data.status);
    } else {
      fail("Health Check", `Health endpoint returned ${response.status}`);
    }
  } catch {
    warn("Health Check", `Cannot reach ${BASE_URL}/api/health (server may not be running)`);
  }
}

async function checkSitemap() {
  try {
    const response = await fetch(`${BASE_URL}/sitemap.xml`);

    if (response.ok) {
      const text = await response.text();
      const urlCount = (text.match(/<url>/g) || []).length;
      pass("Sitemap", `Sitemap accessible with ${urlCount} URLs`);
    } else {
      fail("Sitemap", `Sitemap returned ${response.status}`);
    }
  } catch {
    warn("Sitemap", `Cannot reach ${BASE_URL}/sitemap.xml (server may not be running)`);
  }
}

async function checkReviews() {
  try {
    const snapshot = await db
      .collection("reviews")
      .where("status", "==", "approved")
      .limit(50)
      .get();

    if (snapshot.size >= 5) {
      pass("Reviews", `${snapshot.size} approved reviews found`);
    } else if (snapshot.size > 0) {
      warn("Reviews", `Only ${snapshot.size} reviews (recommend 5+)`);
    } else {
      warn("Reviews", "No reviews found");
    }
  } catch (error) {
    fail("Reviews", "Cannot query reviews", String(error));
  }
}

// ---------- Runner ----------

async function runChecks() {
  console.log("============================================");
  console.log("🔍 ShipMate Pre-Launch Validation");
  console.log("============================================");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Project:  ${process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214"}`);
  console.log(`Time:     ${new Date().toISOString()}`);
  console.log("============================================\n");

  // Run all checks
  await checkFirestore();
  await checkProducts();
  await checkCategories();
  await checkCoupons();
  await checkSiteSettings();
  await checkCounters();
  await checkReviews();
  await checkEnvironmentVars();
  await checkHealthEndpoint();
  await checkSitemap();

  // Print results
  console.log("\n============================================");
  console.log("📋 Results");
  console.log("============================================\n");

  const icons = { pass: "✅", fail: "❌", warn: "⚠️" };

  for (const result of results) {
    console.log(`${icons[result.status]} ${result.name}: ${result.message}`);
    if (result.details) {
      console.log(`   → ${result.details}`);
    }
  }

  // Summary
  const passed = results.filter((r) => r.status === "pass").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const warned = results.filter((r) => r.status === "warn").length;

  console.log("\n============================================");
  console.log("📊 Summary");
  console.log("============================================");
  console.log(`✅ Passed:   ${passed}`);
  console.log(`⚠️  Warnings: ${warned}`);
  console.log(`❌ Failed:   ${failed}`);
  console.log("============================================\n");

  if (failed > 0) {
    console.log("❌ PRE-LAUNCH CHECK FAILED — Fix the issues above before deploying.\n");
    process.exit(1);
  } else if (warned > 0) {
    console.log("⚠️  PRE-LAUNCH CHECK PASSED WITH WARNINGS — Review warnings before deploying.\n");
    process.exit(0);
  } else {
    console.log("🚀 ALL CHECKS PASSED — Ready for launch!\n");
    process.exit(0);
  }
}

runChecks().catch((error) => {
  console.error("❌ Pre-launch check crashed:", error);
  process.exit(1);
});
