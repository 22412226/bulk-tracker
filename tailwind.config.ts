import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0B0F19",
        card: {
          DEFAULT: "#151C2C",
          secondary: "#1E2638",
          hover: "#252F45",
        },
        border: {
          DEFAULT: "#2A344A",
          light: "#39455F",
        },
        macro: {
          calories: "#F59E0B", // amber
          protein: "#38BDF8",  // sky
          carbs: "#34D399",    // emerald
          fat: "#F472B6",      // pink
        },
        brand: {
          DEFAULT: "#6366F1",  // indigo
          hover: "#4F46E5",
          light: "#818CF8",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"SF Pro Display"',
          '"SF Pro Text"',
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      screens: {
        xs: "375px",
      },
    },
  },
  plugins: [],
};

export default config;
