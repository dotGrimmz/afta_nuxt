// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL || "",
      supabaseAnonKey: process.env.SUPABASE_KEY || "",
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
  ],
  storybook: {
    url: "http://localhost:6006",
    storybookRoute: "/__storybook__",
    port: 6006,
  },
  css: ["@/assets/css/tailwind.css"],
  supabase: {
    redirect: false,
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,
  },
});
