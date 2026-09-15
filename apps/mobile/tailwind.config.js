/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        hercom: {
          DEFAULT: "#0B70FE",
          dark: "#0959CC",
          soft: "#E8F2FF",
        },
        brand: {
          DEFAULT: "#0B70FE",
          dark: "#0959CC",
          soft: "#E8F2FF",
        },
        canvas: "#F4F6F8",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F1F5F9",
        },
        tactical: {
          base: "#EDECEA",
          elevated: "#F7F6F4",
          surface: "#FFFFFF",
          sunken: "#D9D7D3",
          accent: "#1A4F8C",
          "accent-dim": "#1B2C4A",
          steel: "#3D4E5C",
          text: "#1B2C4A",
          success: "#157A3C",
          warning: "#B45309",
          danger: "#C81E1E",
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
        sans: ["WorkSans_400Regular"],
        medium: ["WorkSans_500Medium"],
        semibold: ["WorkSans_600SemiBold"],
        bold: ["WorkSans_700Bold"],
        display: ["Arvo_700Bold"],
        arvo: ["Arvo_400Regular"],
        "arvo-bold": ["Arvo_700Bold"],
        mono: ["WorkSans_600SemiBold"],
        "mono-medium": ["WorkSans_600SemiBold"],
        "mono-bold": ["WorkSans_700Bold"],
      },
      fontSize: {
        xs: ["0.9375rem", { lineHeight: "1.35rem" }],
        sm: ["1rem", { lineHeight: "1.5rem" }],
        base: ["1.0625rem", { lineHeight: "1.625rem" }],
        lg: ["1.125rem", { lineHeight: "1.75rem" }],
        xl: ["1.375rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
      },
      borderRadius: {
        card: "12px",
        hud: "8px",
        panel: "12px",
      },
    },
  },
  plugins: [],
};
