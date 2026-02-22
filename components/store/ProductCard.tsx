"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/cart/cart-store";

export interface ProductCardProps {
  id: string;
  slug: string;
  titleHe: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  avgRating?: number;
  reviewCount?: number;
  badge?: "sale" | "hot" | "new" | null;
}

export default function ProductCard({
  id,
  slug,
  titleHe,
  price,
  compareAtPrice,
  image,
  avgRating = 0,
  reviewCount = 0,
  badge,
}: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const discount = compareAtPrice
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  return (
    <Link href={`/product/${slug}`} className="block group">
      <div className="card overflow-hidden h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-cream">
          {image ? (
            <Image
              src={image}
              alt={titleHe}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-charcoal-light">
              <ShoppingCart size={40} strokeWidth={1} />
            </div>
          )}

          {/* Badge */}
          {badge === "sale" && discount > 0 && (
            <span className="absolute top-3 right-3 badge-sale">
              {discount}%−
            </span>
          )}
          {badge === "hot" && (
            <span className="absolute top-3 right-3 badge-hot">🔥 חם</span>
          )}
          {badge === "new" && (
            <span className="absolute top-3 right-3 bg-teal text-white text-xs font-bold px-2 py-1 rounded-full">
              חדש
            </span>
          )}

          {/* Quick add overlay */}
          <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0
                         transition-transform duration-300">
            <button
              onClick={(e) => {
                e.preventDefault();
                addItem({ productId: id, titleHe, image, price });
              }}
              className="w-full bg-teal hover:bg-teal-dark text-white text-sm font-bold
                        py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingCart size={16} />
              הוסף לסל
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3 flex-1 flex flex-col gap-1.5">
          <h3 className="text-sm font-medium text-charcoal line-clamp-2 leading-snug min-h-[2.5em]">
            {titleHe}
          </h3>

          {/* Rating */}
          {reviewCount > 0 && (
            <div className="flex items-center gap-1">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < Math.round(avgRating) ? "text-accent fill-accent" : "text-gray-200"}
                  />
                ))}
              </div>
              <span className="text-[11px] text-charcoal-light">({reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="mt-auto flex items-baseline gap-2">
            <span className="price text-lg">₪{price.toFixed(0)}</span>
            {compareAtPrice && compareAtPrice > price && (
              <span className="price-compare">₪{compareAtPrice.toFixed(0)}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
