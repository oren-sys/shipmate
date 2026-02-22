import { NextRequest, NextResponse } from "next/server";
import { createPaymentPage } from "@/lib/payments/meshulam";

interface CreatePaymentBody {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description?: string;
  maxPayments?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreatePaymentBody = await request.json();

    // Validate required fields
    if (!body.orderId || !body.amount || !body.customerEmail) {
      return NextResponse.json(
        { error: "חסרים פרטים נדרשים" },
        { status: 400 }
      );
    }

    if (body.amount <= 0) {
      return NextResponse.json(
        { error: "סכום לא תקין" },
        { status: 400 }
      );
    }

    const result = await createPaymentPage({
      amount: body.amount,
      description: body.description || `הזמנה מ-ShipMate #${body.orderId}`,
      orderId: body.orderId,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      maxPayments: body.maxPayments || 3,
    });

    if (result.success && result.paymentUrl) {
      // TODO: Update order with transactionId in Firestore
      // await updateOrder(body.orderId, {
      //   paymentTransactionId: result.transactionId,
      //   status: "PENDING_PAYMENT",
      // });

      return NextResponse.json({
        paymentUrl: result.paymentUrl,
        transactionId: result.transactionId,
      });
    }

    return NextResponse.json(
      { error: result.error || "שגיאה ביצירת דף תשלום" },
      { status: 500 }
    );
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: "שגיאה בעיבוד התשלום" },
      { status: 500 }
    );
  }
}
