import { NextRequest, NextResponse } from "next/server";

// Simple tokenizer for Hebrew + English text
function tokenize(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/[^\u0590-\u05FFa-z0-9\s]/g, "")
    .trim();

  const words = normalized.split(/\s+/).filter((w) => w.length >= 2);

  // Also create substrings for prefix matching
  const tokens: string[] = [];
  for (const word of words) {
    tokens.push(word);
    // Add prefixes (min 2 chars) for autocomplete-style matching
    for (let i = 2; i < word.length; i++) {
      tokens.push(word.substring(0, i));
    }
  }

  return Array.from(new Set(tokens));
}

// Placeholder products for search (until Firestore connected)
const PLACEHOLDER_PRODUCTS = [
  {
    id: "1",
    slug: "wireless-bluetooth-earbuds",
    titleHe: "אוזניות אלחוטיות בלוטוס TWS עם ביטול רעשים",
    image: "",
    price: 89.9,
    tokens: ["אוזניות", "אלחוטיות", "בלוטוס", "tws", "ביטול", "רעשים", "earbuds", "wireless", "bluetooth"],
  },
  {
    id: "2",
    slug: "wireless-charger-fast",
    titleHe: "מטען אלחוטי מהיר 15W עם תאורת LED",
    image: "",
    price: 49.9,
    tokens: ["מטען", "אלחוטי", "מהיר", "led", "charger", "wireless", "תאורה"],
  },
  {
    id: "3",
    slug: "smart-watch-sport",
    titleHe: "שעון חכם ספורטיבי עם מד דופק ו-GPS",
    image: "",
    price: 129.9,
    tokens: ["שעון", "חכם", "ספורט", "ספורטיבי", "דופק", "gps", "watch", "smart"],
  },
  {
    id: "4",
    slug: "led-strip-lights",
    titleHe: "רצועת LED צבעונית עם שלט RGB",
    image: "",
    price: 39.9,
    tokens: ["רצועת", "led", "צבעוני", "צבעונית", "שלט", "rgb", "תאורה", "תאורת"],
  },
  {
    id: "5",
    slug: "phone-case-iphone",
    titleHe: "כיסוי מגן שקוף לאייפון 15 עם מגנט MagSafe",
    image: "",
    price: 29.9,
    tokens: ["כיסוי", "מגן", "שקוף", "אייפון", "iphone", "magsafe", "מגנט"],
  },
  {
    id: "6",
    slug: "cable-organizer-desk",
    titleHe: "מארגן כבלים לשולחן העבודה 5 חריצים",
    image: "",
    price: 19.9,
    tokens: ["מארגן", "כבלים", "שולחן", "עבודה", "organizer", "cable"],
  },
  {
    id: "7",
    slug: "portable-mini-fan",
    titleHe: "מאוורר נייד מיני USB נטען",
    image: "",
    price: 24.9,
    tokens: ["מאוורר", "נייד", "מיני", "usb", "נטען", "fan", "portable"],
  },
  {
    id: "8",
    slug: "silicone-kitchen-utensils",
    titleHe: "סט כלי מטבח סיליקון 12 חלקים",
    image: "",
    price: 59.9,
    tokens: ["מטבח", "סיליקון", "כלי", "סט", "kitchen", "utensils"],
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  if (!query.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return NextResponse.json({ results: [], total: 0 });
  }

  // TODO: Replace with Firestore search-index query:
  // const searchResults = await searchProducts(query, limit);

  // For now, search placeholder data
  const scored = PLACEHOLDER_PRODUCTS.map((product) => {
    let score = 0;
    for (const qt of queryTokens) {
      for (const pt of product.tokens) {
        if (pt === qt) {
          score += 10; // Exact match
        } else if (pt.startsWith(qt) || qt.startsWith(pt)) {
          score += 5; // Prefix match
        }
      }
    }
    // Boost title direct match
    if (product.titleHe.includes(query)) {
      score += 20;
    }
    return { ...product, score };
  })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  const results = scored.map(({ tokens: _tokens, score: _score, ...rest }) => rest);

  return NextResponse.json({
    results,
    total: results.length,
    query,
  });
}
