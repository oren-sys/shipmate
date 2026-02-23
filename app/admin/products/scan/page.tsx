"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Category {
  id: string;
  aliexpressId: string;
  nameEn: string;
  nameHe: string;
}

interface ScannedProduct {
  aliexpressId: string;
  titleEn: string;
  titleHe: string;
  descriptionEn: string;
  costPriceUSD: number;
  originalPriceUSD: number;
  priceILS: number;
  compareAtILS: number;
  discount: string;
  images: string[];
  salesVolume: number;
  rating: number;
  commissionRate: string;
  aliexpressUrl: string;
  category: string;
  selected: boolean;
}

const ITEMS_PER_CATEGORY_OPTIONS = [5, 10, 15, 20, 30, 50];

export default function ScanProductsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [itemsPerCategory, setItemsPerCategory] = useState(10);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0, category: "" });
  const [products, setProducts] = useState<ScannedProduct[]>([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null);
  const [error, setError] = useState("");
  const [dataSource, setDataSource] = useState<string>("");

  // Fetch categories on mount
  useEffect(() => {
    fetch("/api/admin/products/scan")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => setError("שגיאה בטעינת קטגוריות"));
  }, []);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const selectAllCategories = () => {
    if (selectedCategories.length === categories.length) {
      setSelectedCategories([]);
    } else {
      setSelectedCategories(categories.map((c) => c.id));
    }
  };

  /* ── Scan AliExpress ── */
  const handleScan = async () => {
    if (selectedCategories.length === 0) {
      setError("יש לבחור לפחות קטגוריה אחת");
      return;
    }

    setError("");
    setScanning(true);
    setProducts([]);
    setImportResult(null);
    setScanProgress({ current: 0, total: selectedCategories.length, category: "" });

    const allProducts: ScannedProduct[] = [];

    for (let i = 0; i < selectedCategories.length; i++) {
      const catId = selectedCategories[i];
      const cat = categories.find((c) => c.id === catId);
      setScanProgress({ current: i + 1, total: selectedCategories.length, category: cat?.nameHe || catId });

      try {
        const res = await fetch("/api/admin/products/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryId: catId,
            count: itemsPerCategory,
            autoTranslate,
          }),
        });

        if (!res.ok) throw new Error("Scan failed");

        const data = await res.json();
        if (data.source) setDataSource(data.source);
        const categoryProducts = (data.products || []).map((p: Omit<ScannedProduct, "selected">) => ({
          ...p,
          category: catId,
          selected: true,
        }));

        allProducts.push(...categoryProducts);
      } catch (err) {
        console.error(`Error scanning category ${catId}:`, err);
      }
    }

    setProducts(allProducts);
    setScanning(false);
  };

  /* ── Import selected products ── */
  const handleImport = async () => {
    const selectedProducts = products.filter((p) => p.selected);
    if (selectedProducts.length === 0) {
      setError("יש לבחור לפחות מוצר אחד");
      return;
    }

    setImporting(true);
    setError("");

    let success = 0;
    let failed = 0;

    // Import in batches of 5
    const batchSize = 5;
    for (let i = 0; i < selectedProducts.length; i += batchSize) {
      const batch = selectedProducts.slice(i, i + batchSize);

      try {
        const res = await fetch("/api/admin/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            products: batch.map((p) => ({
              titleEn: p.titleEn,
              titleHe: p.titleHe,
              descriptionEn: p.descriptionEn,
              costPrice: p.costPriceUSD,
              price: p.priceILS,
              compareAtPrice: p.compareAtILS,
              images: p.images,
              aliexpressUrl: p.aliexpressUrl,
              aliexpressId: p.aliexpressId,
              category: p.category,
              status: "ACTIVE",
            })),
            autoTranslate,
          }),
        });

        if (res.ok) {
          success += batch.length;
        } else {
          failed += batch.length;
        }
      } catch {
        failed += batch.length;
      }
    }

    setImportResult({ success, failed });
    setImporting(false);
  };

  const toggleProduct = (index: number) => {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p))
    );
  };

  const selectAllProducts = () => {
    const allSelected = products.every((p) => p.selected);
    setProducts((prev) => prev.map((p) => ({ ...p, selected: !allSelected })));
  };

  const selectedCount = products.filter((p) => p.selected).length;

  const groupedProducts = products.reduce<Record<string, ScannedProduct[]>>((acc, p) => {
    const cat = categories.find((c) => c.id === p.category);
    const label = cat?.nameHe || p.category || "כללי";
    if (!acc[label]) acc[label] = [];
    acc[label].push(p);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
          <div>
            <h1 className="text-2xl font-bold text-charcoal">
              🔍 סריקת מוצרים טרנדיים
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              סריקה אוטומטית של מוצרים חמים מ-AliExpress לפי קטגוריה
            </p>
          </div>
        </div>

        {products.length > 0 && (
          <button
            onClick={() => {
              setProducts([]);
              setImportResult(null);
            }}
            className="px-4 py-2 text-sm text-gray-500 hover:text-charcoal hover:bg-gray-100 rounded-lg transition-colors"
          >
            סריקה חדשה
          </button>
        )}
      </div>

      {/* Import Result */}
      {importResult && (
        <div className="p-4 bg-teal/10 border border-teal/30 rounded-2xl">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-bold text-charcoal">
                הייבוא הושלם! {importResult.success} מוצרים יובאו בהצלחה
              </p>
              {importResult.failed > 0 && (
                <p className="text-sm text-red-500 mt-1">
                  {importResult.failed} מוצרים נכשלו
                </p>
              )}
              <button
                onClick={() => router.push("/admin/products")}
                className="mt-2 text-sm text-teal hover:underline font-medium"
              >
                צפייה במוצרים →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan config — only show if no products scanned yet */}
      {products.length === 0 && !scanning && (
        <>
          {/* Category Selection */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-charcoal">📁 בחירת קטגוריות</h2>
              <button
                onClick={selectAllCategories}
                className="text-sm text-coral hover:text-coral-dark font-medium"
              >
                {selectedCategories.length === categories.length ? "ניקוי הכל" : "בחר הכל"}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.id);
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategory(cat.id)}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      isSelected
                        ? "border-coral bg-coral/5 text-coral"
                        : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    <span className="text-2xl block mb-1">
                      {cat.id === "electronics" && "🔌"}
                      {cat.id === "fashion" && "👗"}
                      {cat.id === "home" && "🏠"}
                      {cat.id === "beauty" && "💄"}
                      {cat.id === "kids" && "🧒"}
                      {cat.id === "gadgets" && "📱"}
                      {cat.id === "sports" && "⚽"}
                      {cat.id === "auto" && "🚗"}
                      {cat.id === "jewelry" && "💎"}
                      {cat.id === "toys" && "🎮"}
                    </span>
                    <span className="text-sm font-medium">{cat.nameHe}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Items per Category */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-charcoal mb-4">📊 כמות מוצרים לקטגוריה</h2>

            <div className="flex flex-wrap gap-3">
              {ITEMS_PER_CATEGORY_OPTIONS.map((num) => (
                <button
                  key={num}
                  onClick={() => setItemsPerCategory(num)}
                  className={`px-5 py-3 rounded-xl text-sm font-bold transition-all ${
                    itemsPerCategory === num
                      ? "bg-coral text-white shadow-md shadow-coral/20"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {num} מוצרים
                </button>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoTranslate}
                  onChange={(e) => setAutoTranslate(e.target.checked)}
                  className="rounded border-gray-300 text-coral focus:ring-coral"
                />
                <span className="text-sm text-charcoal">תרגום אוטומטי לעברית</span>
              </label>

              <div className="text-sm text-gray-500">
                סה&quot;כ: <span className="font-bold text-charcoal">
                  {selectedCategories.length * itemsPerCategory}
                </span> מוצרים ({selectedCategories.length} קטגוריות × {itemsPerCategory})
              </div>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Scan Button */}
          <button
            onClick={handleScan}
            disabled={selectedCategories.length === 0}
            className="w-full py-4 bg-gradient-to-l from-coral to-[#E5553A] text-white font-bold text-lg rounded-2xl
                       hover:shadow-lg hover:shadow-coral/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🚀 התחל סריקה — {selectedCategories.length * itemsPerCategory} מוצרים
          </button>
        </>
      )}

      {/* Scanning progress */}
      {scanning && (
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-coral/10 flex items-center justify-center animate-pulse">
            <span className="text-3xl">🔍</span>
          </div>
          <h3 className="text-lg font-bold text-charcoal mb-2">
            סורק מוצרים טרנדיים...
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            קטגוריה {scanProgress.current}/{scanProgress.total}: {scanProgress.category}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto">
            <div
              className="bg-coral h-2 rounded-full transition-all duration-500"
              style={{
                width: `${(scanProgress.current / scanProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      {products.length > 0 && !scanning && (
        <>
          {/* Source indicator */}
          {dataSource === "no_token" && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span>🔑</span>
                <span>חשבון AliExpress לא מחובר — מוצגים מוצרים לדוגמה. חברו את החשבון כדי לטעון מוצרים אמיתיים.</span>
              </div>
              <a
                href="https://api-sg.aliexpress.com/oauth/authorize?response_type=code&force_auth=true&redirect_uri=https%3A%2F%2Fshipmate.store%2Fcallback&client_id=528274&sp=ae"
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
              >
                חבר AliExpress
              </a>
            </div>
          )}
          {dataSource === "fallback" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>AliExpress API לא זמין כרגע — מוצגים מוצרים לדוגמה לפי קטגוריה. אפשר לייבא אותם או לנסות שוב מאוחר יותר.</span>
            </div>
          )}

          {/* Results header */}
          <div className="flex items-center justify-between bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <button
                onClick={selectAllProducts}
                className="text-sm text-coral hover:text-coral-dark font-medium"
              >
                {products.every((p) => p.selected) ? "ביטול בחירה" : "בחר הכל"}
              </button>
              <span className="text-sm text-gray-500">
                {selectedCount}/{products.length} מוצרים נבחרו
              </span>
            </div>

            <button
              onClick={handleImport}
              disabled={importing || selectedCount === 0}
              className="px-6 py-3 bg-teal text-white font-bold rounded-xl hover:bg-teal/90
                         transition-all disabled:opacity-50 shadow-sm flex items-center gap-2"
            >
              {importing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  מייבא...
                </>
              ) : (
                <>
                  📥 ייבא {selectedCount} מוצרים לחנות
                </>
              )}
            </button>
          </div>

          {/* Products by category */}
          {Object.entries(groupedProducts).map(([categoryName, catProducts]) => (
            <div key={categoryName} className="space-y-3">
              <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-coral"></span>
                {categoryName}
                <span className="text-sm font-normal text-gray-400">
                  ({catProducts.filter((p) => p.selected).length}/{catProducts.length})
                </span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {catProducts.map((product) => {
                  const globalIdx = products.indexOf(product);
                  return (
                    <div
                      key={product.aliexpressId}
                      className={`bg-white rounded-xl p-4 shadow-sm border transition-all flex gap-4 ${
                        product.selected
                          ? "border-teal/40 bg-teal/[0.02]"
                          : "border-gray-100 opacity-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={product.selected}
                        onChange={() => toggleProduct(globalIdx)}
                        className="mt-1 rounded border-gray-300 text-teal focus:ring-teal flex-shrink-0"
                      />

                      {/* Image */}
                      <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                        {product.images[0] ? (
                          <Image
                            src={product.images[0]}
                            alt={product.titleEn}
                            fill
                            className="object-cover"
                            sizes="80px"
                            unoptimized
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            📦
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-charcoal text-sm leading-snug line-clamp-2">
                          {product.titleHe || product.titleEn}
                        </h4>
                        {product.titleHe && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1" dir="ltr">
                            {product.titleEn}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs">
                          <span className="text-gray-500">
                            עלות: <span className="font-medium" dir="ltr">${product.costPriceUSD.toFixed(2)}</span>
                          </span>
                          <span className="text-teal font-bold">
                            ₪{product.priceILS.toFixed(0)}
                          </span>
                          {product.salesVolume > 0 && (
                            <span className="text-gray-400">
                              🔥 {product.salesVolume.toLocaleString()} נמכרו
                            </span>
                          )}
                          {product.rating > 0 && (
                            <span className="text-gray-400">
                              ⭐ {product.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* Help */}
      {products.length === 0 && !scanning && (
        <div className="bg-cream rounded-2xl p-6 border border-coral/10">
          <h3 className="text-sm font-bold text-charcoal mb-3">💡 איך זה עובד?</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>• בחר קטגוריות וכמות מוצרים לכל קטגוריה</li>
            <li>• המערכת סורקת מוצרים חמים ונמכרים מ-AliExpress</li>
            <li>• תרגום אוטומטי לעברית + חישוב מחיר בשקלים</li>
            <li>• בחר את המוצרים שמעניינים אותך וייבא בלחיצה</li>
            <li>• המוצרים מתווספים ישירות לחנות שלך</li>
          </ul>
        </div>
      )}
    </div>
  );
}
