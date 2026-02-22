"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const statusSteps = [
  { key: "pending", label: "הזמנה התקבלה", icon: "📋" },
  { key: "processing", label: "בטיפול", icon: "⚙️" },
  { key: "shipped", label: "נשלח", icon: "📦" },
  { key: "delivered", label: "נמסר", icon: "✅" },
];

const demoOrder = {
  id: "o1",
  orderNumber: "SM-1047",
  status: "processing",
  paymentStatus: "paid",
  createdAt: "2025-02-22T12:30:00Z",
  customer: {
    name: "יעל כהן",
    email: "yael@example.com",
    phone: "050-1234567",
  },
  shippingAddress: {
    city: "תל אביב",
    street: "דיזנגוף 120",
    apartment: "דירה 5",
    zipCode: "6433501",
  },
  items: [
    { id: "p1", titleHe: "אוזניות בלוטוס Pro", quantity: 1, price: 179.9, image: "" },
    { id: "p5", titleHe: "כבל טעינה מגנטי", quantity: 2, price: 49.9, image: "" },
  ],
  subtotal: 279.7,
  shippingCost: 0,
  discount: 0,
  total: 279.7,
  paymentId: "MSH-12345",
  trackingNumber: "",
  notes: "",
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [order] = useState(demoOrder);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber);
  const [notes, setNotes] = useState(order.notes);

  const currentStepIndex = statusSteps.findIndex((s) => s.key === order.status);

  const updateStatus = async (newStatus: string) => {
    try {
      await fetch(`/api/admin/orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, trackingNumber }),
      });
      alert(`סטטוס עודכן ל: ${newStatus}`);
    } catch {
      alert("שגיאה בעדכון");
    }
  };

  return (
    <div className="space-y-6 max-w-5xl" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">→</button>
          <div>
            <h1 className="text-2xl font-bold text-charcoal">הזמנה {order.orderNumber}</h1>
            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString("he-IL")}</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50">
            🖨️ חשבונית
          </button>
          <button className="px-4 py-2 bg-white border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50">
            📧 שלח ללקוח
          </button>
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-sm font-bold text-charcoal mb-6">מעקב הזמנה</h3>
        <div className="flex items-center justify-between relative">
          {/* Progress line */}
          <div className="absolute top-5 right-5 left-5 h-1 bg-gray-200 rounded-full">
            <div
              className="h-full bg-teal rounded-full transition-all"
              style={{ width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%` }}
            />
          </div>

          {statusSteps.map((step, i) => (
            <div key={step.key} className="relative flex flex-col items-center z-10">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                  i <= currentStepIndex
                    ? "bg-teal text-white shadow-md"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                {step.icon}
              </div>
              <span className={`text-xs mt-2 font-medium ${i <= currentStepIndex ? "text-teal" : "text-gray-400"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">פריטים</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">📦</div>
                    <div>
                      <p className="font-medium text-charcoal text-sm">{item.titleHe}</p>
                      <p className="text-xs text-gray-400">כמות: {item.quantity}</p>
                    </div>
                  </div>
                  <span className="font-medium text-charcoal">₪{(item.price * item.quantity).toFixed(0)}</span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">סכום ביניים</span>
                <span className="text-charcoal">₪{order.subtotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">משלוח</span>
                <span className="text-emerald-600">{order.shippingCost === 0 ? "חינם 🎉" : `₪${order.shippingCost}`}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">הנחה</span>
                  <span className="text-coral">-₪{order.discount.toFixed(0)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-100 font-bold">
                <span className="text-charcoal">סה&quot;כ</span>
                <span className="text-charcoal">₪{order.total.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Tracking & Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">פעולות</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">מספר מעקב</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="IL123456789"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-charcoal mb-1.5">הערות פנימיות</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-coral/30 outline-none resize-none"
                  placeholder="הערות..."
                />
              </div>

              <div className="flex gap-3">
                {order.status === "pending" && (
                  <button onClick={() => updateStatus("processing")} className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600">
                    התחל טיפול
                  </button>
                )}
                {order.status === "processing" && (
                  <button onClick={() => updateStatus("shipped")} className="px-4 py-2 bg-purple-500 text-white text-sm font-medium rounded-xl hover:bg-purple-600">
                    סמן כנשלח
                  </button>
                )}
                {order.status === "shipped" && (
                  <button onClick={() => updateStatus("delivered")} className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600">
                    סמן כנמסר
                  </button>
                )}
                <button className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-xl hover:bg-red-100">
                  ביטול הזמנה
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">👤 לקוח</h3>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-charcoal">{order.customer.name}</p>
              <p className="text-gray-500">{order.customer.email}</p>
              <p className="text-gray-500" dir="ltr">{order.customer.phone}</p>
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">📍 כתובת משלוח</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>{order.shippingAddress.street}</p>
              {order.shippingAddress.apartment && <p>{order.shippingAddress.apartment}</p>}
              <p>{order.shippingAddress.city}</p>
              <p className="text-gray-400" dir="ltr">{order.shippingAddress.zipCode}</p>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-charcoal mb-4">💳 תשלום</h3>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">סטטוס</span>
                <span className="text-emerald-600 font-medium">שולם</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">אמצעי</span>
                <span className="text-charcoal">Meshulam</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">מזהה תשלום</span>
                <span className="text-charcoal font-mono text-xs">{order.paymentId}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
