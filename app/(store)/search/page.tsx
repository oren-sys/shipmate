"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search as SearchIcon, SlidersHorizontal, PackageOpen } from "lucide-react";
import SearchBar from "@/components/store/SearchBar";
import ProductCard from "@/components/store/ProductCard";

interface SearchResult {
  id: string;
  slug: string;
  titleHe: string;
  image: string;
  price: number;
  compareAtPrice?: number;
  avgRating?: number;
  reviewCount?: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");

  useEffect(() => {
    if (!initialQuery.trim()) {
      setResults([]);
      setTotal(0);
      return;
    }

    const fetchResults = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(initialQuery)}&limit=40`
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data.results || []);
          setTotal(data.total || 0);
        }
      } catch {
        // Fail silently
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [initialQuery]);

  // Sort results client-side
  const sortedResults = [...results].sort((a, b) => {
    switch (sortBy) {
      case "price-low":
        return a.price - b.price;
      case "price-high":
        return b.price - a.price;
      case "rating":
        return (b.avgRating || 0) - (a.avgRating || 0);
      default: // relevance — keep server order
        return 0;
    }
  });

  return (
    <>
      {/* Results header */}
      {initialQuery && (
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">
              {isLoading ? (
                "מחפש..."
              ) : total > 0 ? (
                <>תוצאות חיפוש עבור &quot;{initialQuery}&quot; ({total})</>
              ) : (
                <>לא נמצאו תוצאות עבור &quot;{initialQuery}&quot;</>
              )}
            </h1>
          </div>

          {total > 0 && (
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={16} className="text-charcoal-light" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-sm bg-white border border-cream-dark/30 rounded-lg px-3 py-2
                          focus:outline-none focus:ring-2 focus:ring-coral/30"
              >
                <option value="relevance">רלוונטיות</option>
                <option value="price-low">מחיר: נמוך לגבוה</option>
                <option value="price-high">מחיר: גבוה לנמוך</option>
                <option value="rating">דירוג</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-square bg-cream" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-cream rounded w-3/4" />
                <div className="h-4 bg-cream rounded w-1/2" />
                <div className="h-5 bg-cream rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results grid */}
      {!isLoading && sortedResults.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sortedResults.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              slug={product.slug}
              titleHe={product.titleHe}
              price={product.price}
              compareAtPrice={product.compareAtPrice}
              image={product.image}
              avgRating={product.avgRating}
              reviewCount={product.reviewCount}
            />
          ))}
        </div>
      )}

      {/* No results */}
      {!isLoading && initialQuery && total === 0 && (
        <div className="text-center py-16 space-y-4">
          <div className="w-20 h-20 bg-cream rounded-3xl flex items-center justify-center mx-auto">
            <PackageOpen size={36} className="text-charcoal-light" />
          </div>
          <h2 className="text-lg font-bold">לא מצאנו מה שחיפשת 😕</h2>
          <p className="text-charcoal-light text-sm max-w-md mx-auto">
            נסו לחפש עם מילות מפתח אחרות, או עיינו בקטגוריות שלנו למציאת מוצרים מגניבים.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            {["אוזניות", "מטען", "שעון חכם", "LED", "כיסוי"].map((term) => (
              <a
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="px-4 py-2 bg-coral/5 text-coral text-sm rounded-xl
                          hover:bg-coral/10 transition-colors font-medium"
              >
                {term}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Empty state — no query */}
      {!initialQuery && (
        <div className="text-center py-16 space-y-4">
          <div className="w-20 h-20 bg-coral/10 rounded-3xl flex items-center justify-center mx-auto">
            <SearchIcon size={36} className="text-coral" />
          </div>
          <h2 className="text-lg font-bold">חפשו מוצרים</h2>
          <p className="text-charcoal-light text-sm max-w-md mx-auto">
            הקלידו מילות חיפוש בשורת החיפוש למעלה כדי למצוא מוצרים מגניבים
          </p>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-8">
        <SearchBar />
      </div>

      <Suspense
        fallback={
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden animate-pulse">
                <div className="aspect-square bg-cream" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-cream rounded w-3/4" />
                  <div className="h-4 bg-cream rounded w-1/2" />
                  <div className="h-5 bg-cream rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        }
      >
        <SearchContent />
      </Suspense>
    </div>
  );
}
