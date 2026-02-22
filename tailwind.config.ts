import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        coral: { DEFAULT: "#FF6B47", light: "#FF8A6A", dark: "#E5553A" },
        teal: { DEFAULT: "#1A7A6D", light: "#22998A", dark: "#135E54" },
        accent: { DEFAULT: "#FFD23F", light: "#FFE066", dark: "#E6BC39" },
        charcoal: { DEFAULT: "#2D2D3A", light: "#4A4A5A" },
        cream: { DEFAULT: "#FFF8F4", dark: "#FFF0E8" },
        mint: { DEFAULT: "#34D399" },
      },
      fontFamily: {
        heebo: ["Heebo", "sans-serif"],
        nunito: ["Nunito", "sans-serif"],
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
