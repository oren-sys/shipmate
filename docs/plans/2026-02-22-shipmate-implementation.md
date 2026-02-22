# ShipMate Platform Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build and deploy a complete Israeli dropshipping platform (shipmate.store) on Google Cloud using Firestore-only architecture.

**Architecture:** Next.js 14 on Cloud Run, Firestore for all data, Cloud Functions for background jobs, Cloud Storage for media. All within GCP free tier. RTL Hebrew storefront with ShipMate branding (coral #FF6B47 / teal #1A7A6D palette).

**Tech Stack:** Next.js 14 (App Router), Tailwind CSS, Firebase Admin SDK, NextAuth.js, Meshulam payments, WhatsApp Business API, Gmail API, Docker, Cloud Build.

**GCP Project:** `dropship-488214` | **Domain:** `shipmate.store`

---

## Phase 1: Foundation

### Task 1: GCP Project Setup Script

**Files:**
- Create: `scripts/gcp-setup.sh`

**Step 1: Write the setup script**

```bash
#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="dropship-488214"
REGION="me-west1"

echo "=== Setting GCP project ==="
gcloud config set project $PROJECT_ID

echo "=== Enabling APIs ==="
gcloud services enable \
  run.googleapis.com \
  cloudfunctions.googleapis.com \
  cloudbuild.googleapis.com \
  cloudscheduler.googleapis.com \
  cloudtasks.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  translate.googleapis.com \
  artifactregistry.googleapis.com \
  logging.googleapis.com \
  clouderrorreporting.googleapis.com \
  iam.googleapis.com

echo "=== Creating Firestore database ==="
gcloud firestore databases create \
  --location=$REGION \
  --type=firestore-native \
  2>/dev/null || echo "Firestore already exists"

echo "=== Creating Cloud Storage buckets ==="
gsutil mb -l $REGION -p $PROJECT_ID gs://${PROJECT_ID}-products/ 2>/dev/null || echo "Products bucket exists"
gsutil mb -l $REGION -p $PROJECT_ID gs://${PROJECT_ID}-invoices/ 2>/dev/null || echo "Invoices bucket exists"
gsutil mb -l $REGION -p $PROJECT_ID gs://${PROJECT_ID}-assets/ 2>/dev/null || echo "Assets bucket exists"

# Make products and assets buckets public
gsutil iam ch allUsers:objectViewer gs://${PROJECT_ID}-products/
gsutil iam ch allUsers:objectViewer gs://${PROJECT_ID}-assets/

echo "=== Creating Cloud Tasks queue ==="
gcloud tasks queues create order-processing \
  --location=$REGION \
  2>/dev/null || echo "Queue exists"

gcloud tasks queues create image-processing \
  --location=$REGION \
  2>/dev/null || echo "Queue exists"

gcloud tasks queues create notifications \
  --location=$REGION \
  2>/dev/null || echo "Queue exists"

echo "=== Creating Artifact Registry repo ==="
gcloud artifacts repositories create shipmate \
  --repository-format=docker \
  --location=$REGION \
  --description="ShipMate Docker images" \
  2>/dev/null || echo "Repo exists"

echo "=== Setting up Secret Manager secrets ==="
SECRETS=(
  "MESHULAM_API_KEY"
  "MESHULAM_PAGE_CODE"
  "ALIEXPRESS_API_KEY"
  "ALIEXPRESS_API_SECRET"
  "WHATSAPP_API_TOKEN"
  "WHATSAPP_PHONE_ID"
  "META_PIXEL_ID"
  "TIKTOK_PIXEL_ID"
  "GOOGLE_ANALYTICS_ID"
  "NEXTAUTH_SECRET"
  "ADMIN_EMAIL"
  "ADMIN_PASSWORD"
  "GMAIL_CLIENT_ID"
  "GMAIL_CLIENT_SECRET"
  "GMAIL_REFRESH_TOKEN"
)

for SECRET in "${SECRETS[@]}"; do
  echo "placeholder" | gcloud secrets create $SECRET \
    --data-file=- \
    --replication-policy=automatic \
    2>/dev/null || echo "Secret $SECRET exists"
done

echo "=== Creating service account ==="
SA_NAME="shipmate-runner"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud iam service-accounts create $SA_NAME \
  --display-name="ShipMate Cloud Run" \
  2>/dev/null || echo "SA exists"

# Grant permissions
ROLES=(
  "roles/datastore.user"
  "roles/storage.objectAdmin"
  "roles/cloudtasks.enqueuer"
  "roles/secretmanager.secretAccessor"
  "roles/logging.logWriter"
  "roles/errorreporting.writer"
  "roles/run.invoker"
)

for ROLE in "${ROLES[@]}"; do
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$ROLE" \
    --quiet
done

echo ""
echo "=== Setup Complete ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service Account: $SA_EMAIL"
echo "Buckets: gs://${PROJECT_ID}-products/ gs://${PROJECT_ID}-invoices/ gs://${PROJECT_ID}-assets/"
echo "Task Queues: order-processing, image-processing, notifications"
echo ""
echo "Next: Run 'npm install' in the project directory"
```

**Step 2: Run the setup script**

```bash
chmod +x scripts/gcp-setup.sh
bash scripts/gcp-setup.sh
```

Expected: All APIs enabled, Firestore created, buckets created, secrets created, service account ready.

**Step 3: Commit**

```bash
git add scripts/gcp-setup.sh
git commit -m "feat: add GCP project setup script"
```

---

### Task 2: Initialize Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`, `postcss.config.mjs`
- Create: `app/layout.tsx`, `app/page.tsx`
- Create: `.env.example`, `.env.local`, `.gitignore`

**Step 1: Initialize project**

```bash
cd "/c/Users/Oren/Projects/Dropship GCP"
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

If the directory isn't empty, init in a temp dir and move files. The key packages:

```bash
npm install firebase-admin@^12 next-auth@^4 zustand@^4 zod@^3 sharp@^0.33 uuid@^9
npm install @google-cloud/storage @google-cloud/tasks @google-cloud/secret-manager @google-cloud/translate
npm install react-icons lucide-react clsx tailwind-merge
npm install -D @types/uuid
```

**Step 2: Configure Tailwind for RTL + ShipMate brand**

`tailwind.config.ts`:
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: { DEFAULT: "#FF6B47", light: "#FF8A6A", dark: "#E5553A" },
        teal: { DEFAULT: "#1A7A6D", light: "#22998A", dark: "#135E54" },
        accent: { DEFAULT: "#FFD23F", light: "#FFE066", dark: "#E6BC39" },
        charcoal: { DEFAULT: "#2D2D3A", light: "#4A4A5A" },
        cream: { DEFAULT: "#FFF8F4", dark: "#FFF0E8" },
        mint: { DEFAULT: "#34D399" },
      },
      fontFamily: {
        heebo: ["Heebo", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
```

**Step 3: Create root layout with RTL + fonts**

`app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Heebo, Nunito } from "next/font/google";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew", "latin"], variable: "--font-heebo" });
const nunito = Nunito({ subsets: ["latin"], variable: "--font-nunito" });

export const metadata: Metadata = {
  title: "ShipMate | שיפמייט - החבר שלך לקניות חכמות",
  description: "מוצרים שווים במחירים שלא תאמינו. משלוח לכל הארץ.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={`${heebo.variable} ${nunito.variable}`}>
      <body className="font-heebo bg-cream text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
```

**Step 4: Set up globals.css with brand styles**

`app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    direction: rtl;
  }

  body {
    @apply bg-cream text-charcoal;
  }

  ::selection {
    @apply bg-coral/20 text-charcoal;
  }
}

@layer components {
  .btn-primary {
    @apply bg-coral hover:bg-coral-dark text-white font-bold py-3 px-6 rounded-xl
           transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5
           active:translate-y-0 active:shadow-md;
  }

  .btn-secondary {
    @apply bg-teal hover:bg-teal-dark text-white font-bold py-3 px-6 rounded-xl
           transition-all duration-200 hover:shadow-lg;
  }

  .btn-outline {
    @apply border-2 border-teal text-teal hover:bg-teal hover:text-white
           font-bold py-3 px-6 rounded-xl transition-all duration-200;
  }

  .card {
    @apply bg-white rounded-card shadow-sm hover:shadow-md transition-shadow duration-200;
  }

  .badge-sale {
    @apply bg-coral text-white text-xs font-bold px-2 py-1 rounded-full;
  }

  .badge-hot {
    @apply bg-accent text-charcoal text-xs font-bold px-2 py-1 rounded-full;
  }

  .price {
    @apply text-coral font-bold text-xl font-heebo;
  }

  .price-compare {
    @apply text-gray-400 line-through text-sm;
  }
}
```

**Step 5: Create folder structure**

```bash
mkdir -p app/(store) app/admin app/api
mkdir -p components/store components/admin components/shared components/icons
mkdir -p lib/gcp lib/payments lib/notifications lib/orders lib/marketing lib/analytics lib/cart lib/support lib/email-templates
mkdir -p functions/aliexpress-scraper functions/trend-detector functions/image-processor functions/invoice-generator functions/price-updater functions/cart-recovery functions/meta-capi functions/order-tracker functions/scheduler-dispatcher functions/daily-summary
mkdir -p scripts public/fonts
```

**Step 6: Create .env.example and .env.local**

`.env.example`:
```
# GCP
GOOGLE_CLOUD_PROJECT=dropship-488214
GCS_PRODUCTS_BUCKET=dropship-488214-products
GCS_INVOICES_BUCKET=dropship-488214-invoices
GCS_ASSETS_BUCKET=dropship-488214-assets

# App
BASE_URL=https://shipmate.store
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-secret-here

# Admin
ADMIN_EMAIL=admin@shipmate.store
ADMIN_PASSWORD=change-me

# Payments (Meshulam)
MESHULAM_API_KEY=placeholder
MESHULAM_PAGE_CODE=placeholder

# AliExpress
ALIEXPRESS_API_KEY=placeholder
ALIEXPRESS_API_SECRET=placeholder

# WhatsApp Business
WHATSAPP_API_TOKEN=placeholder
WHATSAPP_PHONE_ID=placeholder

# Pixels
META_PIXEL_ID=placeholder
TIKTOK_PIXEL_ID=placeholder
GOOGLE_ANALYTICS_ID=placeholder

# Gmail
GMAIL_CLIENT_ID=placeholder
GMAIL_CLIENT_SECRET=placeholder
GMAIL_REFRESH_TOKEN=placeholder
```

Copy to `.env.local` with same content for local dev.

**Step 7: Commit**

```bash
git init
git add -A
git commit -m "feat: initialize Next.js 14 project with ShipMate branding and RTL support"
```

---

### Task 3: Firestore Schema & Data Layer

**Files:**
- Create: `lib/firebase.ts` — Firebase Admin initialization
- Create: `lib/firestore/types.ts` — all TypeScript types
- Create: `lib/firestore/products.ts` — product CRUD
- Create: `lib/firestore/orders.ts` — order CRUD
- Create: `lib/firestore/customers.ts` — customer CRUD
- Create: `lib/firestore/categories.ts` — category CRUD
- Create: `lib/firestore/carts.ts` — cart operations
- Create: `lib/firestore/reviews.ts` — review CRUD
- Create: `lib/firestore/coupons.ts` — coupon CRUD
- Create: `lib/firestore/invoices.ts` — invoice CRUD
- Create: `lib/firestore/settings.ts` — site settings
- Create: `lib/firestore/counters.ts` — atomic counters
- Create: `lib/firestore/search-index.ts` — search operations
- Create: `lib/firestore/cache.ts` — cache with TTL
- Create: `lib/firestore/index.ts` — barrel export

**Step 1: Firebase Admin init**

`lib/firebase.ts`:
```typescript
import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { getStorage, Storage } from "firebase-admin/storage";

let app: App;
let db: Firestore;
let storage: Storage;

function getFirebaseApp(): App {
  if (getApps().length > 0) return getApps()[0];

  // In GCP (Cloud Run/Functions), uses Application Default Credentials automatically
  // Locally, set GOOGLE_APPLICATION_CREDENTIALS or use gcloud auth
  app = initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214",
    storageBucket: process.env.GCS_PRODUCTS_BUCKET || "dropship-488214-products",
  });

  return app;
}

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
    db.settings({ ignoreUndefinedProperties: true });
  }
  return db;
}

export function getStorageClient(): Storage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
  }
  return storage;
}
```

**Step 2: TypeScript types**

`lib/firestore/types.ts` — Define all document types:

```typescript
import { Timestamp } from "firebase-admin/firestore";

// === Products ===
export type ProductStatus = "ACTIVE" | "DRAFT" | "OUT_OF_STOCK" | "ARCHIVED";

export interface Product {
  id: string;
  aliexpressId?: string;
  title: string;
  titleHe: string;
  description: string;
  descriptionHe: string;
  slug: string;
  price: number;       // ILS retail
  costPrice: number;   // USD cost
  compareAtPrice: number; // ILS strikethrough
  images: string[];    // Cloud Storage URLs
  categoryId: string;
  categoryName: string;    // denormalized
  categoryNameHe: string;  // denormalized
  tags: string[];
  aliexpressUrl?: string;
  supplierName?: string;
  supplierRating?: number;
  shippingDays: number;
  weight?: number;
  status: ProductStatus;
  salesCount: number;
  viewCount: number;
  trendScore: number;
  reviewCount: number;
  avgRating: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === Orders ===
export type OrderStatus = "PENDING" | "PAID" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED" | "REFUNDED";

export interface OrderItem {
  productId: string;
  title: string;
  titleHe: string;
  image: string;
  quantity: number;
  priceAtPurchase: number;
  costAtPurchase: number;
}

export interface Order {
  id: string;
  orderNumber: string;  // IL-10001
  customerId: string;
  customerName: string;   // denormalized
  customerEmail: string;  // denormalized
  customerPhone: string;  // denormalized
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  tax: number;        // VAT 17%
  total: number;      // ILS
  status: OrderStatus;
  aliexpressOrderId?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  paymentMethod: string;
  paymentId?: string;
  installments: number;
  couponCode?: string;
  notes?: string;
  shippingAddress: Address;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Address {
  street: string;
  city: string;
  zipCode: string;
  country: string; // default "IL"
}

// === Customers ===
export interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address?: Address;
  totalSpent: number;
  orderCount: number;
  marketingConsent: boolean;
  createdAt: Timestamp;
}

// === Categories ===
export interface Category {
  id: string;
  name: string;
  nameHe: string;
  slug: string;
  parentId?: string;
  image?: string;
  order: number;
}

// === Reviews ===
export interface Review {
  id: string;
  productId: string;
  customerId: string;
  customerName: string;
  rating: number; // 1-5
  text: string;
  images?: string[];
  verified: boolean;
  approved: boolean;
  createdAt: Timestamp;
}

// === Coupons ===
export type DiscountType = "PERCENTAGE" | "FIXED";

export interface Coupon {
  id: string;
  code: string;
  discountType: DiscountType;
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: Timestamp;
  active: boolean;
  createdAt: Timestamp;
}

// === Invoices ===
export interface Invoice {
  id: string;
  orderId: string;
  invoiceNumber: number;
  pdfUrl: string;
  signedUrl?: string;
  totalAmount: number;
  vatAmount: number;
  createdAt: Timestamp;
}

// === Cart ===
export interface CartItem {
  productId: string;
  quantity: number;
  priceSnapshot: number;
  titleHe: string;
  image: string;
}

export interface Cart {
  sessionId: string;
  items: CartItem[];
  email?: string;
  phone?: string;
  totalValue: number;
  recovered: boolean;
  remindersSent: number;
  lastReminderAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// === Site Settings ===
export interface SiteSettings {
  storeName: string;
  storeNameHe: string;
  logo: string;
  favicon: string;
  announcementBar?: string;
  freeShippingThreshold: number;
  shippingPolicy: string;
  returnPolicy: string;
  privacyPolicy: string;
  socialLinks: {
    facebook?: string;
    instagram?: string;
    tiktok?: string;
    whatsapp?: string;
  };
}

// === Viral Posts ===
export type ViralStatus = "DRAFT" | "SCHEDULED" | "POSTED" | "VIRAL";

export interface ViralPost {
  id: string;
  productId: string;
  platform: string;
  contentType: string;
  hebrewCaption: string;
  hashtags: string[];
  scheduledAt?: Timestamp;
  postedAt?: Timestamp;
  engagement: { likes: number; shares: number; comments: number; views: number };
  status: ViralStatus;
}

// === Support Tickets ===
export type TicketStatus = "OPEN" | "PENDING" | "RESOLVED";
export type TicketChannel = "WHATSAPP" | "EMAIL" | "WEB";

export interface SupportTicket {
  id: string;
  customerId?: string;
  channel: TicketChannel;
  subject: string;
  messages: { from: string; text: string; timestamp: Timestamp }[];
  status: TicketStatus;
  priority: "LOW" | "MEDIUM" | "HIGH";
  assignedTo?: string;
  createdAt: Timestamp;
  resolvedAt?: Timestamp;
}

// === Marketing Campaigns ===
export interface MarketingCampaign {
  id: string;
  name: string;
  platform: "META" | "TIKTOK" | "GOOGLE" | "EMAIL" | "WHATSAPP";
  status: string;
  budget: number;
  spent: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
  startDate: Timestamp;
  endDate?: Timestamp;
}

// === Search Index ===
export interface SearchIndexEntry {
  productId: string;
  tokens: string[]; // lowercased words from title, titleHe, tags
  titleHe: string;
  price: number;
  image: string;
  categoryId: string;
  status: ProductStatus;
}
```

**Step 3: Build all Firestore CRUD modules**

Each module follows this pattern — example for `lib/firestore/products.ts`:

```typescript
import { getDb } from "@/lib/firebase";
import { Product, ProductStatus } from "./types";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

const COLLECTION = "products";

export async function getProduct(id: string): Promise<Product | null> {
  const doc = await getDb().collection(COLLECTION).doc(id).get();
  return doc.exists ? { id: doc.id, ...doc.data() } as Product : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const snap = await getDb().collection(COLLECTION)
    .where("slug", "==", slug)
    .where("status", "==", "ACTIVE")
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() } as Product;
}

export async function listProducts(opts: {
  status?: ProductStatus;
  categoryId?: string;
  sortBy?: "trendScore" | "salesCount" | "createdAt" | "price";
  sortDir?: "asc" | "desc";
  limit?: number;
  startAfter?: any;
}): Promise<{ products: Product[]; lastDoc: any }> {
  let q = getDb().collection(COLLECTION) as any;

  if (opts.status) q = q.where("status", "==", opts.status);
  if (opts.categoryId) q = q.where("categoryId", "==", opts.categoryId);

  q = q.orderBy(opts.sortBy || "createdAt", opts.sortDir || "desc");
  if (opts.startAfter) q = q.startAfter(opts.startAfter);
  q = q.limit(opts.limit || 20);

  const snap = await q.get();
  const products = snap.docs.map((d: any) => ({ id: d.id, ...d.data() } as Product));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;

  return { products, lastDoc };
}

export async function createProduct(data: Omit<Product, "id" | "createdAt" | "updatedAt">): Promise<string> {
  const ref = getDb().collection(COLLECTION).doc();
  await ref.set({
    ...data,
    salesCount: data.salesCount || 0,
    viewCount: data.viewCount || 0,
    trendScore: data.trendScore || 0,
    reviewCount: data.reviewCount || 0,
    avgRating: data.avgRating || 0,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
}

export async function updateProduct(id: string, data: Partial<Product>): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    ...data,
    updatedAt: Timestamp.now(),
  });
}

export async function incrementProductSales(id: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    salesCount: FieldValue.increment(1),
    updatedAt: Timestamp.now(),
  });
}

export async function incrementProductViews(id: string): Promise<void> {
  await getDb().collection(COLLECTION).doc(id).update({
    viewCount: FieldValue.increment(1),
  });
}
```

Build similar CRUD modules for: orders, customers, categories, reviews, coupons, invoices, carts, settings, counters, search-index, cache. Each follows the same getDb() pattern with appropriate queries and indexes.

**Key module: `lib/firestore/counters.ts`:**
```typescript
import { getDb } from "@/lib/firebase";
import { FieldValue } from "firebase-admin/firestore";

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
```

**Key module: `lib/firestore/search-index.ts`:**
```typescript
import { getDb } from "@/lib/firebase";
import { SearchIndexEntry } from "./types";

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u0590-\u05FF]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

export async function upsertSearchIndex(product: {
  id: string; title: string; titleHe: string; tags: string[];
  price: number; images: string[]; categoryId: string; status: string;
}): Promise<void> {
  const tokens = [
    ...tokenize(product.title),
    ...tokenize(product.titleHe),
    ...product.tags.flatMap((t) => tokenize(t)),
  ];
  const unique = [...new Set(tokens)];

  await getDb().collection("searchIndex").doc(product.id).set({
    productId: product.id,
    tokens: unique,
    titleHe: product.titleHe,
    price: product.price,
    image: product.images[0] || "",
    categoryId: product.categoryId,
    status: product.status,
  });
}

export async function searchProducts(query: string, limit = 20): Promise<SearchIndexEntry[]> {
  const queryTokens = tokenize(query).slice(0, 10); // Firestore array-contains-any max 30
  if (queryTokens.length === 0) return [];

  const snap = await getDb().collection("searchIndex")
    .where("status", "==", "ACTIVE")
    .where("tokens", "array-contains-any", queryTokens)
    .limit(limit)
    .get();

  return snap.docs.map((d) => d.data() as SearchIndexEntry);
}
```

**Step 4: Create barrel export**

`lib/firestore/index.ts`:
```typescript
export * from "./types";
export * from "./products";
export * from "./orders";
export * from "./customers";
export * from "./categories";
export * from "./carts";
export * from "./reviews";
export * from "./coupons";
export * from "./invoices";
export * from "./settings";
export * from "./counters";
export * from "./search-index";
export * from "./cache";
```

**Step 5: Commit**

```bash
git add lib/
git commit -m "feat: add Firestore data layer with all collection CRUD operations"
```

---

### Task 4: GCP Client Libraries

**Files:**
- Create: `lib/gcp/storage.ts` — Cloud Storage operations
- Create: `lib/gcp/tasks.ts` — Cloud Tasks enqueue
- Create: `lib/gcp/translate.ts` — Cloud Translation
- Create: `lib/gcp/secrets.ts` — Secret Manager

**Step 1: Cloud Storage client**

`lib/gcp/storage.ts`:
```typescript
import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214";

export async function uploadFile(
  bucket: string,
  filePath: string,
  buffer: Buffer,
  contentType: string
): Promise<string> {
  const file = storage.bucket(bucket).file(filePath);
  await file.save(buffer, { contentType, resumable: false });
  return `https://storage.googleapis.com/${bucket}/${filePath}`;
}

