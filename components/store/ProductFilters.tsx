"use client";

import { useState } from "react";
import { SlidersHorizontal, ChevronDown } from "lucide-react";

interface FilterProps {
  onSortChange?: (sort: string) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
}

const sortOptions = [
  { value: "trendScore", label: "פופולריות" },
  { value: "createdAt", label: "חדשים" },
  { value: "price-asc", label: "מחיר: נמוך לגבוה" },
  { value: "price-desc", label: "מחיר: גבוה לנמוך" },
  { value: "avgRating", label: "דירוג" },
  { value: "salesCount", label: "הכי נמכר" },
];

const priceRanges = [
  { label: "עד ₪50", min: 0, max: 50 },
  { label: "₪50 - ₪100", min: 50, max: 100 },
  { label: "₪100 - ₪200", min: 100, max: 200 },
  { label: "₪200+", min: 200, max: 99999 },
];

export default function ProductFilters({ onSortChange, onFilterChange }: FilterProps) {
  const [sort, setSort] = useState("trendScore");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);

  const handleSort = (value: string) => {
    setSort(value);
    onSortChange?.(value);
  };

  return (
    <div className="space-y-4">
      {/* Top bar: sort + filter toggle */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl border border-cream-dark/30
                   hover:border-teal/30 transition-colors text-sm font-medium"
        >
          <SlidersHorizontal size={16} />
          סינון
          <ChevronDown size={14} className={`transition-transform ${showFilters ? "rotate-180" : ""}`} />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-charcoal-light hidden sm:inline">מיון:</span>
          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="bg-white border border-cream-dark/30 rounded-xl px-3 py-2.5 text-sm
                     focus:outline-none focus:ring-2 focus:ring-teal/20 font-heebo"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white rounded-2xl p-5 border border-cream-dark/30 animate-slide-down">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Price range */}
            <div>
              <h3 className="font-bold text-sm mb-3">טווח מחירים</h3>
              <div className="space-y-2">
                {priceRanges.map((range, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="price"
                      checked={selectedPrice === i}
                      onChange={() => {
                        setSelectedPrice(i);
                        onFilterChange?.({ priceMin: range.min, priceMax: range.max });
                      }}
                      className="accent-coral"
                    />
                    <span className="text-sm text-charcoal group-hover:text-coral transition-colors">
                      {range.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <h3 className="font-bold text-sm mb-3">דירוג מינימלי</h3>
              <div className="space-y-2">
                {[4, 3, 2].map((rating) => (
                  <label key={rating} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="rating" className="accent-coral" />
                    <span className="text-sm text-charcoal group-hover:text-coral transition-colors">
                      {rating}+ כוכבים
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Shipping */}
            <div>
              <h3 className="font-bold text-sm mb-3">זמן משלוח</h3>
              <div className="space-y-2">
                {["עד 7 ימים", "עד 14 ימים", "עד 21 ימים"].map((label) => (
                  <label key={label} className="flex items-center gap-2 cursor-pointer group">
                    <input type="radio" name="shipping" className="accent-coral" />
                    <span className="text-sm text-charcoal group-hover:text-coral transition-colors">
                      {label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Clear */}
          <button
            onClick={() => {
              setSelectedPrice(null);
              onFilterChange?.({});
            }}
            className="mt-4 text-sm text-coral hover:text-coral-dark font-medium"
          >
            נקה סינון
          </button>
        </div>
      )}
    </div>
  );
}
