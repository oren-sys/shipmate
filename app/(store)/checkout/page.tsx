"use client";

import Link from "next/link";
import { ChevronRight, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/cart/cart-store";
import CheckoutForm from "@/components/store/CheckoutForm";

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);

  // Redirect to cart if empty
  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-cream rounded-3xl flex items-center justify-center mx-auto">
          <ShoppingBag size={40} className="text-charcoal-light" />
        </div>
        <h1 className="text-2xl font-bold">הסל שלך ריק</h1>
        <p className="text-charcoal-light">
          הוסף מוצרים לסל לפני שתוכל להמשיך לתשלום
        </p>
        <Link href="/" className="btn-primary inline-block">
          חזרה לחנות
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-charcoal-light mb-6">
        <Link href="/cart" className="hover:text-coral transition-colors">
          סל קניות
        </Link>
        <ChevronRight size={14} />
        <span className="text-charcoal font-medium">תשלום</span>
      </nav>

      <h1 className="text-2xl font-bold mb-6">השלמת הזמנה</h1>

      <CheckoutForm />
    </div>
  );
}