export async function getSignedUrl(bucket: string, filePath: string, expiresInDays = 30): Promise<string> {
  const [url] = await storage.bucket(bucket).file(filePath).getSignedUrl({
    action: "read",
    expires: Date.now() + expiresInDays * 24 * 60 * 60 * 1000,
  });
  return url;
}

export async function deleteFile(bucket: string, filePath: string): Promise<void> {
  await storage.bucket(bucket).file(filePath).delete().catch(() => {});
}

export function getPublicUrl(bucket: string, filePath: string): string {
  return `https://storage.googleapis.com/${bucket}/${filePath}`;
}

export const BUCKETS = {
  products: `${PROJECT}-products`,
  invoices: `${PROJECT}-invoices`,
  assets: `${PROJECT}-assets`,
};
```

**Step 2: Cloud Tasks client**

`lib/gcp/tasks.ts`:
```typescript
import { CloudTasksClient } from "@google-cloud/tasks";

const client = new CloudTasksClient();
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214";
const REGION = "me-west1";
const BASE_URL = process.env.BASE_URL || "https://shipmate.store";

export async function enqueueTask(
  queue: string,
  path: string,
  payload: Record<string, any>,
  delaySeconds?: number
): Promise<void> {
  const parent = client.queuePath(PROJECT, REGION, queue);

  const task: any = {
    httpRequest: {
      httpMethod: "POST" as const,
      url: `${BASE_URL}${path}`,
      headers: { "Content-Type": "application/json" },
      body: Buffer.from(JSON.stringify(payload)).toString("base64"),
    },
  };

  if (delaySeconds) {
    task.scheduleTime = {
      seconds: Math.floor(Date.now() / 1000) + delaySeconds,
    };
  }

  await client.createTask({ parent, task });
}

