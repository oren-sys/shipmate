"use client";

import Link from "next/link";

export default function MarketingPage() {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal">שיווק</h1>
        <p className="text-sm text-gray-500 mt-1">ניהול קמפיינים, קופונים ותוכן ויראלי</p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "ROAS", value: "4.2x", change: "+0.8", icon: "📈", color: "bg-emerald-50 text-emerald-700" },
          { label: "הוצאת פרסום", value: "₪2,450", change: "החודש", icon: "💸", color: "bg-coral/10 text-coral" },
          { label: "הכנסות מפרסום", value: "₪10,290", change: "החודש", icon: "💰", color: "bg-teal/10 text-teal" },
          { label: "קופונים פעילים", value: "5", change: "12 שימושים", icon: "🎟️", color: "bg-amber-50 text-amber-700" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{stat.icon}</span>
              <span className="text-xs text-gray-400">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-charcoal">{stat.value}</p>
            <p className={`text-xs mt-1 ${stat.color} px-2 py-0.5 rounded-full inline-block`}>{stat.change}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Campaigns */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-coral flex items-center justify-center">
              <span className="text-white text-lg">📣</span>
            </div>
            <h3 className="font-bold text-charcoal">קמפיינים</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            ניהול קמפיינים פעילים במטא, גוגל וטיקטוק. מעקב ביצועים ו-ROAS.
          </p>
          <div className="space-y-3 mb-4">
            {[
              { name: "Meta — קולקציית חורף", status: "פעיל", spend: "₪850", roas: "5.1x" },
              { name: "Google — מילות מפתח", status: "פעיל", spend: "₪620", roas: "3.8x" },
              { name: "TikTok — ויראלי", status: "מושהה", spend: "₪280", roas: "2.9x" },
            ].map((campaign) => (
              <div key={campaign.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-charcoal">{campaign.name}</p>
                  <p className="text-xs text-gray-400">{campaign.spend} | ROAS {campaign.roas}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  campaign.status === "פעיל" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                }`}>
                  {campaign.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Coupons */}
        <Link href="/admin/marketing/coupons" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-coral/30 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-teal flex items-center justify-center">
              <span className="text-white text-lg">🎟️</span>
            </div>
            <h3 className="font-bold text-charcoal group-hover:text-coral transition-colors">קופונים</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            צור וניהל קופוני הנחה. מעקב שימושים והכנסות.
          </p>
          <div className="space-y-2">
            {[
              { code: "WELCOME15", uses: 23, discount: "15%" },
              { code: "SHARE10", uses: 12, discount: "10%" },
              { code: "WINTER25", uses: 8, discount: "25%" },
            ].map((coupon) => (
              <div key={coupon.code} className="flex items-center justify-between">
                <span className="text-sm font-mono text-coral">{coupon.code}</span>
                <span className="text-xs text-gray-400">{coupon.uses} שימושים | {coupon.discount}</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-coral font-medium mt-4">ניהול קופונים ←</p>
        </Link>

        {/* Viral content */}
        <Link href="/admin/marketing/viral" className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:border-coral/30 transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
              <span className="text-charcoal text-lg">🔥</span>
            </div>
            <h3 className="font-bold text-charcoal group-hover:text-coral transition-colors">תוכן ויראלי</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            יצירת תוכן שיווקי בעברית לרשתות החברתיות. כיתובים, האשטגים ולוח שנה.
          </p>
          <div className="space-y-2">
            {[
              { platform: "TikTok", posts: 12, engagement: "8.5K" },
              { platform: "Instagram", posts: 8, engagement: "5.2K" },
              { platform: "Facebook", posts: 15, engagement: "3.1K" },
            ].map((platform) => (
              <div key={platform.platform} className="flex items-center justify-between">
                <span className="text-sm text-charcoal">{platform.platform}</span>
                <span className="text-xs text-gray-400">{platform.posts} פוסטים | {platform.engagement} אינטראקציות</span>
              </div>
            ))}
          </div>
          <p className="text-sm text-coral font-medium mt-4">ניהול תוכן ←</p>
        </Link>
      </div>

      {/* Performance chart placeholder */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-charcoal mb-4">📊 ביצועי שיווק — 30 יום אחרונים</h3>
        <div className="h-48 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">
          גרף ביצועים (הוצאה vs הכנסה לפי ערוץ)
        </div>
      </div>
    </div>
  );
}
