/**
 * Referral & Loyalty System
 *
 * - Unique referral codes per customer
 * - WhatsApp share link generation
 * - Track referral conversions
 * - Both referrer + referee get 15% off
 * - Points system: 1 point per ₪1 spent
 *
 * Firestore collections: referrals, loyaltyPoints
 */

import { getDb } from "@/lib/firebase";

// ---------- Types ----------

export interface ReferralCode {
  code: string;
  customerId: string;
  customerName: string;
  totalReferrals: number;
  totalConversions: number;
  totalRevenueGenerated: number;
  isActive: boolean;
  createdAt: string;
}

export interface ReferralConversion {
  referralCode: string;
  referrerId: string;
  refereeId: string;
  refereeOrderId: string;
  orderTotal: number;
  referrerDiscount: number;
  refereeDiscount: number;
  status: "pending" | "completed" | "cancelled";
  createdAt: string;
}

export interface LoyaltyAccount {
  customerId: string;
  totalPoints: number;
  availablePoints: number;
  redeemedPoints: number;
  tier: "bronze" | "silver" | "gold" | "vip";
  history: LoyaltyTransaction[];
  updatedAt: string;
}

export interface LoyaltyTransaction {
  type: "earn" | "redeem" | "bonus" | "referral";
  points: number;
  description: string;
  orderId?: string;
  timestamp: string;
}

// ---------- Referral Code Generation ----------

const CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion

function generateCode(prefix: string = "SM"): string {
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += CHARSET[Math.floor(Math.random() * CHARSET.length)];
  }
  return code;
}

// ---------- Referral System ----------

