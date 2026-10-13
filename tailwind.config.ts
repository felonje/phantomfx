import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#070b14",
          900: "#0d1320",
          800: "#131b2c",
          700: "#1c2639",
          600: "#2a3650",
        },
        brand: { 400: "#5b8cff", 500: "#3b6ef5" },
        up: "#16b979",
        down: "#ef4444",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
