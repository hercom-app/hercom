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
        // Paleta táctica ANA navy (tokens de referencia; el tema vivo va en JS).
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
