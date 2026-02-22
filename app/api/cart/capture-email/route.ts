import { NextRequest, NextResponse } from "next/server";
// import { captureCartEmail } from "@/lib/firestore/carts";

export async function POST(request: NextRequest) {
  try {
    const { sessionId, email, phone } = await request.json();

    if (!sessionId || !email) {
      return NextResponse.json({ error: "Missing sessionId or email" }, { status: 400 });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    // TODO: Uncomment when Firestore is connected
    // await captureCartEmail(sessionId, email, phone);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Email capture error:", error);
    return NextResponse.json({ error: "Capture failed" }, { status: 500 });
  }
}
