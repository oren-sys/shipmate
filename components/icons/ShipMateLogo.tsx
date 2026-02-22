"use client";

interface LogoProps {
  variant?: "full" | "icon";
  color?: "coral" | "white" | "teal";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { icon: 32, full: 120 },
  md: { icon: 40, full: 160 },
  lg: { icon: 56, full: 220 },
};

/* ── Smiling Box Icon (SVG) ── */
function BoxIcon({ size, white = false }: { size: number; white?: boolean }) {
  const navy = white ? "#FFFFFF" : "#1B5777";
  const coral = white ? "rgba(255,255,255,0.7)" : "#E87C5B";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Box body */}
      <path
        d="M18 42 L50 28 L82 42 L82 72 L50 86 L18 72 Z"
        fill="white"
        stroke={navy}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      {/* Box top face */}
      <path
        d="M18 42 L50 28 L82 42 L50 56 Z"
        fill="white"
        stroke={navy}
        strokeWidth="4.5"
        strokeLinejoin="round"
      />
      {/* Box center line */}
      <line x1="50" y1="56" x2="50" y2="86" stroke={navy} strokeWidth="4" />
      {/* Top stripes */}
      <line x1="30" y1="36" x2="62" y2="36" stroke={navy} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="34" y1="41" x2="66" y2="41" stroke={coral} strokeWidth="3.5" strokeLinecap="round" />
      <line x1="30" y1="46" x2="62" y2="46" stroke={navy} strokeWidth="3.5" strokeLinecap="round" />
      {/* Tape/tag on right */}
      <rect x="72" y="38" width="6" height="14" rx="1" fill={coral} />
      <path d="M72 52 L75 55 L78 52" fill={coral} />
      {/* Face - eyes */}
      <path d="M30 62 Q33 58 36 62" stroke={navy} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <path d="M42 62 Q45 58 48 62" stroke={navy} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Face - smile */}
      <path d="M30 68 Q39 76 48 68" stroke={navy} strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Wave */}
      <path
        d="M12 82 Q30 74 50 82 Q70 90 88 82"
        stroke={coral}
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ── Full Logo: Box + "shipmate.store" text ── */
function FullLogo({ width, white = false }: { width: number; white?: boolean }) {
  const navy = white ? "#FFFFFF" : "#1B5777";
  const coral = white ? "rgba(255,255,255,0.7)" : "#E87C5B";

  const iconSize = width * 0.35;
  const fontSize = width * 0.12;
  const storeSize = fontSize * 0.7;

  return (
    <div
      className="flex items-center gap-1"
      style={{ width, gap: width * 0.04 }}
      dir="ltr"
      aria-label="ShipMate.store"
    >
      <BoxIcon size={iconSize} white={white} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
        <span
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 800,
            fontSize,
            color: navy,
            letterSpacing: "-0.02em",
          }}
        >
          shipmate
        </span>
        <span
          style={{
            fontFamily: "'Nunito', sans-serif",
            fontWeight: 700,
            fontSize: storeSize,
            color: coral,
            letterSpacing: "0.02em",
            marginTop: 1,
          }}
        >
          .store
        </span>
      </div>
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
  const isWhite = color === "white";

  if (variant === "icon") {
    return (
      <div className={className}>
        <BoxIcon size={s.icon} white={isWhite} />
      </div>
    );
  }

  return (
    <div className={className}>
      <FullLogo width={s.full} white={isWhite} />
    </div>
  );
}
