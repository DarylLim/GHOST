/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ghost: {
          accent: "#00ffaa",
          bg: "#000000",
          surface: "#0a0a0a",
          "surface-2": "#111111",
          "surface-3": "#1a1a1a",
          border: "#222222",
          "border-2": "#333333",
          text: "#ffffff",
          "text-secondary": "#888888",
          critical: "#ff3333",
          warning: "#ffaa00",
          safe: "#33ff66",
        },
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
      },
    },
  },
  plugins: [],
};
