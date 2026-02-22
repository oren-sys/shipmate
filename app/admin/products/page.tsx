"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Product {
  id: string;
  titleHe: string;
  titleEn: string;
  price: number;
  costPrice: number;
  category: string;
  status: "active" | "draft" | "outOfStock";
  image: string;
  createdAt: string;
}

const statusConfig = {
  active: { label: "פעיל", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  draft: { label: "טיוטה", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  outOfStock: { label: "אזל", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
};

// Demo products
const demoProducts: Product[] = [
  { id: "p1", titleHe: "אוזניות בלוטוס Pro", titleEn: "Bluetooth Earbuds Pro", price: 179.9, costPrice: 45, category: "אלקטרוניקה", status: "active", image: "/placeholder-product.jpg", createdAt: "2025-02-20" },
  { id: "p2", titleHe: "מנורת LED חכמה", titleEn: "Smart LED Lamp", price: 149.9, costPrice: 38, category: "בית וגן", status: "active", image: "/placeholder-product.jpg", createdAt: "2025-02-19" },
  { id: "p3", titleHe: "כרית מסאז׳ חשמלית", titleEn: "Electric Massage Pillow", price: 229.9, costPrice: 55, category: "בריאות", status: "active", image: "/placeholder-product.jpg", createdAt: "2025-02-18" },
  { id: "p4", titleHe: "ארגונית שולחן עבודה", titleEn: "Desk Organizer", price: 89.9, costPrice: 22, category: "בית וגן", status: "draft", image: "/placeholder-product.jpg", createdAt: "2025-02-17" },
  { id: "p5", titleHe: "כבל טעינה מגנטי", titleEn: "Magnetic Charging Cable", price: 49.9, costPrice: 8, category: "אלקטרוניקה", status: "active", image: "/placeholder-product.jpg", createdAt: "2025-02-16" },
  { id: "p6", titleHe: "תיק גב אנטי-גניבה", titleEn: "Anti-Theft Backpack", price: 199.9, costPrice: 50, category: "אופנה", status: "outOfStock", image: "/placeholder-product.jpg", createdAt: "2025-02-15" },
  { id: "p7", titleHe: "שעון חכם ספורט", titleEn: "Sport Smart Watch", price: 299.9, costPrice: 75, category: "אלקטרוניקה", status: "active", image: "/placeholder-product.jpg", createdAt: "2025-02-14" },
  { id: "p8", titleHe: "מפזר ריח חשמלי", titleEn: "Electric Diffuser", price: 119.9, costPrice: 28, category: "בית וגן", status: "active", image: "/placeholder-product.jpg", createdAt: "2025-02-13" },
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>(demoProducts);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const categories = Array.from(new Set(demoProducts.map((p) => p.category)));

  const filtered = products.filter((p) => {
    if (search && !p.titleHe.includes(search) && !p.titleEn.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((p) => p.id)));
  };

  const margin = (price: number, cost: number) =>
    Math.round(((price - cost) / price) * 100);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">מוצרים</h1>
          <p className="text-sm text-gray-500 mt-1">{products.length} מוצרים</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/products/import"
            className="px-4 py-2 bg-white text-charcoal text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            📥 ייבוא מAliExpress
          </Link>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-coral text-white text-sm font-medium rounded-xl hover:bg-coral-dark transition-colors shadow-sm shadow-coral/20"
          >
            + מוצר חדש
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-[250px]">
            <input
              type="text"
              placeholder="חפש מוצר..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 focus:border-coral outline-none transition-all"
            />
          </div>
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-charcoal bg-white focus:ring-2 focus:ring-coral/30 outline-none"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="active">פעיל</option>
            <option value="draft">טיוטה</option>
            <option value="outOfStock">אזל מהמלאי</option>
          </select>
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-charcoal bg-white focus:ring-2 focus:ring-coral/30 outline-none"
          >
            <option value="all">כל הקטגוריות</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">{selected.size} נבחרו</span>
            <button className="text-sm text-coral hover:text-coral-dark font-medium">הפעל</button>
            <button className="text-sm text-gray-500 hover:text-charcoal font-medium">העבר לטיוטה</button>
            <button className="text-sm text-red-500 hover:text-red-700 font-medium">מחק</button>
          </div>
        )}
      </div>

      {/* Product table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-right px-6 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">מוצר</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">קטגוריה</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">מחיר</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">עלות</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">מרווח</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">סטטוס</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => {
              const status = statusConfig[product.status];
              return (
                <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0">
                        📦
                      </div>
                      <div>
                        <p className="font-medium text-charcoal">{product.titleHe}</p>
                        <p className="text-xs text-gray-400">{product.titleEn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-gray-500">{product.category}</td>
                  <td className="px-4 py-4 font-medium text-charcoal">₪{product.price.toFixed(0)}</td>
                  <td className="px-4 py-4 text-gray-500">₪{product.costPrice.toFixed(0)}</td>
                  <td className="px-4 py-4">
                    <span className={`font-medium ${margin(product.price, product.costPrice) >= 60 ? "text-emerald-600" : margin(product.price, product.costPrice) >= 40 ? "text-amber-600" : "text-red-600"}`}>
                      {margin(product.price, product.costPrice)}%
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-coral hover:text-coral-dark text-sm font-medium"
                    >
                      עריכה
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
