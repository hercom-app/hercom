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
        // Paleta táctica Black Ops / SilentArc (modo oscuro / HUD).
        tactical: {
          base: "#07090B",
          elevated: "#0C1014",
          surface: "#12181C",
          sunken: "#080B0E",
          accent: "#3EE0C6",
          "accent-dim": "#1FA896",
          steel: "#7A8B94",
          text: "#DCE6E2",
          success: "#3DDC84",
          warning: "#FFB020",
          danger: "#FF4D4D",
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
        sans: ["Rajdhani_400Regular"],
        medium: ["Rajdhani_500Medium"],
        semibold: ["Rajdhani_600SemiBold"],
        bold: ["Rajdhani_700Bold"],
        display: ["BlackOpsOne_400Regular"],
        mono: ["ShareTechMono_400Regular"],
        "mono-medium": ["ShareTechMono_400Regular"],
        "mono-bold": ["ShareTechMono_400Regular"],
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
        // Esquinas casi angulares del rediseño táctico.
        hud: "1px",
        panel: "2px",
      },
    },
  },
  plugins: [],
};
