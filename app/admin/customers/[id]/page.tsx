"use client";

import { useRouter } from "next/navigation";

export default function CustomerDetailPage() {
  const router = useRouter();

  // Demo customer — in production fetch from Firestore
  const customer = {
    name: "יעל כהן",
    email: "yael@example.com",
    phone: "050-1234567",
    segment: "vip",
    createdAt: "2024-11-15",
    ordersCount: 8,
    totalSpent: 2450,
    avgOrderValue: 306.25,
    lastOrder: "2025-02-22",
    loyaltyPoints: 2450,
    referralCode: "YAEL15",
    orders: [
      { orderNumber: "SM-1047", total: 189.9, status: "ממתין", date: "2025-02-22" },
      { orderNumber: "SM-1038", total: 349.9, status: "נמסר", date: "2025-02-15" },
      { orderNumber: "SM-1025", total: 129.9, status: "נמסר", date: "2025-02-01" },
      { orderNumber: "SM-1010", total: 449.9, status: "נמסר", date: "2025-01-20" },
      { orderNumber: "SM-998", total: 89.9, status: "נמסר", date: "2025-01-10" },
    ],
  };

  return (
    <div className="space-y-6 max-w-5xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">→</button>
        <div>
          <h1 className="text-2xl font-bold text-charcoal">{customer.name}</h1>
          <p className="text-sm text-gray-500">לקוח מאז {new Date(customer.createdAt).toLocaleDateString("he-IL")}</p>
        </div>
        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-sm font-medium rounded-full">⭐ VIP</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats */}
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "הזמנות", value: customer.ordersCount.toString(), color: "text-coral" },
              { label: "ערך כולל", value: `₪${customer.totalSpent.toLocaleString()}`, color: "text-teal" },
              { label: "ממוצע להזמנה", value: `₪${customer.avgOrderValue.toFixed(0)}`, color: "text-charcoal" },
              { label: "נקודות נאמנות", value: customer.loyaltyPoints.toLocaleString(), color: "text-amber-600" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <p className="text-xs text-gray-400 mb-1">{stat.label}</p>
                <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Order history */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-6 pb-4">
              <h3 className="text-sm font-bold text-charcoal">היסטוריית הזמנות</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-t border-b border-gray-100">
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-400">הזמנה</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">סטטוס</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">סכום</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400">תאריך</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.orderNumber} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-6 py-3 font-mono font-medium text-charcoal">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-500">{order.status}</td>
                    <td className="px-4 py-3 font-medium text-charcoal">₪{order.total.toFixed(0)}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {new Date(order.date).toLocaleDateString("he-IL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">📇 פרטי קשר</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-400">אימייל</p>
                <p className="text-charcoal">{customer.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">טלפון</p>
                <p className="text-charcoal" dir="ltr">{customer.phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">קוד הפניה</p>
                <p className="text-coral font-mono font-medium">{customer.referralCode}</p>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">⚡ פעולות</h3>
            <div className="space-y-2">
              <button className="w-full text-right px-4 py-2.5 text-sm text-charcoal bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                📧 שלח אימייל
              </button>
              <button className="w-full text-right px-4 py-2.5 text-sm text-charcoal bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                💬 שלח WhatsApp
              </button>
              <button className="w-full text-right px-4 py-2.5 text-sm text-charcoal bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                🎟️ שלח קופון
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
