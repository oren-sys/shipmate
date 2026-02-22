import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FF6B47 0%, #E5553A 100%)",
          borderRadius: 36,
        }}
      >
        <svg width="120" height="120" viewBox="0 0 48 48" fill="none">
          {/* Ship hull = package box bottom */}
          <path d="M8 28L12 35H36L40 28H8Z" fill="white" />
          {/* Package box body */}
          <rect x="14" y="14" width="20" height="14" rx="2" fill="white" />
          {/* Tape cross */}
          <path d="M14 21H34" stroke="#FF6B47" strokeWidth="1.5" opacity="0.6" />
          <path d="M24 14V28" stroke="#FF6B47" strokeWidth="1.5" opacity="0.6" />
          {/* Flaps */}
          <path d="M14 14L18 8H24L22 14" fill="white" opacity="0.9" />
          <path d="M34 14L30 8H24L26 14" fill="white" opacity="0.85" />
          {/* Mast */}
          <path d="M24 8V3" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          {/* Flag */}
          <path d="M24 3L30 5.5L24 8" fill="#1A7A6D" opacity="0.9" />
          {/* Waves */}
          <path
            d="M4 38C8 35 12 35 16 38C20 41 24 41 28 38C32 35 36 35 40 38"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
