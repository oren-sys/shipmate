import { NextRequest, NextResponse } from "next/server";

interface CheckoutItem {
  productId: string;
  titleHe: string;
  price: number;
  quantity: number;
  image: string;
}

interface CheckoutBody {
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  shippingAddress: {
    city: string;
    street: string;
    apartment: string;
    zipCode: string;
    notes: string;
  };
  items: CheckoutItem[];
  couponCode?: string;
  couponDiscount: number;
  subtotal: number;
  shippingCost: number;
  total: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CheckoutBody = await request.json();

    // Basic validation
    if (!body.customer?.email || !body.customer?.phone) {
      return NextResponse.json(
        { error: "פרטי לקוח חסרים" },
        { status: 400 }
      );
    }

    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: "סל קניות ריק" },
        { status: 400 }
      );
    }

    if (!body.shippingAddress?.city || !body.shippingAddress?.street) {
      return NextResponse.json(
        { error: "כתובת למשלוח חסרה" },
        { status: 400 }
      );
    }

    // Phone validation (Israeli 05X format)
    const cleanPhone = body.customer.phone.replace(/[-\s()]/g, "");
    if (!/^05\d{8}$/.test(cleanPhone)) {
      return NextResponse.json(
        { error: "מספר טלפון לא תקין" },
        { status: 400 }
      );
    }

    // Recalculate totals server-side to prevent manipulation
    const calculatedSubtotal = body.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const FREE_SHIPPING_THRESHOLD = 199;
    const STANDARD_SHIPPING = 29.9;
    const calculatedShipping =
      calculatedSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
    const calculatedTotal =
      calculatedSubtotal + calculatedShipping - (body.couponDiscount || 0);

    // TODO: Validate coupon server-side via Firestore
    // const coupon = await getCouponByCode(body.couponCode);

    // Generate order number
    const orderNumber = `IL-${10000 + Math.floor(Math.random() * 90000)}`;
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // TODO: Save order to Firestore
    // const order = await createOrder({
    //   orderNumber,
    //   status: "PENDING_PAYMENT",
    //   customer: body.customer,
    //   shippingAddress: body.shippingAddress,
    //   items: body.items,
    //   subtotal: calculatedSubtotal,
    //   shipping: calculatedShipping,
    //   discount: body.couponDiscount || 0,
    //   total: calculatedTotal,
    //   couponCode: body.couponCode,
    // });

    // TODO: Create Meshulam payment page
    // const paymentResult = await createPaymentPage({
    //   amount: calculatedTotal,
    //   orderId,
    //   customerName: `${body.customer.firstName} ${body.customer.lastName}`,
    //   customerEmail: body.customer.email,
    //   customerPhone: cleanPhone,
    // });
    //
    // if (paymentResult.paymentUrl) {
    //   return NextResponse.json({
    //     orderId,
    //     orderNumber,
    //     paymentUrl: paymentResult.paymentUrl,
    //   });
    // }

    // For now, return order ID directly (no payment gateway yet)
    return NextResponse.json({
      orderId,
      orderNumber,
      total: calculatedTotal,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "שגיאה בעיבוד ההזמנה" },
      { status: 500 }
    );
  }
}
