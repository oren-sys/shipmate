import { Metadata } from "next";

export const metadata: Metadata = {
  title: "מדיניות משלוחים | ShipMate",
  description: "מידע על משלוחים, זמני אספקה ועלויות משלוח באתר ShipMate.",
};

export default function ShippingPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 font-heebo" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">מדיניות משלוחים</h1>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <h2 className="text-2xl font-bold text-gray-900">זמני אספקה</h2>
        <p>
          המוצרים שלנו נשלחים ישירות מהספקים שלנו ברחבי העולם. זמני האספקה
          המשוערים הם:
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-gray-200 pb-3">
            <span className="font-medium">משלוח רגיל</span>
            <span className="text-teal font-bold">14-30 ימי עסקים</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="font-medium">משלוח מהיר (במידה וזמין)</span>
            <span className="text-teal font-bold">7-14 ימי עסקים</span>
          </div>
        </div>

        <p className="text-sm text-gray-500">
          * זמני האספקה הם הערכה בלבד ועשויים להשתנות בהתאם למיקום, מכס ותנאים
          חיצוניים. עיכובים עלולים להתרחש בתקופות חגים או אירועים בלתי צפויים.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">עלויות משלוח</h2>

        <div className="bg-teal/5 border border-teal/20 rounded-2xl p-6">
          <p className="text-center text-lg font-medium text-teal">
            &#x1F69A; משלוח חינם בהזמנות מעל &#x20AA;199!
          </p>
        </div>

        <p>
          בהזמנות מתחת ל-&#x20AA;199, עלות המשלוח תחושב בעת התשלום בהתאם למשקל
          ויעד המשלוח.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">מעקב אחרי הזמנה</h2>
        <p>
          לאחר שליחת ההזמנה, תקבלו מספר מעקב באימייל שיאפשר לכם לעקוב אחרי
          סטטוס המשלוח. ניתן גם לבדוק את סטטוס ההזמנה דרך חשבונכם באתר.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">מכס ומיסים</h2>
        <p>
          מוצרים הנשלחים מחו&quot;ל עשויים להיות כפופים למכס ומע&quot;מ בהתאם
          לחוקי המדינה. המחירים באתר אינם כוללים עלויות מכס ככל שיחולו.
          הזמנות עד 75$ בדרך כלל פטורות ממכס.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">שאלות?</h2>
        <p>
          לכל שאלה לגבי משלוח או סטטוס הזמנה, אנא{" "}
          <a href="/contact" className="text-teal underline hover:text-teal/80">
            צרו איתנו קשר
          </a>
          .
        </p>
      </div>
    </div>
  );
}