export const QUEUES = {
  orderProcessing: "order-processing",
  imageProcessing: "image-processing",
  notifications: "notifications",
};
```

**Step 3: Cloud Translation client**

`lib/gcp/translate.ts`:
```typescript
import { TranslationServiceClient } from "@google-cloud/translate";

const client = new TranslationServiceClient();
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214";

export async function translateToHebrew(text: string): Promise<string> {
  const [response] = await client.translateText({
    parent: `projects/${PROJECT}/locations/global`,
    contents: [text],
    mimeType: "text/plain",
    targetLanguageCode: "he",
    sourceLanguageCode: "en",
  });
  return response.translations?.[0]?.translatedText || text;
}

export async function translateBatch(texts: string[]): Promise<string[]> {
  if (texts.length === 0) return [];
  const [response] = await client.translateText({
    parent: `projects/${PROJECT}/locations/global`,
    contents: texts,
    mimeType: "text/plain",
    targetLanguageCode: "he",
    sourceLanguageCode: "en",
  });
  return response.translations?.map((t) => t.translatedText || "") || texts;
}
```

**Step 4: Secret Manager client**

`lib/gcp/secrets.ts`:
```typescript
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const client = new SecretManagerServiceClient();
const PROJECT = process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214";

export async function getSecret(name: string): Promise<string> {
  const [version] = await client.accessSecretVersion({
    name: `projects/${PROJECT}/secrets/${name}/versions/latest`,
  });
  return version.payload?.data?.toString() || "";
}

