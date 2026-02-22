"use client";

interface LogoProps {
  variant?: "full" | "icon" | "hebrew";
  color?: "coral" | "white" | "teal";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: { width: 120, height: 32, iconSize: 28 },
  md: { width: 160, height: 40, iconSize: 36 },
  lg: { width: 220, height: 56, iconSize: 48 },
};

const colorMap = {
  coral: { primary: "#FF6B47", secondary: "#1A7A6D" },
  white: { primary: "#FFFFFF", secondary: "#FFFFFF" },
  teal: { primary: "#1A7A6D", secondary: "#FF6B47" },
};

export default function ShipMateLogo({
  variant = "full",
  color = "coral",
  size = "md",
  className = "",
}: LogoProps) {
  const { width, height, iconSize } = sizeMap[size];
  const { primary, secondary } = colorMap[color];

  if (variant === "icon") {
    return (
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        className={className}
        aria-label="ShipMate"
      >
        {/* Package box icon */}
        <rect x="8" y="16" width="32" height="24" rx="4" fill={primary} />
        <path d="M8 22H40" stroke={secondary} strokeWidth="2" />
        <path d="M24 16V40" stroke={secondary} strokeWidth="2" />
        {/* Package flap top */}
        <path d="M12 16L20 8H28L36 16" fill={primary} opacity="0.85" />
        <path d="M20 8L24 12L28 8" stroke={secondary} strokeWidth="1.5" fill="none" />
        {/* Tape/ribbon */}
        <rect x="21" y="22" width="6" height="10" rx="1" fill={secondary} opacity="0.3" />
      </svg>
    );
  }

  if (variant === "hebrew") {
    return (
      <span
        className={`font-heebo font-bold ${className}`}
        style={{ color: primary, fontSize: iconSize * 0.7 }}
      >
        שיפמייט
      </span>
    );
  }

  // Full logo: "ShipMate" text with package icon replacing the "i" dot
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 220 56"
      fill="none"
      className={className}
      aria-label="ShipMate - שיפמייט"
    >
      {/* S */}
      <text x="0" y="38" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="36" fill={primary}>
        Sh
      </text>
      {/* i — the dot is a package */}
      <text x="50" y="38" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="36" fill={primary}>
        i
      </text>
      {/* Package icon replacing i-dot */}
      <rect x="53" y="4" width="12" height="9" rx="2" fill={secondary} />
      <path d="M53 7.5H65" stroke={primary} strokeWidth="0.8" />
      <path d="M59 4V13" stroke={primary} strokeWidth="0.8" />
      <path d="M55 4L58 1H62L65 4" fill={secondary} opacity="0.8" />
      {/* pMate */}
      <text x="62" y="38" fontFamily="Nunito, sans-serif" fontWeight="800" fontSize="36" fill={primary}>
        pMate
      </text>
    </svg>
  );
}
