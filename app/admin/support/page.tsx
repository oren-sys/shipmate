"use client";

/**
 * Admin Support Tickets Page
 *
 * Features:
 * - Ticket list with status filters
 * - Priority indicators
 * - Channel badges (WhatsApp, Email, Web)
 * - Quick stats
 */

import { useState, useEffect } from "react";
import Link from "next/link";

interface Ticket {
  id: string;
  phone?: string;
  email?: string;
  channel: "whatsapp" | "email" | "web";
  subject: string;
  status: "open" | "pending" | "resolved";
  priority: "low" | "medium" | "high";
  messagesCount: number;
  createdAt: string;
  updatedAt: string;
}

const channelConfig = {
  whatsapp: { label: "WhatsApp", color: "bg-green-100 text-green-800", icon: "💬" },
  email: { label: "אימייל", color: "bg-blue-100 text-blue-800", icon: "📧" },
  web: { label: "אתר", color: "bg-purple-100 text-purple-800", icon: "🌐" },
};

const statusConfig = {
  open: { label: "פתוח", color: "bg-red-100 text-red-800" },
  pending: { label: "ממתין", color: "bg-yellow-100 text-yellow-800" },
  resolved: { label: "נפתר", color: "bg-green-100 text-green-800" },
};

const priorityConfig = {
  low: { label: "נמוכה", color: "text-gray-500" },
  medium: { label: "רגילה", color: "text-yellow-600" },
  high: { label: "גבוהה", color: "text-red-600 font-bold" },
};

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "pending" | "resolved">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // No API route for support tickets yet — start with empty state
    setTickets([]);
    setLoading(false);
  }, []);

  const filteredTickets = filter === "all"
    ? tickets
    : tickets.filter((t) => t.status === filter);

  const stats = {
    open: tickets.filter((t) => t.status === "open").length,
    pending: tickets.filter((t) => t.status === "pending").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    highPriority: tickets.filter((t) => t.priority === "high" && t.status !== "resolved").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">תמיכה</h1>
          <p className="text-gray-500 mt-1">ניהול פניות לקוחות</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-600">{stats.open}</p>
          <p className="text-sm text-red-800">פתוחים</p>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-yellow-800">ממתינים</p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
          <p className="text-sm text-green-800">נפתרו</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{stats.highPriority}</p>
          <p className="text-sm text-orange-800">דחוף</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "open", "pending", "resolved"] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === status
                ? "bg-[#1A7A6D] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {status === "all" ? "הכל" : statusConfig[status].label}
            <span className="mr-1 opacity-75">
              ({status === "all" ? tickets.length : tickets.filter((t) => t.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">טוען...</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-100">
            {filteredTickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/admin/support/${ticket.id}`}
                className="block hover:bg-gray-50 transition-colors"
              >
                <div className="p-4 flex items-center gap-4">
                  {/* Priority indicator */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    ticket.priority === "high" ? "bg-red-500" :
                    ticket.priority === "medium" ? "bg-yellow-500" : "bg-gray-300"
                  }`} />

                  {/* Channel icon */}
                  <span className="text-xl flex-shrink-0">
                    {channelConfig[ticket.channel].icon}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">
                        {ticket.subject}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-500">
                        {ticket.phone || ticket.email}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {ticket.messagesCount} הודעות
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500">
                        {new Date(ticket.updatedAt).toLocaleDateString("he-IL")}
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${channelConfig[ticket.channel].color}`}>
                      {channelConfig[ticket.channel].label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusConfig[ticket.status].color}`}>
                      {statusConfig[ticket.status].label}
                    </span>
                    <span className={`text-xs ${priorityConfig[ticket.priority].color}`}>
                      {priorityConfig[ticket.priority].label}
                    </span>
                  </div>
                </div>
              </Link>
            ))}

            {filteredTickets.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 px-4">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">אין פניות תמיכה עדיין</p>
                <p className="text-sm text-gray-400 mt-1">פניות חדשות מלקוחות יופיעו כאן</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
