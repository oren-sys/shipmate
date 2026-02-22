import { Metadata } from "next";
import Link from "next/link";
import { Home, ChevronLeft, Truck, RotateCcw, ShieldCheck, CreditCard } from "lucide-react";
import ImageGallery from "@/components/store/ImageGallery";
import ShareButtons from "@/components/store/ShareButtons";
import ReviewSection from "@/components/store/ReviewSection";
import AddToCartButton from "./AddToCartButton";

interface ProductPageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  // TODO: Fetch from Firestore
  return {
    title: `מוצר | ShipMate שיפמייט`,
    description: "מוצר באיכות גבוהה במחיר מדהים. משלוח לכל הארץ.",
  };
}

// Placeholder product data
function getPlaceholderProduct(slug: string) {
  return {
    id: "1",
    slug,
    title: "Wireless Bluetooth Earbuds TWS",
    titleHe: "אוזניות אלחוטיות בלוטוס TWS עם ביטול רעשים",
    description: "High quality wireless earbuds with active noise cancellation",
    descriptionHe: `אוזניות אלחוטיות TWS באיכות פרימיום עם ביטול רעשים אקטיבי.

תכונות עיקריות:
• ביטול רעשים אקטיבי (ANC) לחוויית שמיעה מושלמת
• בלוטוס 5.3 לחיבור יציב ומהיר
• סוללה ל-8 שעות + קייס טעינה ל-32 שעות נוספות
• עמידות במים IPX5
• מיקרופון מובנה לשיחות צלולות
• נוח במיוחד לשימוש ממושך`,
    price: 89.9,
    compareAtPrice: 149.9,
    images: [],
    categoryNameHe: "אלקטרוניקה",
    categorySlug: "electronics",
    shippingDays: 14,
    avgRating: 4.5,
    reviewCount: 128,
    salesCount: 342,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  // TODO: const product = await getProductBySlug(params.slug);
  const product = getPlaceholderProduct(params.slug);

  const discount = Math.round(
    ((product.compareAtPrice - product.price) / product.compareAtPrice) * 100
  );
  const installments = (product.price / 3).toFixed(0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-charcoal-light mb-6">
        <Link href="/" className="hover:text-coral transition-colors flex items-center gap-1">
          <Home size={14} />
          ראשי
        </Link>
        <ChevronLeft size={14} />
        <Link href={`/category/${product.categorySlug}`} className="hover:text-coral transition-colors">
          {product.categoryNameHe}
        </Link>
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
              <span>⭐ {product.avgRating} ({product.reviewCount} ביקורות)</span>
              <span className="w-1 h-1 bg-charcoal-light/40 rounded-full" />
              <span>🛒 {product.salesCount} נמכרו</span>
            </div>
          </div>

          {/* Price */}
          <div className="bg-cream rounded-2xl p-4 space-y-2">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-coral">₪{product.price.toFixed(0)}</span>
              <span className="text-lg text-gray-400 line-through">₪{product.compareAtPrice.toFixed(0)}</span>
              <span className="badge-sale">חיסכון {discount}%</span>
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
          <div className="border-t border-cream-dark/30 pt-5">
            <h2 className="font-bold text-lg mb-3">תיאור המוצר</h2>
            <div className="text-sm text-charcoal leading-relaxed whitespace-pre-line">
              {product.descriptionHe}
            </div>
          </div>
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
