import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // "White" look: pure white page, ink-black accents, hairline borders.
        // `cream` keeps its name so existing classes (bg-cream, text-cream)
        // keep working — it's simply white now.
        cream: {
          DEFAULT: "#FFFFFF",
          soft: "#FFFFFF",
        },
        charcoal: {
          DEFAULT: "#111827",
          muted: "#5B6472",
        },
        line: "#E5E7EB",
        surface: {
          DEFAULT: "#FFFFFF",
          muted: "#F3F4F6",
        },
        // Pill text (dark enough to pass contrast) + soft pill backgrounds.
        // The brighter bar colors live in StatusPill.tsx (statusAccentColor).
        status: {
          open: "#1F6B58",
          "open-bg": "#E3F4EE",
          filling: "#7A5200",
          "filling-bg": "#FBF0D4",
          nearly: "#8A3D0E",
          "nearly-bg": "#FDE6D6",
          full: "#8A1F1A",
          "full-bg": "#FBE0DE",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        body: ["var(--font-body)", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        xl2: "1rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(17, 24, 39, 0.05)",
        card: "0 1px 2px rgba(17, 24, 39, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
