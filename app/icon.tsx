import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
        }}
      >
        {/* Smiling box favicon */}
        <svg width="30" height="30" viewBox="0 0 100 100" fill="none">
          <path d="M18 40 L50 26 L82 40 L82 72 L50 86 L18 72 Z" fill="white" stroke="#1B5777" strokeWidth="5.5" strokeLinejoin="round" />
          <path d="M18 40 L50 26 L82 40 L50 54 Z" fill="white" stroke="#1B5777" strokeWidth="5.5" strokeLinejoin="round" />
          <line x1="50" y1="54" x2="50" y2="86" stroke="#1B5777" strokeWidth="5" />
          <line x1="34" y1="39" x2="66" y2="39" stroke="#E87C5B" strokeWidth="4.5" />
          <rect x="72" y="36" width="7" height="14" rx="1" fill="#E87C5B" />
          <path d="M29 61 Q33 56 37 61" stroke="#1B5777" strokeWidth="3.5" fill="none" />
          <path d="M42 61 Q46 56 50 61" stroke="#1B5777" strokeWidth="3.5" fill="none" />
          <path d="M29 68 Q39 77 50 68" stroke="#1B5777" strokeWidth="3.5" fill="none" />
          <path d="M10 84 Q30 75 50 84 Q70 93 90 84" stroke="#E87C5B" strokeWidth="4" fill="none" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
