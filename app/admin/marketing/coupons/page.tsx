"use client";

import { useState, useEffect, useCallback } from "react";

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

interface CouponForm {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  maxUses: number;
  status: "active" | "expired" | "disabled";
  expiresAt: string;
}

const emptyForm: CouponForm = {
  code: "",
  type: "percentage",
  value: 10,
  minOrder: 0,
  maxUses: 100,
  status: "active",
  expiresAt: "",
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CouponForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCoupons(data.coupons || []);
    } catch {
      console.error("Failed to fetch coupons");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (coupon: Coupon) => {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrder: coupon.minOrder,
      maxUses: coupon.maxUses,
      status: coupon.status,
      expiresAt: coupon.expiresAt ? coupon.expiresAt.split("T")[0] : "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId) {
        // Update existing coupon
        const res = await fetch("/api/admin/coupons", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...form }),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "שגיאה בעדכון קופון");
          return;
        }
      } else {
        // Create new coupon
        const res = await fetch("/api/admin/coupons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) {
          const err = await res.json();
          alert(err.error || "שגיאה ביצירת קופון");
          return;
        }
      }
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await fetchCoupons();
    } catch {
      alert("שגיאה בשמירת קופון");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`האם למחוק את הקופון "${coupon.code}"?`)) return;

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: coupon.id }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "שגיאה במחיקת קופון");
        return;
      }
      await fetchCoupons();
    } catch {
      alert("שגיאה במחיקת קופון");
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
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
          onClick={openCreateForm}
          className="px-4 py-2 bg-coral text-white text-sm font-medium rounded-xl hover:bg-coral-dark transition-colors shadow-sm shadow-coral/20"
        >
          + קופון חדש
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-coral/20">
          <h3 className="text-sm font-bold text-charcoal mb-4">
            {editingId ? "עריכת קופון" : "יצירת קופון חדש"}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">קוד קופון</label>
              <input
                type="text"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="SUMMER20"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:ring-2 focus:ring-coral/30 outline-none"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">סוג</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "percentage" | "fixed" })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-coral/30 outline-none"
              >
                <option value="percentage">אחוז הנחה</option>
                <option value="fixed">סכום קבוע (₪)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">
                {form.type === "percentage" ? "אחוז (%)" : "סכום (₪)"}
              </label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => setForm({ ...form, value: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">מינימום הזמנה (₪)</label>
              <input
                type="number"
                value={form.minOrder}
                onChange={(e) => setForm({ ...form, minOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">מקסימום שימושים</label>
              <input
                type="number"
                value={form.maxUses}
                onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal mb-1.5">תוקף עד</label>
              <input
                type="date"
                value={form.expiresAt}
                onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
              />
            </div>
            {editingId && (
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">סטטוס</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as "active" | "expired" | "disabled" })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-coral/30 outline-none"
                >
                  <option value="active">פעיל</option>
                  <option value="expired">פג תוקף</option>
                  <option value="disabled">מושבת</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-teal text-white text-sm font-medium rounded-xl hover:bg-teal-dark transition-colors disabled:opacity-50"
            >
              {saving ? "שומר..." : editingId ? "שמור שינויים" : "צור קופון"}
            </button>
            <button
              onClick={cancelForm}
              className="px-6 py-2 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-100 text-center">
          <div className="inline-block w-8 h-8 border-4 border-coral/30 border-t-coral rounded-full animate-spin" />
          <p className="text-sm text-gray-400 mt-3">טוען קופונים...</p>
        </div>
      )}

      {/* Coupons table */}
      {!loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {coupons.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm">אין קופונים עדיין</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">קוד</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">הנחה</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">מינימום</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">שימושים</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">סטטוס</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">תוקף</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">פעולות</th>
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
                      {coupon.minOrder > 0 ? `₪${coupon.minOrder}` : "\u2014"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-charcoal">{coupon.usedCount}/{coupon.maxUses}</span>
                        {coupon.maxUses > 0 && (
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-coral rounded-full"
                              style={{ width: `${Math.min((coupon.usedCount / coupon.maxUses) * 100, 100)}%` }}
                            />
                          </div>
                        )}
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
                      {coupon.expiresAt
                        ? new Date(coupon.expiresAt).toLocaleDateString("he-IL")
                        : "\u2014"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditForm(coupon)}
                          className="px-2.5 py-1 text-xs font-medium text-teal hover:bg-teal/10 rounded-lg transition-colors"
                          title="עריכה"
                        >
                          &#9998; עריכה
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          className="px-2.5 py-1 text-xs font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="מחיקה"
                        >
                          &#128465; מחיקה
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
