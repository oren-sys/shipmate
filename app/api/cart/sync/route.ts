import { NextRequest, NextResponse } from "next/server";
// import { saveCart } from "@/lib/firestore/carts";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, items } = await request.json();

    if (!sessionId || !items) {
      return NextResponse.json({ error: "Missing sessionId or items" }, { status: 400 });
    }

    // TODO: Uncomment when Firestore is connected
    // await saveCart(
    //   sessionId,
    //   items.map((item: any) => ({
    //     productId: item.productId,
    //     quantity: item.quantity,
    //     priceSnapshot: item.price,
    //     titleHe: item.titleHe,
    //     image: item.image,
    //   }))
    // );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Cart sync error:", error);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}
