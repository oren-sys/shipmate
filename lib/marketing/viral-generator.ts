/**
 * Viral Content Generator
 *
 * Generates Hebrew marketing content for social media platforms:
 * - TikTok/Reel captions
 * - Facebook ad copy
 * - Instagram story text
 * - WhatsApp broadcasts
 * - Google Ads headlines
 *
 * Features:
 * - Hebrew hashtag generator
 * - Content templates by category
 * - Saves to Firestore viralPosts collection
 */

import { getDb } from "@/lib/firebase";

// ---------- Types ----------

export type Platform = "tiktok" | "instagram" | "facebook" | "whatsapp" | "google_ads";

export interface ViralContent {
  platform: Platform;
  caption: string;
  hashtags: string[];
  callToAction: string;
  emoji: string;
}

export interface ProductInput {
  titleHe: string;
  titleEn?: string;
  price: number;
  compareAtPrice?: number;
  category?: string;
  features?: string[];
}

// ---------- Hebrew Hashtag Bank ----------

const hashtagBank: Record<string, string[]> = {
  general: [
    "שיפמייט", "ShipMate", "דילים", "מבצעים", "קניותאונליין",
    "משלוחחינם", "ישראל", "מומלץ", "חדש", "טרנדי",
    "שווהלגלות", "מתנהמושלמת", "איכות", "זול",
  ],
  electronics: [
    "טכנולוגיה", "גאדג׳טים", "אלקטרוניקה", "חכם", "בלוטוס",
    "אוזניות", "שעוןחכם", "טעינה", "USB", "LED",
  ],
  home: [
    "עיצובבית", "בית", "מטבח", "סלון", "נוחות",
    "חדשבבית", "סדרוארגון", "אווירה", "עיצוב",
  ],
  fashion: [
    "אופנה", "סטייל", "לוקחדש", "אביזרים", "תיקים",
    "שעונים", "תכשיטים", "טרנד2025",
  ],
  health: [
    "בריאות", "כושר", "ספורט", "מסאג׳", "רגיעה",
    "יוגה", "אימון", "חייםבריאים",
  ],
  kids: [
    "ילדים", "צעצועים", "משחקים", "חינוכי", "כיף",
    "משפחה", "הורים", "מתנהלילדים",
  ],
};

// ---------- Caption Templates ----------

const tiktokTemplates = [
  "אתם לא מאמינים כמה ה{product} הזה טוב 🔥 לינק בביו!",
  "POV: הזמנתם {product} ב-₪{price} והוא הגיע! 📦✨",
  "מי עוד צריך {product}? רק ₪{price}! 🛒 #שיפמייט",
  "ה{product} הזה שינה לי את החיים!! 😍 שווה כל שקל",
  "אם עדיין לא קניתם {product} אתם מפספסים! 🚀",
  "ניסיתי {product} וזה מ-ד-ה-י-ם! ₪{price} בלבד 💫",
  "GRWM עם ה{product} החדש שלי 🤩 {discount} הנחה!",
  "הדבר הכי שווה שקניתי החודש: {product} 🏆",
];

const instagramTemplates = [
  "✨ חדש באתר!\n\n{product}\n{description}\n\n💰 רק ₪{price}{discountLine}\n🚚 משלוח חינם מעל ₪199\n\n🛒 לינק בביו\n\n{hashtags}",
  "עדיין לא מכירים את ה{product}? 🤔\n\nהנה הסיבות שאתם חייבים אותו:\n{features}\n\n💰 ₪{price} בלבד\n🛒 shipmate.store\n\n{hashtags}",
  "📸 Product of the day\n\n{product}\n{description}\n\n{discountLine}\n🛒 הזמינו עכשיו בלינק שבביו!\n\n{hashtags}",
];

const facebookTemplates = [
  "🎉 מוצר חדש באתר!\n\n{product}\n{description}\n\n💰 רק ₪{price}{discountLine}\n🚚 משלוח חינם מעל ₪199\n💳 תשלום מאובטח\n\n🛒 להזמנה: shipmate.store",
  "🔥 דיל היום!\n\n{product} ב-₪{price} בלבד!{discountLine}\n\n{features}\n\n⏰ מלאי מוגבל\n🛒 shipmate.store",
  "מי פה אוהב דילים? 🙋‍♀️\n\n{product} עכשיו ב-₪{price}!{discountLine}\n\n✅ איכות מעולה\n✅ משלוח מהיר\n✅ 100% שביעות רצון\n\n🛒 shipmate.store",
];

const whatsappTemplates = [
  "היי! 👋\nרצינו לספר לכם על {product} החדש שלנו!\n\n💰 רק ₪{price}{discountLine}\n🚚 משלוח חינם מעל ₪199\n\n🛒 להזמנה: shipmate.store",
  "🎁 מבצע מיוחד!\n\n{product} ב-₪{price} בלבד!{discountLine}\n\nלהזמנה מהירה: shipmate.store\n\nהמלאי מוגבל! ⏰",
  "✨ חדש בShipMate!\n\n{product}\n₪{price}{discountLine}\n\n👉 shipmate.store",
];