export async function loadAllSecrets(): Promise<Record<string, string>> {
  const secretNames = [
    "MESHULAM_API_KEY", "MESHULAM_PAGE_CODE",
    "ALIEXPRESS_API_KEY", "ALIEXPRESS_API_SECRET",
    "WHATSAPP_API_TOKEN", "WHATSAPP_PHONE_ID",
    "META_PIXEL_ID", "TIKTOK_PIXEL_ID", "GOOGLE_ANALYTICS_ID",
    "NEXTAUTH_SECRET", "ADMIN_EMAIL", "ADMIN_PASSWORD",
    "GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN",
  ];

  const results: Record<string, string> = {};
  await Promise.all(
    secretNames.map(async (name) => {
      try {
        results[name] = await getSecret(name);
      } catch {
        results[name] = process.env[name] || "";
      }
    })
  );
  return results;
}
```

**Step 5: Commit**

```bash
git add lib/gcp/
git commit -m "feat: add GCP client libraries (Storage, Tasks, Translation, Secrets)"
```

---

### Task 5: Config & Environment

**Files:**
- Create: `lib/config.ts`

```typescript
import { z } from "zod";

const configSchema = z.object({
  GOOGLE_CLOUD_PROJECT: z.string().default("dropship-488214"),
  GCS_PRODUCTS_BUCKET: z.string().default("dropship-488214-products"),
  GCS_INVOICES_BUCKET: z.string().default("dropship-488214-invoices"),
  GCS_ASSETS_BUCKET: z.string().default("dropship-488214-assets"),
  BASE_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.string().default("development"),
  NEXTAUTH_URL: z.string().optional(),
  NEXTAUTH_SECRET: z.string().default("dev-secret-change-me"),
  ADMIN_EMAIL: z.string().default("admin@shipmate.store"),
  ADMIN_PASSWORD: z.string().default("change-me"),
  MESHULAM_API_KEY: z.string().default("placeholder"),
  MESHULAM_PAGE_CODE: z.string().default("placeholder"),
  ALIEXPRESS_API_KEY: z.string().default("placeholder"),
  ALIEXPRESS_API_SECRET: z.string().default("placeholder"),
  WHATSAPP_API_TOKEN: z.string().default("placeholder"),
  WHATSAPP_PHONE_ID: z.string().default("placeholder"),
  META_PIXEL_ID: z.string().default(""),
  TIKTOK_PIXEL_ID: z.string().default(""),
  GOOGLE_ANALYTICS_ID: z.string().default(""),
  GMAIL_CLIENT_ID: z.string().default("placeholder"),
  GMAIL_CLIENT_SECRET: z.string().default("placeholder"),
  GMAIL_REFRESH_TOKEN: z.string().default("placeholder"),
});

export type Config = z.infer<typeof configSchema>;

let _config: Config | null = null;

