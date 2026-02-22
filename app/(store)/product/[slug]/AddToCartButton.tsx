"use client";

import { useState } from "react";
import { ShoppingCart, Minus, Plus, Check } from "lucide-react";
import { useCartStore } from "@/lib/cart/cart-store";

interface AddToCartButtonProps {
  productId: string;
  titleHe: string;
  image: string;
  price: number;
}

export default function AddToCartButton({ productId, titleHe, image, price }: AddToCartButtonProps) {
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleAdd = () => {
    addItem({ productId, titleHe, image, price }, quantity);
    setAdded(true);
    setQuantity(1);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex items-center gap-3">
      {/* Quantity selector */}
      <div className="flex items-center border border-cream-dark/30 rounded-xl overflow-hidden">
        <button
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          className="px-3 py-3 hover:bg-cream transition-colors"
          disabled={quantity <= 1}
        >
          <Minus size={16} className={quantity <= 1 ? "text-gray-300" : "text-charcoal"} />
        </button>
        <span className="px-4 py-3 font-bold text-sm min-w-[3rem] text-center">
          {quantity}
        </span>
        <button
          onClick={() => setQuantity((q) => Math.min(10, q + 1))}
          className="px-3 py-3 hover:bg-cream transition-colors"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Add to cart button */}
      <button
        onClick={handleAdd}
        className={`flex-1 font-bold py-3.5 px-6 rounded-xl transition-all duration-300
                  flex items-center justify-center gap-2 text-white text-lg
                  ${added
                    ? "bg-mint hover:bg-mint"
                    : "bg-coral hover:bg-coral-dark hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                  }`}
      >
        {added ? (
          <>
            <Check size={20} />
            נוסף לסל!
          </>
        ) : (
          <>
            <ShoppingCart size={20} />
            הוסף לסל — ₪{(price * quantity).toFixed(0)}
          </>
        )}
      </button>
    </div>
  );
}
