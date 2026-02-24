import { Metadata } from "next";

export const metadata: Metadata = {
  title: "תנאי שימוש | ShipMate",
  description: "תנאי השימוש של אתר ShipMate. אנא קראו בעיון לפני השימוש באתר.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 font-heebo" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">תנאי שימוש</h1>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <p className="text-sm text-gray-500">עדכון אחרון: פברואר 2026</p>

        <p>
          ברוכים הבאים לאתר ShipMate. השימוש באתר מהווה הסכמה לתנאי השימוש
          המפורטים להלן. אנא קראו אותם בעיון.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">1. כללי</h2>
        <p>
          האתר מופעל על ידי ShipMate ומספק פלטפורמה לרכישת מוצרים מקוונת.
          התנאים חלים על כל שימוש באתר, כולל גלישה, רכישה ויצירת חשבון.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">2. הזמנות ותשלומים</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>כל המחירים באתר מוצגים בשקלים חדשים (&#x20AA;) וכוללים מע&quot;מ.</li>
          <li>ביצוע הזמנה מהווה הצעה לרכוש, והיא כפופה לאישור מצדנו.</li>
          <li>אנו שומרים על הזכות לבטל הזמנות במקרה של טעות במחיר או חוסר במלאי.</li>
          <li>התשלום מתבצע באמצעות ספקי תשלום מאובטחים.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">3. משלוחים</h2>
        <p>
          זמני האספקה הם הערכה בלבד ואינם מהווים התחייבות. לפרטים מלאים ראו{" "}
          <a href="/shipping" className="text-teal underline hover:text-teal/80">
            מדיניות משלוחים
          </a>
          .
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">4. ביטולים והחזרות</h2>
        <p>
          ביטול עסקה יתבצע בהתאם לחוק הגנת הצרכן. לפרטים מלאים ראו{" "}
          <a href="/returns" className="text-teal underline hover:text-teal/80">
            מדיניות החזרות
          </a>
          .
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">5. קניין רוחני</h2>
        <p>
          כל התכנים באתר, לרבות טקסטים, תמונות, לוגואים ועיצוב, הם רכושה של
          ShipMate ומוגנים בזכויות יוצרים. אין להעתיק, לשכפל או להפיץ תכנים
          מהאתר ללא אישור מראש.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">6. הגבלת אחריות</h2>
        <p>
          ShipMate עושה מאמץ להציג מידע מדויק על המוצרים, אך אינה אחראית
          לאי-דיוקים בתיאורים או בתמונות. המוצרים נמכרים &quot;כפי שהם&quot;
          (&quot;as is&quot;) בכפוף לאחריות הספק.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">7. פרטיות</h2>
        <p>
          השימוש באתר כפוף ל
          <a href="/privacy" className="text-teal underline hover:text-teal/80">
            מדיניות הפרטיות
          </a>{" "}
          שלנו.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">8. שינויים בתנאים</h2>
        <p>
          אנו שומרים על הזכות לעדכן תנאים אלה מעת לעת. המשך השימוש באתר לאחר
          עדכון מהווה הסכמה לתנאים החדשים.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">9. דין וסמכות שיפוט</h2>
        <p>
          תנאים אלה כפופים לדיני מדינת ישראל. סמכות השיפוט הבלעדית נתונה
          לבתי המשפט המוסמכים בישראל.
        </p>
      </div>
    </div>
  );
}
