"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: "/admin", label: "דשבורד", icon: "📊" },
  { href: "/admin/products/scan", label: "סריקת מוצרים", icon: "🔍" },
  { href: "/admin/products", label: "מוצרים", icon: "📦" },
  { href: "/admin/orders", label: "הזמנות", icon: "🛒" },
  { href: "/admin/customers", label: "לקוחות", icon: "👥" },
  { href: "/admin/marketing", label: "שיווק", icon: "📣" },
  { href: "/admin/support", label: "תמיכה", icon: "💬" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-charcoal min-h-screen flex flex-col fixed right-0 top-0 z-30">
      {/* Logo */}
      <div className="p-6 border-b border-charcoal-light/30">
        <Link href="/admin" className="flex items-center gap-2">
          <span className="text-2xl">🚀</span>
          <div>
            <h1 className="font-nunito font-bold text-lg text-white leading-tight">
              ShipMate
            </h1>
            <span className="text-xs text-gray-400">ניהול חנות</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-coral text-white shadow-md shadow-coral/20"
                  : "text-gray-300 hover:bg-charcoal-light/50 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
              {isActive && (
                <span className="mr-auto w-1.5 h-1.5 rounded-full bg-white" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-charcoal-light/30">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-200 transition-colors"
        >
          <span>🏪</span>
          <span>צפייה בחנות</span>
        </Link>
      </div>
    </aside>
  );
}
