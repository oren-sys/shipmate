"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  itemCount: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
  paymentStatus: "paid" | "pending" | "refunded";
  createdAt: string;
  trackingNumber?: string;
}

const statusConfig = {
  pending: { label: "ממתין", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400" },
  processing: { label: "בטיפול", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400" },
  shipped: { label: "נשלח", bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400" },
  delivered: { label: "נמסר", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400" },
  cancelled: { label: "בוטל", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-400" },
  refunded: { label: "הוחזר", bg: "bg-gray-100", text: "text-gray-600", dot: "bg-gray-400" },
};

const paymentBadge = {
  paid: { label: "שולם", class: "bg-emerald-50 text-emerald-700" },
  pending: { label: "ממתין", class: "bg-amber-50 text-amber-700" },
  refunded: { label: "הוחזר", class: "bg-gray-100 text-gray-600" },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch("/api/admin/orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, []);

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search && !o.orderNumber?.includes(search) && !o.customerName?.includes(search)) return false;
    return true;
  });

  const counts = {
    pending: orders.filter((o) => o.status === "pending").length,
    processing: orders.filter((o) => o.status === "processing").length,
    shipped: orders.filter((o) => o.status === "shipped").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">טוען הזמנות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal">הזמנות</h1>
        <p className="text-sm text-gray-500 mt-1">{orders.length} הזמנות</p>
      </div>

      {/* Quick stats */}
      <div className="flex gap-3">
        {[
          { label: "ממתינות", count: counts.pending, color: "bg-amber-400" },
          { label: "בטיפול", count: counts.processing, color: "bg-blue-400" },
          { label: "נשלחו", count: counts.shipped, color: "bg-purple-400" },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-100 shadow-sm">
            <span className={`w-2.5 h-2.5 rounded-full ${stat.color}`} />
            <span className="text-sm font-medium text-charcoal">{stat.count}</span>
            <span className="text-xs text-gray-400">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="חפש מספר הזמנה או שם..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-coral/30 outline-none"
        >
          <option value="all">כל הסטטוסים</option>
          <option value="pending">ממתין</option>
          <option value="processing">בטיפול</option>
          <option value="shipped">נשלח</option>
          <option value="delivered">נמסר</option>
          <option value="cancelled">בוטל</option>
          <option value="refunded">הוחזר</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">אין הזמנות עדיין</p>
            <p className="text-sm text-gray-400 mt-1">הזמנות חדשות יופיעו כאן</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">הזמנה</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">לקוח</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">סטטוס</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">תשלום</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">פריטים</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">סה&quot;כ</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">תאריך</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => {
                const status = statusConfig[order.status];
                const payment = paymentBadge[order.paymentStatus];
                const date = new Date(order.createdAt);

                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono font-medium text-charcoal">{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-charcoal">{order.customerName}</p>
                      <p className="text-xs text-gray-400">{order.customerEmail}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${payment.class}`}>
                        {payment.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-gray-500">{order.itemCount}</td>
                    <td className="px-4 py-4 font-medium text-charcoal">₪{order.total?.toFixed(0)}</td>
                    <td className="px-4 py-4 text-gray-400 text-xs">
                      {date.toLocaleDateString("he-IL")}
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="text-coral hover:text-coral-dark text-sm font-medium">
                        צפייה
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
