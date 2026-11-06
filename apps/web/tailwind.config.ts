import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "Segoe UI", "sans-serif"],
      },
      colors: {
        paper: "#f4f7fb",
        card: "#ffffff",
        line: "#e6edf5",
        ink: "#10243e",
        pine: "#1d4ed8",
        copper: "#9f1239",
        sea: "#1d4ed8",
      },
      borderRadius: {
        DEFAULT: "0.625rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(16 36 62 / 0.05), 0 10px 28px rgb(16 36 62 / 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