export function getConfig(): Config {
  if (_config) return _config;
  _config = configSchema.parse(process.env);
  return _config;
}

export const isProduction = () => getConfig().NODE_ENV === "production";
export const isGCP = () => !!process.env.K_SERVICE; // Cloud Run sets this
```

**Commit:**
```bash
git add lib/config.ts
git commit -m "feat: add zod-validated config with GCP Secret Manager support"
```

---

## Phase 2: Product Engine

### Task 6: Product Import Pipeline

**Files:**
- Create: `lib/product-import.ts`
- Create: `lib/pricing.ts`

**`lib/pricing.ts`:**
```typescript
import { getDb } from "@/lib/firebase";
import { Timestamp } from "firebase-admin/firestore";

const CACHE_KEY = "usd-ils-rate";
const VAT_RATE = 0.17;

export async function getExchangeRate(): Promise<number> {
  const db = getDb();
  const cached = await db.collection("cache").doc(CACHE_KEY).get();

  if (cached.exists) {
    const data = cached.data()!;
    if (data.expiresAt.toMillis() > Date.now()) {
      return data.value;
    }
  }

  // Fetch from Bank of Israel API
  try {
    const res = await fetch(
      "https://www.boi.org.il/PublicApi/GetExchangeRates?asXml=false"
    );
    const data = await res.json();
    const usd = data.exchangeRates?.find((r: any) => r.key === "USD");
    const rate = usd?.currentExchangeRate || 3.7;

    await db.collection("cache").doc(CACHE_KEY).set({
      value: rate,
      expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000),
      updatedAt: Timestamp.now(),
    });

    return rate;
  } catch {
    return 3.7; // fallback
  }
}

export function calculatePrice(costUSD: number, exchangeRate: number): {
  price: number;
  compareAtPrice: number;
} {
  // Markup tiers
  let markup: number;
  if (costUSD < 5) markup = 3.0;
  else if (costUSD < 15) markup = 2.5;
  else markup = 2.0;

  const baseILS = costUSD * exchangeRate * markup;
  const withVAT = baseILS * (1 + VAT_RATE);
  // Round to X.90
  const price = Math.floor(withVAT) + 0.9;
  const compareAtPrice = Math.floor(price * 1.35) + 0.9;

  return { price, compareAtPrice };
}

export function calculateVAT(total: number): number {
  return +(total - total / (1 + VAT_RATE)).toFixed(2);
}

export function calculateInstallments(total: number, months: number): number {
  return +(total / months).toFixed(2);
}
```

**`lib/product-import.ts`:**
```typescript
import { translateBatch } from "@/lib/gcp/translate";
import { getExchangeRate, calculatePrice } from "@/lib/pricing";
import { createProduct } from "@/lib/firestore/products";
import { upsertSearchIndex } from "@/lib/firestore/search-index";
import { Timestamp } from "firebase-admin/firestore";

export interface RawProductImport {
  aliexpressId: string;
  title: string;
  description: string;
  images: string[];
  costPriceUSD: number;
  shippingDays: number;
  supplierName?: string;
  supplierRating?: number;
  aliexpressUrl?: string;
  category?: string;
  tags?: string[];
}

export async function importProduct(raw: RawProductImport): Promise<string> {
  // Translate title + description to Hebrew
  const [titleHe, descriptionHe] = await translateBatch([raw.title, raw.description]);

  // Calculate ILS pricing
  const rate = await getExchangeRate();
  const { price, compareAtPrice } = calculatePrice(raw.costPriceUSD, rate);

  // Generate slug from Hebrew title
  const slug = generateSlug(titleHe, raw.aliexpressId);

  const productId = await createProduct({
    aliexpressId: raw.aliexpressId,
    title: raw.title,
    titleHe,
    description: raw.description,
    descriptionHe,
    slug,
    price,
    costPrice: raw.costPriceUSD,
    compareAtPrice,
    images: raw.images,
    categoryId: raw.category || "uncategorized",
    categoryName: "",
    categoryNameHe: "",
    tags: raw.tags || [],
    aliexpressUrl: raw.aliexpressUrl,
    supplierName: raw.supplierName,
    supplierRating: raw.supplierRating,
    shippingDays: raw.shippingDays,
    status: "DRAFT",
    salesCount: 0,
    viewCount: 0,
    trendScore: 0,
    reviewCount: 0,
    avgRating: 0,
  });

  // Update search index
  await upsertSearchIndex({
    id: productId,
    title: raw.title,
    titleHe,
    tags: raw.tags || [],
    price,
    images: raw.images,
    categoryId: raw.category || "uncategorized",
    status: "DRAFT",
  });

  return productId;
}

