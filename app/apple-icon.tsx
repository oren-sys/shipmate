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
          background: "white",
          borderRadius: 36,
        }}
      >
        {/* Smiling box apple icon */}
        <svg width="150" height="150" viewBox="0 0 100 100" fill="none">
          <path d="M18 40 L50 26 L82 40 L82 72 L50 86 L18 72 Z" fill="white" stroke="#1B5777" strokeWidth="4.5" strokeLinejoin="round" />
          <path d="M18 40 L50 26 L82 40 L50 54 Z" fill="white" stroke="#1B5777" strokeWidth="4.5" strokeLinejoin="round" />
          <line x1="50" y1="54" x2="50" y2="86" stroke="#1B5777" strokeWidth="4" />
          <line x1="30" y1="35" x2="62" y2="35" stroke="#1B5777" strokeWidth="3" />
          <line x1="34" y1="40" x2="66" y2="40" stroke="#E87C5B" strokeWidth="3" />
          <line x1="30" y1="45" x2="62" y2="45" stroke="#1B5777" strokeWidth="3" />
          <rect x="73" y="36" width="6" height="14" rx="1" fill="#E87C5B" />
          <path d="M75 50 L76 53 L78 50" fill="#E87C5B" />
          <path d="M29 62 Q33 57 37 62" stroke="#1B5777" strokeWidth="2.5" fill="none" />
          <path d="M42 62 Q46 57 50 62" stroke="#1B5777" strokeWidth="2.5" fill="none" />
          <path d="M29 68 Q39 77 50 68" stroke="#1B5777" strokeWidth="2.5" fill="none" />
          <path d="M10 84 Q30 75 50 84 Q70 93 90 84" stroke="#E87C5B" strokeWidth="3.5" fill="none" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
