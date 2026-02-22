"use client";

import { useState } from "react";

interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  status: "active" | "expired" | "disabled";
  expiresAt: string;
  createdAt: string;
}

const demoCoupons: Coupon[] = [
  { id: "c1", code: "WELCOME15", type: "percentage", value: 15, minOrder: 0, maxUses: 1000, usedCount: 23, status: "active", expiresAt: "2025-12-31", createdAt: "2025-01-01" },
  { id: "c2", code: "SHARE10", type: "percentage", value: 10, minOrder: 100, maxUses: 500, usedCount: 12, status: "active", expiresAt: "2025-12-31", createdAt: "2025-01-01" },
  { id: "c3", code: "WINTER25", type: "percentage", value: 25, minOrder: 200, maxUses: 100, usedCount: 8, status: "active", expiresAt: "2025-03-31", createdAt: "2025-02-01" },
  { id: "c4", code: "SHIP50", type: "fixed", value: 50, minOrder: 150, maxUses: 200, usedCount: 45, status: "active", expiresAt: "2025-06-30", createdAt: "2025-01-15" },
  { id: "c5", code: "BLACKFRIDAY", type: "percentage", value: 30, minOrder: 100, maxUses: 500, usedCount: 500, status: "expired", expiresAt: "2024-11-30", createdAt: "2024-11-20" },
];

export default function CouponsPage() {
  const [coupons] = useState(demoCoupons);
  const [showForm, setShowForm] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: 10,
    minOrder: 0,
    maxUses: 100,
    expiresAt: "",
  });

  const handleCreate = async () => {
    try {
      await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCoupon),
      });
      setShowForm(false);
      setNewCoupon({ code: "", type: "percentage", value: 10, minOrder: 0, maxUses: 100, expiresAt: "" });
    } catch {
      alert("שגיאה ביצירת קופון");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-charcoal">קופונים</h1>
          <p className="text-sm text-gray-500 mt-1">{coupons.length} קופונים</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-coral text-white text-sm font-medium rounded-xl hover:bg-coral-dark transition-colors shadow-sm shadow-coral/20"
        >
          + קופון חדש
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-coral/20">
          <h3 className="text-sm font-bold text-charcoal mb-4">יצירת קופון חדש</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">קוד קופון</label>
              <input
                type="text"
                value={newCoupon.code}
                onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER20"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-coral/30 outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">סוג</label>
              <select
                value={newCoupon.type}
                onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as "percentage" | "fixed" })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-coral/30 outline-none"
              >
                <option value="percentage">אחוז הנחה</option>
                <option value="fixed">סכום קבוע (₪)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                {newCoupon.type === "percentage" ? "אחוז (%)" : "סכום (₪)"}
              </label>
              <input
                type="number"
                value={newCoupon.value}
                onChange={(e) => setNewCoupon({ ...newCoupon, value: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">מינימום הזמנה (₪)</label>
              <input
                type="number"
                value={newCoupon.minOrder}
                onChange={(e) => setNewCoupon({ ...newCoupon, minOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">מקסימום שימושים</label>
              <input
                type="number"
                value={newCoupon.maxUses}
                onChange={(e) => setNewCoupon({ ...newCoupon, maxUses: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">תוקף עד</label>
              <input
                type="date"
                value={newCoupon.expiresAt}
                onChange={(e) => setNewCoupon({ ...newCoupon, expiresAt: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleCreate} className="px-6 py-2 bg-teal text-white text-sm font-medium rounded-xl hover:bg-teal-dark transition-colors">
              צור קופון
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Coupons table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">קוד</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">הנחה</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">מינימום</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">שימושים</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">סטטוס</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">תוקף</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <span className="font-mono font-bold text-coral">{coupon.code}</span>
                </td>
                <td className="px-4 py-4 text-charcoal">
                  {coupon.type === "percentage" ? `${coupon.value}%` : `₪${coupon.value}`}
                </td>
                <td className="px-4 py-4 text-gray-500">
                  {coupon.minOrder > 0 ? `₪${coupon.minOrder}` : "—"}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-charcoal">{coupon.usedCount}/{coupon.maxUses}</span>
                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-coral rounded-full"
                        style={{ width: `${Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    coupon.status === "active" ? "bg-emerald-50 text-emerald-700" :
                    coupon.status === "expired" ? "bg-gray-100 text-gray-500" :
                    "bg-red-50 text-red-700"
                  }`}>
                    {coupon.status === "active" ? "פעיל" : coupon.status === "expired" ? "פג תוקף" : "מושבת"}
                  </span>
                </td>
                <td className="px-4 py-4 text-gray-400 text-xs">
                  {new Date(coupon.expiresAt).toLocaleDateString("he-IL")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