function generateSlug(hebrewTitle: string, fallbackId: string): string {
  const cleaned = hebrewTitle
    .replace(/[^\u0590-\u05FF\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
  return cleaned || `product-${fallbackId}`;
}
```

**Commit:**
```bash
git add lib/pricing.ts lib/product-import.ts
git commit -m "feat: add pricing engine and product import pipeline"
```

---

### Task 7: AliExpress Scraper (Cloud Function)

**Files:**
- Create: `functions/aliexpress-scraper/index.ts`
- Create: `functions/aliexpress-scraper/package.json`

This Cloud Function accepts product URLs or search params, scrapes product data via the AliExpress API (or HTTP fallback), downloads images to Cloud Storage, and returns structured product data. Uses `@google-cloud/functions-framework`. Deploys with 1GB memory, 300s timeout. Full implementation with rate limiting, retry logic, image download/upload pipeline.

**Commit:**
```bash
git add functions/aliexpress-scraper/
git commit -m "feat: add AliExpress scraper Cloud Function"
```

---

### Task 8: Trend Detector & Image Processor (Cloud Functions)

**Files:**
- Create: `functions/trend-detector/index.ts`
- Create: `functions/trend-detector/package.json`
- Create: `functions/image-processor/index.ts`
- Create: `functions/image-processor/package.json`

Trend detector: daily scheduled function, scores products by order velocity, wishlist growth, review sentiment. Updates trendScore, flags top 20, writes to cache.

Image processor: triggered by Cloud Tasks, downloads images, uses sharp to resize (thumb 200x200, medium 600x600, large 1200x1200), converts to WebP, uploads to Cloud Storage, updates product images array.

**Commit:**
```bash
git add functions/trend-detector/ functions/image-processor/
git commit -m "feat: add trend detector and image processor Cloud Functions"
```

---

## Phase 3: Storefront

### Task 9: Store Layout & Navigation

**Files:**
- Create: `app/(store)/layout.tsx`
- Create: `components/store/Header.tsx`
- Create: `components/store/MobileNav.tsx`
- Create: `components/store/Footer.tsx`
- Create: `components/store/AnnouncementBar.tsx`
- Create: `components/store/WhatsAppButton.tsx`
- Create: `components/store/CartDrawer.tsx`
- Create: `components/icons/Logo.tsx`
- Create: `components/icons/ShipMateLogo.tsx`

The store layout wraps all customer-facing pages. Full RTL Hebrew with:
- Announcement bar (configurable from Firestore siteSettings)
- Header: Logo (ShipMate SVG), category nav, search bar, cart icon with count
- Mobile: hamburger → slide-out menu, sticky bottom nav (home/categories/search/cart)
- Footer: about, shipping info, returns, social links, payment icons
- Floating WhatsApp button (fixed bottom-left in RTL)
- Cart drawer (slides from left in RTL)
- Cookie consent banner

**`components/icons/ShipMateLogo.tsx`** — SVG logo component:
The "i" dot in ShipMate is replaced by a small package/box icon. Renders in coral by default, accepts color prop. Hebrew version below in Heebo.

**`app/(store)/layout.tsx`:**
```tsx
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import MobileNav from "@/components/store/MobileNav";
import AnnouncementBar from "@/components/store/AnnouncementBar";
import WhatsAppButton from "@/components/store/WhatsAppButton";
import CartDrawer from "@/components/store/CartDrawer";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <MobileNav />
      <WhatsAppButton />
      <CartDrawer />
    </div>
  );
}
```

All components use the ShipMate brand colors, Heebo font, RTL layout. Mobile-first responsive design with Tailwind breakpoints.

**Commit:**
```bash
git add app/(store)/layout.tsx components/store/ components/icons/
git commit -m "feat: add store layout with header, footer, mobile nav, and branding"
```

---

### Task 10: Homepage

**Files:**
- Create: `app/(store)/page.tsx`
- Create: `components/store/HeroBanner.tsx`
- Create: `components/store/ProductCard.tsx`
- Create: `components/store/ProductGrid.tsx`
- Create: `components/store/CategoryGrid.tsx`
- Create: `components/store/TrustBar.tsx`
- Create: `components/store/ReviewCarousel.tsx`
- Create: `components/store/NewsletterSignup.tsx`

Homepage sections (all Hebrew):
1. **Hero** — warm coral gradient, "מוצרים שווים במחירים שלא תאמינו", CTA button
2. **Trust bar** — 4 icons: free shipping, secure payment, easy returns, Hebrew support
3. **מוצרים חמים** (Hot Products) — trending products from Firestore cache
4. **Category grid** — 6 categories with icons
5. **הכי נמכרים** (Best Sellers) — by salesCount
6. **הגיעו לאחרונה** (New Arrivals) — by createdAt
7. **Reviews carousel**
8. **Newsletter signup**

**ProductCard** is the core reusable component: white card with rounded-card, image fills top, coral price, strikethrough compare-at, star rating, "הוסף לסל" button in teal.

Uses React Server Components with Suspense. `revalidate = 3600` (ISR).

**Commit:**
```bash
git add app/(store)/page.tsx components/store/
git commit -m "feat: add homepage with hero, product grids, categories, and trust bar"
```

---

### Task 11: Product Listing & Detail Pages

**Files:**
- Create: `app/(store)/category/[slug]/page.tsx`
- Create: `app/(store)/product/[slug]/page.tsx`
- Create: `components/store/ProductFilters.tsx`
- Create: `components/store/ImageGallery.tsx`
- Create: `components/store/ReviewSection.tsx`
- Create: `components/store/ShareButtons.tsx`

**Category page:** Product grid (2 col mobile, 4 col desktop), filter sidebar (price range, rating, shipping time), sort dropdown, infinite scroll with cursor pagination, Hebrew breadcrumbs, generateMetadata with Hebrew SEO.

**Product detail:** Image gallery with zoom, Hebrew title + description, coral ₪ price, installment badge, quantity selector, "הוסף לסל" button, delivery estimate, shipping/returns accordion, reviews, similar products, WhatsApp share, JSON-LD structured data.

**Commit:**
```bash
git add app/(store)/category/ app/(store)/product/ components/store/
git commit -m "feat: add product listing and detail pages with filters and gallery"
```

---

### Task 12: Shopping Cart (Firestore-backed)

**Files:**
- Create: `lib/cart/cart-store.ts` — Zustand store
- Create: `app/(store)/cart/page.tsx`
- Create: `app/api/cart/capture-email/route.ts`

**Zustand store** synced to Firestore: on add/remove/update, writes to `carts/{sessionId}`. Session ID from cookie. Fallback to localStorage.

**Cart page:** Line items with images, quantity controls, ₪ prices, remove button. Summary: subtotal, shipping (free over ₪199), total. Installment preview. "המשך לתשלום" CTA. Upsell suggestions. Empty state.

**CartDrawer** (from Task 9) shares the same Zustand store.

**Commit:**
```bash
git add lib/cart/ app/(store)/cart/ app/api/cart/
git commit -m "feat: add Firestore-backed shopping cart with Zustand sync"
```

---

### Task 13: Checkout Flow

**Files:**
- Create: `app/(store)/checkout/page.tsx`
- Create: `app/(store)/order-confirmation/[id]/page.tsx`
- Create: `components/store/CheckoutForm.tsx`
- Create: `app/api/checkout/route.ts`

Multi-step checkout:
1. Customer info (name, email, phone with Israeli validation, address with city dropdown)
2. Shipping (standard AliExpress, estimated delivery in Hebrew)
3. Payment (redirect to Meshulam)

Order summary sidebar (sticky desktop). Coupon code input. Terms checkbox. "בצע הזמנה" button.

Order confirmation page: thank you with order number, WhatsApp share.

**Commit:**
```bash
git add app/(store)/checkout/ app/(store)/order-confirmation/ components/store/CheckoutForm.tsx app/api/checkout/
git commit -m "feat: add multi-step checkout flow with Israeli validation"
```

---

### Task 14: Search

**Files:**
- Create: `app/(store)/search/page.tsx`
- Create: `app/api/search/route.ts`
- Create: `components/store/SearchBar.tsx`

Search API queries `searchIndex` collection with array-contains-any on tokenized query. Search-as-you-type with 300ms debounce. Results grid. Popular/recent searches. No-results recommendations.

**Commit:**
```bash
git add app/(store)/search/ app/api/search/ components/store/SearchBar.tsx
git commit -m "feat: add product search with tokenized Firestore index"
```

---

## Phase 4: Payments

### Task 15: Meshulam Integration

**Files:**
- Create: `lib/payments/meshulam.ts`
- Create: `app/api/payments/meshulam-webhook/route.ts`
- Create: `app/api/payments/create/route.ts`

Meshulam client: create payment page (amount ILS, description Hebrew, maxPayments for installments, customer info, success/failure/notify URLs). Returns payment URL for redirect.

Webhook handler: verify signature, update order status to PAID, enqueue Cloud Tasks (confirmation, invoice, fulfillment). Sandbox mode for testing.

**Commit:**
```bash
git add lib/payments/ app/api/payments/
git commit -m "feat: add Meshulam payment gateway with webhook handler"
```

---

### Task 16: Invoice Generator & Price Updater (Cloud Functions)

**Files:**
- Create: `functions/invoice-generator/index.ts`
- Create: `functions/invoice-generator/package.json`
- Create: `functions/price-updater/index.ts`
- Create: `functions/price-updater/package.json`

Invoice generator: triggered by Cloud Tasks, generates Hebrew RTL tax invoice PDF (חשבונית מס) using pdfkit, uploads to Cloud Storage (invoices bucket, private), generates signed URL, saves Invoice record.

Price updater: daily function, fetches USD/ILS from Bank of Israel, updates all product prices, logs changes.

**Commit:**
```bash
git add functions/invoice-generator/ functions/price-updater/
git commit -m "feat: add invoice generator and price updater Cloud Functions"
```

---

## Phase 5: Order Management & Notifications

### Task 17: Order Processing Pipeline

**Files:**
- Create: `lib/orders/pipeline.ts`
- Create: `app/api/orders/webhook/route.ts`

Cloud Tasks orchestration:
- `order.confirm`: create order, send confirmation email+WhatsApp, fire pixels, mark cart recovered
- `order.fulfill`: forward to AliExpress API, save aliexpressOrderId
- `order.track`: fetch tracking, update status, send shipping notification
- `order.review-request`: 3-day delayed, send review request via WhatsApp+email

All tasks have retry config with exponential backoff.

**Commit:**
```bash
git add lib/orders/ app/api/orders/
git commit -m "feat: add order processing pipeline with Cloud Tasks orchestration"
```

---

### Task 18: WhatsApp Notifications

**Files:**
- Create: `lib/notifications/whatsapp.ts`

WhatsApp Business Cloud API client. Hebrew templates: order confirmation, shipped, delivered, cart reminder, discount offer. Israeli phone format validation (+972). Respects marketingConsent flag.

**Commit:**
```bash
git add lib/notifications/whatsapp.ts
git commit -m "feat: add WhatsApp notification system with Hebrew templates"
```

---

### Task 19: Email Notification System

**Files:**
- Create: `lib/notifications/email.ts`
- Create: `lib/email-templates/order-confirmation.ts`
- Create: `lib/email-templates/shipping-notification.ts`
- Create: `lib/email-templates/delivery-confirmation.ts`
- Create: `lib/email-templates/cart-abandonment.ts`
- Create: `lib/email-templates/welcome.ts`
- Create: `lib/email-templates/weekly-deals.ts`
- Create: `lib/email-templates/base-layout.ts`

Gmail API client with OAuth2. All templates: responsive, mobile-first, RTL Hebrew, inline CSS, ShipMate branding. Base layout with header (logo), body, footer (unsubscribe link).

Cart abandonment sequence: 1hr (reminder), 24hr (+10% coupon), 48hr (+15% coupon, urgency).

**Commit:**
```bash
git add lib/notifications/email.ts lib/email-templates/
git commit -m "feat: add email notification system with Hebrew RTL templates"
```

---

## Phase 6: Admin Dashboard

### Task 20: Admin Auth & Layout

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/login/page.tsx`
- Create: `app/api/auth/[...nextauth]/route.ts`
- Create: `lib/auth.ts`
- Create: `middleware.ts`
- Create: `components/admin/AdminSidebar.tsx`
- Create: `components/admin/AdminHeader.tsx`

