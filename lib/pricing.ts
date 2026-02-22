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
