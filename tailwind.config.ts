import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { 50: "#eef2f8", 100: "#dbe3f0", 600: "#1e3a6b", 700: "#172e57", 800: "#122545", 900: "#0d1b33" },
        // duolingo-style chunky yellow for main buttons and progress, with its darker "shadow" edge
        sun: { 50: "#fff8e1", 400: "#ffb800", 600: "#d99a00" },
        line: "#e5e5e5", // the light grey of card borders
        amber: { 100: "#fdf0d5", 200: "#fbe2ad", 400: "#f5b843", 600: "#b9790f", 800: "#7a4d06" },
      },
      fontFamily: {
        sans: ["Nunito", "system-ui", "sans-serif"],
        arabic: ["var(--font-arabic)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
