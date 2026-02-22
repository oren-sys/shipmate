"use client";

import dynamic from "next/dynamic";
import StatsCard from "@/components/admin/StatsCard";
import RecentOrders from "@/components/admin/RecentOrders";

// Dynamic import for recharts (client-only, no SSR)
const RevenueChart = dynamic(
  () => import("@/components/admin/RevenueChart"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-96 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-coral border-t-transparent rounded-full" />
      </div>
    ),
  }
);

export default function AdminDashboard() {
  return (
    <div className="space-y-6" dir="rtl">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">דשבורד</h1>
          <p className="text-sm text-gray-500 mt-1">סקירה כללית של החנות</p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-coral text-white text-sm font-medium rounded-xl hover:bg-coral-dark transition-colors shadow-sm shadow-coral/20">
            + מוצר חדש
          </button>
          <button className="px-4 py-2 bg-white text-charcoal text-sm font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">
            📊 דוח יומי
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="הזמנות היום"
          value="23"
          change="+18%"
          changeType="up"
          icon="🛒"
          color="coral"
        />
        <StatsCard
          title="הכנסות היום"
          value="₪4,280"
          change="+12%"
          changeType="up"
          icon="💰"
          color="teal"
        />
        <StatsCard
          title="שיעור המרה"
          value="3.2%"
          change="-0.5%"
          changeType="down"
          icon="📈"
          color="accent"
        />
        <StatsCard
          title="לקוחות חדשים"
          value="15"
          change="+3"
          changeType="up"
          icon="👥"
          color="mint"
        />
      </div>

      {/* Revenue chart */}
      <RevenueChart />

      {/* Recent orders */}
      <RecentOrders />

      {/* Quick insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top products */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-charcoal mb-4">🏆 מוצרים מובילים</h3>
          <div className="space-y-3">
            {[
              { name: "אוזניות בלוטוס Pro", sales: 47, revenue: "₪8,460" },
              { name: "מנורת LED חכמה", sales: 35, revenue: "₪5,250" },
              { name: "כרית מסאז׳ חשמלית", sales: 28, revenue: "₪6,440" },
            ].map((product, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-coral/10 text-coral text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm text-charcoal">{product.name}</span>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-charcoal">{product.revenue}</p>
                  <p className="text-xs text-gray-400">{product.sales} מכירות</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alerts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-charcoal mb-4">⚠️ התראות</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
              <span className="text-amber-500 mt-0.5">⚡</span>
              <div>
                <p className="text-sm font-medium text-amber-800">
                  3 מוצרים עם מלאי נמוך
                </p>
                <p className="text-xs text-amber-600 mt-0.5">יש לבדוק מלאי ספק</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-500 mt-0.5">📦</span>
              <div>
                <p className="text-sm font-medium text-blue-800">
                  5 הזמנות ממתינות למשלוח
                </p>
                <p className="text-xs text-blue-600 mt-0.5">מעל 24 שעות</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg">
              <span className="text-emerald-500 mt-0.5">✅</span>
              <div>
                <p className="text-sm font-medium text-emerald-800">
                  עדכון מחירים הושלם
                </p>
                <p className="text-xs text-emerald-600 mt-0.5">47 מוצרים עודכנו</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's activity */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-sm font-bold text-charcoal mb-4">📋 פעילות היום</h3>
          <div className="space-y-4">
            {[
              { time: "14:32", text: "הזמנה SM-1047 התקבלה", type: "order" },
              { time: "13:15", text: "משלוח SM-1043 נמסר", type: "delivery" },
              { time: "12:00", text: "עדכון מחירים אוטומטי", type: "system" },
              { time: "10:45", text: "לקוח חדש נרשם", type: "customer" },
              { time: "09:30", text: "ביקורת חיובית ★★★★★", type: "review" },
            ].map((activity, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xs text-gray-400 font-mono mt-0.5 min-w-[3rem]">
                  {activity.time}
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-2 shrink-0" />
                <span className="text-sm text-gray-600">{activity.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
