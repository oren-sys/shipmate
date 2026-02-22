"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface ImportedProduct {
  titleEn: string;
  titleHe: string;
  price: number;
  costPrice: number;
  images: string[];
  descriptionEn: string;
  aliexpressUrl: string;
  selected: boolean;
}

export default function ProductImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [bulkUrls, setBulkUrls] = useState("");
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<ImportedProduct[]>([]);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const handleScrape = async () => {
    setError("");
    setLoading(true);

    try {
      const urls =
        mode === "single"
          ? [url.trim()]
          : bulkUrls
              .split("\n")
              .map((u) => u.trim())
              .filter(Boolean);

      if (urls.length === 0) {
        setError("יש להזין לפחות כתובת אחת");
        return;
      }

      const res = await fetch("/api/admin/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, autoTranslate }),
      });

      if (!res.ok) throw new Error("Scrape failed");

      const data = await res.json();
      setProducts(
        data.products.map((p: Omit<ImportedProduct, "selected">) => ({
          ...p,
          selected: true,
        }))
      );
    } catch {
      setError("שגיאה בייבוא המוצרים. בדקו את הכתובת ונסו שוב.");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const selectedProducts = products.filter((p) => p.selected);
    if (selectedProducts.length === 0) {
      setError("יש לבחור לפחות מוצר אחד");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: selectedProducts,
          autoTranslate,
        }),
      });

      if (!res.ok) throw new Error("Import failed");
      router.push("/admin/products");
    } catch {
      setError("שגיאה בשמירת המוצרים");
    } finally {
      setImporting(false);
    }
  };

  const toggleProduct = (index: number) => {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  };

  const selectedCount = products.filter((p) => p.selected).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          →
        </button>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">ייבוא מ-AliExpress</h1>
          <p className="text-sm text-gray-500 mt-1">הדבק קישור מוצר ומנוע הייבוא יטפל בשאר</p>
        </div>
      </div>

      {/* Import form */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {/* Mode tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode("single")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "single" ? "bg-coral text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            מוצר בודד
          </button>
          <button
            onClick={() => setMode("bulk")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === "bulk" ? "bg-coral text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ייבוא מרובה
          </button>
        </div>

        {mode === "single" ? (
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">קישור למוצר</label>
            <div className="flex gap-3">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://aliexpress.com/item/..."
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 focus:border-coral outline-none"
                dir="ltr"
              />
              <button
                onClick={handleScrape}
                disabled={loading || !url.trim()}
                className="px-6 py-2.5 bg-coral text-white font-medium rounded-xl hover:bg-coral-dark transition-colors disabled:opacity-50"
              >
                {loading ? "מייבא..." : "ייבוא"}
              </button>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">
              קישורים (קישור אחד בכל שורה)
            </label>
            <textarea
              value={bulkUrls}
              onChange={(e) => setBulkUrls(e.target.value)}
              rows={6}
              placeholder={`https://aliexpress.com/item/123.html\nhttps://aliexpress.com/item/456.html\nhttps://aliexpress.com/item/789.html`}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 focus:border-coral outline-none resize-none font-mono"
              dir="ltr"
            />
            <button
              onClick={handleScrape}
              disabled={loading || !bulkUrls.trim()}
              className="mt-3 px-6 py-2.5 bg-coral text-white font-medium rounded-xl hover:bg-coral-dark transition-colors disabled:opacity-50"
            >
              {loading ? "מייבא..." : `ייבא ${bulkUrls.split("\n").filter(Boolean).length} מוצרים`}
            </button>
          </div>
        )}

        {/* Options */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={autoTranslate}
              onChange={(e) => setAutoTranslate(e.target.checked)}
              className="rounded border-gray-300 text-coral focus:ring-coral"
            />
            <span className="text-sm text-charcoal">תרגם אוטומטית לעברית (Google Translate)</span>
          </label>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Preview results */}
      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-charcoal">
              תצוגה מקדימה ({selectedCount}/{products.length} נבחרו)
            </h2>
            <button
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
              className="px-6 py-2.5 bg-teal text-white font-medium rounded-xl hover:bg-teal-dark transition-colors disabled:opacity-50 shadow-sm"
            >
              {importing ? "שומר..." : `שמור ${selectedCount} מוצרים`}
            </button>
          </div>

          {products.map((product, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl p-6 shadow-sm border transition-all ${
                product.selected ? "border-teal/50" : "border-gray-100 opacity-60"
              }`}
            >
              <div className="flex items-start gap-4">
                <input
                  type="checkbox"
                  checked={product.selected}
                  onChange={() => toggleProduct(index)}
                  className="mt-1 rounded border-gray-300 text-teal focus:ring-teal"
                />

                <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center text-3xl shrink-0">
                  📦
                </div>

                <div className="flex-1">
                  <h3 className="font-bold text-charcoal">{product.titleHe || product.titleEn}</h3>
                  {product.titleHe && (
                    <p className="text-xs text-gray-400" dir="ltr">{product.titleEn}</p>
                  )}
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="text-gray-500">
                      עלות: <span className="font-medium">${product.costPrice}</span>
                    </span>
                    <span className="text-teal font-medium">
                      מחיר מוצע: ₪{product.price}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                    {product.descriptionEn}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help */}
      <div className="bg-cream rounded-2xl p-6 border border-coral/10">
        <h3 className="text-sm font-bold text-charcoal mb-3">💡 טיפים לייבוא</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• העתק את כתובת המוצר ישירות מ-AliExpress</li>
          <li>• המערכת תחלץ אוטומטית תמונות, מחיר ותיאור</li>
          <li>• התמחור מחושב אוטומטית לפי נוסחת הרווחיות</li>
          <li>• ניתן לערוך כל מוצר אחרי הייבוא</li>
          <li>• בייבוא מרובה — עד 20 מוצרים בבת אחת</li>
        </ul>
      </div>
    </div>
  );
}
