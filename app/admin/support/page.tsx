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

// Demo data
const demoTickets: Ticket[] = [
  {
    id: "T001",
    phone: "+972501234567",
    channel: "whatsapp",
    subject: "ההזמנה לא הגיעה כבר שבועיים",
    status: "open",
    priority: "high",
    messagesCount: 4,
    createdAt: "2024-02-20T10:30:00Z",
    updatedAt: "2024-02-21T14:20:00Z",
  },
  {
    id: "T002",
    email: "sarah@example.com",
    channel: "email",
    subject: "בקשת החזרה - מוצר לא תואם",
    status: "pending",
    priority: "medium",
    messagesCount: 2,
    createdAt: "2024-02-19T08:15:00Z",
    updatedAt: "2024-02-20T11:00:00Z",
  },
  {
    id: "T003",
    phone: "+972509876543",
    channel: "whatsapp",
    subject: "שאלה על זמני משלוח",
    status: "resolved",
    priority: "low",
    messagesCount: 3,
    createdAt: "2024-02-18T16:45:00Z",
    updatedAt: "2024-02-18T17:30:00Z",
  },
  {
    id: "T004",
    channel: "web",
    email: "david@example.com",
    subject: "בעיה בתשלום",
    status: "open",
    priority: "high",
    messagesCount: 1,
    createdAt: "2024-02-21T09:00:00Z",
    updatedAt: "2024-02-21T09:00:00Z",
  },
  {
    id: "T005",
    phone: "+972507654321",
    channel: "whatsapp",
    subject: "רוצה לשנות כתובת למשלוח",
    status: "pending",
    priority: "medium",
    messagesCount: 2,
    createdAt: "2024-02-20T14:00:00Z",
    updatedAt: "2024-02-21T10:00:00Z",
  },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "pending" | "resolved">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from API, fallback to demo
    setTickets(demoTickets);
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
              <div className="p-12 text-center text-gray-500">
                אין פניות בקטגוריה זו
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
