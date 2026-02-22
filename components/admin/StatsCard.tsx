"use client";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: string;
  color: "coral" | "teal" | "accent" | "mint";
}

const colorMap = {
  coral: {
    bg: "bg-coral/10",
    text: "text-coral",
    icon: "bg-coral",
  },
  teal: {
    bg: "bg-teal/10",
    text: "text-teal",
    icon: "bg-teal",
  },
  accent: {
    bg: "bg-accent/10",
    text: "text-amber-600",
    icon: "bg-accent",
  },
  mint: {
    bg: "bg-mint/10",
    text: "text-emerald-600",
    icon: "bg-mint",
  },
};

export default function StatsCard({
  title,
  value,
  change,
  changeType = "neutral",
  icon,
  color,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-charcoal font-heebo">
            {value}
          </p>
        </div>
        <div
          className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center shadow-sm`}
        >
          <span className="text-xl">{icon}</span>
        </div>
      </div>

      {change && (
        <div className="flex items-center gap-1.5">
          {changeType === "up" && (
            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          {changeType === "down" && (
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <span
            className={`text-sm font-medium ${
              changeType === "up"
                ? "text-emerald-600"
                : changeType === "down"
                  ? "text-red-600"
                  : "text-gray-500"
            }`}
          >
            {change}
          </span>
          <span className="text-xs text-gray-400">מאתמול</span>
        </div>
      )}
    </div>
  );
}
