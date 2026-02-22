import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/firebase";

const db = getDb();

/**
 * GET /api/admin/coupons — List all coupons
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await db
      .collection("coupons")
      .orderBy("createdAt", "desc")
      .get();

    const coupons = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ coupons });
  } catch (error) {
    console.error("Coupons list error:", error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

/**
 * POST /api/admin/coupons — Create a coupon
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    const { code, type, value, minOrder, maxUses, expiresAt } = body;

    if (!code || !type || !value) {
      return NextResponse.json(
        { error: "Missing required fields: code, type, value" },
        { status: 400 }
      );
    }

    // Check for duplicate code
    const existing = await db
      .collection("coupons")
      .where("code", "==", code.toUpperCase())
      .get();

    if (!existing.empty) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 409 }
      );
    }

    const ref = db.collection("coupons").doc();

    await ref.set({
      code: code.toUpperCase(),
      type, // "percentage" | "fixed"
      value: Number(value),
      minOrder: Number(minOrder) || 0,
      maxUses: Number(maxUses) || 0,
      usedCount: 0,
      status: "active",
      expiresAt: expiresAt || null,
      createdAt: new Date().toISOString(),
      createdBy: session.user?.email || "admin",
    });

    return NextResponse.json({ id: ref.id, code: code.toUpperCase() });
  } catch (error) {
    console.error("Coupon create error:", error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/coupons — Update coupon status
 */
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    await db.collection("coupons").doc(id).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Coupon update error:", error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}
