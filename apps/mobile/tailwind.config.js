/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        hercom: {
          DEFAULT: "#007AFF",
          dark: "#0062CC",
          soft: "#E8F2FF",
        },
        brand: {
          DEFAULT: "#007AFF",
          dark: "#0062CC",
          soft: "#E8F2FF",
        },
        canvas: "#F4F6F8",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F1F5F9",
        },
        success: {
          DEFAULT: "#15803D",
          soft: "#DCFCE7",
        },
        warning: {
          DEFAULT: "#B45309",
          soft: "#FEF3C7",
        },
      },
      fontFamily: {
        sans: ["Poppins_400Regular"],
        medium: ["Poppins_500Medium"],
        semibold: ["Poppins_600SemiBold"],
        bold: ["Poppins_700Bold"],
      },
      fontSize: {
        xs: ["0.875rem", { lineHeight: "1.35rem" }],
        sm: ["1.0625rem", { lineHeight: "1.55rem" }],
        base: ["1.125rem", { lineHeight: "1.7rem" }],
        lg: ["1.25rem", { lineHeight: "1.8rem" }],
        xl: ["1.375rem", { lineHeight: "1.95rem" }],
        "2xl": ["1.625rem", { lineHeight: "2.15rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.35rem" }],
      },
      borderRadius: {
        card: "1.5rem",
      },
    },
  },
  plugins: [],
};
