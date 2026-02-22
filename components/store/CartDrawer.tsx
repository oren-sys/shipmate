"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

// TODO: Connect to Zustand cart store in Task 12
interface CartDrawerProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CartDrawer({ isOpen = false, onClose }: CartDrawerProps) {
  const [open, setOpen] = useState(isOpen);

  useEffect(() => setOpen(isOpen), [isOpen]);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  if (!open) return null;

  // Placeholder empty cart state
  const items: any[] = [];
  const subtotal = 0;

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
              {items.length}
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
              {/* Cart items would render here */}
            </div>
          )}
        </div>

        {/* Footer with subtotal */}
        {items.length > 0 && (
          <div className="border-t border-cream-dark/30 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">סה״כ</span>
              <span className="price text-2xl">₪{subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-charcoal-light">
              משלוח וארנונה יחושבו בקופה
            </p>
            <Link
              href="/checkout"
              onClick={handleClose}
              className="btn-primary w-full text-center block"
            >
              המשך לתשלום
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
