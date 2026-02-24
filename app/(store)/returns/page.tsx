import { Metadata } from "next";

export const metadata: Metadata = {
  title: "החזרות והחלפות | ShipMate",
  description: "מדיניות החזרות והחלפות באתר ShipMate. כל מה שצריך לדעת על ביטולים והחזרות.",
};

export default function ReturnsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 font-heebo" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">החזרות והחלפות</h1>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <p>
          ב-ShipMate, שביעות הרצון שלכם חשובה לנו מאוד. אם קיבלתם מוצר פגום,
          שגוי או שאינו תואם את התיאור — אנחנו כאן כדי לעזור.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">מדיניות ביטולים</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>ניתן לבטל הזמנה תוך 14 יום מיום קבלת המוצר בהתאם לחוק הגנת הצרכן.</li>
          <li>ביטול הזמנה לפני משלוח — ללא עלות.</li>
          <li>ביטול לאחר קבלת המוצר — יש להחזיר את המוצר באריזתו המקורית.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">מוצר פגום או שגוי</h2>
        <p>
          אם קיבלתם מוצר פגום, שבור או שונה ממה שהזמנתם, אנא פנו אלינו תוך 48
          שעות מקבלת המוצר עם:
        </p>
        <ul className="space-y-2 list-disc list-inside">
          <li>מספר הזמנה</li>
          <li>תמונות של המוצר הפגום</li>
          <li>תיאור קצר של הבעיה</li>
        </ul>
        <p>
          נבדוק את הפנייה ונחזור אליכם עם פתרון — החלפה, החזר כספי או זיכוי.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">תהליך ההחזרה</h2>
        <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <span className="bg-teal text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
            <span>פנו אלינו דרך <a href="/contact" className="text-teal underline">צור קשר</a> או WhatsApp.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-teal text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
            <span>נבדוק את הבקשה ונאשר את ההחזרה.</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-teal text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
            <span>שלחו את המוצר חזרה (במידת הצורך).</span>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-teal text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
            <span>נבצע החזר/זיכוי תוך 14 ימי עסקים.</span>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">מוצרים שלא ניתן להחזיר</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>מוצרים שנעשה בהם שימוש</li>
          <li>מוצרים ללא אריזה מקורית</li>
          <li>מוצרי היגיינה אישית (לאחר פתיחת האריזה)</li>
        </ul>
      </div>
    </div>
  );
}
