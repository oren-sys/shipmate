"use client";

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
  items: number;
}

const statusConfig = {
  pending: {
    label: "ממתין",
    bg: "bg-amber-50",
    text: "text-amber-700",
    dot: "bg-amber-400",
  },
  processing: {
    label: "בטיפול",
    bg: "bg-blue-50",
    text: "text-blue-700",
    dot: "bg-blue-400",
  },
  shipped: {
    label: "נשלח",
    bg: "bg-purple-50",
    text: "text-purple-700",
    dot: "bg-purple-400",
  },
  delivered: {
    label: "נמסר",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    dot: "bg-emerald-400",
  },
  cancelled: {
    label: "בוטל",
    bg: "bg-red-50",
    text: "text-red-700",
    dot: "bg-red-400",
  },
};

// Demo orders
const demoOrders: Order[] = [
  {
    id: "ord_1",
    orderNumber: "SM-1047",
    customerName: "יעל כהן",
    total: 189.9,
    status: "pending",
    date: "לפני 12 דקות",
    items: 2,
  },
  {
    id: "ord_2",
    orderNumber: "SM-1046",
    customerName: "דניאל לוי",
    total: 349.9,
    status: "processing",
    date: "לפני שעה",
    items: 1,
  },
  {
    id: "ord_3",
    orderNumber: "SM-1045",
    customerName: "נועה אברהם",
    total: 89.9,
    status: "shipped",
    date: "לפני 3 שעות",
    items: 3,
  },
  {
    id: "ord_4",
    orderNumber: "SM-1044",
    customerName: "אורי שמעון",
    total: 249.9,
    status: "delivered",
    date: "אתמול",
    items: 1,
  },
  {
    id: "ord_5",
    orderNumber: "SM-1043",
    customerName: "מיכל דוד",
    total: 159.9,
    status: "delivered",
    date: "אתמול",
    items: 4,
  },
  {
    id: "ord_6",
    orderNumber: "SM-1042",
    customerName: "רועי פרץ",
    total: 69.9,
    status: "cancelled",
    date: "לפני יומיים",
    items: 1,
  },
];

export default function RecentOrders() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between p-6 pb-4">
        <h3 className="text-lg font-bold text-charcoal">הזמנות אחרונות</h3>
        <button className="text-sm text-coral hover:text-coral-dark font-medium transition-colors">
          הצג הכל ←
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-b border-gray-100">
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                הזמנה
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                לקוח
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                סטטוס
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                פריטים
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                סה&quot;כ
              </th>
              <th className="text-right px-6 py-3 text-xs font-medium text-gray-400 uppercase">
                זמן
              </th>
            </tr>
          </thead>
          <tbody>
            {demoOrders.map((order) => {
              const status = statusConfig[order.status];
              return (
                <tr
                  key={order.id}
                  className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <span className="font-mono font-medium text-charcoal">
                      {order.orderNumber}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-charcoal">
                    {order.customerName}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.text}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                      {status.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500">{order.items}</td>
                  <td className="px-6 py-4 font-medium text-charcoal">
                    ₪{order.total.toFixed(0)}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-xs">
                    {order.date}
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
