"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  titleHe: string;
  image: string;
  price: number;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  sessionId: string;

  // Actions
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;

  // Computed
  getItemCount: () => number;
  getSubtotal: () => number;
  getShippingCost: () => number;
  getTotal: () => number;
}

function generateSessionId(): string {
  return `cart_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

const FREE_SHIPPING_THRESHOLD = 199;
const STANDARD_SHIPPING = 29.9;

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      sessionId: generateSessionId(),

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: Math.min(10, i.quantity + quantity) }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...item, quantity }],
          };
        });

        // Async sync to Firestore (non-blocking)
        syncCartToFirestore(get().sessionId, get().items);
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
        syncCartToFirestore(get().sessionId, get().items);
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId ? { ...i, quantity: Math.min(10, quantity) } : i
          ),
        }));
        syncCartToFirestore(get().sessionId, get().items);
      },

      clearCart: () => {
        set({ items: [] });
      },

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      getSubtotal: () =>
        +get().items.reduce((sum, i) => sum + i.price * i.quantity, 0).toFixed(2),

      getShippingCost: () => {
        const subtotal = get().getSubtotal();
        if (subtotal === 0) return 0;
        return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;
      },

      getTotal: () => +(get().getSubtotal() + get().getShippingCost()).toFixed(2),
    }),
    {
      name: "shipmate-cart",
    }
  )
);

// Non-blocking Firestore sync via API route
async function syncCartToFirestore(sessionId: string, items: CartItem[]) {
  try {
    await fetch("/api/cart/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, items }),
    });
  } catch {
    // Fail silently — localStorage is the source of truth client-side
  }
}
