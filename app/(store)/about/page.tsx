import { Metadata } from "next";

export const metadata: Metadata = {
  title: "אודות ShipMate | החנות שלך לקניות חכמות",
  description: "ShipMate - חנות אונליין ישראלית המציעה מוצרים איכותיים במחירים משתלמים עם משלוח לכל הארץ.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 font-heebo" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">אודות ShipMate</h1>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <p>
          ברוכים הבאים ל-<strong>ShipMate</strong> — החנות המקוונת שלכם למוצרים
          איכותיים, טרנדיים ובמחירים שפשוט לא תמצאו בחנויות רגילות.
        </p>

        <p>
          אנחנו מאמינים שכל אחד ואחת מגיעים לגישה למוצרים הטובים ביותר מכל
          העולם, ישירות עד הבית, ובמחירים הוגנים. זו בדיוק המשימה שלנו — לגשר
          בין יצרנים מובילים לבין הלקוחות שלנו בישראל.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">למה ShipMate?</h2>

        <ul className="space-y-3 list-none">
          <li className="flex items-start gap-3">
            <span className="text-teal text-xl">&#10003;</span>
            <span><strong>מחירים משתלמים</strong> — עובדים ישירות מול ספקים כדי להביא לכם את המחיר הטוב ביותר.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-teal text-xl">&#10003;</span>
            <span><strong>מוצרים מאומתים</strong> — כל מוצר עובר סינון ובקרת איכות לפני שהוא עולה לאתר.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-teal text-xl">&#10003;</span>
            <span><strong>שירות בעברית</strong> — צוות התמיכה שלנו כאן בשבילכם, בעברית, בכל שאלה.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="text-teal text-xl">&#10003;</span>
            <span><strong>משלוח לכל הארץ</strong> — נשלח אליכם לכל כתובת בישראל.</span>
          </li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">הסיפור שלנו</h2>

        <p>
          ShipMate נולדה מתוך תשוקה לקניות חכמות. ראינו שצרכנים ישראלים משלמים
          הרבה יותר ממה שצריך על מוצרי יומיום, וגם על גאדג&apos;טים שמשנים את
          החיים. החלטנו שהגיע הזמן לשנות את זה.
        </p>

        <p>
          היום אנחנו מציעים מבחר רחב של מוצרים בקטגוריות מגוונות — אלקטרוניקה,
          בית וגן, אופנה, יופי וטיפוח, ספורט ועוד. ואנחנו ממשיכים לגדול ולהוסיף
          מוצרים חדשים כל הזמן.
        </p>

        <div className="bg-teal/5 border border-teal/20 rounded-2xl p-6 mt-8">
          <p className="text-center text-lg font-medium text-teal">
            יש לכם שאלות? דברו איתנו!<br />
            <a href="/contact" className="underline hover:text-teal/80">צור קשר</a> |
            <a href="https://wa.me/" className="underline hover:text-teal/80 mr-2"> WhatsApp</a>
          </p>
        </div>
      </div>
    </div>
  );
}
