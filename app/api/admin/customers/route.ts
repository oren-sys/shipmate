import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/firebase";

const db = getDb();

/**
 * GET /api/admin/customers — List customers with filters
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const segment = searchParams.get("segment");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");

    let query = db.collection("customers").orderBy("createdAt", "desc");

    if (segment && segment !== "all") {
      query = query.where("segment", "==", segment);
    }

    const snapshot = await query.limit(limit).get();

    let customers = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return { id: doc.id, ...data };
    });

    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(
        (c: Record<string, unknown>) =>
          (typeof c.name === "string" && c.name.includes(search)) ||
          (typeof c.email === "string" && (c.email as string).toLowerCase().includes(searchLower)) ||
          (typeof c.phone === "string" && (c.phone as string).includes(search))
      );
    }

    // Calculate lifetime value and segment for each customer
    const enriched = await Promise.all(
      customers.map(async (customer) => {
        const customerEmail = (customer as Record<string, unknown>).email as string || "";
        const ordersSnapshot = await db
          .collection("orders")
          .where("customerEmail", "==", customerEmail)
          .get();

        const ordersCount = ordersSnapshot.size;
        const totalSpent = ordersSnapshot.docs.reduce(
          (sum, doc) => sum + (doc.data().total || 0),
          0
        );

        // Auto-segment
        let autoSegment = "new";
        if (totalSpent >= 2000 || ordersCount >= 5) autoSegment = "vip";
        else if (ordersCount >= 2) autoSegment = "returning";

        return {
          ...customer,
          ordersCount,
          totalSpent,
          avgOrderValue: ordersCount > 0 ? totalSpent / ordersCount : 0,
          segment: autoSegment,
        };
      })
    );

    return NextResponse.json({ customers: enriched, count: enriched.length });
  } catch (error) {
    console.error("Customers list error:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}
