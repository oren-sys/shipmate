import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/firebase";

const db = getDb();

/**
 * GET /api/admin/products/[id] — Get single product
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const doc = await db.collection("products").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Product get error:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/products/[id] — Update product
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();

    // Re-tokenize for search
    const searchTokens = tokenize(body.titleHe, body.titleEn);

    await db
      .collection("products")
      .doc(id)
      .update({
        ...body,
        searchTokens,
        updatedAt: new Date().toISOString(),
      });

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id] — Delete product (soft)
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;

    // Soft delete: set status to 'deleted'
    await db.collection("products").doc(id).update({
      status: "deleted",
      deletedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Product delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 }
    );
  }
}

function tokenize(...fields: (string | undefined)[]): string[] {
  const tokens = new Set<string>();

  for (const field of fields) {
    if (!field) continue;
    const words = field.toLowerCase().split(/[\s,.\-_]+/).filter(Boolean);
    for (const word of words) {
      tokens.add(word);
      for (let i = 2; i <= Math.min(word.length, 6); i++) {
        tokens.add(word.substring(0, i));
      }
    }
  }

  return Array.from(tokens);
}
