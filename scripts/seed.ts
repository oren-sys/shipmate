/**
 * ShipMate Seed Data Script
 *
 * Populates Firestore with:
 * 1. Site settings (store name, policies, thresholds)
 * 2. 6 categories with Hebrew names
 * 3. 25 sample products with Hebrew descriptions
 * 4. Coupon codes (WELCOME15, SHARE10)
 * 5. Sample reviews
 * 6. Counter docs (orders, invoices)
 *
 * Run: npx tsx scripts/seed.ts
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || "dropship-488214",
  });
}

const db = admin.firestore();

// ---------- Helpers ----------

function slug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\u0590-\u05FF]+/g, "-")
    .replace(/^-|-$/g, "");
}

const now = admin.firestore.Timestamp.now();

// ---------- Categories ----------

const categories = [
  {
    slug: "electronics",
    name: "Electronics",
    nameHe: "אלקטרוניקה",
    description: "גאדג׳טים ואביזרי טכנולוגיה",
    image: "https://storage.googleapis.com/dropship-488214-assets/categories/electronics.jpg",
    order: 1,
    active: true,
  },
  {
    slug: "home",
    name: "Home & Living",
    nameHe: "בית ומגורים",
    description: "מוצרים לבית, מטבח וסלון",
    image: "https://storage.googleapis.com/dropship-488214-assets/categories/home.jpg",
    order: 2,
    active: true,
  },
  {
    slug: "fashion",
    name: "Fashion & Accessories",
    nameHe: "אופנה ואביזרים",
    description: "תיקים, שעונים, תכשיטים ואביזרים",
    image: "https://storage.googleapis.com/dropship-488214-assets/categories/fashion.jpg",
    order: 3,
    active: true,
  },
  {
    slug: "health",
    name: "Health & Fitness",
    nameHe: "בריאות וכושר",
    description: "ציוד ספורט, כושר ובריאות",
    image: "https://storage.googleapis.com/dropship-488214-assets/categories/health.jpg",
    order: 4,
    active: true,
  },
  {
    slug: "kids",
    name: "Kids & Toys",
    nameHe: "ילדים וצעצועים",
    description: "צעצועים, משחקים ומוצרים לילדים",
    image: "https://storage.googleapis.com/dropship-488214-assets/categories/kids.jpg",
    order: 5,
    active: true,
  },
  {
    slug: "automotive",
    name: "Automotive",
    nameHe: "רכב",
    description: "אביזרי רכב ואלקטרוניקה לרכב",
    image: "https://storage.googleapis.com/dropship-488214-assets/categories/automotive.jpg",
    order: 6,
    active: true,
  },
];

// ---------- Products ----------

const products = [
  // Electronics (5)
  {
    titleHe: "אוזניות בלוטוס אלחוטיות Pro",
    titleEn: "Wireless Bluetooth Earbuds Pro",
    descriptionHe: "אוזניות בלוטוס 5.3 עם ביטול רעשים אקטיבי, סוללה ל-30 שעות, עמידות במים IPX5. צליל סטריאו HD איכותי.",
    costPrice: 8,
    price: 79,
    compareAtPrice: 129,
    category: "electronics",
    tags: ["אוזניות", "בלוטוס", "אלחוטי"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/earbuds-1.jpg"],
    weight: 0.05,
  },
  {
    titleHe: "מטען אלחוטי מהיר 15W",
    titleEn: "Fast Wireless Charger 15W",
    descriptionHe: "מטען אלחוטי Qi עם טעינה מהירה 15 וואט. תואם לכל הסמארטפונים, עיצוב דק ואלגנטי עם LED חיווי.",
    costPrice: 5,
    price: 49,
    compareAtPrice: 79,
    category: "electronics",
    tags: ["מטען", "אלחוטי", "טעינה"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/charger-1.jpg"],
    weight: 0.1,
  },
  {
    titleHe: "רמקול בלוטוס נייד עמיד במים",
    titleEn: "Portable Waterproof Bluetooth Speaker",
    descriptionHe: "רמקול בלוטוס 20W עם באס עמוק, עמיד במים IPX7, סוללה ל-12 שעות. מושלם לים, בריכה וטיולים.",
    costPrice: 12,
    price: 99,
    compareAtPrice: 149,
    category: "electronics",
    tags: ["רמקול", "בלוטוס", "עמיד במים"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/speaker-1.jpg"],
    weight: 0.3,
  },
  {
    titleHe: "שעון חכם ספורט עם GPS",
    titleEn: "Smart Sports Watch with GPS",
    descriptionHe: "שעון חכם עם GPS מובנה, מד דופק, מד צעדים, מעקב שינה. עמיד במים 5ATM. מסך AMOLED 1.4 אינץ׳.",
    costPrice: 18,
    price: 149,
    compareAtPrice: 249,
    category: "electronics",
    tags: ["שעון חכם", "ספורט", "GPS"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/watch-1.jpg"],
    weight: 0.05,
  },
  {
    titleHe: "מנורת LED שולחנית חכמה",
    titleEn: "Smart LED Desk Lamp",
    descriptionHe: "מנורת LED עם 5 מצבי תאורה, בקרת עמעום, טעינה אלחוטית מובנית לטלפון. עיצוב מינימליסטי.",
    costPrice: 10,
    price: 89,
    compareAtPrice: 139,
    category: "electronics",
    tags: ["מנורה", "LED", "חכם"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/lamp-1.jpg"],
    weight: 0.5,
  },

  // Home & Living (5)
  {
    titleHe: "סט סכיני שף מקצועי 6 חלקים",
    titleEn: "Professional Chef Knife Set 6pcs",
    descriptionHe: "סט סכינים מנירוסטה יפנית עם ידית ארגונומית. כולל סכין שף, סנטוקו, לחם, ירקות, קילוף ומעמד עץ.",
    costPrice: 15,
    price: 129,
    compareAtPrice: 199,
    category: "home",
    tags: ["סכינים", "מטבח", "שף"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/knives-1.jpg"],
    weight: 1.2,
  },
  {
    titleHe: "מפזר שמנים אתריים אולטרסוני",
    titleEn: "Ultrasonic Essential Oil Diffuser",
    descriptionHe: "מפזר ריח אולטרסוני 500 מ\"ל עם 7 צבעי LED, טיימר אוטומטי, עיצוב עץ אלגנטי. יוצר אווירה מרגיעה.",
    costPrice: 7,
    price: 69,
    compareAtPrice: 99,
    category: "home",
    tags: ["מפזר", "ארומתרפיה", "עיצוב"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/diffuser-1.jpg"],
    weight: 0.4,
  },
  {
    titleHe: "מארגן מגירות מודולרי - סט 8",
    titleEn: "Modular Drawer Organizer Set of 8",
    descriptionHe: "סט 8 קופסאות ארגון למגירות בגדלים שונים. חומר פלסטיק איכותי, קל לניקוי. מושלם למטבח, חדר שינה ומשרד.",
    costPrice: 4,
    price: 39,
    compareAtPrice: 59,
    category: "home",
    tags: ["ארגון", "מגירות", "סדר"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/organizer-1.jpg"],
    weight: 0.3,
  },
  {
    titleHe: "שמיכה מחוממת חשמלית כפולה",
    titleEn: "Electric Heated Blanket Double",
    descriptionHe: "שמיכה חשמלית רכה ונעימה, 3 רמות חום, כיבוי אוטומטי, ניתנת לכביסה. גודל כפול 180x130 ס\"מ.",
    costPrice: 16,
    price: 139,
    compareAtPrice: 199,
    category: "home",
    tags: ["שמיכה", "חימום", "חורף"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/blanket-1.jpg"],
    weight: 1.0,
  },
  {
    titleHe: "תאורת LED רצועה RGB 5 מטר",
    titleEn: "RGB LED Strip Light 5m",
    descriptionHe: "רצועת LED RGB 5 מטר עם שלט רחוק, 16 מיליון צבעים, חיבור WiFi ושליטה מהאפליקציה. מושלם לסלון ולחדר שינה.",
    costPrice: 6,
    price: 59,
    compareAtPrice: 89,
    category: "home",
    tags: ["LED", "תאורה", "עיצוב"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/led-strip-1.jpg"],
    weight: 0.2,
  },

  // Fashion (5)
  {
    titleHe: "תיק גב עסקי עם תא למחשב נייד",
    titleEn: "Business Backpack with Laptop Compartment",
    descriptionHe: "תיק גב אלגנטי עם תא מרופד למחשב 15.6 אינץ׳, חומר עמיד למים, פורט USB לטעינה, כיסים מאורגנים.",
    costPrice: 14,
    price: 119,
    compareAtPrice: 179,
    category: "fashion",
    tags: ["תיק", "מחשב נייד", "עסקי"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/backpack-1.jpg"],
    weight: 0.7,
  },
  {
    titleHe: "משקפי שמש פולארויד יוניסקס",
    titleEn: "Polarized Unisex Sunglasses",
    descriptionHe: "משקפי שמש פולארויד עם הגנת UV400, מסגרת קלת משקל, עדשות מקוטבות. עיצוב קלאסי שמתאים לכולם.",
    costPrice: 3,
    price: 39,
    compareAtPrice: 69,
    category: "fashion",
    tags: ["משקפיים", "שמש", "אופנה"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/sunglasses-1.jpg"],
    weight: 0.03,
  },
  {
    titleHe: "ארנק עור PU מינימליסטי RFID",
    titleEn: "Minimalist PU Leather RFID Wallet",
    descriptionHe: "ארנק דק ואלגנטי מעור PU איכותי עם הגנת RFID. 6 תאים לכרטיסים, תא לשטרות, עיצוב slim.",
    costPrice: 4,
    price: 49,
    compareAtPrice: 79,
    category: "fashion",
    tags: ["ארנק", "עור", "RFID"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/wallet-1.jpg"],
    weight: 0.08,
  },
  {
    titleHe: "שרשרת נירוסטה זהב - עיצוב מינימליסטי",
    titleEn: "Gold Stainless Steel Minimalist Necklace",
    descriptionHe: "שרשרת נירוסטה בציפוי זהב 18K, עמידה בפני מים וזיעה. עיצוב עדין ומינימליסטי, אורך 45+5 ס\"מ.",
    costPrice: 3,
    price: 35,
    compareAtPrice: 59,
    category: "fashion",
    tags: ["שרשרת", "תכשיטים", "זהב"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/necklace-1.jpg"],
    weight: 0.02,
  },
  {
    titleHe: "חגורת עור אמיתי לגבר",
    titleEn: "Genuine Leather Men Belt",
    descriptionHe: "חגורה מעור אמיתי עם אבזם אוטומטי. רוחב 3.5 ס\"מ, ניתן לחיתוך לאורך המתאים. בצבע שחור/חום.",
    costPrice: 5,
    price: 55,
    compareAtPrice: 89,
    category: "fashion",
    tags: ["חגורה", "עור", "גבר"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/belt-1.jpg"],
    weight: 0.15,
  },

  // Health & Fitness (5)
  {
    titleHe: "אקדח עיסוי מקצועי 30 מהירויות",
    titleEn: "Professional Massage Gun 30 Speeds",
    descriptionHe: "אקדח עיסוי עם 30 מהירויות ו-6 ראשי עיסוי. מנוע שקט, סוללה ל-6 שעות. מושלם לאחרי אימון.",
    costPrice: 20,
    price: 169,
    compareAtPrice: 269,
    category: "health",
    tags: ["עיסוי", "כושר", "שרירים"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/massage-gun-1.jpg"],
    weight: 0.8,
  },
  {
    titleHe: "גומיות כושר - סט 5 רמות",
    titleEn: "Resistance Bands Set 5 Levels",
    descriptionHe: "סט 5 גומיות התנגדות ברמות שונות, לטקס טבעי. כולל תיק נשיאה. מושלם לאימון בבית ובטיול.",
    costPrice: 3,
    price: 35,
    compareAtPrice: 55,
    category: "health",
    tags: ["גומיות", "כושר", "אימון"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/bands-1.jpg"],
    weight: 0.2,
  },
  {
    titleHe: "בקבוק מים חכם עם תזכורת שתייה",
    titleEn: "Smart Water Bottle with Drinking Reminder",
    descriptionHe: "בקבוק 750 מ\"ל עם חיישן טמפרטורה ותזכורת שתייה LED. נירוסטה כפולה, שומר קר 24 שעות / חם 12 שעות.",
    costPrice: 7,
    price: 65,
    compareAtPrice: 99,
    category: "health",
    tags: ["בקבוק", "מים", "חכם"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/bottle-1.jpg"],
    weight: 0.3,
  },
  {
    titleHe: "משקל דיגיטלי חכם עם אפליקציה",
    titleEn: "Smart Digital Scale with App",
    descriptionHe: "משקל גוף דיגיטלי חכם, מודד 13 מדדים (משקל, שומן, שריר, מים). חיבור Bluetooth לאפליקציה. עד 180 ק\"ג.",
    costPrice: 8,
    price: 79,
    compareAtPrice: 129,
    category: "health",
    tags: ["משקל", "דיגיטלי", "כושר"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/scale-1.jpg"],
    weight: 1.5,
  },
  {
    titleHe: "מזרן יוגה מקצועי 6 מ\"מ",
    titleEn: "Professional Yoga Mat 6mm",
    descriptionHe: "מזרן יוגה TPE ידידותי לסביבה, עובי 6 מ\"מ, אנטי החלקה דו צדדי. קל לנשיאה עם רצועה. 183x61 ס\"מ.",
    costPrice: 6,
    price: 59,
    compareAtPrice: 89,
    category: "health",
    tags: ["יוגה", "מזרן", "ספורט"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/yoga-mat-1.jpg"],
    weight: 0.8,
  },

  // Kids & Toys (3)
  {
    titleHe: "ערכת ציור מקצועית לילדים 150 חלקים",
    titleEn: "Kids Professional Art Set 150pcs",
    descriptionHe: "ערכת ציור מקיפה: צבעי מים, צבעי שמן, מרקרים, עפרונות צבעוניים, פסטלים ועוד. מארז עץ יוקרתי.",
    costPrice: 9,
    price: 79,
    compareAtPrice: 129,
    category: "kids",
    tags: ["ציור", "יצירה", "ילדים"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/art-set-1.jpg"],
    weight: 1.0,
  },
  {
    titleHe: "רובוט חינוכי מתכנת לילדים",
    titleEn: "Educational Programmable Robot for Kids",
    descriptionHe: "רובוט חינוכי שמלמד תכנות בצורה משחקית. שלט רחוק, חיישני מגע, LED צבעוני. גילאי 6+.",
    costPrice: 14,
    price: 119,
    compareAtPrice: 189,
    category: "kids",
    tags: ["רובוט", "חינוכי", "תכנות"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/robot-1.jpg"],
    weight: 0.5,
  },
  {
    titleHe: "אוהל משחק לילדים עם תאורת כוכבים",
    titleEn: "Kids Play Tent with Star Lights",
    descriptionHe: "אוהל משחק מהאגדות עם תאורת LED כוכבים, חלונות רשת, דלת נפתחת. קל להרכבה ולפירוק. גודל 130x100 ס\"מ.",
    costPrice: 11,
    price: 99,
    compareAtPrice: 149,
    category: "kids",
    tags: ["אוהל", "משחק", "ילדים"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/tent-1.jpg"],
    weight: 1.5,
  },

  // Automotive (2)
  {
    titleHe: "מצלמת דרך Full HD כפולה",
    titleEn: "Dual Full HD Dash Camera",
    descriptionHe: "מצלמת דרך כפולה (קדמית + אחורית) ברזולוציית Full HD 1080p. ראיית לילה, חיישן G, הקלטה בלופ. מסך 3 אינץ׳.",
    costPrice: 15,
    price: 129,
    compareAtPrice: 199,
    category: "automotive",
    tags: ["מצלמה", "דרך", "רכב"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/dashcam-1.jpg"],
    weight: 0.15,
  },
  {
    titleHe: "שואב אבק לרכב נטען USB-C",
    titleEn: "Car Vacuum Cleaner USB-C Rechargeable",
    descriptionHe: "שואב אבק קומפקטי לרכב, טעינת USB-C, כוח יניקה 9000Pa. כולל 3 ראשי שאיבה. סוללה ל-30 דקות.",
    costPrice: 8,
    price: 75,
    compareAtPrice: 119,
    category: "automotive",
    tags: ["שואב אבק", "רכב", "ניקיון"],
    images: ["https://storage.googleapis.com/dropship-488214-assets/products/car-vacuum-1.jpg"],
    weight: 0.5,
  },
];

// ---------- Coupons ----------

const coupons = [
  {
    code: "WELCOME15",
    type: "percentage",
    value: 15,
    minOrderAmount: 50,
    maxUses: 10000,
    usedCount: 0,
    isActive: true,
    description: "15% הנחה להזמנה ראשונה",
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    code: "SHARE10",
    type: "percentage",
    value: 10,
    minOrderAmount: 0,
    maxUses: 10000,
    usedCount: 0,
    isActive: true,
    description: "10% הנחה מהפניית חבר",
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ---------- Site Settings ----------

const siteSettings = {
  storeName: "ShipMate",
  storeNameHe: "שיפמייט",
  logo: "https://storage.googleapis.com/dropship-488214-assets/logo.png",
  favicon: "https://storage.googleapis.com/dropship-488214-assets/favicon.ico",
  announcementBar: "🚚 משלוח חינם מעל ₪199! | 🎁 קוד WELCOME15 ל-15% הנחה",
  freeShippingThreshold: 199,
  currency: "ILS",
  shippingPolicy: `מדיניות משלוחים - ShipMate

📦 משלוח רגיל: ₪29 (7-14 ימי עסקים)
🚀 משלוח מהיר: ₪49 (3-5 ימי עסקים)
🆓 משלוח חינם בהזמנה מעל ₪199

כל ההזמנות נשלחות עם מספר מעקב.
המשלוחים מגיעים לכל רחבי ישראל.`,
  returnPolicy: `מדיניות החזרות - ShipMate

✅ 14 ימי החזרה מיום קבלת המוצר
✅ המוצר חייב להיות באריזתו המקורית
✅ החזר כספי תוך 5 ימי עסקים

לפתיחת בקשת החזרה: support@shipmate.store`,
  privacyPolicy: `מדיניות פרטיות - ShipMate

אנו מכבדים את פרטיותכם. המידע שנאסף משמש אך ורק לצורך עיבוד הזמנות ושיפור השירות.
אנו לא משתפים מידע אישי עם צדדים שלישיים.
בכל שאלה: privacy@shipmate.store`,
  socialLinks: {
    instagram: "https://instagram.com/shipmate.store",
    facebook: "https://facebook.com/shipmate.store",
    tiktok: "https://tiktok.com/@shipmate.store",
    whatsapp: "https://wa.me/972501234567",
  },
};

// ---------- Sample Reviews ----------

const reviews = [
  { productIndex: 0, name: "דנה כ.", rating: 5, text: "אוזניות מדהימות! איכות צליל מעולה ואחיזה נוחה. שווה כל שקל!", date: "2024-02-10" },
  { productIndex: 0, name: "יוסי מ.", rating: 4, text: "מוצר טוב מאוד, הגיע מהר. ביטול רעשים עובד סבבה.", date: "2024-02-12" },
  { productIndex: 2, name: "נועה ל.", rating: 5, text: "רמקול חזק ועמיד! לקחנו לבריכה ועבד מצוין", date: "2024-02-08" },
  { productIndex: 3, name: "אמיר ש.", rating: 5, text: "שעון מהמם! GPS מדויק, סוללה מחזיקה 5 ימים", date: "2024-02-15" },
  { productIndex: 5, name: "רחל ג.", rating: 5, text: "סכינים חדות ואיכותיות מאוד. המעמד יפה", date: "2024-01-28" },
  { productIndex: 6, name: "מיכל ד.", rating: 4, text: "מפזר נהדר, הריח ממלא את כל החדר. עיצוב יפה", date: "2024-02-01" },
  { productIndex: 10, name: "עומר ק.", rating: 5, text: "תיק מעולה! נוח, הרבה תאים, נראה יוקרתי", date: "2024-02-05" },
  { productIndex: 15, name: "גיל ר.", rating: 5, text: "אקדח עיסוי משנה חיים! אחרי ריצה זה גאוני", date: "2024-02-14" },
  { productIndex: 15, name: "שירה א.", rating: 4, text: "עובד טוב, קצת רועש אבל מרגיש נהדר", date: "2024-02-16" },
  { productIndex: 20, name: "יעל נ.", rating: 5, text: "הבת שלי מתה על הערכה! צבעים יפים ואיכותיים", date: "2024-02-11" },
];

// ---------- Seed Function ----------

async function seed() {
  console.log("🌱 Starting ShipMate seed...\n");

  // 1. Site Settings
  console.log("📝 Seeding site settings...");
  await db.collection("settings").doc("site").set({
    ...siteSettings,
    updatedAt: now,
  });
  console.log("   ✅ Site settings created\n");

  // 2. Categories
  console.log("📁 Seeding categories...");
  const categoryIds: Record<string, string> = {};
  for (const cat of categories) {
    const ref = db.collection("categories").doc(cat.slug);
    await ref.set({
      ...cat,
      productCount: 0,
      createdAt: now,
      updatedAt: now,
    });
    categoryIds[cat.slug] = ref.id;
    console.log(`   ✅ ${cat.nameHe} (${cat.slug})`);
  }
  console.log("");

  // 3. Products
  console.log("🛍️ Seeding products...");
  const productIds: string[] = [];
  for (const product of products) {
    const productSlug = slug(product.titleEn);
    const ref = db.collection("products").doc();
    await ref.set({
      ...product,
      slug: productSlug,
      categoryId: categoryIds[product.category] || product.category,
      status: "active",
      salesCount: Math.floor(Math.random() * 50),
      viewCount: Math.floor(Math.random() * 500),
      trendScore: Math.floor(Math.random() * 100),
      reviewCount: 0,
      avgRating: 0,
      createdAt: now,
      updatedAt: now,
    });
    productIds.push(ref.id);
    console.log(`   ✅ ${product.titleHe} - ₪${product.price}`);
  }
  console.log("");

  // 4. Reviews
  console.log("⭐ Seeding reviews...");
  for (const review of reviews) {
    const productId = productIds[review.productIndex];
    if (!productId) continue;

    await db.collection("reviews").add({
      productId,
      customerName: review.name,
      rating: review.rating,
      text: review.text,
      verified: true,
      status: "approved",
      createdAt: admin.firestore.Timestamp.fromDate(new Date(review.date)),
    });

    // Update product review stats
    const productRef = db.collection("products").doc(productId);
    const productDoc = await productRef.get();
    if (productDoc.exists) {
      const data = productDoc.data()!;
      const currentCount = (data.reviewCount as number) || 0;
      const currentAvg = (data.avgRating as number) || 0;
      const newCount = currentCount + 1;
      const newAvg = (currentAvg * currentCount + review.rating) / newCount;

      await productRef.update({
        reviewCount: newCount,
        avgRating: Math.round(newAvg * 10) / 10,
      });
    }

    console.log(`   ✅ Review for product ${review.productIndex}: ${review.rating}⭐`);
  }
  console.log("");

  // 5. Coupons
  console.log("🎟️ Seeding coupons...");
  for (const coupon of coupons) {
    await db.collection("coupons").doc(coupon.code).set({
      ...coupon,
      createdAt: now,
    });
    console.log(`   ✅ ${coupon.code} (${coupon.value}% off)`);
  }
  console.log("");

  // 6. Counters
  console.log("🔢 Seeding counters...");
  await db.collection("counters").doc("orders").set({ value: 10000 });
  await db.collection("counters").doc("invoices").set({ value: 1000 });
  console.log("   ✅ Orders counter: 10000");
  console.log("   ✅ Invoices counter: 1000\n");

  // 7. Update category product counts
  console.log("📊 Updating category counts...");
  const categoryCounts: Record<string, number> = {};
  for (const product of products) {
    categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
  }
  for (const [catSlug, count] of Object.entries(categoryCounts)) {
    await db.collection("categories").doc(catSlug).update({ productCount: count });
    console.log(`   ✅ ${catSlug}: ${count} products`);
  }
  console.log("");

  // Summary
  console.log("============================================");
  console.log("🚀 Seed complete!");
  console.log("============================================");
  console.log(`   Categories: ${categories.length}`);
  console.log(`   Products:   ${products.length}`);
  console.log(`   Reviews:    ${reviews.length}`);
  console.log(`   Coupons:    ${coupons.length}`);
  console.log(`   Counters:   2`);
  console.log("============================================\n");
}

// Run
seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