const googleAdsTemplates = {
  headlines: [
    "{product} | ₪{price}",
    "{product} במבצע!",
    "דיל: {product}",
    "חדש! {product}",
    "₪{price} בלבד | {product}",
    "משלוח חינם | {product}",
    "{discount} הנחה | ShipMate",
  ],
  descriptions: [
    "{product} באיכות מעולה. רק ₪{price}. משלוח חינם מעל ₪199. הזמינו עכשיו!",
    "קנו {product} ב-₪{price} בלבד. {discount} הנחה. תשלום מאובטח. ShipMate.",
    "חדש! {product}. מחיר מיוחד ₪{price}. משלוח מהיר. 100% שביעות רצון.",
  ],
};

// ---------- Generator Functions ----------

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fillTemplate(template: string, product: ProductInput): string {
  const discount = product.compareAtPrice
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const discountLine = discount > 0
    ? `\n🏷️ ${discount}% הנחה! (במקום ₪${product.compareAtPrice})`
    : "";

  const features = product.features
    ? product.features.map((f) => `✅ ${f}`).join("\n")
    : "✅ איכות מעולה\n✅ משלוח מהיר\n✅ ביטול חינם";

  return template
    .replace(/\{product\}/g, product.titleHe)
    .replace(/\{price\}/g, product.price.toFixed(0))
    .replace(/\{discount\}/g, discount > 0 ? `${discount}%` : "")
    .replace(/\{discountLine\}/g, discountLine)
    .replace(/\{description\}/g, `מוצר איכותי ב-ShipMate`)
    .replace(/\{features\}/g, features)
    .replace(/\{hashtags\}/g, ""); // Hashtags added separately
}

export function getHashtags(category?: string, count: number = 12): string[] {
  const tags = [...hashtagBank.general];

  if (category) {
    const categoryKey = Object.keys(hashtagBank).find((key) =>
      category.includes(key) || key.includes(category.toLowerCase())
    );
    if (categoryKey && hashtagBank[categoryKey]) {
      tags.push(...hashtagBank[categoryKey]);
    }
  }

  // Shuffle and pick
  const shuffled = tags.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function generateTikTokCaption(product: ProductInput): ViralContent {
  const template = pickRandom(tiktokTemplates);
  const hashtags = getHashtags(product.category, 6);

  return {
    platform: "tiktok",
    caption: fillTemplate(template, product),
    hashtags,
    callToAction: "🔗 לינק בביו",
    emoji: "🎵",
  };
}

export function generateInstagramCaption(product: ProductInput): ViralContent {
  const template = pickRandom(instagramTemplates);
  const hashtags = getHashtags(product.category, 15);
  const hashtagString = hashtags.map((h) => `#${h}`).join(" ");

  return {
    platform: "instagram",
    caption: fillTemplate(template, product).replace("{hashtags}", hashtagString),
    hashtags,
    callToAction: "🛒 לינק בביו",
    emoji: "📸",
  };
}

export function generateFacebookPost(product: ProductInput): ViralContent {
  const template = pickRandom(facebookTemplates);

  return {
    platform: "facebook",
    caption: fillTemplate(template, product),
    hashtags: getHashtags(product.category, 5),
    callToAction: "🛒 shipmate.store",
    emoji: "📘",
  };
}

export function generateWhatsAppBroadcast(product: ProductInput): ViralContent {
  const template = pickRandom(whatsappTemplates);

  return {
    platform: "whatsapp",
    caption: fillTemplate(template, product),
    hashtags: [],
    callToAction: "👉 shipmate.store",
    emoji: "💬",
  };
}

export function generateGoogleAds(product: ProductInput): {
  headlines: string[];
  descriptions: string[];
} {
  return {
    headlines: googleAdsTemplates.headlines.map((t) => fillTemplate(t, product).substring(0, 30)),
    descriptions: googleAdsTemplates.descriptions.map((t) => fillTemplate(t, product).substring(0, 90)),
  };
}

// ---------- Batch Generator ----------

export function generateAllPlatforms(product: ProductInput): ViralContent[] {
  return [
    generateTikTokCaption(product),
    generateInstagramCaption(product),
    generateFacebookPost(product),
    generateWhatsAppBroadcast(product),
  ];
}

// ---------- Save to Firestore ----------

export async function saveViralPost(content: ViralContent & { productId?: string }) {
  const db = getDb();

  const ref = db.collection("viralPosts").doc();
  await ref.set({
    ...content,
    status: "draft",
    createdAt: new Date().toISOString(),
    engagement: 0,
  });

  return ref.id;
}

export async function scheduleViralPost(postId: string, scheduledAt: string) {
  const db = getDb();

  await db.collection("viralPosts").doc(postId).update({
    status: "scheduled",
    scheduledAt,
    updatedAt: new Date().toISOString(),
  });
}
