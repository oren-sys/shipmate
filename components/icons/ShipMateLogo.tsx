"use client";

interface LogoProps {
  variant?: "full" | "icon" | "hebrew";
  color?: "coral" | "white" | "teal";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: {
    icon: 26,
    nameSize: 15,
    storeSize: 11,
    hebrewSize: 9,
    gap: 6,
    radius: 6,
  },
  md: {
    icon: 34,
    nameSize: 20,
    storeSize: 13,
    hebrewSize: 10,
    gap: 8,
    radius: 8,
  },
  lg: {
    icon: 46,
    nameSize: 28,
    storeSize: 16,
    hebrewSize: 12,
    gap: 10,
    radius: 10,
  },
};

interface ColorScheme {
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  shipColor: string;
  mateColor: string;
  dotColor: string;
  storeColor: string;
  hebrewColor: string;
}

const colorMap: Record<string, ColorScheme> = {
  coral: {
    iconBg: "linear-gradient(145deg, #FF6B47 0%, #E8503A 100%)",
    iconBorder: "none",
    iconColor: "#FFFFFF",
    shipColor: "#2D2D3A",
    mateColor: "#FF6B47",
    dotColor: "#FF6B47",
    storeColor: "#1A7A6D",
    hebrewColor: "#8E9196",
  },
  white: {
    iconBg: "rgba(255,255,255,0.12)",
    iconBorder: "1.5px solid rgba(255,255,255,0.25)",
    iconColor: "#FFFFFF",
    shipColor: "#FFFFFF",
    mateColor: "#FFFFFF",
    dotColor: "#FF6B47",
    storeColor: "rgba(255,255,255,0.55)",
    hebrewColor: "rgba(255,255,255,0.4)",
  },
  teal: {
    iconBg: "linear-gradient(145deg, #1A7A6D 0%, #15695E 100%)",
    iconBorder: "none",
    iconColor: "#FFFFFF",
    shipColor: "#1A7A6D",
    mateColor: "#1A7A6D",
    dotColor: "#FF6B47",
    storeColor: "#FF6B47",
    hebrewColor: "#8E9196",
  },
};

/* ── Icon Mark: Bold "S" in a rounded gradient square ── */
function IconMark({
  size,
  bg,
  color,
  border,
  radius,
}: {
  size: number;
  bg: string;
  color: string;
  border: string;
  radius: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: bg,
        borderRadius: radius,
        border,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: bg.includes("gradient")
          ? "0 2px 8px rgba(255,107,71,0.25)"
          : "none",
      }}
    >
      <span
        style={{
          color,
          fontSize: size * 0.56,
          fontWeight: 900,
          fontFamily: "'Nunito', sans-serif",
          lineHeight: 1,
          letterSpacing: -0.5,
        }}
      >
        S
      </span>
    </div>
  );
}

/* ── ShipMate.store Logo ── */
export default function ShipMateLogo({
  variant = "full",
  color = "coral",
  size = "md",
  className = "",
}: LogoProps) {
  const s = sizeMap[size];
  const c = colorMap[color];

  /* Icon only */
  if (variant === "icon") {
    return (
      <div className={className}>
        <IconMark
          size={s.icon}
          bg={c.iconBg}
          color={c.iconColor}
          border={c.iconBorder}
          radius={s.radius}
        />
      </div>
    );
  }

  /* Hebrew only */
  if (variant === "hebrew") {
    return (
      <span
        className={`font-heebo font-bold ${className}`}
        style={{ color: c.hebrewColor, fontSize: s.icon * 0.42 }}
      >
        שיפמייט סטור
      </span>
    );
  }

  /* Full logo: icon + "ShipMate.store" + Hebrew subtitle */
  return (
    <div
      className={`flex items-center ${className}`}
      style={{ gap: s.gap }}
      dir="ltr"
      aria-label="ShipMate.store – שיפמייט סטור"
    >
      <IconMark
        size={s.icon}
        bg={c.iconBg}
        color={c.iconColor}
        border={c.iconBorder}
        radius={s.radius}
      />

      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
        {/* Wordmark */}
        <div
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize: s.nameSize,
            letterSpacing: "-0.02em",
            display: "flex",
            alignItems: "baseline",
          }}
        >
          <span style={{ color: c.shipColor }}>Ship</span>
          <span style={{ color: c.mateColor }}>Mate</span>
          <span
            style={{
              color: c.dotColor,
              fontSize: s.storeSize,
              fontWeight: 700,
              marginLeft: 1,
              marginRight: 1,
            }}
          >
            .
          </span>
          <span
            style={{
              color: c.storeColor,
              fontSize: s.storeSize,
              fontWeight: 700,
              letterSpacing: "0.04em",
              textTransform: "lowercase" as const,
            }}
          >
            store
          </span>
        </div>

        {/* Hebrew subtitle */}
        <span
          dir="rtl"
          style={{
            fontFamily: "'Heebo', sans-serif",
            fontWeight: 600,
            fontSize: s.hebrewSize,
            color: c.hebrewColor,
            marginTop: 2,
          }}
        >
          שיפמייט סטור
        </span>
      </div>
    </div>
  );
}
