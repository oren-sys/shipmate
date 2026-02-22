import { Metadata } from "next";
import HeroBanner from "@/components/store/HeroBanner";
import TrustBar from "@/components/store/TrustBar";
import ProductGrid from "@/components/store/ProductGrid";
import CategoryGrid from "@/components/store/CategoryGrid";
import ReviewCarousel from "@/components/store/ReviewCarousel";
import NewsletterSignup from "@/components/store/NewsletterSignup";
import type { ProductCardProps } from "@/components/store/ProductCard";

export const metadata: Metadata = {
  title: "ShipMate | שיפמייט - החבר שלך לקניות חכמות",
  description: "מוצרים שווים במחירים שלא תאמינו. אלפי מוצרים מגניבים עם משלוח לכל הארץ. קניות חכמות מתחילות כאן!",
  openGraph: {
    title: "ShipMate | שיפמייט",
    description: "החבר שלך לקניות חכמות - מוצרים שווים במחירים מדהימים",
    url: "https://shipmate.store",
  },
};

// Revalidate every hour (ISR)
export const revalidate = 3600;

// Placeholder products — replaced by Firestore data when connected
const placeholderProducts: ProductCardProps[] = [
  { id: "1", slug: "wireless-earbuds", titleHe: "אוזניות אלחוטיות בלוטוס TWS", price: 89.9, compareAtPrice: 149.9, image: "", avgRating: 4.5, reviewCount: 128, badge: "hot" },
  { id: "2", slug: "smart-watch", titleHe: "שעון חכם ספורט עמיד במים", price: 129.9, compareAtPrice: 199.9, image: "", avgRating: 4.3, reviewCount: 85, badge: "sale" },
  { id: "3", slug: "led-strip", titleHe: "פס לד RGB שלט רחוק 5 מטר", price: 49.9, compareAtPrice: 89.9, image: "", avgRating: 4.7, reviewCount: 203, badge: "sale" },
  { id: "4", slug: "phone-holder", titleHe: "מעמד טלפון מגנטי לרכב", price: 34.9, compareAtPrice: 59.9, image: "", avgRating: 4.2, reviewCount: 67, badge: null },
  { id: "5", slug: "portable-blender", titleHe: "בלנדר נייד USB נטען", price: 69.9, compareAtPrice: 119.9, image: "", avgRating: 4.6, reviewCount: 154, badge: "hot" },
  { id: "6", slug: "ring-light", titleHe: "טבעת תאורה LED לסלפי וסטרימינג", price: 59.9, compareAtPrice: 99.9, image: "", avgRating: 4.4, reviewCount: 92, badge: "new" },
  { id: "7", slug: "wireless-charger", titleHe: "מטען אלחוטי מהיר 15W", price: 44.9, compareAtPrice: 79.9, image: "", avgRating: 4.1, reviewCount: 45, badge: null },
  { id: "8", slug: "mini-projector", titleHe: "מקרן מיני נייד HD", price: 199.9, compareAtPrice: 349.9, image: "", avgRating: 4.8, reviewCount: 38, badge: "sale" },
];

export default async function HomePage() {
  // TODO: Fetch from Firestore when connected
  // const { products: hotProducts } = await listProducts({ status: "ACTIVE", sortBy: "trendScore", limit: 4 });
  // const { products: bestSellers } = await listProducts({ status: "ACTIVE", sortBy: "salesCount", limit: 4 });
  // const { products: newArrivals } = await listProducts({ status: "ACTIVE", sortBy: "createdAt", limit: 4 });

  const hotProducts = placeholderProducts.slice(0, 4);
  const bestSellers = placeholderProducts.slice(2, 6);
  const newArrivals = placeholderProducts.slice(4, 8);

  return (
    <>
      <HeroBanner />
      <TrustBar />
      <ProductGrid
        title="🔥 מוצרים חמים"
        products={hotProducts}
        showViewAll
        viewAllHref="/category/trending"
      />
      <CategoryGrid />
      <ProductGrid
        title="⭐ הכי נמכרים"
        products={bestSellers}
        showViewAll
        viewAllHref="/category/best-sellers"
      />
      <ReviewCarousel />
      <ProductGrid
        title="🆕 הגיעו לאחרונה"
        products={newArrivals}
        showViewAll
        viewAllHref="/category/new-arrivals"
      />
      <NewsletterSignup />
    </>
  );
}
