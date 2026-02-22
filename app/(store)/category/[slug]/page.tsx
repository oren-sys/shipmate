import { Metadata } from "next";
import ProductCard, { ProductCardProps } from "@/components/store/ProductCard";
import ProductFilters from "@/components/store/ProductFilters";
import { ChevronLeft, Home } from "lucide-react";
import Link from "next/link";

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
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const name = categoryNames[params.slug] || params.slug;
  return {
    title: `${name} | ShipMate שיפמייט`,
    description: `מוצרי ${name} במחירים מדהימים. משלוח לכל הארץ.`,
  };
}

// Placeholder products
const placeholderProducts: ProductCardProps[] = [
  { id: "1", slug: "wireless-earbuds", titleHe: "אוזניות אלחוטיות בלוטוס TWS", price: 89.9, compareAtPrice: 149.9, image: "", avgRating: 4.5, reviewCount: 128, badge: "hot" },
  { id: "2", slug: "smart-watch", titleHe: "שעון חכם ספורט עמיד במים", price: 129.9, compareAtPrice: 199.9, image: "", avgRating: 4.3, reviewCount: 85, badge: "sale" },
  { id: "3", slug: "led-strip", titleHe: "פס לד RGB שלט רחוק 5 מטר", price: 49.9, compareAtPrice: 89.9, image: "", avgRating: 4.7, reviewCount: 203, badge: "sale" },
  { id: "4", slug: "phone-holder", titleHe: "מעמד טלפון מגנטי לרכב", price: 34.9, compareAtPrice: 59.9, image: "", avgRating: 4.2, reviewCount: 67, badge: null },
  { id: "5", slug: "portable-blender", titleHe: "בלנדר נייד USB נטען", price: 69.9, compareAtPrice: 119.9, image: "", avgRating: 4.6, reviewCount: 154, badge: "hot" },
  { id: "6", slug: "ring-light", titleHe: "טבעת תאורה LED לסלפי", price: 59.9, compareAtPrice: 99.9, image: "", avgRating: 4.4, reviewCount: 92, badge: "new" },
];

export default async function CategoryPage({ params }: CategoryPageProps) {
  const categoryName = categoryNames[params.slug] || params.slug;

  // TODO: Fetch from Firestore
  // const { products } = await listProducts({ status: "ACTIVE", categoryId: params.slug, limit: 20 });
  const products = placeholderProducts;

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

      {/* Filters */}
      <ProductFilters />

      {/* Product grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
        {products.map((product) => (
          <ProductCard key={product.id} {...product} />
        ))}
      </div>

      {/* Load more */}
      <div className="text-center mt-8">
        <button className="btn-outline text-sm">
          הצג עוד מוצרים
        </button>
      </div>
    </div>
  );
}
