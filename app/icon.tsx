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
          background: "linear-gradient(145deg, #FF6B47 0%, #E8503A 100%)",
          borderRadius: 7,
          fontFamily: "sans-serif",
        }}
      >
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 21,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -1,
          }}
        >
          S
        </span>
      </div>
    ),
    { ...size }
  );
}
