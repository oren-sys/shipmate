# ShipMate Store Fixes — Design Document

**Date:** 2026-02-24
**Status:** Approved

## Overview

8 fixes/features for the ShipMate dropshipping store (shipmate.store). Covers product import quality, data cleanup, coupon management, support system verification, and shipping time accuracy.

## Task 1: Fix English Descriptions on Imported Products

**Problem:** Import translates titles but descriptions stay in English.

**Solution:**
- Import process: add `translateToHebrew()` call for descriptions in `/app/api/admin/products/import/route.ts`
- Existing products: batch-translate all products with English-only descriptions via admin script/endpoint
- Store `description` (EN) + `descriptionHe` (HE), display Hebrew on storefront

## Task 2: Category Mismatch

**Problem:** Site has 6 seeded categories. AliExpress mapping defines 10. Import sets `category: ""`.

**Solution:**
- Sync Firestore `categories` collection to match all 10 categories from `lib/aliexpress/categories.ts`
- During scan import: auto-assign category based on AliExpress feed category
- During URL import: use keyword matching on AliExpress product category to suggest best site category
- Pass category through during the entire import flow

## Task 3: Snappier Hebrew Titles

**Problem:** Auto-translated titles are too literal/long. Need shorter, more appealing marketing-style titles.

**Solution:**
- After Google Translate, apply a post-processing step to shorten/improve titles
- Use AI prompt or heuristic: max 6-8 words, remove technical jargon, make appealing
- Admin can still manually edit titles

## Task 4: Delete All Demo Data

**Problem:** Seed data pollutes the live store.

**What to delete:**
- All documents from: `orders`, `customers`, `reviews`, `supportTickets`
- Demo products (those without `aliexpressId`)
- Demo coupons (WELCOME15, SHARE10)

**What to keep:**
- Categories (needed for navigation)
- Real imported products (have `aliexpressId`)
- Settings/configuration docs

**Method:** Admin script that queries and batch-deletes from Firestore.

## Task 5: Edit & Delete Coupons

**Problem:** Admin can create coupons but cannot edit or delete them.

**Solution:**
- Add `updateCoupon()` and `deleteCoupon()` to `lib/firestore/coupons.ts`
- Add/update API endpoints: `PUT` for full update, `DELETE` for removal
- Update admin coupons page: edit modal with all fields, delete button with confirmation dialog
- Fix field name mismatch between API route and Firestore schema

## Task 6 & 7: Support System & Email Verification

**Problem:** Need to verify support system works and check support@shipmate.store.

**Findings:**
- WhatsApp link on contact page has no phone number (`href="https://wa.me/"`)
- Support ticket detail page may be missing
- Email uses Resend — domain verification status unknown

**Solution:**
- Fix WhatsApp link with actual business phone number
- Verify/create support ticket detail page `/admin/support/[id]`
- Document steps for Resend domain verification (DNS records: MX, SPF, DKIM)
- Verify contact form submission actually creates support tickets

## Task 8: Realistic Shipping Time

**Problem:** AliExpress delivery estimates not extracted. Store shows blanket "14 business days".

**Solution:**
- Parse shipping/delivery data from AliExpress API response during import
- Calculate: `shippingDays = Math.ceil(aliexpressDays * 1.15)` (15% buffer)
- Store per-product in `shippingDays` field
- Display on product page
- Default fallback: 21 business days if no AliExpress data
