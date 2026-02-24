# ShipMate Store Fixes — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 8 issues: product import quality (descriptions, categories, titles, shipping time), demo data cleanup, coupon CRUD, and support system verification.

**Architecture:** All changes are within the existing Next.js 14 + Firestore + Google Cloud Translate stack. No new dependencies needed. Changes span API routes, Firestore lib functions, admin UI pages, and store-facing pages.

**Tech Stack:** Next.js 14, TypeScript, Firestore, Google Cloud Translation API, Tailwind CSS, Lucide React

---

## Task 1: Translate Descriptions During Import

**Files:**
- Modify: `app/api/admin/products/import/route.ts:99-117`

**Step 1: Add description translation to import flow**

In `app/api/admin/products/import/route.ts`, after the title translation (line 103), add description translation:

```typescript
// After line 103 (titleHe translation), add:
let descriptionHe = "";
if (autoTranslate && productData.descriptionEn) {
  // Strip HTML tags from description before translating
  const plainDesc = productData.descriptionEn.replace(/<[^>]*>/g, "").substring(0, 2000);
  descriptionHe = await translateToHebrew(plainDesc);
}
```

Then in the product object (line 105-117), add `descriptionHe`:

```typescript
products.push({
  titleEn: productData.titleEn,
  titleHe,
  descriptionEn: productData.descriptionEn,
  descriptionHe,  // <-- ADD THIS
  costPrice: productData.costPrice,
  price,
  compareAtPrice: compareAt,
  images: productData.images,
  aliexpressUrl: url,
  aliexpressId: productId,
  category: "",
  status: "draft",
});
```

**Step 2: Verify the change compiles**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add app/api/admin/products/import/route.ts
git commit -m "feat: translate product descriptions to Hebrew during import"
```

---

## Task 2: Sync Categories and Auto-Assign During Import

The site has 6 seeded categories but AliExpress mapping has 10. Need to ensure all 10 exist in Firestore AND products get assigned during import.

**Files:**
- Create: `scripts/sync-categories.ts`
- Modify: `app/api/admin/products/import/route.ts:115`
- Modify: `app/admin/products/scan/page.tsx:78-84` (scan import already passes category)

**Step 1: Create category sync script**

Create `scripts/sync-categories.ts` that ensures all 10 AliExpress categories exist in Firestore:

```typescript
/**
 * Sync AliExpress categories to Firestore categories collection.
 * Run: npx tsx scripts/sync-categories.ts
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
```

**Step 2: Run the sync script**

Run: `npx tsx scripts/sync-categories.ts`

**Step 3: Fix import route to accept category from scan**

In `app/api/admin/products/import/route.ts`, the URL import sets `category: ""`. For scan imports, category is already passed through `app/admin/products/scan/page.tsx:83` (`category: p.category`). The scan import hits a different endpoint (`/api/admin/products` POST), so verify that endpoint saves the category. Check the products bulk-create endpoint.

**Step 4: Commit**

```bash
git add scripts/sync-categories.ts app/api/admin/products/import/route.ts
git commit -m "feat: sync 10 categories to Firestore, auto-assign during import"
```

---

## Task 3: Snappier Hebrew Titles

**Files:**
- Modify: `app/api/admin/products/import/route.ts:101-103`

**Step 1: Add title shortening after translation**

After the `translateToHebrew` call for titles, add a post-processing step:

```typescript
let titleHe = "";
if (autoTranslate && productData.titleEn) {
  titleHe = await translateToHebrew(productData.titleEn);
  // Shorten: keep max 8 words, remove filler words
  titleHe = shortenHebrewTitle(titleHe);
}
```

Add the helper function in the same file:

```typescript
/**
 * Shorten Hebrew product title to be snappy and marketing-friendly.
 * Max 8 words, remove filler/technical words.
 */
