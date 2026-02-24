"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, Menu, X, User } from "lucide-react";
import ShipMateLogo from "@/components/icons/ShipMateLogo";
import { useCartStore } from "@/lib/cart/cart-store";
import CartDrawer from "./CartDrawer";

const NAV_LINKS = [
  { href: "/", label: "ראשי" },
  { href: "/category/electronics", label: "אלקטרוניקה" },
  { href: "/category/fashion", label: "אופנה" },
  { href: "/category/home", label: "בית וגן" },
  { href: "/category/beauty", label: "יופי וטיפוח" },
  { href: "/category/kids", label: "ילדים" },
  { href: "/category/gadgets", label: "גאדג׳טים" },
  { href: "/category/sports", label: "ספורט" },
  { href: "/category/auto", label: "רכב" },
  { href: "/category/jewelry", label: "תכשיטים" },
  { href: "/category/toys", label: "צעצועים" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount)();

  return (
    <>
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cream-dark/50">
      {/* Main header row */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Right side: Menu + Logo (RTL) */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 hover:bg-cream rounded-xl transition-colors"
              aria-label="תפריט"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <Link href="/" className="flex items-center gap-2 group">
              <ShipMateLogo size="md" color="coral" />
            </Link>
          </div>

          {/* Center: Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-charcoal hover:text-coral rounded-lg
                           hover:bg-coral/5 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Left side: Search + Account + Cart (RTL) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 hover:bg-cream rounded-xl transition-colors"
              aria-label="חיפוש"
            >
              <Search size={20} className="text-charcoal" />
            </button>
            <Link
              href="/admin"
              className="hidden sm:flex p-2 hover:bg-cream rounded-xl transition-colors"
              aria-label="חשבון"
            >
              <User size={20} className="text-charcoal" />
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 hover:bg-cream rounded-xl transition-colors group"
              aria-label="סל קניות"
            >
              <ShoppingBag size={20} className="text-charcoal group-hover:text-coral transition-colors" />
              {/* Cart count badge */}
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -left-0.5 bg-coral text-white text-[10px] font-bold
                               w-[18px] h-[18px] rounded-full flex items-center justify-center">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Search bar (expandable) */}
      {searchOpen && (
        <div className="border-t border-cream-dark/30 bg-white px-4 py-3 animate-slide-down">
          <div className="max-w-2xl mx-auto relative">
            <input
              type="text"
              placeholder="מה את/ה מחפש/ת?"
              className="w-full py-3 px-5 pr-12 bg-cream rounded-2xl text-charcoal placeholder-charcoal-light
                         focus:outline-none focus:ring-2 focus:ring-coral/30 font-heebo text-sm"
              autoFocus
            />
            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-light" />
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden border-t border-cream-dark/30 bg-white animate-slide-down">
          <nav className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 text-charcoal hover:text-coral hover:bg-coral/5
                           rounded-xl transition-all duration-200 font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
