"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Grid3X3, Search, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/cart/cart-store";

const navItems = [
  { href: "/", icon: Home, label: "ראשי" },
  { href: "/category", icon: Grid3X3, label: "קטגוריות" },
  { href: "/search", icon: Search, label: "חיפוש" },
  { href: "/cart", icon: ShoppingBag, label: "סל", badge: true },
];

export default function MobileNav() {
  const pathname = usePathname();
  const itemCount = useCartStore((s) => s.getItemCount)();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md
                    border-t border-cream-dark/50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-2 px-4 rounded-2xl
                         transition-all duration-300 relative group
                         ${isActive
                           ? "text-coral"
                           : "text-charcoal-light hover:text-coral"
                         }`}
            >
              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -top-1 w-1 h-1 bg-coral rounded-full" />
              )}
              <div className="relative">
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 2}
                  className="transition-all duration-300"
                />
                {item.badge && itemCount > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 bg-coral text-white text-[9px]
                                 font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {itemCount > 9 ? "9+" : itemCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
