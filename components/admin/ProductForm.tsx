"use client";

import { useState } from "react";
import ImageManager from "./ImageManager";

export interface ProductData {
  id?: string;
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  costPrice: number;
  price: number;
  compareAtPrice: number;
  category: string;
  tags: string[];
  status: "active" | "draft" | "outOfStock";
  images: string[];
  aliexpressUrl: string;
  weight: number;
}

const defaultProduct: ProductData = {
  titleHe: "",
  titleEn: "",
  descriptionHe: "",
  descriptionEn: "",
  costPrice: 0,
  price: 0,
  compareAtPrice: 0,
  category: "",
  tags: [],
  status: "draft",
  images: [],
  aliexpressUrl: "",
  weight: 0,
};

const categories = [
  { value: "electronics", label: "אלקטרוניקה" },
  { value: "fashion", label: "אופנה" },
  { value: "home", label: "בית וגן" },
  { value: "beauty", label: "יופי וטיפוח" },
  { value: "sports", label: "ספורט" },
  { value: "toys", label: "צעצועים" },
  { value: "gadgets", label: "גאדג׳טים" },
  { value: "auto", label: "רכב" },
  { value: "jewelry", label: "תכשיטים" },
  { value: "kids", label: "ילדים" },
];

// Tiered markup pricing
function calculatePrice(costUSD: number, exchangeRate: number = 3.6): { price: number; compareAt: number } {
  const costILS = costUSD * exchangeRate;
  let markup: number;

  if (costUSD < 5) markup = 3.0;
  else if (costUSD <= 15) markup = 2.5;
  else markup = 2.0;

  const basePrice = costILS * markup;
  const withVAT = basePrice * 1.17;
  // Round to .90
  const price = Math.ceil(withVAT / 10) * 10 - 0.1;
  const compareAt = Math.ceil(price * 1.3 / 10) * 10 - 0.1;

  return { price, compareAt };
}

interface ProductFormProps {
  product?: Partial<ProductData>;
  onSave: (data: ProductData) => void;
  isNew?: boolean;
}

export default function ProductForm({ product, onSave, isNew = false }: ProductFormProps) {
  const [data, setData] = useState<ProductData>({ ...defaultProduct, ...product });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof ProductData>(key: K, value: ProductData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const handleCostChange = (costPrice: number) => {
    update("costPrice", costPrice);
    if (costPrice > 0) {
      const { price, compareAt } = calculatePrice(costPrice);
      update("price", price);
      update("compareAtPrice", compareAt);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !data.tags.includes(tagInput.trim())) {
      update("tags", [...data.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    update("tags", data.tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      onSave(data);
    } finally {
      setSaving(false);
    }
  };

  const marginPercent = data.price > 0 && data.costPrice > 0
    ? Math.round(((data.price - data.costPrice * 3.6 * 1.17) / data.price) * 100)
    : 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content — left 2 cols */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic info */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">פרטי מוצר</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">שם מוצר (עברית)</label>
                <input
                  type="text"
                  value={data.titleHe}
                  onChange={(e) => update("titleHe", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 focus:border-coral outline-none"
                  placeholder="אוזניות בלוטוס אלחוטיות"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">שם מוצר (אנגלית)</label>
                <input
                  type="text"
                  value={data.titleEn}
                  onChange={(e) => update("titleEn", e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 focus:border-coral outline-none"
                  placeholder="Wireless Bluetooth Earbuds"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">תיאור (עברית)</label>
                <textarea
                  value={data.descriptionHe}
                  onChange={(e) => update("descriptionHe", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 focus:border-coral outline-none resize-none"
                  placeholder="תיאור מפורט בעברית..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">תיאור (אנגלית)</label>
                <textarea
                  value={data.descriptionEn}
                  onChange={(e) => update("descriptionEn", e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 focus:border-coral outline-none resize-none"
                  placeholder="English description..."
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">💰 תמחור</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">עלות ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={data.costPrice || ""}
                  onChange={(e) => handleCostChange(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 focus:border-coral outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">מחיר (₪)</label>
                <input
                  type="number"
                  step="0.1"
                  value={data.price || ""}
                  onChange={(e) => update("price", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 focus:border-coral outline-none"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">מחיר לפני הנחה (₪)</label>
                <input
                  type="number"
                  step="0.1"
                  value={data.compareAtPrice || ""}
                  onChange={(e) => update("compareAtPrice", parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 focus:border-coral outline-none"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">מרווח</label>
                <div className={`px-4 py-2.5 rounded-xl text-sm font-bold ${marginPercent >= 50 ? "bg-emerald-50 text-emerald-700" : marginPercent >= 30 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>
                  {marginPercent}%
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              תמחור אוטומטי: ×3 מתחת ל$5 | ×2.5 בין $5-15 | ×2 מעל $15 | +17% מע&quot;מ
            </p>
          </div>

          {/* Images */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">📸 תמונות</h3>
            <ImageManager
              images={data.images}
              onChange={(images) => update("images", images)}
            />
          </div>
        </div>

        {/* Sidebar — right col */}
        <div className="space-y-6">
          {/* Status */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">סטטוס</h3>
            <select
              value={data.status}
              onChange={(e) => update("status", e.target.value as ProductData["status"])}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-coral/30 outline-none"
            >
              <option value="draft">טיוטה</option>
              <option value="active">פעיל</option>
              <option value="outOfStock">אזל מהמלאי</option>
            </select>
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">קטגוריה</h3>
            <select
              value={data.category}
              onChange={(e) => update("category", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-coral/30 outline-none"
              required
            >
              <option value="">בחר קטגוריה</option>
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">תגיות</h3>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-coral/30 outline-none"
                placeholder="הוסף תגית..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-gray-100 text-charcoal rounded-lg text-sm hover:bg-gray-200 transition-colors"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-coral/10 text-coral rounded-full text-xs font-medium"
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-coral-dark">×</button>
                </span>
              ))}
            </div>
          </div>

          {/* AliExpress */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">🔗 AliExpress</h3>
            <input
              type="url"
              value={data.aliexpressUrl}
              onChange={(e) => update("aliexpressUrl", e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
              placeholder="https://aliexpress.com/item/..."
              dir="ltr"
            />
            <input
              type="number"
              step="0.01"
              value={data.weight || ""}
              onChange={(e) => update("weight", parseFloat(e.target.value) || 0)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none mt-3"
              placeholder="משקל (גרם)"
            />
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-coral text-white font-bold rounded-xl hover:bg-coral-dark transition-all disabled:opacity-50 shadow-md shadow-coral/20"
          >
            {saving ? "שומר..." : isNew ? "צור מוצר" : "שמור שינויים"}
          </button>
        </div>
      </div>
    </form>
  );
}
