# ShipMate Platform Design

## Overview

Israeli dropshipping platform at **shipmate.store**. Hebrew RTL storefront, Firestore-only database, deployed entirely on Google Cloud (project: `dropship-488214`) within free tier.

## Brand

- **Name:** ShipMate | שיפמייט
- **Domain:** shipmate.store
- **Tagline (HE):** החבר שלך לקניות חכמות
- **Tagline (EN):** Smart finds, shipped to you
- **Tone:** Friendly, casual Hebrew, emoji-friendly, informal "את/ה"

### Colors

| Role | Hex | Use |
|------|-----|-----|
| Primary (Coral) | #FF6B47 | CTAs, highlights |
| Secondary (Teal) | #1A7A6D | Trust, headers, nav |
| Accent (Yellow) | #FFD23F | Badges, sale tags |
| Dark (Charcoal) | #2D2D3A | Text |
| Light (Off-White) | #FFF8F4 | Backgrounds |
| Success (Mint) | #34D399 | Confirmations |

### Typography

- Hebrew: Heebo (Medium/Bold)
- English/Logo: Nunito
- Prices: Heebo Bold

### Logo

Text "ShipMate" in Nunito Bold with package-icon replacing the dot on "i". Hebrew version: שיפמייט in Heebo Bold. Works in coral-on-white, white-on-teal, monochrome.

## Architecture

### GCP Services (all free tier)

| Service | Purpose |
|---------|---------|
| Cloud Run | Next.js app (storefront + admin + API) |
| Firestore | ALL data storage |
| Cloud Functions 2nd gen | Background jobs |
| Cloud Storage | Images, invoices |
| Cloud Tasks | Job orchestration |
| Cloud Scheduler | 1 dispatcher job (30 min interval) |
| Secret Manager | API keys |
| Cloud Build + Artifact Registry | CI/CD |

### Tech Stack

- Next.js 14 (App Router) + Tailwind CSS + RTL
- Firebase Admin SDK (Firestore)
- NextAuth.js (admin auth)
- Meshulam (Israeli payments)
- WhatsApp Business API
- Gmail API (transactional email)
- Cloud Translation API (Hebrew)
- Docker → Cloud Run

### Firestore Collections

```
products/{id}           - product catalog
orders/{id}             - orders with embedded items
customers/{id}          - customer profiles
categories/{id}         - product categories
reviews/{id}            - product reviews
coupons/{id}            - discount codes
invoices/{id}           - tax invoices
carts/{sessionId}       - shopping carts
sessions/{sessionId}    - user sessions
cache/{key}             - exchange rates, trending
viralPosts/{id}         - marketing content
marketingCampaigns/{id} - campaign tracking
supportTickets/{id}     - customer support
siteSettings/{key}      - store config
searchIndex/{id}        - tokenized search
counters/{name}         - auto-increment counters
```

### Key Decisions

1. **No Cloud SQL** — Firestore for everything, $0/mo
2. **Denormalization** — orders embed customer/product data
3. **Search** — tokenized searchIndex collection with array-contains-any
4. **Auto-increment** — Firestore transactions on counters collection
5. **1 scheduler job** — dispatcher fans out based on time of day
6. **Placeholder secrets** — user fills in real API keys later

## Phases

1. GCP setup + Next.js init + Firestore schema + config
2. AliExpress scraper + trends + product import + image processing
3. Storefront (layout, home, products, cart, checkout, search)
4. Payments (Meshulam, invoices, pricing)
5. Order management + WhatsApp + email
6. Admin dashboard
7. Marketing (pixels, SEO, viral, referrals, cart recovery)
8. Customer support
9. Deployment (CI/CD, monitoring)
10. Launch prep (validation, seed data)

## Website Design

- Mobile-first, RTL Hebrew throughout
- Warm coral/teal palette, rounded corners, generous whitespace
- Product cards: white with shadow, image top 60%, coral price
- Trust bar with package/shield/return/chat icons
- Sticky bottom nav on mobile (home, categories, search, cart)
- Floating WhatsApp button, cart drawer from left (RTL)
- SVG logo generated in code (no external assets needed)