function shortenHebrewTitle(title: string): string {
  const fillerWords = ["עם", "של", "בעל", "כולל", "מסוג", "איכותי", "מקצועי", "חדש", "מתאים ל"];
  let words = title.split(/\s+/);

  // Remove filler words if title is long
  if (words.length > 8) {
    words = words.filter((w) => !fillerWords.includes(w));
  }

  // Truncate to 8 words max
  if (words.length > 8) {
    words = words.slice(0, 8);
  }

  return words.join(" ");
}
```

**Step 2: Verify compiles**

Run: `npx tsc --noEmit`

**Step 3: Commit**

```bash
git add app/api/admin/products/import/route.ts
git commit -m "feat: shorten Hebrew product titles to max 8 snappy words"
```

---

## Task 4: Delete All Demo Data

**Files:**
- Create: `scripts/delete-demo-data.ts`

**Step 1: Create cleanup script**

```typescript
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
```

**Step 2: Run the cleanup**

Run: `npx tsx scripts/delete-demo-data.ts`

**Step 3: Commit**

```bash
git add scripts/delete-demo-data.ts
git commit -m "feat: add script to delete all demo/seed data from Firestore"
```

---

## Task 5: Coupon Edit & Delete

**Files:**
- Modify: `lib/firestore/coupons.ts` — add `updateCoupon()` and `deleteCoupon()`
- Modify: `app/api/admin/coupons/route.ts` — expand PUT handler, add DELETE handler
- Modify: `app/admin/marketing/coupons/page.tsx` — add edit modal, delete button, fetch real data

### Step 1: Add Firestore functions

Add to `lib/firestore/coupons.ts` after line 67:

```typescript
export async function updateCoupon(id: string, data: Partial<Omit<Coupon, "id" | "createdAt">>): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    ...data,
    ...(data.code && { code: data.code.toUpperCase() }),
    updatedAt: Timestamp.now(),
  });
}

export async function deleteCoupon(id: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).delete();
}
```

### Step 2: Expand API route

Replace the PUT handler in `app/api/admin/coupons/route.ts` (lines 50-60) to accept full updates:

```typescript
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, ...updates } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing coupon id" }, { status: 400 });
    }

    // Validate coupon exists
    const existing = await db.collection("coupons").doc(id).get();
    if (!existing.exists) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    await db.collection("coupons").doc(id).update({
      ...updates,
      ...(updates.code && { code: updates.code.toUpperCase() }),
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Coupon update error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}
```

Add DELETE handler after PUT:

```typescript
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Missing coupon id" }, { status: 400 });
    }

    await db.collection("coupons").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Coupon delete error:", error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
