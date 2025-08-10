// tailwind.config.ts
import type { Config } from "tailwindcss";
import ui from "@nuxt/ui/tailwind";

export default <Partial<Config>>{
  darkMode: "class",
  presets: [ui],
  content: [
    "./app.vue",
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}",
    "./error.vue",
    "./node_modules/@nuxt/ui/dist/**/*.{js,mjs,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#8B5CF6", // Violet 500
        secondary: "#F97316", // Orange 500
        accent: "#14B8A6", // Teal 500
      },
      fontFamily: {
        heading: ["DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "8px", // soft
        soft: "8px",
      },
      maxWidth: {
        content: "1200px",
      },
      // optional: consistent gutters
      spacing: {
        gutter: "1.5rem",
      },
    },
    // Optional: handy container setup (uses 1200px cap)
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        md: "1.5rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1200px", // cap at 1200
        "2xl": "1200px",
      },
    },
  },
  plugins: [],
};
