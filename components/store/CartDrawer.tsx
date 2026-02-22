"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ShoppingBag, Trash2, Truck } from "lucide-react";
import { useCartStore } from "@/lib/cart/cart-store";

interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const FREE_SHIPPING_THRESHOLD = 199;

export default function CartDrawer({ isOpen = false, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, getSubtotal, getItemCount } = useCartStore();
  const subtotal = getSubtotal();
  const itemCount = getItemCount();
  const untilFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleClose = () => {
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Drawer — slides from LEFT in RTL */}
      <div className="fixed top-0 left-0 h-full w-full max-w-md bg-white z-50
                      shadow-2xl transform transition-transform duration-300
                      flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cream-dark/30">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-coral" />
            <h2 className="font-bold text-lg">סל הקניות</h2>
            <span className="bg-coral/10 text-coral text-xs font-bold px-2 py-0.5 rounded-full">
              {itemCount}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-cream rounded-xl transition-colors"
            aria-label="סגור סל"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 bg-cream rounded-2xl flex items-center justify-center">
                <ShoppingBag size={32} className="text-charcoal-light" />
              </div>
              <p className="text-charcoal-light font-medium">הסל שלך ריק</p>
              <Link
                href="/"
                onClick={handleClose}
                className="btn-primary text-sm"
              >
                בואו נמצא משהו שווה 🔥
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Free shipping progress */}
              {untilFreeShipping > 0 && (
                <div className="bg-teal/5 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Truck size={16} className="text-teal" />
                    <span className="text-xs font-medium">
                      חסרים ₪{untilFreeShipping.toFixed(0)} למשלוח חינם!
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-cream rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {items.map((item) => (
                <div key={item.productId} className="flex gap-3 pb-3 border-b border-cream-dark/20 last:border-0">
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.titleHe}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-charcoal-light">
                        <ShoppingBag size={20} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium line-clamp-2 mb-1.5">{item.titleHe}</h4>
                    <div className="flex items-center justify-between">
                      {/* Quantity */}
                      <div className="flex items-center border border-cream-dark/30 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                          className="px-1.5 py-1 hover:bg-cream transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="px-2 py-1 text-xs font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                          className="px-1.5 py-1 hover:bg-cream transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Price + remove */}
                      <div className="flex items-center gap-2">
                        <span className="price text-sm">₪{(item.price * item.quantity).toFixed(0)}</span>
                        <button
                          onClick={() => removeItem(item.productId)}
                          className="p-1 text-charcoal-light hover:text-coral transition-colors"
                          aria-label="הסר"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with subtotal */}
        {items.length > 0 && (
          <div className="border-t border-cream-dark/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">סה״כ</span>
              <span className="price text-2xl">₪{subtotal.toFixed(0)}</span>
            </div>
            <p className="text-xs text-charcoal-light">
              משלוח וארנונה יחושבו בקופה
            </p>
            <Link
              href="/cart"
              onClick={handleClose}
              className="btn-primary w-full text-center block"
            >
              לסל הקניות
            </Link>
            <button
              onClick={handleClose}
              className="w-full text-center text-sm text-charcoal-light hover:text-coral transition-colors py-2"
            >
              המשך לקנות
            </button>
          </div>
        )}
      </div>
    </>
  );
}
