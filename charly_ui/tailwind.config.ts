// tailwind.config.ts

import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'SF Pro Display'", "ui-sans-serif", "system-ui"],
        mono: ["'SF Mono'", "ui-monospace", "SFMono-Regular"],
      },
      fontSize: {
        "title-medium": ["1.75rem", { lineHeight: "2.25rem", fontWeight: "600" }], // 28px
        "body": ["1rem", { lineHeight: "1.5rem", fontWeight: "400" }],             // 16px
        "label-medium": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "500" }], // 14px
        "caption": ["0.75rem", { lineHeight: "1rem", fontWeight: "400" }],          // 12px
      },
      borderRadius: {
        "apple-xl": "2rem",
      },
      colors: {
        primary: {
          50: "#eef5ff",
          100: "#d6e3ff",
          300: "#6ca9ff",
          500: "#007aff", // Apple Blue
          600: "#0065d1",
        },
      },
      boxShadow: {
        apple: "0px 2px 10px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
  ],
}

export default config
