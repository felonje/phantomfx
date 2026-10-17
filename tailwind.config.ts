import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#060a12",
          900: "#0b111d",
          850: "#0f1624",
          800: "#131b2c",
          700: "#1b2538",
          600: "#273349",
          500: "#3a4862",
        },
        brand: { 300: "#8fb0ff", 400: "#5b8cff", 500: "#3b6ef5", 600: "#2c58d6" },
        up: "#16b979",
        down: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(91,140,255,0.15), 0 8px 40px -8px rgba(59,110,245,0.45)",
        panel: "0 1px 0 0 rgba(255,255,255,0.03) inset, 0 10px 30px -12px rgba(0,0,0,0.6)",
      },
      keyframes: {
        "fade-up": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        flash: { "0%": { opacity: "1" }, "100%": { opacity: "0" } },
      },
      animation: {
        "fade-up": "fade-up 0.25s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
