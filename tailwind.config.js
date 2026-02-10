
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#FEFFD2",
          100: "#FFEEA9",
          300: "#FFBF78",
          500: "#FF7D29",

          /* Semantic aliases */
          bg: "#FEFFD2",
          surface: "#FFEEA9",
          accent: "#FFBF78",
          primary: "#FF7D29",

          /* Text */
          dark: "#2B2B2B",
          muted: "#6B7280",
        },
      },

      backgroundImage: {
        "brand-gradient":
          "linear-gradient(180deg, #FEFFD2 0%, #FFEEA9 50%, #FFBF78 100%)",
      },

      animation: {
        marquee: "marquee 30s linear infinite",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
