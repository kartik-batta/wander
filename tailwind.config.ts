import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F7F3EC",
        surface: "#FFFDF8",
        "surface-alt": "#EFE8DA",
        ink: "#1B1917",
        muted: "#6B655D",
        accent: "#A24513",
        "accent-hover": "#7A3410",
        border: "#E1D9C7",
        danger: "#A83A2A",
        success: "#4B7A3D",
      },
      fontFamily: {
        serif: ["var(--font-fraunces)", "Georgia", "serif"],
        sans:  ["var(--font-inter)", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(27,25,23,0.06), 0 8px 24px -12px rgba(27,25,23,0.12)",
      },
      maxWidth: {
        wander: "640px",
      },
    },
  },
  plugins: [],
};

export default config;
