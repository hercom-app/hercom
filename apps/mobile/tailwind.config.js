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
        },
        brand: {
          DEFAULT: "#007AFF",
          dark: "#0062CC",
        },
      },
      borderRadius: {
        card: "1.5rem",
      },
    },
  },
  plugins: [],
};
