import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/firebase";
import { autoPostProduct } from "@/lib/marketing/facebook-poster";

const db = getDb();

/**
 * GET /api/admin/products — List products with optional filters
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = db.collection("products").orderBy("createdAt", "desc");

    if (status && status !== "all") {
      query = query.where("status", "==", status);
    }
    if (category && category !== "all") {
      query = query.where("category", "==", category);
    }

    const snapshot = await query.limit(limit).offset(offset).get();

    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Client-side search filter (for small datasets; use search index for scale)
    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        (p: Record<string, unknown>) =>
          (typeof p.titleHe === "string" && p.titleHe.includes(search)) ||
          (typeof p.titleEn === "string" && (p.titleEn as string).toLowerCase().includes(searchLower))
      );
    }

    return NextResponse.json({ products, count: products.length });
  } catch (error) {
    console.error("Products list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/products — Create one or more products
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Bulk import
    if (Array.isArray(body.products)) {
      const batch = db.batch();
      const created: string[] = [];

      for (const product of body.products) {
        const ref = db.collection("products").doc();
        const slug = generateSlug(product.titleEn || product.titleHe);

        batch.set(ref, {
          ...product,
          slug,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          searchTokens: tokenize(product.titleHe, product.titleEn),
        });

        created.push(ref.id);
      }

      await batch.commit();

      // Auto-post each product to Facebook (fire-and-forget)
      for (let i = 0; i < body.products.length; i++) {
        const product = body.products[i];
        if (product.status !== "draft") {
          const prodSlug = generateSlug(product.titleEn || product.titleHe);
          autoPostProduct({
            id: created[i],
            slug: prodSlug,
            titleHe: product.titleHe,
            titleEn: product.titleEn,
            price: product.price,
            compareAtPrice: product.compareAtPrice,
            category: product.category,
            features: product.features,
            image: product.images?.[0],
          }).catch((err) => console.error("Facebook auto-post failed:", err));
        }
      }

      return NextResponse.json({ created, count: created.length });
    }

    // Single product
    const slug = generateSlug(body.titleEn || body.titleHe);
    const ref = db.collection("products").doc();

    await ref.set({
      ...body,
      slug,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      searchTokens: tokenize(body.titleHe, body.titleEn),
    });

    // Auto-post to Facebook (fire-and-forget, don't block response)
    if (body.status !== "draft") {
      autoPostProduct({
        id: ref.id,
        slug,
        titleHe: body.titleHe,
        titleEn: body.titleEn,
        price: body.price,
        compareAtPrice: body.compareAtPrice,
        category: body.category,
        features: body.features,
        image: body.images?.[0],
      }).catch((err) => console.error("Facebook auto-post failed:", err));
    }

    return NextResponse.json({ id: ref.id, slug });
  } catch (error) {
    console.error("Product create error:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-\u0590-\u05FF]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 80);
}

function tokenize(...fields: (string | undefined)[]): string[] {
  const tokens = new Set<string>();

  for (const field of fields) {
    if (!field) continue;
    const words = field.toLowerCase().split(/[\s,.\-_]+/).filter(Boolean);
    for (const word of words) {
      tokens.add(word);
      // Prefix tokens for search
      for (let i = 2; i <= Math.min(word.length, 6); i++) {
        tokens.add(word.substring(0, i));
      }
    }
  }

  return Array.from(tokens);
}
