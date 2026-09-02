/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Geist Sans",
          "Geist",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        display: [
          "Geist Sans",
          "Geist",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        xs: ["0.75rem", { lineHeight: "1.125rem" }],
        sm: ["0.875rem", { lineHeight: "1.25rem" }],
        base: ["0.9375rem", { lineHeight: "1.5rem" }],
        lg: ["1.0625rem", { lineHeight: "1.625rem" }],
        xl: ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      colors: {
        hercom: {
          DEFAULT: "#007AFF",
          dark: "#0062CC",
          muted: "#E8F2FF",
        },
        brand: {
          DEFAULT: "#007AFF",
          dark: "#0062CC",
        },
        admin: {
          ink: "#18181b",
          canvas: "#f4f4f5",
          border: "#e4e4e7",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(24 24 27 / 0.04), 0 1px 3px 0 rgb(24 24 27 / 0.08)",
        panel:
          "0 0 0 1px rgb(24 24 27 / 0.04), 0 8px 24px -12px rgb(24 24 27 / 0.18)",
      },
    },
  },
  plugins: [],
};
