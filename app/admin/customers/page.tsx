"use client";

import Link from "next/link";
import { useState } from "react";

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

const demoCustomers: Customer[] = [
  { id: "c1", name: "יעל כהן", email: "yael@example.com", phone: "050-1234567", ordersCount: 8, totalSpent: 2450, lastOrder: "2025-02-22", segment: "vip", createdAt: "2024-11-15" },
  { id: "c2", name: "דניאל לוי", email: "daniel@example.com", phone: "052-9876543", ordersCount: 3, totalSpent: 890, lastOrder: "2025-02-22", segment: "returning", createdAt: "2025-01-03" },
  { id: "c3", name: "נועה אברהם", email: "noa@example.com", phone: "054-5556667", ordersCount: 1, totalSpent: 89.9, lastOrder: "2025-02-22", segment: "new", createdAt: "2025-02-22" },
  { id: "c4", name: "אורי שמעון", email: "ori@example.com", phone: "050-1112233", ordersCount: 5, totalSpent: 1280, lastOrder: "2025-02-21", segment: "returning", createdAt: "2024-12-20" },
  { id: "c5", name: "מיכל דוד", email: "michal@example.com", phone: "053-4445566", ordersCount: 2, totalSpent: 320, lastOrder: "2025-02-21", segment: "returning", createdAt: "2025-01-15" },
  { id: "c6", name: "רועי פרץ", email: "roi@example.com", phone: "058-7778899", ordersCount: 1, totalSpent: 69.9, lastOrder: "2025-01-10", segment: "at_risk", createdAt: "2025-01-10" },
  { id: "c7", name: "שרה גולד", email: "sara@example.com", phone: "050-3334455", ordersCount: 12, totalSpent: 4100, lastOrder: "2025-02-20", segment: "vip", createdAt: "2024-09-01" },
  { id: "c8", name: "עמית ברק", email: "amit@example.com", phone: "052-6667788", ordersCount: 1, totalSpent: 119.9, lastOrder: "2025-02-19", segment: "new", createdAt: "2025-02-19" },
];

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [segmentFilter, setSegmentFilter] = useState("all");

  const filtered = demoCustomers.filter((c) => {
    if (segmentFilter !== "all" && c.segment !== segmentFilter) return false;
    if (search && !c.name.includes(search) && !c.email.includes(search) && !c.phone.includes(search)) return false;
    return true;
  });

  const totalLTV = demoCustomers.reduce((sum, c) => sum + c.totalSpent, 0);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-charcoal">לקוחות</h1>
        <p className="text-sm text-gray-500 mt-1">
          {demoCustomers.length} לקוחות | ערך כולל: ₪{totalLTV.toLocaleString()}
        </p>
      </div>

      {/* Segment stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(["vip", "returning", "new", "at_risk"] as const).map((seg) => {
          const config = segmentConfig[seg];
          const count = demoCustomers.filter((c) => c.segment === seg).length;
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
                  <td className="px-4 py-4 font-medium text-charcoal">₪{customer.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-4 text-gray-400 text-xs">
                    {new Date(customer.lastOrder).toLocaleDateString("he-IL")}
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
      </div>
    </div>
  );
}
