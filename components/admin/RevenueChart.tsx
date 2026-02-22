"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Demo data — last 30 days
const generateDemoData = () => {
  const data = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    // Simulate higher revenue on weekdays
    const baseRevenue = dayOfWeek === 5 || dayOfWeek === 6 ? 800 : 1500;
    const revenue = Math.round(
      baseRevenue + Math.random() * 1200 + (29 - i) * 30
    );
    const orders = Math.round(revenue / 120 + Math.random() * 3);

    data.push({
      date: `${date.getDate()}/${date.getMonth() + 1}`,
      revenue,
      orders,
    });
  }

  return data;
};

const data = generateDemoData();

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload) return null;

  return (
    <div className="bg-charcoal text-white rounded-lg px-4 py-3 shadow-lg text-sm" dir="rtl">
      <p className="text-gray-300 mb-1">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} className="font-medium">
          {entry.dataKey === "revenue"
            ? `₪${entry.value.toLocaleString()}`
            : `${entry.value} הזמנות`}
        </p>
      ))}
    </div>
  );
}

export default function RevenueChart() {
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = data.reduce((sum, d) => sum + d.orders, 0);

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-charcoal">הכנסות 30 יום</h3>
          <p className="text-sm text-gray-500 mt-1">
            סה&quot;כ: ₪{totalRevenue.toLocaleString()} | {totalOrders} הזמנות
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-coral" />
            הכנסות
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-teal" />
            הזמנות
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B47" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#FF6B47" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1A7A6D" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#1A7A6D" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#999" }}
              interval={4}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#999" }}
              tickFormatter={(v) => `₪${v}`}
              orientation="right"
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#FF6B47"
              strokeWidth={2}
              fill="url(#colorRevenue)"
            />
            <Area
              type="monotone"
              dataKey="orders"
              stroke="#1A7A6D"
              strokeWidth={2}
              fill="url(#colorOrders)"
              yAxisId={0}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