NextAuth.js credentials provider. Admin email/password from env/Secret Manager. Middleware protects `/admin/*`. Admin layout: sidebar nav (dashboard, products, orders, customers, marketing, support), header with admin name + logout.

**Commit:**
```bash
git add app/admin/ app/api/auth/ lib/auth.ts middleware.ts components/admin/
git commit -m "feat: add admin authentication and dashboard layout"
```

---

### Task 21: Admin Dashboard Home

**Files:**
- Create: `app/admin/page.tsx`
- Create: `components/admin/StatsCard.tsx`
- Create: `components/admin/RevenueChart.tsx`
- Create: `components/admin/RecentOrders.tsx`

Stats cards (today's orders, revenue ₪, conversion %). Revenue chart last 30 days (using recharts or a simple SVG chart). Recent orders table with status badges. Quick action buttons.

```bash
npm install recharts
```

**Commit:**
```bash
git add app/admin/page.tsx components/admin/
git commit -m "feat: add admin dashboard with stats, charts, and recent orders"
```

---

### Task 22: Product Management (Admin)

**Files:**
- Create: `app/admin/products/page.tsx`
- Create: `app/admin/products/[id]/page.tsx`
- Create: `app/admin/products/import/page.tsx`
- Create: `app/api/admin/products/route.ts`
- Create: `app/api/admin/products/[id]/route.ts`
- Create: `app/api/admin/products/import/route.ts`
- Create: `components/admin/ProductForm.tsx`
- Create: `components/admin/ImageManager.tsx`

Product list with search/filter/bulk actions. Product editor: Hebrew title/description, price calculator, image manager (reorder, upload to Cloud Storage), category/tags. Import page: paste AliExpress URL → auto-scrape, bulk import, auto-translate toggle, preview before save.

**Commit:**
```bash
git add app/admin/products/ app/api/admin/products/ components/admin/ProductForm.tsx components/admin/ImageManager.tsx
git commit -m "feat: add admin product management with import and editor"
```

---

### Task 23: Order & Customer Management (Admin)

**Files:**
- Create: `app/admin/orders/page.tsx`
- Create: `app/admin/orders/[id]/page.tsx`
- Create: `app/admin/customers/page.tsx`
- Create: `app/admin/customers/[id]/page.tsx`
- Create: `app/api/admin/orders/route.ts`
- Create: `app/api/admin/orders/[id]/route.ts`
- Create: `app/api/admin/customers/route.ts`

Orders: table with filters, order detail (customer info, line items, payment, tracking, status timeline, actions). Customers: list with search, profile with order history, lifetime value, segments.

**Commit:**
```bash
git add app/admin/orders/ app/admin/customers/ app/api/admin/orders/ app/api/admin/customers/
git commit -m "feat: add admin order and customer management"
```

---

### Task 24: Marketing Dashboard (Admin)

**Files:**
- Create: `app/admin/marketing/page.tsx`
- Create: `app/admin/marketing/coupons/page.tsx`
- Create: `app/admin/marketing/viral/page.tsx`
- Create: `app/api/admin/coupons/route.ts`

Marketing overview: campaigns, spend vs revenue, ROAS. Coupon management: create/edit/usage stats. Viral content: calendar, generate Hebrew captions, schedule.

**Commit:**
```bash
git add app/admin/marketing/ app/api/admin/coupons/
git commit -m "feat: add admin marketing dashboard with coupons and viral content"
```

---

## Phase 7: Marketing & Viral Engine

### Task 25: Analytics & Pixels

**Files:**
- Create: `lib/analytics/pixels.ts`
- Create: `components/PixelProvider.tsx`
- Create: `functions/meta-capi/index.ts`
- Create: `functions/meta-capi/package.json`

Client-side pixels: GA4, Meta Pixel, TikTok Pixel. Events: page_view, view_item, add_to_cart, begin_checkout, purchase. Consent-aware (only after cookie consent). Server-side Meta CAPI Cloud Function for iOS accuracy.

**Commit:**
```bash
git add lib/analytics/ components/PixelProvider.tsx functions/meta-capi/
git commit -m "feat: add analytics pixels (GA4, Meta, TikTok) with server-side CAPI"
```

---

### Task 26: SEO Engine

**Files:**
- Create: `app/sitemap.ts`
- Create: `app/robots.ts`

Dynamic sitemap from Firestore products + categories. robots.txt. All pages already have generateMetadata with Hebrew meta. JSON-LD on product pages. hreflang Hebrew. Canonical URLs. Open Graph.

**Commit:**
```bash
git add app/sitemap.ts app/robots.ts
git commit -m "feat: add SEO with dynamic sitemap, robots.txt, and structured data"
```

---

### Task 27: Viral Content Generator

**Files:**
- Create: `lib/marketing/viral-generator.ts`

Generates Hebrew marketing content: TikTok/Reel captions, Facebook ad copy, Instagram story text, WhatsApp broadcasts, Google Ads headlines. Hebrew hashtag generator. Content templates. Saves to Firestore viralPosts.

**Commit:**
```bash
git add lib/marketing/viral-generator.ts
git commit -m "feat: add viral content generator with Hebrew templates"
```

---

### Task 28: Referral & Loyalty + Cart Recovery

**Files:**
- Create: `lib/marketing/referral.ts`
- Create: `app/api/referral/track/route.ts`
- Create: `functions/cart-recovery/index.ts`
- Create: `functions/cart-recovery/package.json`

Referral: unique codes per customer, WhatsApp share, track conversions, both parties get 15% off. Points system (1pt/₪ spent).

Cart recovery Cloud Function: runs every 30 min, queries abandoned carts, sends WhatsApp (1hr) → email with 10% coupon (24hr) → WhatsApp with 15% coupon (48hr).

**Commit:**
```bash
git add lib/marketing/referral.ts app/api/referral/ functions/cart-recovery/
git commit -m "feat: add referral system and cart abandonment recovery"
```

---

## Phase 8: Customer Support

### Task 29: WhatsApp Bot & Support Tickets

**Files:**
- Create: `app/api/whatsapp/webhook/route.ts`
- Create: `lib/support/whatsapp-bot.ts`
- Create: `app/admin/support/page.tsx`
- Create: `app/admin/support/[id]/page.tsx`

WhatsApp webhook: auto-reply to Hebrew keywords (הזמנה/מעקב → tracking, החזרה → return policy, etc.). Unknown → create support ticket in Firestore.

Admin support pages: ticket list with filters, ticket detail with conversation thread, reply from admin, templates.

**Commit:**
```bash
git add app/api/whatsapp/ lib/support/ app/admin/support/
git commit -m "feat: add WhatsApp bot and support ticket system"
```

---

## Phase 9: Deployment

### Task 30: Dockerfile & Cloud Run Config

**Files:**
- Create: `Dockerfile`
- Create: `service.yaml`
- Create: `.dockerignore`

Multi-stage Docker build: deps → build → production. Node 20 slim. Non-root user. PORT env. `service.yaml`: min 0, max 10 instances, 512Mi memory, 1 CPU, concurrency 80, Secret Manager env vars.

**Commit:**
```bash
git add Dockerfile service.yaml .dockerignore
git commit -m "feat: add Dockerfile and Cloud Run service config"
```

---

### Task 31: Cloud Build CI/CD

**Files:**
- Create: `cloudbuild.yaml`
- Create: `cloudbuild-functions.yaml`
- Create: `scripts/deploy.sh`

`cloudbuild.yaml`: install deps, lint, type-check, build Next.js, build Docker, push to Artifact Registry, deploy to Cloud Run.

`cloudbuild-functions.yaml`: deploy each Cloud Function with memory/timeout/env config.

`deploy.sh`: orchestrates full deployment (container + functions + scheduler jobs).

**Commit:**
```bash
git add cloudbuild.yaml cloudbuild-functions.yaml scripts/deploy.sh
git commit -m "feat: add Cloud Build CI/CD and deployment scripts"
```

---

### Task 32: Monitoring & Scheduler Dispatcher

**Files:**
- Create: `app/api/health/route.ts`
- Create: `functions/scheduler-dispatcher/index.ts`
- Create: `functions/scheduler-dispatcher/package.json`
- Create: `functions/daily-summary/index.ts`
- Create: `functions/daily-summary/package.json`

Health check: Firestore read, Cloud Storage access. Scheduler dispatcher: 1 Cloud Scheduler job (every 30 min) triggers this function, which checks time and fans out to appropriate tasks (cart recovery every 30 min, order tracking every 6h, trend detection daily 2am IST, price update daily 6am IST, admin summary daily 8am IST).

**Commit:**
```bash
git add app/api/health/ functions/scheduler-dispatcher/ functions/daily-summary/
git commit -m "feat: add health check, scheduler dispatcher, and monitoring"
```

---

## Phase 10: Launch Prep

### Task 33: Seed Data

**Files:**
- Create: `scripts/seed.ts`

Populates:
1. siteSettings (store name, policies in Hebrew, social links, free shipping threshold ₪199)
2. 6 categories with Hebrew names
3. 25 sample products with Hebrew descriptions and placeholder images
4. Coupon codes: WELCOME15 (15% first order), SHARE10 (10% referral)
5. Sample reviews
6. Counter docs (orders: 10000, invoices: 1000)

Run with: `npx tsx scripts/seed.ts`

**Commit:**
```bash
git add scripts/seed.ts
git commit -m "feat: add seed script with sample data and Hebrew content"
```

---

### Task 34: Pre-Launch Validation

**Files:**
- Create: `scripts/pre-launch-check.ts`

Validates: secrets populated, Firestore accessible, Cloud Storage buckets exist, Meshulam sandbox works, Cloud Functions deployed, scheduler jobs created, Hebrew content present, mobile responsive meta, sitemap accessible, health check returns 200, 20+ active products, legal pages populated.

**Commit:**
```bash
git add scripts/pre-launch-check.ts
git commit -m "feat: add pre-launch validation script"
```

---

### Task 35: Deploy to GCP

**Step 1:** Run GCP setup script (Task 1)
**Step 2:** Build and push Docker image
**Step 3:** Deploy Cloud Run service
**Step 4:** Deploy all Cloud Functions
**Step 5:** Create Cloud Scheduler job
**Step 6:** Run seed data
**Step 7:** Run pre-launch checks
**Step 8:** Map custom domain (shipmate.store)

```bash
# Build & deploy
bash scripts/deploy.sh

# Seed data
npx tsx scripts/seed.ts

# Validate
npx tsx scripts/pre-launch-check.ts
```

**Commit:**
```bash
git add -A
git commit -m "chore: final deployment configuration"
```

---

## Execution Strategy

Tasks 1-5 are sequential (foundation). After that, many tasks are parallelizable:

**Can run in parallel:**
- Tasks 6-8 (product engine) — independent
- Tasks 9-14 (storefront) — can be split: layout first, then pages in parallel
- Tasks 17-19 (notifications) — independent of each other
- Tasks 25-28 (marketing) — independent of each other

**Must be sequential:**
- Task 1 → Task 2 → Task 3 (foundation builds on itself)
- Task 9 (layout) → Tasks 10-14 (pages need layout)
- Task 15 (payments) → Task 16 (invoices need payment flow)
- Task 20 (admin auth) → Tasks 21-24 (admin pages need auth)
- Tasks 30-32 → Tasks 33-35 (deploy infrastructure before launch)

**Recommended parallel batches:**
1. **Batch 1:** Tasks 1-5 (sequential, foundation)
2. **Batch 2:** Tasks 6-8 (parallel, product engine) + Task 9 (layout)
3. **Batch 3:** Tasks 10-14 (storefront pages, partially parallel)
4. **Batch 4:** Tasks 15-16 (payments) + Tasks 17-19 (notifications, parallel)
5. **Batch 5:** Task 20 (admin auth) → Tasks 21-24 (admin pages, partially parallel)
6. **Batch 6:** Tasks 25-28 (marketing, parallel) + Task 29 (support)
7. **Batch 7:** Tasks 30-32 (deployment infra)
8. **Batch 8:** Tasks 33-35 (seed, validate, deploy)
