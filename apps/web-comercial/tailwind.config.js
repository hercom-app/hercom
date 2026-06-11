/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
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
    },
  },
  plugins: [],
};
