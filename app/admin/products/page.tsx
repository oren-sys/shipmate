"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Image from "next/image";

interface Product {
  id: string;
  titleHe: string;
  titleEn: string;
  price: number;
  costPrice: number;
  category: string;
  status: string;
  images?: string[];
  createdAt: string;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  ACTIVE: { label: "פעיל", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  active: { label: "פעיל", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  DRAFT: { label: "טיוטה", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  draft: { label: "טיוטה", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
  OUT_OF_STOCK: { label: "אזל", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  outOfStock: { label: "אזל", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
};

const defaultStatus = { label: "לא ידוע", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" };

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  // Fetch products from Firestore via API
  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    } finally {
      setLoading(false);
    }
  }

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const filtered = products.filter((p) => {
    if (search && !p.titleHe?.includes(search) && !p.titleEn?.toLowerCase().includes(search.toLowerCase())) return false;
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

  const margin = (price: number, cost: number) => {
    if (!price || !cost) return 0;
    return Math.round(((price - cost) / price) * 100);
  };

  // Delete selected products
  const handleDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`למחוק ${selected.size} מוצרים?`)) return;

    setDeleting(true);
    try {
      const deletePromises = Array.from(selected).map((id) =>
        fetch(`/api/admin/products/${id}`, { method: "DELETE" })
      );
      await Promise.all(deletePromises);
      setProducts((prev) => prev.filter((p) => !selected.has(p.id)));
      setSelected(new Set());
    } catch (err) {
      console.error("Error deleting products:", err);
    } finally {
      setDeleting(false);
    }
  };

  // Delete single product
  const handleDeleteSingle = async (id: string) => {
    if (!confirm("למחוק מוצר זה?")) return;
    try {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting product:", err);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">מוצרים</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? "טוען..." : `${products.length} מוצרים`}
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/products/scan"
            className="px-4 py-2 bg-white text-charcoal text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            🔍 סריקת מוצרים
          </Link>
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
            <option value="ACTIVE">פעיל</option>
            <option value="DRAFT">טיוטה</option>
            <option value="OUT_OF_STOCK">אזל מהמלאי</option>
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
          {/* Refresh */}
          <button
            onClick={fetchProducts}
            className="px-3 py-2.5 text-sm text-gray-500 hover:text-charcoal hover:bg-gray-100 rounded-xl transition-colors"
            title="רענן"
          >
            🔄
          </button>
        </div>

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm text-gray-500">{selected.size} נבחרו</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-sm text-red-500 hover:text-red-700 font-medium disabled:opacity-50"
            >
              {deleting ? "מוחק..." : "🗑️ מחק"}
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="animate-pulse text-4xl mb-3">📦</div>
          <p className="text-gray-500">טוען מוצרים...</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-bold text-charcoal mb-2">אין מוצרים עדיין</h3>
          <p className="text-gray-500 mb-6">סרוק מוצרים טרנדיים מ-AliExpress או ייבא ידנית</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/admin/products/scan"
              className="px-6 py-3 bg-coral text-white font-medium rounded-xl hover:bg-coral-dark transition-colors"
            >
              🔍 סריקת מוצרים
            </Link>
            <Link
              href="/admin/products/import"
              className="px-6 py-3 bg-white text-charcoal font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              📥 ייבוא ידני
            </Link>
          </div>
        </div>
      )}

      {/* Product table */}
      {!loading && filtered.length > 0 && (
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
                const status = statusConfig[product.status] || defaultStatus;
                const productImage = product.images?.[0];
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
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-lg shrink-0 overflow-hidden relative">
                          {productImage ? (
                            <Image
                              src={productImage}
                              alt={product.titleHe || product.titleEn}
                              fill
                              className="object-cover"
                              sizes="40px"
                              unoptimized
                            />
                          ) : (
                            "📦"
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-charcoal truncate">{product.titleHe || product.titleEn}</p>
                          <p className="text-xs text-gray-400 truncate">{product.titleEn}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-500">{product.category || "—"}</td>
                    <td className="px-4 py-4 font-medium text-charcoal">
                      {product.price ? `₪${Number(product.price).toFixed(0)}` : "—"}
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {product.costPrice ? `$${Number(product.costPrice).toFixed(0)}` : "—"}
                    </td>
                    <td className="px-4 py-4">
                      {product.price && product.costPrice ? (
                        <span className={`font-medium ${margin(product.price, product.costPrice * 3.6) >= 60 ? "text-emerald-600" : margin(product.price, product.costPrice * 3.6) >= 40 ? "text-amber-600" : "text-red-600"}`}>
                          {margin(product.price, product.costPrice * 3.6)}%
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="text-coral hover:text-coral-dark text-sm font-medium"
                        >
                          עריכה
                        </Link>
                        <button
                          onClick={() => handleDeleteSingle(product.id)}
                          className="text-red-400 hover:text-red-600 text-sm"
                          title="מחק"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
