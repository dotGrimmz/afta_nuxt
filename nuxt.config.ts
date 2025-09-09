// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY
        ? "[SET]"
        : "[MISSING]", // mask actual key
    },
  },
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/supabase",
    "@nuxtjs/tailwindcss",
    "@nuxt/ui",
    "@nuxt/image",
    "@nuxtjs/storybook",
    "@nuxtjs/color-mode",
  ],
  storybook: {
    port: 6006,
  },
  css: ["@/assets/css/main.css"],
  supabase: {
    redirect: false,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },
  colorMode: {
    preference: "dark",
    fallback: "dark",
    classSuffix: "", // results in `dark` class (no suffix)
    storageKey: "color-mode", // can remove the switch entirely if you never render one
  },
  app: {
    head: {
      link: [
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&family=Inter:wght@400;500;600&display=swap",
        },
      ],
    },
  },
});
