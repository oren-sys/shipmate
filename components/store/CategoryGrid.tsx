import Link from "next/link";
import { Smartphone, Shirt, Home, Sparkles, Baby, Zap } from "lucide-react";

const defaultCategories = [
  { slug: "electronics", nameHe: "אלקטרוניקה", icon: Smartphone, color: "bg-blue-50 text-blue-600" },
  { slug: "fashion", nameHe: "אופנה", icon: Shirt, color: "bg-pink-50 text-pink-600" },
  { slug: "home", nameHe: "בית וגן", icon: Home, color: "bg-green-50 text-green-600" },
  { slug: "beauty", nameHe: "יופי וטיפוח", icon: Sparkles, color: "bg-purple-50 text-purple-600" },
  { slug: "kids", nameHe: "ילדים", icon: Baby, color: "bg-orange-50 text-orange-600" },
  { slug: "gadgets", nameHe: "גאדג׳טים", icon: Zap, color: "bg-yellow-50 text-yellow-700" },
];

interface CategoryGridProps {
  categories?: { slug: string; nameHe: string; image?: string }[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  const cats = categories || defaultCategories;

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-charcoal mb-6 text-center">
          קטגוריות
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {cats.map((cat, i) => {
            const defaultCat = defaultCategories[i] || defaultCategories[0];
            const Icon = defaultCat.icon;
            const colorClass = defaultCat.color;

            return (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className="flex flex-col items-center gap-3 p-4 rounded-2xl
                         hover:bg-cream transition-all duration-300 group"
              >
                <div className={`w-16 h-16 rounded-2xl ${colorClass} flex items-center justify-center
                              group-hover:scale-110 transition-transform duration-300`}>
                  <Icon size={28} />
                </div>
                <span className="text-sm font-medium text-charcoal text-center">
                  {cat.nameHe}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
