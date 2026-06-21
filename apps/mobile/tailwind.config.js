/** @type {import('tailwindcss').Config} */
// Paleta reflectă @tradegx/ui-tokens (sursa runtime pentru cod). Aici e config build-time.
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: "#09090b",
        surface: "#18181c",
        border: "#27272a",
        muted: "#71717a",
        primary: "#6366f1",
        "primary-alt": "#8b5cf6",
        bull: "#10b981",
        bear: "#f43f5e",
        warn: "#f59e0b",
        info: "#38bdf8",
      },
    },
  },
  plugins: [],
};
