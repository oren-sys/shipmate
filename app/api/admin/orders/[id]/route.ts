import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/firebase";

const db = getDb();

/**
 * GET /api/admin/orders/[id] — Get single order
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
    const doc = await db.collection("orders").doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error("Order get error:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/orders/[id] — Update order (status, tracking, notes)
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

    const allowedFields = ["status", "trackingNumber", "notes", "internalNotes"];
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Add status history entry
    if (body.status) {
      const orderDoc = await db.collection("orders").doc(id).get();
      const existing = orderDoc.data();
      const statusHistory = existing?.statusHistory || [];

      statusHistory.push({
        status: body.status,
        timestamp: new Date().toISOString(),
        updatedBy: session.user?.email || "admin",
      });

      updateData.statusHistory = statusHistory;
    }

    await db.collection("orders").doc(id).update(updateData);

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Order update error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
