import { Metadata } from "next";
import Link from "next/link";
import { Home, ChevronLeft, Truck, RotateCcw, ShieldCheck, CreditCard } from "lucide-react";
import ImageGallery from "@/components/store/ImageGallery";
import ShareButtons from "@/components/store/ShareButtons";
import ReviewSection from "@/components/store/ReviewSection";
import AddToCartButton from "./AddToCartButton";
import { notFound } from "next/navigation";
import { getDb } from "@/lib/firebase";

interface ProductPageProps {
  params: { slug: string };
}

// Always render dynamically (Firestore not available at build time)
export const dynamic = "force-dynamic";

async function getProductBySlug(slug: string) {
  try {
    const db = getDb();

    // Try to find by slug
    let snap = await db
      .collection("products")
      .where("slug", "==", slug)
      .where("status", "==", "ACTIVE")
      .limit(1)
      .get();

    // If not found by slug, try by ID
    if (snap.empty) {
      const doc = await db.collection("products").doc(slug).get();
      if (doc.exists && doc.data()?.status === "ACTIVE") {
        const d = doc.data()!;
        return { id: doc.id, ...d };
      }
      return null;
    }

    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    return { title: "מוצר לא נמצא | ShipMate" };
  }
  return {
    title: `${(product as any).titleHe || (product as any).titleEn} | ShipMate שיפמייט`,
    description: (product as any).descriptionHe || (product as any).descriptionEn || "מוצר באיכות גבוהה במחיר מדהים.",
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const raw = await getProductBySlug(params.slug);
  if (!raw) notFound();

  const product = {
    id: (raw as any).id,
    slug: (raw as any).slug || params.slug,
    titleHe: (raw as any).titleHe || (raw as any).titleEn || "מוצר",
    titleEn: (raw as any).titleEn || "",
    descriptionHe: (raw as any).descriptionHe || (raw as any).descriptionEn || "",
    price: (raw as any).price || 0,
    compareAtPrice: (raw as any).compareAtPrice || (raw as any).price * 1.3 || 0,
    images: (raw as any).images || [],
    categoryNameHe: (raw as any).categoryNameHe || (raw as any).category || "",
    categorySlug: (raw as any).categoryId || (raw as any).category || "",
    shippingDays: (raw as any).shippingDays || 14,
    avgRating: (raw as any).avgRating || 0,
    reviewCount: (raw as any).reviewCount || 0,
    salesCount: (raw as any).salesCount || 0,
  };

  const discount = product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const installments = (product.price / 3).toFixed(0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-charcoal-light mb-6">
        <Link href="/" className="hover:text-coral transition-colors flex items-center gap-1">
          <Home size={14} />
          ראשי
        </Link>
        {product.categorySlug && (
          <>
            <ChevronLeft size={14} />
            <Link href={`/category/${product.categorySlug}`} className="hover:text-coral transition-colors">
              {product.categoryNameHe || product.categorySlug}
            </Link>
          </>
        )}
        <ChevronLeft size={14} />
        <span className="text-charcoal font-medium line-clamp-1">{product.titleHe}</span>
      </nav>

      {/* Product layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
        {/* Left: Images */}
        <div>
          <ImageGallery images={product.images} alt={product.titleHe} />
        </div>

        {/* Right: Info */}
        <div className="space-y-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-charcoal leading-tight">
              {product.titleHe}
            </h1>

            {/* Rating + sales */}
            <div className="flex items-center gap-3 mt-2 text-sm text-charcoal-light">
              {product.avgRating > 0 && (
                <span>⭐ {product.avgRating} ({product.reviewCount} ביקורות)</span>
              )}
              {product.salesCount > 0 && (
                <>
                  <span className="w-1 h-1 bg-charcoal-light/40 rounded-full" />
                  <span>🛒 {product.salesCount} נמכרו</span>
                </>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="bg-cream rounded-2xl p-4 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-coral">₪{product.price.toFixed(0)}</span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-gray-400 line-through">₪{product.compareAtPrice.toFixed(0)}</span>
                  <span className="badge-sale">חיסכון {discount}%</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-charcoal-light">
              <CreditCard size={14} />
              <span>או ב-3 תשלומים של ₪{installments}</span>
            </div>
          </div>

          {/* Add to cart */}
          <AddToCartButton
            productId={product.id}
            titleHe={product.titleHe}
            image={product.images[0] || ""}
            price={product.price}
          />

          {/* Share */}
          <ShareButtons url={`https://shipmate.store/product/${product.slug}`} title={product.titleHe} />

          {/* Shipping & policies accordion */}
          <div className="space-y-3 border-t border-cream-dark/30 pt-5">
            <div className="flex items-center gap-3 text-sm">
              <Truck size={18} className="text-teal flex-shrink-0" />
              <div>
                <span className="font-medium">משלוח</span>
                <span className="text-charcoal-light"> — הגעה תוך {product.shippingDays} ימי עסקים</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <RotateCcw size={18} className="text-teal flex-shrink-0" />
              <div>
                <span className="font-medium">החזרות</span>
                <span className="text-charcoal-light"> — 30 יום להחזרה ללא שאלות</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <ShieldCheck size={18} className="text-teal flex-shrink-0" />
              <div>
                <span className="font-medium">תשלום מאובטח</span>
                <span className="text-charcoal-light"> — הצפנת SSL מלאה</span>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.descriptionHe && (
            <div className="border-t border-cream-dark/30 pt-5">
              <h2 className="font-bold text-lg mb-3">תיאור המוצר</h2>
              <div className="text-sm text-charcoal leading-relaxed whitespace-pre-line">
                {product.descriptionHe}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="mt-12 border-t border-cream-dark/30 pt-8">
        <ReviewSection
          productId={product.id}
          avgRating={product.avgRating}
          reviewCount={product.reviewCount}
        />
      </div>
    </div>
  );
}
