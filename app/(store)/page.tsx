import { Metadata } from "next";
import HeroBanner from "@/components/store/HeroBanner";
import TrustBar from "@/components/store/TrustBar";
import ProductGrid from "@/components/store/ProductGrid";
import CategoryGrid from "@/components/store/CategoryGrid";
import ReviewCarousel from "@/components/store/ReviewCarousel";
import NewsletterSignup from "@/components/store/NewsletterSignup";
import type { ProductCardProps } from "@/components/store/ProductCard";
import { getDb } from "@/lib/firebase";

export const metadata: Metadata = {
  title: "ShipMate | שיפמייט - החבר שלך לקניות חכמות",
  description: "מוצרים שווים במחירים שלא תאמינו. אלפי מוצרים מגניבים עם משלוח לכל הארץ. קניות חכמות מתחילות כאן!",
  openGraph: {
    title: "ShipMate | שיפמייט",
    description: "החבר שלך לקניות חכמות - מוצרים שווים במחירים מדהימים",
    url: "https://shipmate.store",
  },
};

// Always render dynamically (Firestore not available at build time)
export const dynamic = "force-dynamic";

async function getActiveProducts(sortBy: string, limit: number): Promise<ProductCardProps[]> {
  try {
    const db = getDb();
    const snap = await db
      .collection("products")
      .where("status", "==", "ACTIVE")
      .orderBy(sortBy, "desc")
      .limit(limit)
      .get();

    if (snap.empty) return [];

    return snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        slug: d.slug || doc.id,
        titleHe: d.titleHe || d.titleEn || "מוצר",
        price: d.price || 0,
        compareAtPrice: d.compareAtPrice || undefined,
        image: d.images?.[0] || "",
        avgRating: d.avgRating || 0,
        reviewCount: d.reviewCount || 0,
        badge: d.trendScore > 50 ? "hot" : d.compareAtPrice ? "sale" : null,
      };
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
}

export default async function HomePage() {
  // Fetch real products from Firestore
  const [hotProducts, bestSellers, newArrivals] = await Promise.all([
    getActiveProducts("createdAt", 4),
    getActiveProducts("createdAt", 4),
    getActiveProducts("createdAt", 8),
  ]);

  // Use different slices of newArrivals if we don't have enough distinct products
  const displayHot = hotProducts.length > 0 ? hotProducts : [];
  const displayBest = bestSellers.length > 0 ? bestSellers : [];
  const displayNew = newArrivals.length > 4 ? newArrivals.slice(4) : newArrivals;

  const hasProducts = displayHot.length > 0 || displayBest.length > 0 || displayNew.length > 0;

  return (
    <>
      <HeroBanner />
      <TrustBar />
      {hasProducts ? (
        <>
          {displayHot.length > 0 && (
            <ProductGrid
              title="🔥 מוצרים חמים"
              products={displayHot}
              showViewAll
              viewAllHref="/category/trending"
            />
          )}
          <CategoryGrid />
          {displayBest.length > 0 && (
            <ProductGrid
              title="⭐ הכי נמכרים"
              products={displayBest}
              showViewAll
              viewAllHref="/category/best-sellers"
            />
          )}
          <ReviewCarousel />
          {displayNew.length > 0 && (
            <ProductGrid
              title="🆕 הגיעו לאחרונה"
              products={displayNew}
              showViewAll
              viewAllHref="/category/new-arrivals"
            />
          )}
        </>
      ) : (
        <>
          <CategoryGrid />
          <div className="max-w-7xl mx-auto px-4 py-16 text-center">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-2xl font-bold text-charcoal mb-2">מוצרים בדרך!</h2>
            <p className="text-charcoal-light">אנחנו עובדים על הוספת מוצרים מדהימים. חזרו בקרוב!</p>
          </div>
          <ReviewCarousel />
        </>
      )}
      <NewsletterSignup />
    </>
  );
}
