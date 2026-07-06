/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        /** Títulos — Plus Jakarta Sans (libre). Ver docs/TIPOGRAFIA.md */
        display: [
          "Plus Jakarta Sans",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        /** Cuerpo, labels, tablas — Inter */
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
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
          ink: "#0F172A",
          surface: "#F8FAFC",
          border: "#E2E8F0",
        },
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)",
        header: "0 1px 0 0 rgb(15 23 42 / 0.05)",
      },
    },
  },
  plugins: [],
};
