import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/firebase";

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

  try {
    // Fetch active products from Firestore
    const db = getDb();
    const snap = await db
      .collection("products")
      .where("status", "==", "ACTIVE")
      .limit(100)
      .get();

    if (snap.empty) {
      return NextResponse.json({ results: [], total: 0, query });
    }

    // Score products by matching query tokens against searchTokens and title
    const scored = snap.docs.map((doc) => {
      const data = doc.data();
      const productTokens: string[] = data.searchTokens || [];
      const titleHe: string = data.titleHe || "";
      const titleEn: string = data.titleEn || "";

      let score = 0;
      for (const qt of queryTokens) {
        for (const pt of productTokens) {
          if (pt === qt) {
            score += 10; // Exact match
          } else if (pt.startsWith(qt) || qt.startsWith(pt)) {
            score += 5; // Prefix match
          }
        }
      }

      // Boost title direct match
      if (titleHe.includes(query)) score += 20;
      if (titleEn.toLowerCase().includes(query.toLowerCase())) score += 15;

      return {
        id: doc.id,
        slug: data.slug || doc.id,
        titleHe: titleHe || titleEn || "מוצר",
        image: data.images?.[0] || "",
        price: data.price || 0,
        score,
      };
    })
      .filter((p) => p.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    const results = scored.map(({ score: _score, ...rest }) => rest);

    return NextResponse.json({
      results,
      total: results.length,
      query,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [], total: 0, query });
  }
}
