import { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Package, MessageCircle, Home, Copy } from "lucide-react";

interface OrderConfirmationProps {
  params: { id: string };
}

export const metadata: Metadata = {
  title: "ההזמנה התקבלה! | ShipMate שיפמייט",
  description: "ההזמנה שלך התקבלה בהצלחה. תודה שקנית ב-ShipMate!",
};

export default async function OrderConfirmationPage({ params }: OrderConfirmationProps) {
  // TODO: Fetch order from Firestore
  // const order = await getOrder(params.id);
  const orderId = params.id;
  const orderNumber = `IL-${orderId.slice(-5).toUpperCase()}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 text-center space-y-8">
      {/* Success icon */}
      <div className="w-24 h-24 bg-mint/15 rounded-3xl flex items-center justify-center mx-auto">
        <CheckCircle2 size={48} className="text-mint" />
      </div>

      {/* Heading */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold">ההזמנה התקבלה! 🎉</h1>
        <p className="text-charcoal-light text-lg">
          תודה שקנית ב-ShipMate! קיבלנו את ההזמנה שלך ונתחיל לטפל בה מיד.
        </p>
      </div>

      {/* Order number card */}
      <div className="card p-6 space-y-4 text-right">
        <div className="flex items-center justify-between">
          <span className="text-charcoal-light text-sm">מספר הזמנה</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-coral" dir="ltr">{orderNumber}</span>
            <button
              className="p-1.5 text-charcoal-light hover:text-coral rounded-lg hover:bg-coral/5 transition-colors"
              aria-label="העתק מספר הזמנה"
              onClick={() => {
                // Client-side copy handled via JS
              }}
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        <div className="border-t border-cream-dark/30 pt-4 space-y-2 text-sm">
          <div className="flex items-center gap-3">
            <Package size={18} className="text-teal flex-shrink-0" />
            <div>
              <span className="font-medium">משלוח</span>
              <span className="text-charcoal-light"> — הגעה משוערת תוך 10-21 ימי עסקים</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-charcoal-light">
          נשלח לך עדכון במייל ובוואטסאפ ברגע שההזמנה תצא לדרך.
        </p>
      </div>

      {/* Share on WhatsApp */}
      <div className="card p-5 bg-mint/5 border border-mint/20">
        <p className="text-sm font-medium mb-3">ספרו לחברים על ShipMate!</p>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `הזמנתי מ-ShipMate 🚀 מוצרים מגניבים במחירים מטורפים! בדקו את זה: https://shipmate.store`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] text-white font-bold px-5 py-2.5 rounded-xl
                    hover:bg-[#20BD5B] transition-colors text-sm"
        >
          <MessageCircle size={18} />
          שתף בוואטסאפ
        </a>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link href="/" className="btn-primary inline-flex items-center gap-2">
          <Home size={18} />
          חזרה לחנות
        </Link>
        <Link
          href="/contact"
          className="text-sm text-charcoal-light hover:text-coral transition-colors"
        >
          צריכים עזרה? צרו קשר
        </Link>
      </div>
    </div>
  );
}
