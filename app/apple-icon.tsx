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
          background: "linear-gradient(145deg, #FF6B47 0%, #E8503A 100%)",
          borderRadius: 40,
          fontFamily: "sans-serif",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 116,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -4,
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
