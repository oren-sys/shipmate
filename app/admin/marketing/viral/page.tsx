"use client";

import { useState } from "react";

interface ContentPost {
  id: string;
  platform: "tiktok" | "instagram" | "facebook" | "whatsapp";
  caption: string;
  hashtags: string[];
  status: "draft" | "scheduled" | "published";
  scheduledAt?: string;
  engagement?: number;
}

const platformConfig = {
  tiktok: { label: "TikTok", icon: "🎵", color: "bg-pink-50 text-pink-700" },
  instagram: { label: "Instagram", icon: "📸", color: "bg-purple-50 text-purple-700" },
  facebook: { label: "Facebook", icon: "📘", color: "bg-blue-50 text-blue-700" },
  whatsapp: { label: "WhatsApp", icon: "💬", color: "bg-emerald-50 text-emerald-700" },
};

const hebrewHashtags = [
  "שיפמייט", "דילים", "מבצעים", "קניותאונליין", "טיקטוקישראל",
  "אלקטרוניקה", "גאדג׳טים", "עיצובבית", "מתנות", "משלוחחינם",
  "ישראל", "חדש", "מומלץ", "הנחה", "טרנדי",
];

export default function ViralContentPage() {
  const [posts] = useState<ContentPost[]>([]);
  const [generating, setGenerating] = useState(false);
  const [productName, setProductName] = useState("");
  const [targetPlatform, setTargetPlatform] = useState<string>("tiktok");
  const [generatedContent, setGeneratedContent] = useState("");

  const handleGenerate = async () => {
    if (!productName.trim()) return;
    setGenerating(true);

    // In production: call AI API for content generation
    // Simulating with templates
    setTimeout(() => {
      const templates: Record<string, string> = {
        tiktok: `אתם חייבים לראות את ה${productName} הזה! 🔥 לינק בביו #שיפמייט #${productName.replace(/\s+/g, "")}`,
        instagram: `✨ חדש באתר: ${productName}\nאיכות מטורפת במחיר שלא תאמינו!\n\n🛒 לינק בביו\n\n#שיפמייט #חדש #${productName.replace(/\s+/g, "")}`,
        facebook: `🎉 מוצר חדש באתר!\n\n${productName} - עכשיו בהנחת השקה!\n\n🚚 משלוח חינם מעל ₪199\n💳 תשלום מאובטח\n\nלהזמנה: shipmate.store`,
        whatsapp: `היי! 👋\nרצינו לספר לכם על ${productName} החדש שלנו!\nעכשיו בהנחה מיוחדת 🎁\n\nלפרטים: shipmate.store`,
      };
      setGeneratedContent(templates[targetPlatform] || templates.tiktok);
      setGenerating(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 max-w-4xl" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal">תוכן ויראלי</h1>
        <p className="text-sm text-gray-500 mt-1">יצירת תוכן שיווקי בעברית לרשתות החברתיות</p>
      </div>

      {/* Content generator */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-charcoal mb-4">✍️ מחולל תוכן</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">שם מוצר</label>
            <input
              type="text"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="אוזניות בלוטוס Pro"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal mb-1.5">פלטפורמה</label>
            <select
              value={targetPlatform}
              onChange={(e) => setTargetPlatform(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-coral/30 outline-none"
            >
              <option value="tiktok">TikTok</option>
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generating || !productName.trim()}
              className="w-full px-4 py-2.5 bg-coral text-white text-sm font-medium rounded-xl hover:bg-coral-dark transition-colors disabled:opacity-50"
            >
              {generating ? "יוצר..." : "🪄 צור תוכן"}
            </button>
          </div>
        </div>

        {/* Generated content */}
        {generatedContent && (
          <div className="mt-4 p-4 bg-cream rounded-xl border border-coral/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500">תוכן מוצע:</span>
              <button
                onClick={() => navigator.clipboard.writeText(generatedContent)}
                className="text-xs text-coral hover:text-coral-dark font-medium"
              >
                📋 העתק
              </button>
            </div>
            <p className="text-sm text-charcoal whitespace-pre-line">{generatedContent}</p>
          </div>
        )}
      </div>

      {/* Hashtag bank */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-charcoal mb-4"># האשטגים בעברית</h3>
        <div className="flex flex-wrap gap-2">
          {hebrewHashtags.map((tag) => (
            <button
              key={tag}
              onClick={() => navigator.clipboard.writeText(`#${tag}`)}
              className="px-3 py-1.5 bg-gray-50 hover:bg-coral/10 text-sm text-gray-600 hover:text-coral rounded-full transition-colors cursor-pointer"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {/* Content calendar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="p-6 pb-4">
          <h3 className="text-sm font-bold text-charcoal">📅 לוח תוכן</h3>
        </div>

        {posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">אין תוכן עדיין</p>
            <p className="text-sm text-gray-400 mt-1">צרו תוכן חדש עם מחולל התוכן למעלה</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {posts.map((post) => {
              const platform = platformConfig[post.platform];
              return (
                <div key={post.id} className="flex items-start gap-4 p-6">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${platform.color}`}>
                    {platform.icon} {platform.label}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-charcoal">{post.caption}</p>
                    {post.hashtags.length > 0 && (
                      <p className="text-xs text-coral mt-1">
                        {post.hashtags.map((h) => `#${h}`).join(" ")}
                      </p>
                    )}
                  </div>
                  <div className="text-left shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      post.status === "published" ? "bg-emerald-50 text-emerald-700" :
                      post.status === "scheduled" ? "bg-blue-50 text-blue-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {post.status === "published" ? "פורסם" : post.status === "scheduled" ? "מתוזמן" : "טיוטה"}
                    </span>
                    {post.engagement && (
                      <p className="text-xs text-gray-400 mt-1">{post.engagement.toLocaleString()} אינטראקציות</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
