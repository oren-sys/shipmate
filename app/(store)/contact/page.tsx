import { Metadata } from "next";
import { Mail, Phone, MessageCircle, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "צור קשר | ShipMate",
  description: "צרו קשר עם צוות ShipMate - אנחנו כאן לעזור בכל שאלה.",
};

export default function ContactPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 font-heebo" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">צור קשר</h1>
      <p className="text-gray-600 mb-10">
        יש לכם שאלה? צריכים עזרה עם הזמנה? הצוות שלנו כאן בשבילכם.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Email */}
        <div className="bg-gray-50 rounded-2xl p-6 flex items-start gap-4">
          <div className="bg-teal/10 rounded-xl p-3">
            <Mail className="w-6 h-6 text-teal" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">אימייל</h3>
            <a
              href="mailto:support@shipmate.store"
              className="text-teal hover:underline"
            >
              support@shipmate.store
            </a>
            <p className="text-sm text-gray-500 mt-1">נחזור אליכם תוך 24 שעות</p>
          </div>
        </div>

        {/* WhatsApp */}
        <div className="bg-gray-50 rounded-2xl p-6 flex items-start gap-4">
          <div className="bg-green-50 rounded-xl p-3">
            <MessageCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">WhatsApp</h3>
            <a
              href="https://wa.me/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 hover:underline"
            >
              שלחו לנו הודעה
            </a>
            <p className="text-sm text-gray-500 mt-1">מענה מהיר בזמן פעילות</p>
          </div>
        </div>

        {/* Phone */}
        <div className="bg-gray-50 rounded-2xl p-6 flex items-start gap-4">
          <div className="bg-blue-50 rounded-xl p-3">
            <Phone className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">טלפון</h3>
            <p className="text-gray-700">בקרוב</p>
            <p className="text-sm text-gray-500 mt-1">שירות טלפוני בהקמה</p>
          </div>
        </div>

        {/* Hours */}
        <div className="bg-gray-50 rounded-2xl p-6 flex items-start gap-4">
          <div className="bg-amber-50 rounded-xl p-3">
            <Clock className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">שעות פעילות</h3>
            <p className="text-gray-700">א&apos;-ה&apos; 09:00-18:00</p>
            <p className="text-sm text-gray-500 mt-1">ו&apos; 09:00-13:00</p>
          </div>
        </div>
      </div>

      {/* FAQ teaser */}
      <div className="mt-12 bg-teal/5 border border-teal/20 rounded-2xl p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900 mb-3">שאלות נפוצות</h2>
        <div className="space-y-4 text-right max-w-xl mx-auto">
          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-900 hover:text-teal">
              כמה זמן לוקח המשלוח?
            </summary>
            <p className="mt-2 text-gray-600 text-sm">
              משלוח רגיל לוקח 14-30 ימי עסקים. לפרטים מלאים ראו{" "}
              <a href="/shipping" className="text-teal underline">מדיניות משלוחים</a>.
            </p>
          </details>
          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-900 hover:text-teal">
              איך אפשר להחזיר מוצר?
            </summary>
            <p className="mt-2 text-gray-600 text-sm">
              ניתן לבטל הזמנה תוך 14 יום. לפרטים ראו{" "}
              <a href="/returns" className="text-teal underline">החזרות והחלפות</a>.
            </p>
          </details>
          <details className="group">
            <summary className="cursor-pointer font-medium text-gray-900 hover:text-teal">
              האם התשלום מאובטח?
            </summary>
            <p className="mt-2 text-gray-600 text-sm">
              כן, כל התשלומים מעובדים בצורה מאובטחת באמצעות ספקי תשלום מורשים
              עם הצפנת SSL.
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
