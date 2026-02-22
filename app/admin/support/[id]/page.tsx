"use client";

/**
 * Admin Support Ticket Detail
 *
 * Features:
 * - Conversation thread view
 * - Reply from admin
 * - Status management
 * - Priority change
 * - Quick reply templates
 */

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";

interface Message {
  from: "customer" | "admin" | "bot";
  text: string;
  timestamp: string;
}

interface TicketDetail {
  id: string;
  phone?: string;
  email?: string;
  customerId?: string;
  channel: "whatsapp" | "email" | "web";
  subject: string;
  messages: Message[];
  status: "open" | "pending" | "resolved";
  priority: "low" | "medium" | "high";
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

const quickReplies = [
  {
    label: "תודה על הפנייה",
    text: "תודה על הפנייה! נבדוק ונחזור אליכם בהקדם.",
  },
  {
    label: "מספר מעקב",
    text: "מספר המעקב של ההזמנה שלכם הוא: [NUMBER]. תוכלו לעקוב אחרי המשלוח באתר הדואר.",
  },
  {
    label: "החזרה אושרה",
    text: "בקשת ההחזרה אושרה! ✅ אנא שלחו את המוצר באריזה המקורית. ההחזר יתבצע תוך 5 ימי עסקים מרגע הקבלה.",
  },
  {
    label: "משלוח בדרך",
    text: "ההזמנה שלכם בדרך! 🚚 זמן הגעה צפוי: 3-5 ימי עסקים. תקבלו עדכון עם מספר מעקב.",
  },
  {
    label: "קופון פיצוי",
    text: "אנו מתנצלים על אי הנוחות! 🙏 לפיצוי, הנה קופון 15% הנחה על ההזמנה הבאה: SORRY15",
  },
];

// Demo data
const demoTicket: TicketDetail = {
  id: "T001",
  phone: "+972501234567",
  channel: "whatsapp",
  subject: "ההזמנה לא הגיעה כבר שבועיים",
  messages: [
    {
      from: "customer",
      text: "היי, ההזמנה שלי IL-10023 לא הגיעה כבר שבועיים. מה קורה?",
      timestamp: "2024-02-20T10:30:00Z",
    },
    {
      from: "bot",
      text: "📦 הזמנה IL-10023\n\nסטטוס: 🚚 נשלחה\nסכום: ₪189\n📍 מספר מעקב: RM123456789IL",
      timestamp: "2024-02-20T10:30:05Z",
    },
    {
      from: "customer",
      text: "אבל המעקב מראה שזה נעצר לפני 5 ימים",
      timestamp: "2024-02-20T10:35:00Z",
    },
    {
      from: "customer",
      text: "אני רוצה לדבר עם נציג",
      timestamp: "2024-02-21T14:20:00Z",
    },
  ],
  status: "open",
  priority: "high",
  createdAt: "2024-02-20T10:30:00Z",
  updatedAt: "2024-02-21T14:20:00Z",
};

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load from API, fallback to demo
    setTicket(demoTicket);
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages]);

  const handleSendReply = async () => {
    if (!reply.trim() || !ticket) return;

    setSending(true);

    const newMessage: Message = {
      from: "admin",
      text: reply,
      timestamp: new Date().toISOString(),
    };

    // Update local state
    setTicket({
      ...ticket,
      messages: [...ticket.messages, newMessage],
      status: "pending",
      updatedAt: new Date().toISOString(),
    });

    setReply("");

    // TODO: Send via API
    // await fetch(`/api/admin/support/${ticket.id}/reply`, { ... })

    setSending(false);
  };

  const handleStatusChange = async (newStatus: TicketDetail["status"]) => {
    if (!ticket) return;

    setTicket({
      ...ticket,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });

    // TODO: Update via API
  };

  const handlePriorityChange = async (newPriority: TicketDetail["priority"]) => {
    if (!ticket) return;

    setTicket({
      ...ticket,
      priority: newPriority,
      updatedAt: new Date().toISOString(),
    });
  };

  if (loading) {
    return <div className="text-center py-12 text-gray-500">טוען...</div>;
  }

  if (!ticket) {
    return <div className="text-center py-12 text-gray-500">פנייה לא נמצאה</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/admin/support")}
            className="text-gray-500 hover:text-gray-700"
          >
            ← חזרה
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{ticket.subject}</h1>
            <p className="text-sm text-gray-500">
              {ticket.phone || ticket.email} • {ticket.channel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority selector */}
          <select
            value={ticket.priority}
            onChange={(e) => handlePriorityChange(e.target.value as TicketDetail["priority"])}
            className="text-sm border rounded-lg px-3 py-1.5"
          >
            <option value="low">🟢 נמוכה</option>
            <option value="medium">🟡 רגילה</option>
            <option value="high">🔴 גבוהה</option>
          </select>

          {/* Status buttons */}
          <div className="flex gap-1">
            {ticket.status !== "resolved" && (
              <button
                onClick={() => handleStatusChange("resolved")}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                ✅ סגור
              </button>
            )}
            {ticket.status === "resolved" && (
              <button
                onClick={() => handleStatusChange("open")}
                className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
              >
                פתח מחדש
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Conversation */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="p-4 max-h-[500px] overflow-y-auto space-y-4">
          {ticket.messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.from === "admin" ? "justify-start" : "justify-end"}`}
            >
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                  msg.from === "customer"
                    ? "bg-gray-100 text-gray-900"
                    : msg.from === "bot"
                    ? "bg-green-50 text-green-900 border border-green-200"
                    : "bg-[#1A7A6D] text-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs opacity-75 font-medium">
                    {msg.from === "customer" ? "לקוח" : msg.from === "bot" ? "🤖 בוט" : "👤 נציג"}
                  </span>
                  <span className="text-xs opacity-50">
                    {new Date(msg.timestamp).toLocaleTimeString("he-IL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {ticket.status !== "resolved" && (
          <div className="px-4 py-2 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">תגובות מהירות:</p>
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((qr, idx) => (
                <button
                  key={idx}
                  onClick={() => setReply(qr.text)}
                  className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                >
                  {qr.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Reply Input */}
        {ticket.status !== "resolved" && (
          <div className="p-4 border-t border-gray-100">
            <div className="flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="הקלד תגובה..."
                rows={3}
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:ring-2 focus:ring-[#1A7A6D] focus:border-transparent"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply();
                  }
                }}
              />
              <button
                onClick={handleSendReply}
                disabled={!reply.trim() || sending}
                className="self-end px-6 py-3 bg-[#1A7A6D] text-white rounded-xl hover:bg-[#15665B] disabled:opacity-50 transition-colors"
              >
                {sending ? "שולח..." : "שלח"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Ticket Info Sidebar */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-3">פרטי פנייה</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">מזהה:</span>
              <span className="font-mono">{ticket.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">ערוץ:</span>
              <span>{ticket.channel}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">נפתח:</span>
              <span>{new Date(ticket.createdAt).toLocaleDateString("he-IL")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">עודכן:</span>
              <span>{new Date(ticket.updatedAt).toLocaleDateString("he-IL")}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-medium text-gray-900 mb-3">פרטי לקוח</h3>
          <div className="space-y-2 text-sm">
            {ticket.phone && (
              <div className="flex justify-between">
                <span className="text-gray-500">טלפון:</span>
                <span dir="ltr">{ticket.phone}</span>
              </div>
            )}
            {ticket.email && (
              <div className="flex justify-between">
                <span className="text-gray-500">אימייל:</span>
                <span>{ticket.email}</span>
              </div>
            )}
            {ticket.customerId && (
              <div className="flex justify-between">
                <span className="text-gray-500">מזהה לקוח:</span>
                <span className="font-mono">{ticket.customerId}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
