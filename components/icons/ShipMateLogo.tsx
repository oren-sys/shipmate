"use client";

interface LogoProps {
  variant?: "full" | "icon" | "hebrew";
  color?: "coral" | "white" | "teal";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { iconSize: 28, textSize: "text-lg", hebrewSize: "text-[10px]", gap: "gap-1.5" },
  md: { iconSize: 36, textSize: "text-2xl", hebrewSize: "text-xs", gap: "gap-2" },
  lg: { iconSize: 48, textSize: "text-3xl", hebrewSize: "text-sm", gap: "gap-2.5" },
};

const colorMap = {
  coral: { primary: "#FF6B47", secondary: "#1A7A6D", text: "text-coral", hebrewText: "text-teal" },
  white: { primary: "#FFFFFF", secondary: "#FFFFFF", text: "text-white", hebrewText: "text-white/70" },
  teal: { primary: "#1A7A6D", secondary: "#FF6B47", text: "text-teal", hebrewText: "text-coral" },
};

function ShipIcon({ size, primary, secondary }: { size: number; primary: string; secondary: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
    >
      {/* Water waves */}
      <path
        d="M4 38C8 35 12 35 16 38C20 41 24 41 28 38C32 35 36 35 40 38C44 41 44 41 44 38"
        stroke={secondary}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M6 42C10 39 14 39 18 42C22 45 26 45 30 42C34 39 38 39 42 42"
        stroke={secondary}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.3"
      />

      {/* Ship hull (= package box bottom) */}
      <path
        d="M8 28L12 35H36L40 28H8Z"
        fill={primary}
      />

      {/* Package box body on the ship */}
      <rect x="14" y="14" width="20" height="14" rx="2" fill={primary} />

      {/* Package tape / cross lines */}
      <path d="M14 21H34" stroke={secondary} strokeWidth="1.5" opacity="0.6" />
      <path d="M24 14V28" stroke={secondary} strokeWidth="1.5" opacity="0.6" />

      {/* Package flaps (open top) */}
      <path d="M14 14L18 8H24L22 14" fill={primary} opacity="0.9" />
      <path d="M34 14L30 8H24L26 14" fill={primary} opacity="0.85" />

      {/* Flap fold line */}
      <path d="M18 8L21 12" stroke={secondary} strokeWidth="1" opacity="0.5" />
      <path d="M30 8L27 12" stroke={secondary} strokeWidth="1" opacity="0.5" />

      {/* Mast / antenna from package */}
      <path d="M24 8V3" stroke={primary} strokeWidth="1.5" strokeLinecap="round" />

      {/* Flag */}
      <path d="M24 3L30 5.5L24 8" fill={secondary} opacity="0.7" />
    </svg>
  );
}

export default function ShipMateLogo({
  variant = "full",
  color = "coral",
  size = "md",
  className = "",
}: LogoProps) {
  const { iconSize, textSize, hebrewSize, gap } = sizeMap[size];
  const { primary, secondary, text, hebrewText } = colorMap[color];

  if (variant === "icon") {
    return (
      <div className={className}>
        <ShipIcon size={iconSize} primary={primary} secondary={secondary} />
      </div>
    );
  }

  if (variant === "hebrew") {
    return (
      <span
        className={`font-heebo font-bold ${hebrewText} ${className}`}
        style={{ fontSize: iconSize * 0.55 }}
      >
        שיפמייט
      </span>
    );
  }

  // Full logo: Ship+Box emblem + "ShipMate" text + Hebrew subtitle
  return (
    <div className={`flex items-center ${gap} ${className}`} aria-label="ShipMate - שיפמייט">
      <ShipIcon size={iconSize} primary={primary} secondary={secondary} />
      <div className="flex flex-col leading-none">
        <span className={`font-nunito font-extrabold ${textSize} ${text} tracking-tight`}>
          ShipMate
        </span>
        <span className={`font-heebo font-semibold ${hebrewSize} ${hebrewText} opacity-75 -mt-0.5`}>
          שיפמייט
        </span>
      </div>
    </div>
  );
}