```

### Step 3: Rewrite coupons admin page

Replace `app/admin/marketing/coupons/page.tsx` entirely. Key changes:
- Fetch real coupons from API on mount (GET `/api/admin/coupons`)
- Remove hardcoded `demoCoupons` array
- Add edit modal that PUTs to `/api/admin/coupons`
- Add delete button with confirmation dialog that DELETEs to `/api/admin/coupons`
- Refresh list after create/edit/delete
- Add actions column to table with edit (pencil icon) and delete (trash icon) buttons

The page should:
1. `useEffect` to fetch coupons from GET `/api/admin/coupons`
2. Create form stays the same
3. Add `editingCoupon` state for the edit modal
4. Edit modal pre-fills all fields, PUT on save
5. Delete shows `confirm()` dialog, then DELETE
6. After any mutation, re-fetch the coupon list

### Step 4: Verify compiles

Run: `npx tsc --noEmit`

### Step 5: Commit

```bash
git add lib/firestore/coupons.ts app/api/admin/coupons/route.ts app/admin/marketing/coupons/page.tsx
git commit -m "feat: add coupon edit and delete functionality"
```

---

## Task 6: Fix Support System & Contact Page

**Files:**
- Modify: `app/(store)/contact/page.tsx:21-23` — fix WhatsApp link

### Step 1: Fix WhatsApp link

In `app/(store)/contact/page.tsx`, line 21, the WhatsApp link is `href="https://wa.me/"` with no phone number. Update to include the actual WhatsApp Business number. Ask the user for the number, or use a placeholder:

```typescript
href="https://wa.me/972XXXXXXXXX"
```

**Note:** Need to ask user for their WhatsApp Business phone number.

### Step 2: Verify support ticket creation works

Check if the `/api/support` or similar endpoint exists that the contact page should POST to. Currently the contact page has NO form — it's just static info cards. Options:
- Add a simple contact form that creates a support ticket in Firestore
- Or keep it as-is (WhatsApp + email only, no web form)

### Step 3: Commit

```bash
git add "app/(store)/contact/page.tsx"
git commit -m "fix: add WhatsApp number to contact page link"
```

---

## Task 7: Verify support@shipmate.store Email

This is a configuration task, not a code change.

**Step 1: Check Resend domain verification**

The project uses Resend for email. To verify `support@shipmate.store` works:
1. Log in to [Resend dashboard](https://resend.com/domains)
2. Check if `shipmate.store` domain is verified (green checkmark)
3. If not, add the required DNS records: MX, SPF (TXT), DKIM (TXT)

**Step 2: Check DNS records**

Run: `nslookup -type=MX shipmate.store` and `nslookup -type=TXT shipmate.store`

If MX records don't point anywhere, `support@shipmate.store` cannot RECEIVE emails — it can only SEND through Resend. To receive emails, options:
- Use Google Workspace or similar for `support@shipmate.store` inbox
- Use a forwarding service (e.g., ImprovMX, Cloudflare Email Routing) to forward to `oren@skil.media`
- Or just use it as a send-only address and route support through WhatsApp

**Step 3: Document findings for user**

This is an investigation task — report findings to user.

---

## Task 8: Realistic Shipping Time from AliExpress

**Files:**
- Modify: `app/api/admin/products/import/route.ts:189-196` — extract shipping days from API response
- Modify: `app/api/admin/products/import/route.ts:105-117` — add shippingDays to product object

### Step 1: Extract shipping info from AliExpress API response

In `fetchAliExpressProduct()`, after extracting `costPrice` (line 187), add shipping days extraction:

```typescript
// Extract shipping/delivery estimate
let shippingDays = 21; // default fallback
if (product.ae_item_properties?.logistics_info_dto) {
  const logistics = product.ae_item_properties.logistics_info_dto;
  if (logistics.delivery_time) {
    // Add 15% buffer and round up
    shippingDays = Math.ceil(parseInt(logistics.delivery_time) * 1.15);
  }
} else if (product.logistics_info_dto?.logistics_info_list) {
  // Alternative structure — find Israel shipping
  const ilShipping = product.logistics_info_dto.logistics_info_list.find(
    (l: { ship_to_country: string }) => l.ship_to_country === "IL"
  );
  if (ilShipping?.estimated_delivery_time) {
    shippingDays = Math.ceil(parseInt(ilShipping.estimated_delivery_time) * 1.15);
  }
}
```

Update the return value to include `shippingDays`:

```typescript
return {
  titleEn: product.ae_item_base_info_dto?.subject || "AliExpress Product",
  descriptionEn: product.ae_item_base_info_dto?.detail || product.ae_item_base_info_dto?.subject || "",
  costPrice,
  images,
  shippingDays,  // <-- ADD THIS
};
```

### Step 2: Include shippingDays in the product object pushed to the array

In the `POST` handler (line 105-117), add `shippingDays`:

```typescript
products.push({
  titleEn: productData.titleEn,
  titleHe,
  descriptionEn: productData.descriptionEn,
  descriptionHe,
  costPrice: productData.costPrice,
  price,
  compareAtPrice: compareAt,
  images: productData.images,
  aliexpressUrl: url,
  aliexpressId: productId,
  category: "",
  status: "draft",
  shippingDays: productData.shippingDays || 21,  // <-- ADD THIS
});
```

### Step 3: Update fallback product too

In `getFallbackProduct()` (line 235-240), add `shippingDays: 21`.

### Step 4: Verify compiles

Run: `npx tsc --noEmit`

### Step 5: Commit

```bash
git add app/api/admin/products/import/route.ts
git commit -m "feat: extract shipping days from AliExpress API with 15% buffer"
```

---

## Execution Order

Tasks 1, 3, 8 all modify the same file (`import/route.ts`) — combine them into a single editing pass to avoid merge conflicts:
1. **Task 4** — Delete demo data (independent, run first to clean slate)
2. **Task 2** — Sync categories (independent, creates new script)
3. **Tasks 1+3+8** — Import improvements (description translation, snappy titles, shipping days) — all in `import/route.ts`
4. **Task 5** — Coupon CRUD (independent)
5. **Task 6** — Contact page fix (quick, needs WhatsApp number)
6. **Task 7** — Email verification (investigation, no code)
