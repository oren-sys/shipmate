import { Metadata } from "next";

export const metadata: Metadata = {
  title: "מדיניות פרטיות | ShipMate",
  description: "מדיניות הפרטיות של ShipMate - כיצד אנו אוספים, משתמשים ומגנים על המידע שלכם.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 font-heebo" dir="rtl">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">מדיניות פרטיות</h1>

      <div className="space-y-6 text-gray-700 leading-relaxed">
        <p className="text-sm text-gray-500">עדכון אחרון: פברואר 2026</p>

        <p>
          ShipMate (&quot;אנחנו&quot;, &quot;שלנו&quot;) מחויבת להגן על
          הפרטיות שלכם. מדיניות זו מסבירה כיצד אנו אוספים, משתמשים ומגנים על
          המידע האישי שלכם.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">מידע שאנו אוספים</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li><strong>פרטים אישיים:</strong> שם, כתובת אימייל, מספר טלפון, כתובת למשלוח.</li>
          <li><strong>פרטי הזמנה:</strong> מוצרים שנרכשו, היסטוריית הזמנות, פרטי תשלום (מעובדים באופן מאובטח).</li>
          <li><strong>מידע טכני:</strong> כתובת IP, סוג דפדפן, עמודים שנצפו (באמצעות cookies).</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">כיצד אנו משתמשים במידע</h2>
        <ul className="space-y-2 list-disc list-inside">
          <li>עיבוד ומשלוח הזמנות.</li>
          <li>תקשורת לגבי הזמנות, עדכונים ומבצעים (בהסכמתכם).</li>
          <li>שיפור חוויית המשתמש באתר.</li>
          <li>מניעת הונאות ואבטחת מידע.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">שיתוף מידע</h2>
        <p>
          אנחנו <strong>לא מוכרים</strong> את המידע האישי שלכם. אנו משתפים מידע
          רק עם:
        </p>
        <ul className="space-y-2 list-disc list-inside">
          <li>ספקי שירותי משלוח — לצורך ביצוע המשלוח.</li>
          <li>ספקי תשלום — לעיבוד מאובטח של תשלומים.</li>
          <li>רשויות חוק — כנדרש על פי דין.</li>
        </ul>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">Cookies</h2>
        <p>
          האתר משתמש בקבצי cookies כדי לשפר את חוויית הגלישה, לזכור העדפות ולנתח
          תנועה באתר. ניתן לנהל את הגדרות ה-cookies דרך הדפדפן שלכם.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">אבטחת מידע</h2>
        <p>
          אנו משתמשים באמצעי אבטחה מתקדמים כולל הצפנת SSL, אחסון מאובטח בענן
          ובקרות גישה כדי להגן על המידע שלכם.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-8">הזכויות שלכם</h2>
        <p>
          על פי חוק הגנת הפרטיות, יש לכם זכות לבקש עיון, תיקון או מחיקה של
          המידע האישי שלכם. לכל בקשה, פנו אלינו דרך עמוד{" "}
          <a href="/contact" className="text-teal underline hover:text-teal/80">
            צור קשר
          </a>
          .
        </p>
      </div>
    </div>
  );
}
