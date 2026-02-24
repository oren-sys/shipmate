"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  ordersCount: number;
  totalSpent: number;
  lastOrder: string;
  segment: "vip" | "returning" | "new" | "at_risk";
  createdAt: string;
}

const segmentConfig = {
  vip: { label: "VIP", bg: "bg-amber-50", text: "text-amber-700", icon: "⭐" },
  returning: { label: "חוזר", bg: "bg-blue-50", text: "text-blue-700", icon: "🔄" },
  new: { label: "חדש", bg: "bg-emerald-50", text: "text-emerald-700", icon: "🆕" },
  at_risk: { label: "בסיכון", bg: "bg-red-50", text: "text-red-700", icon: "⚠️" },
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await fetch("/api/admin/customers");
        if (res.ok) {
          const data = await res.json();
          setCustomers(data.customers || []);
        }
      } catch (err) {
        console.error("Failed to fetch customers:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchCustomers();
  }, []);

  const filtered = customers.filter((c) => {
    if (segmentFilter !== "all" && c.segment !== segmentFilter) return false;
    if (search && !c.name?.includes(search) && !c.email?.includes(search) && !c.phone?.includes(search)) return false;
    return true;
  });

  const totalLTV = customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" dir="rtl">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-coral border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">טוען לקוחות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal">לקוחות</h1>
        <p className="text-sm text-gray-500 mt-1">
          {customers.length} לקוחות | ערך כולל: ₪{totalLTV.toLocaleString()}
        </p>
      </div>

      {/* Segment stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["vip", "returning", "new", "at_risk"] as const).map((seg) => {
          const config = segmentConfig[seg];
          const count = customers.filter((c) => c.segment === seg).length;
          return (
            <button
              key={seg}
              onClick={() => setSegmentFilter(segmentFilter === seg ? "all" : seg)}
              className={`p-4 rounded-xl border transition-all text-right ${
                segmentFilter === seg
                  ? "border-coral bg-coral/5"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span>{config.icon}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-2xl font-bold text-charcoal">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="חפש לפי שם, אימייל או טלפון..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
      />

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">אין לקוחות עדיין</p>
            <p className="text-sm text-gray-400 mt-1">לקוחות חדשים יופיעו כאן לאחר הזמנה ראשונה</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">לקוח</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">סגמנט</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">הזמנות</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">ערך כולל</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">הזמנה אחרונה</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-400 uppercase">פעולות</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((customer) => {
                const segment = segmentConfig[customer.segment];
                return (
                  <tr key={customer.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-charcoal">{customer.name}</p>
                        <p className="text-xs text-gray-400">{customer.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${segment.bg} ${segment.text}`}>
                        {segment.icon} {segment.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-charcoal">{customer.ordersCount}</td>
                    <td className="px-4 py-4 font-medium text-charcoal">₪{(customer.totalSpent || 0).toLocaleString()}</td>
                    <td className="px-4 py-4 text-gray-400 text-xs">
                      {customer.lastOrder ? new Date(customer.lastOrder).toLocaleDateString("he-IL") : "-"}
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/admin/customers/${customer.id}`} className="text-coral hover:text-coral-dark text-sm font-medium">
                        פרופיל
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
