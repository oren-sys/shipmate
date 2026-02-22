import { Metadata } from "next";
import ProductCard, { ProductCardProps } from "@/components/store/ProductCard";
import ProductFilters from "@/components/store/ProductFilters";
import { ChevronLeft, Home } from "lucide-react";
import Link from "next/link";
import { getDb } from "@/lib/firebase";

interface CategoryPageProps {
  params: { slug: string };
}

// Hebrew category names map
const categoryNames: Record<string, string> = {
  electronics: "אלקטרוניקה",
  fashion: "אופנה",
  home: "בית וגן",
  beauty: "יופי וטיפוח",
  kids: "ילדים",
  gadgets: "גאדג׳טים",
  trending: "מוצרים חמים",
  "best-sellers": "הכי נמכרים",
  "new-arrivals": "הגיעו לאחרונה",
  sports: "ספורט",
  auto: "רכב",
  jewelry: "תכשיטים",
  toys: "צעצועים",
};

// Always render dynamically (Firestore not available at build time)
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const name = categoryNames[params.slug] || params.slug;
  return {
    title: `${name} | ShipMate שיפמייט`,
    description: `מוצרי ${name} במחירים מדהימים. משלוח לכל הארץ.`,
  };
}

async function getCategoryProducts(slug: string): Promise<ProductCardProps[]> {
  try {
    const db = getDb();
    let query = db
      .collection("products")
      .where("status", "==", "ACTIVE");

    // Special categories
    if (slug === "trending" || slug === "best-sellers") {
      query = query.orderBy("createdAt", "desc").limit(20);
    } else if (slug === "new-arrivals") {
      query = query.orderBy("createdAt", "desc").limit(20);
    } else {
      // Filter by category slug
      query = query.where("category", "==", slug).orderBy("createdAt", "desc").limit(20);
    }

    const snap = await query.get();
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
        badge: d.compareAtPrice ? "sale" : null,
      };
    });
  } catch (error) {
    console.error("Error fetching category products:", error);
    return [];
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const categoryName = categoryNames[params.slug] || params.slug;
  const products = await getCategoryProducts(params.slug);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-charcoal-light mb-6">
        <Link href="/" className="hover:text-coral transition-colors flex items-center gap-1">
          <Home size={14} />
          ראשי
        </Link>
        <ChevronLeft size={14} />
        <span className="text-charcoal font-medium">{categoryName}</span>
      </nav>

      {/* Title */}
      <h1 className="text-3xl font-bold text-charcoal mb-2">{categoryName}</h1>
      <p className="text-charcoal-light mb-6">{products.length} מוצרים</p>

      {products.length > 0 ? (
        <>
          {/* Filters */}
          <ProductFilters />

          {/* Product grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            {products.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-bold text-charcoal mb-2">אין מוצרים בקטגוריה זו עדיין</h3>
          <p className="text-charcoal-light mb-6">מוצרים חדשים מתווספים כל הזמן. חזרו בקרוב!</p>
          <Link href="/" className="text-coral hover:text-coral-dark font-medium">
            חזרה לדף הבית →
          </Link>
        </div>
      )}
    </div>
  );
}
