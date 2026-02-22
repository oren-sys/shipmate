"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Search, X, Clock, TrendingUp, Loader2, ShoppingBag } from "lucide-react";

interface SearchResult {
  id: string;
  slug: string;
  titleHe: string;
  image: string;
  price: number;
}

const POPULAR_SEARCHES = [
  "אוזניות אלחוטיות",
  "מטען אלחוטי",
  "כיסוי לאייפון",
  "תאורת LED",
  "שעון חכם",
  "מארגן כבלים",
];

export default function SearchBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("shipmate-recent-searches");
      if (saved) setRecentSearches(JSON.parse(saved));
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    try {
      localStorage.setItem("shipmate-recent-searches", JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  };

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery.trim())}&limit=6`
      );
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {
      // Fail silently
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (query.trim().length >= 2) {
      debounceTimer.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, performSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      saveRecentSearch(query.trim());
      setShowDropdown(false);
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleQuickSearch = (term: string) => {
    setQuery(term);
    saveRecentSearch(term);
    setShowDropdown(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const clearRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("shipmate-recent-searches");
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            className="w-full py-3.5 px-5 pr-12 bg-cream rounded-2xl text-charcoal
                       placeholder-charcoal-light focus:outline-none focus:ring-2
                       focus:ring-coral/30 font-heebo text-sm"
            placeholder="מה את/ה מחפש/ת? 🔍"
            autoComplete="off"
          />
          <Search
            size={18}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal-light"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                inputRef.current?.focus();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-light
                         hover:text-charcoal transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown */}
      {showDropdown && (
        <>
          {/* Click-away overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowDropdown(false)}
          />

          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-lg
                          border border-cream-dark/20 z-50 overflow-hidden max-h-[70vh] overflow-y-auto">
            {/* Loading state */}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={20} className="animate-spin text-coral" />
              </div>
            )}

            {/* Search results */}
            {!isLoading && results.length > 0 && (
              <div className="p-2">
                <p className="px-3 py-1.5 text-xs text-charcoal-light font-medium">
                  תוצאות ({results.length})
                </p>
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/product/${result.slug}`}
                    onClick={() => {
                      setShowDropdown(false);
                      saveRecentSearch(query.trim());
                    }}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream
                              transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-cream flex-shrink-0">
                      {result.image ? (
                        <Image
                          src={result.image}
                          alt={result.titleHe}
                          width={40}
                          height={40}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag size={16} className="text-charcoal-light" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm line-clamp-1">{result.titleHe}</p>
                      <p className="text-xs text-coral font-bold">₪{result.price.toFixed(0)}</p>
                    </div>
                  </Link>
                ))}
                <button
                  onClick={handleSubmit}
                  className="w-full text-center text-sm text-teal font-medium py-2 mt-1
                            hover:bg-teal/5 rounded-xl transition-colors"
                >
                  הצג את כל התוצאות →
                </button>
              </div>
            )}

            {/* No results */}
            {!isLoading && query.trim().length >= 2 && results.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-charcoal-light text-sm">
                  לא נמצאו תוצאות עבור &quot;{query}&quot;
                </p>
                <p className="text-xs text-charcoal-light/70 mt-1">
                  נסו מילות חיפוש אחרות
                </p>
              </div>
            )}

            {/* Empty state: recent + popular */}
            {!isLoading && query.trim().length < 2 && (
              <div className="p-3 space-y-4">
                {/* Recent searches */}
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 mb-2">
                      <p className="text-xs text-charcoal-light font-medium flex items-center gap-1">
                        <Clock size={12} />
                        חיפושים אחרונים
                      </p>
                      <button
                        onClick={clearRecent}
                        className="text-[10px] text-charcoal-light/60 hover:text-coral transition-colors"
                      >
                        נקה
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          onClick={() => handleQuickSearch(term)}
                          className="px-3 py-1.5 bg-cream text-sm rounded-lg hover:bg-cream-dark/20
                                    transition-colors"
                        >
                          {term}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Popular searches */}
                <div>
                  <p className="px-2 mb-2 text-xs text-charcoal-light font-medium flex items-center gap-1">
                    <TrendingUp size={12} />
                    חיפושים פופולריים
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_SEARCHES.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleQuickSearch(term)}
                        className="px-3 py-1.5 bg-coral/5 text-coral text-sm rounded-lg
                                  hover:bg-coral/10 transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
