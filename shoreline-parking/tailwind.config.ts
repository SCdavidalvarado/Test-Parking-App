import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          DEFAULT: "#F7F3EC",
          soft: "#FBF9F5",
        },
        charcoal: {
          DEFAULT: "#23241F",
          muted: "#6B6A63",
        },
        line: "#E4DDCF",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F1ECE3",
        },
        status: {
          open: "#5F7A5A",
          "open-bg": "#E7ECDF",
          filling: "#B08A4E",
          "filling-bg": "#F3E9D4",
          nearly: "#B5643A",
          "nearly-bg": "#F5E1D3",
          full: "#6E3B34",
          "full-bg": "#EAD9D6",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "Georgia", "serif"],
        body: ["var(--font-body)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        soft: "0 2px 10px rgba(35, 36, 31, 0.05), 0 1px 2px rgba(35, 36, 31, 0.04)",
        card: "0 4px 24px rgba(35, 36, 31, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
