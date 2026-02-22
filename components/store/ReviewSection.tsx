"use client";

import { Star } from "lucide-react";

interface ReviewData {
  id: string;
  customerName: string;
  rating: number;
  text: string;
  verified: boolean;
  createdAt: string;
}

interface ReviewSectionProps {
  productId: string;
  avgRating: number;
  reviewCount: number;
  reviews?: ReviewData[];
}

const placeholderReviews: ReviewData[] = [
  { id: "1", customerName: "דנה ל.", rating: 5, text: "מוצר מעולה, בדיוק כמו שתואר. ממליצה!", verified: true, createdAt: "2026-02-15" },
  { id: "2", customerName: "יוסי מ.", rating: 4, text: "איכות טובה, משלוח קצת ארוך אבל שווה", verified: true, createdAt: "2026-02-10" },
  { id: "3", customerName: "מיכל ק.", rating: 5, text: "מחיר מצוין! כבר הזמנתי עוד אחד", verified: false, createdAt: "2026-02-08" },
];

export default function ReviewSection({
  productId,
  avgRating,
  reviewCount,
  reviews,
}: ReviewSectionProps) {
  const items = reviews || placeholderReviews;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">ביקורות ({reviewCount})</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={18}
                className={i < Math.round(avgRating) ? "text-accent fill-accent" : "text-gray-200"}
              />
            ))}
          </div>
          <span className="font-bold text-charcoal">{avgRating.toFixed(1)}</span>
        </div>
      </div>

      <div className="space-y-4">
        {items.map((review) => (
          <div key={review.id} className="card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{review.customerName}</span>
                {review.verified && (
                  <span className="text-[10px] bg-mint/10 text-mint font-bold px-1.5 py-0.5 rounded">
                    רכישה מאומתת ✓
                  </span>
                )}
              </div>
              <span className="text-xs text-charcoal-light">{review.createdAt}</span>
            </div>
            <div className="flex items-center">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={i < review.rating ? "text-accent fill-accent" : "text-gray-200"}
                />
              ))}
            </div>
            <p className="text-sm text-charcoal leading-relaxed">{review.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