export async function createReferralCode(
  customerId: string,
  customerName: string
): Promise<string> {
  const db = getDb();

  // Check if customer already has a code
  const existing = await db
    .collection("referrals")
    .where("customerId", "==", customerId)
    .where("isActive", "==", true)
    .limit(1)
    .get();

  if (!existing.empty) {
    return existing.docs[0].data().code as string;
  }

  // Generate unique code
  let code = generateCode();
  let attempts = 0;

  while (attempts < 10) {
    const dup = await db
      .collection("referrals")
      .where("code", "==", code)
      .limit(1)
      .get();

    if (dup.empty) break;
    code = generateCode();
    attempts++;
  }

  const referral: ReferralCode = {
    code,
    customerId,
    customerName,
    totalReferrals: 0,
    totalConversions: 0,
    totalRevenueGenerated: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  await db.collection("referrals").doc(code).set(referral);

  return code;
}

export async function getReferralByCode(
  code: string
): Promise<ReferralCode | null> {
  const db = getDb();
  const doc = await db.collection("referrals").doc(code).get();

  if (!doc.exists) return null;
  return doc.data() as ReferralCode;
}

export async function trackReferralClick(code: string): Promise<void> {
  const db = getDb();
  const ref = db.collection("referrals").doc(code);
  const doc = await ref.get();

  if (!doc.exists) return;

  await ref.update({
    totalReferrals: (doc.data()?.totalReferrals || 0) + 1,
  });
}

export async function convertReferral(params: {
  referralCode: string;
  refereeId: string;
  refereeOrderId: string;
  orderTotal: number;
}): Promise<{ referrerDiscount: number; refereeDiscount: number }> {
  const db = getDb();
  const referral = await getReferralByCode(params.referralCode);

  if (!referral || !referral.isActive) {
    return { referrerDiscount: 0, refereeDiscount: 0 };
  }

  const discountPercent = 15;
  const referrerDiscount = Math.round(params.orderTotal * (discountPercent / 100));
  const refereeDiscount = Math.round(params.orderTotal * (discountPercent / 100));

  // Record conversion
  const conversion: ReferralConversion = {
    referralCode: params.referralCode,
    referrerId: referral.customerId,
    refereeId: params.refereeId,
    refereeOrderId: params.refereeOrderId,
    orderTotal: params.orderTotal,
    referrerDiscount,
    refereeDiscount,
    status: "completed",
    createdAt: new Date().toISOString(),
  };

  await db.collection("referralConversions").add(conversion);

  // Update referral stats
  await db.collection("referrals").doc(params.referralCode).update({
    totalConversions: (referral.totalConversions || 0) + 1,
    totalRevenueGenerated: (referral.totalRevenueGenerated || 0) + params.orderTotal,
  });

  // Award bonus loyalty points to referrer
  await addLoyaltyPoints(referral.customerId, 50, "referral", "בונוס הפניה - חבר קנה!");

  return { referrerDiscount, refereeDiscount };
}

// ---------- WhatsApp Share ----------

export function generateWhatsAppShareLink(
  referralCode: string,
  productName?: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://shipmate.store";
  const referralUrl = `${baseUrl}?ref=${referralCode}`;

  const message = productName
    ? `היי! 🎁 מצאתי משהו מדהים ב-ShipMate: ${productName}\nקבלו 15% הנחה עם הקוד שלי!\n👉 ${referralUrl}`
    : `היי! 🎁 בואו לגלות את ShipMate - מוצרים מדהימים במחירים משוגעים!\nקבלו 15% הנחה עם הקוד שלי!\n👉 ${referralUrl}`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

// ---------- Loyalty Points ----------

const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 2000,
  vip: 5000,
};

function calculateTier(totalPoints: number): LoyaltyAccount["tier"] {
  if (totalPoints >= TIER_THRESHOLDS.vip) return "vip";
  if (totalPoints >= TIER_THRESHOLDS.gold) return "gold";
  if (totalPoints >= TIER_THRESHOLDS.silver) return "silver";
  return "bronze";
}

export async function getLoyaltyAccount(
  customerId: string
): Promise<LoyaltyAccount | null> {
  const db = getDb();
  const doc = await db.collection("loyaltyPoints").doc(customerId).get();

  if (!doc.exists) return null;
  return doc.data() as LoyaltyAccount;
}

export async function addLoyaltyPoints(
  customerId: string,
  points: number,
  type: LoyaltyTransaction["type"],
  description: string,
  orderId?: string
): Promise<LoyaltyAccount> {
  const db = getDb();
  const ref = db.collection("loyaltyPoints").doc(customerId);
  const doc = await ref.get();

  const transaction: LoyaltyTransaction = {
    type,
    points,
    description,
    orderId,
    timestamp: new Date().toISOString(),
  };

  if (!doc.exists) {
    // Create new account
    const account: LoyaltyAccount = {
      customerId,
      totalPoints: points,
      availablePoints: points,
      redeemedPoints: 0,
      tier: calculateTier(points),
      history: [transaction],
      updatedAt: new Date().toISOString(),
    };
    await ref.set(account);
    return account;
  }

  const existing = doc.data() as LoyaltyAccount;
  const newTotal = existing.totalPoints + points;
  const newAvailable = existing.availablePoints + points;

  const updated: Partial<LoyaltyAccount> = {
    totalPoints: newTotal,
    availablePoints: newAvailable,
    tier: calculateTier(newTotal),
    history: [...(existing.history || []).slice(-49), transaction], // Keep last 50
    updatedAt: new Date().toISOString(),
  };

  await ref.update(updated);

  return { ...existing, ...updated } as LoyaltyAccount;
}

export async function redeemLoyaltyPoints(
  customerId: string,
  points: number,
  orderId: string
): Promise<{ success: boolean; discount: number }> {
  const db = getDb();
  const account = await getLoyaltyAccount(customerId);

  if (!account || account.availablePoints < points) {
    return { success: false, discount: 0 };
  }

  // 100 points = ₪5 discount
  const discount = Math.floor(points / 100) * 5;

  const transaction: LoyaltyTransaction = {
    type: "redeem",
    points: -points,
    description: `מימוש נקודות - הנחה ₪${discount}`,
    orderId,
    timestamp: new Date().toISOString(),
  };

  await db
    .collection("loyaltyPoints")
    .doc(customerId)
    .update({
      availablePoints: account.availablePoints - points,
      redeemedPoints: (account.redeemedPoints || 0) + points,
      history: [...(account.history || []).slice(-49), transaction],
      updatedAt: new Date().toISOString(),
    });

  return { success: true, discount };
}

export async function awardPurchasePoints(
  customerId: string,
  orderTotal: number,
  orderId: string
): Promise<number> {
  // 1 point per ₪1 spent
  const points = Math.floor(orderTotal);

  if (points <= 0) return 0;

  await addLoyaltyPoints(
    customerId,
    points,
    "earn",
    `נקודות על הזמנה ₪${orderTotal.toFixed(0)}`,
    orderId
  );

  return points;
}

// ---------- Tier Benefits ----------

export function getTierBenefits(tier: LoyaltyAccount["tier"]): {
  discountPercent: number;
  freeShipping: boolean;
  pointsMultiplier: number;
  label: string;
  labelHe: string;
} {
  switch (tier) {
    case "vip":
      return {
        discountPercent: 10,
        freeShipping: true,
        pointsMultiplier: 3,
        label: "VIP",
        labelHe: "VIP",
      };
    case "gold":
      return {
        discountPercent: 7,
        freeShipping: true,
        pointsMultiplier: 2,
        label: "Gold",
        labelHe: "זהב",
      };
    case "silver":
      return {
        discountPercent: 5,
        freeShipping: false,
        pointsMultiplier: 1.5,
        label: "Silver",
        labelHe: "כסף",
      };
    default:
      return {
        discountPercent: 0,
        freeShipping: false,
        pointsMultiplier: 1,
        label: "Bronze",
        labelHe: "ארד",
      };
  }
}
