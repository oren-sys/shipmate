"use client";

import { Star } from "lucide-react";

interface ReviewItem {
  name: string;
  rating: number;
  text: string;
  product: string;
}

const sampleReviews: ReviewItem[] = [
  { name: "מיכל ק.", rating: 5, text: "המוצר הגיע מהר ובאיכות מעולה! ממליצה בחום", product: "אוזניות אלחוטיות" },
  { name: "יוסי מ.", rating: 5, text: "מחיר מדהים, איכות גבוהה. אין על ShipMate!", product: "מנורת LED חכמה" },
  { name: "דנה ל.", rating: 4, text: "שירות לקוחות מעולה, עזרו לי בוואטסאפ תוך דקות", product: "כיסוי לאייפון" },
  { name: "אבי ר.", rating: 5, text: "כבר ההזמנה השלישית שלי. תמיד מרוצה!", product: "שעון ספורט חכם" },
];

export default function ReviewCarousel({ reviews }: { reviews?: ReviewItem[] }) {
  const items = reviews || sampleReviews;

  return (
    <section className="py-10 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-charcoal mb-6 text-center">
          מה הלקוחות שלנו אומרים 💬
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((review, i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star
                    key={j}
                    size={14}
                    className={j < review.rating ? "text-accent fill-accent" : "text-gray-200"}
                  />
                ))}
              </div>
              <p className="text-sm text-charcoal leading-relaxed">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="flex items-center justify-between text-xs text-charcoal-light">
                <span className="font-medium text-charcoal">{review.name}</span>
                <span>על: {review.product}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
