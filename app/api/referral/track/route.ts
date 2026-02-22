/**
 * Referral Tracking API
 *
 * POST /api/referral/track - Track referral click
 * GET  /api/referral/track?code=XX - Get referral info
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getReferralByCode,
  trackReferralClick,
} from "@/lib/marketing/referral";

// GET - Get referral code info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Missing referral code" },
        { status: 400 }
      );
    }

    const referral = await getReferralByCode(code.toUpperCase());

    if (!referral) {
      return NextResponse.json(
        { error: "Invalid referral code" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      valid: true,
      code: referral.code,
      referrerName: referral.customerName,
      discountPercent: 15,
    });
  } catch (error) {
    console.error("Referral GET error:", error);
    return NextResponse.json(
      { error: "Failed to validate referral" },
      { status: 500 }
    );
  }
}

// POST - Track referral click
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Missing referral code" },
        { status: 400 }
      );
    }

    const referral = await getReferralByCode(code.toUpperCase());

    if (!referral || !referral.isActive) {
      return NextResponse.json(
        { error: "Invalid or inactive referral code" },
        { status: 404 }
      );
    }

    await trackReferralClick(code.toUpperCase());

    return NextResponse.json({
      success: true,
      discountPercent: 15,
      message: "קיבלתם 15% הנחה! 🎉",
    });
  } catch (error) {
    console.error("Referral POST error:", error);
    return NextResponse.json(
      { error: "Failed to track referral" },
      { status: 500 }
    );
  }
}
