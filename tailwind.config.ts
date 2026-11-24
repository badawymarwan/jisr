import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 50: "#eef2f8", 100: "#dbe3f0", 600: "#1e3a6b", 700: "#172e57", 800: "#122545", 900: "#0d1b33" },
        line: "#e3e9f4", // the light blue-grey of card borders
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
