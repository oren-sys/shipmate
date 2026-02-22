"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Truck } from "lucide-react";
import { useCartStore } from "@/lib/cart/cart-store";

const FREE_SHIPPING_THRESHOLD = 199;

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getShippingCost, getTotal, getItemCount } = useCartStore();

  const subtotal = getSubtotal();
  const shipping = getShippingCost();
  const total = getTotal();
  const itemCount = getItemCount();
  const untilFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-24 h-24 bg-cream rounded-3xl flex items-center justify-center mx-auto">
          <ShoppingBag size={40} className="text-charcoal-light" />
        </div>
        <h1 className="text-2xl font-bold">הסל שלך ריק</h1>
        <p className="text-charcoal-light">
          לא מצאת עדיין משהו שווה? בוא נעזור לך!
        </p>
        <Link href="/" className="btn-primary inline-block">
          בואו נמצא משהו שווה 🔥
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">סל הקניות ({itemCount} פריטים)</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Free shipping progress */}
          {untilFreeShipping > 0 && (
            <div className="bg-teal/5 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Truck size={18} className="text-teal" />
                <span className="text-sm font-medium">
                  חסרים ₪{untilFreeShipping.toFixed(0)} למשלוח חינם!
                </span>
              </div>
              <div className="w-full h-2 bg-cream rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {items.map((item) => (
            <div key={item.productId} className="card p-4 flex gap-4">
              {/* Image */}
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-cream flex-shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.titleHe}
                    width={96}
                    height={96}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-charcoal-light">
                    <ShoppingBag size={24} />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm line-clamp-2 mb-2">{item.titleHe}</h3>
                <div className="flex items-center justify-between">
                  {/* Quantity */}
                  <div className="flex items-center border border-cream-dark/30 rounded-lg overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="px-2.5 py-1.5 hover:bg-cream transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 py-1.5 text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="px-2.5 py-1.5 hover:bg-cream transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Price + remove */}
                  <div className="flex items-center gap-3">
                    <span className="price text-lg">₪{(item.price * item.quantity).toFixed(0)}</span>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-1.5 text-charcoal-light hover:text-coral transition-colors rounded-lg hover:bg-coral/5"
                      aria-label="הסר"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <div className="card p-6 sticky top-24 space-y-4">
            <h2 className="font-bold text-lg">סיכום הזמנה</h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-charcoal-light">סה״כ מוצרים</span>
                <span>₪{subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-charcoal-light">משלוח</span>
                <span className={shipping === 0 ? "text-mint font-medium" : ""}>
                  {shipping === 0 ? "חינם! 🎉" : `₪${shipping.toFixed(0)}`}
                </span>
              </div>
            </div>

            <div className="border-t border-cream-dark/30 pt-3 flex justify-between items-baseline">
              <span className="font-bold text-lg">סה״כ</span>
              <span className="text-2xl font-extrabold text-coral">₪{total.toFixed(0)}</span>
            </div>

            <div className="text-xs text-charcoal-light text-center">
              כולל מע״מ 17% | אפשרות לתשלומים
            </div>

            <Link
              href="/checkout"
              className="btn-primary w-full text-center block text-lg"
            >
              המשך לתשלום
            </Link>

            <Link
              href="/"
              className="block text-center text-sm text-charcoal-light hover:text-coral transition-colors"
            >
              <ArrowRight size={14} className="inline ml-1" />
              המשך לקנות
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
