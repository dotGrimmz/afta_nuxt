// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-15",
  devtools: { enabled: true },
  modules: [
    "@nuxtjs/supabase",
    "@nuxtjs/tailwindcss",
    "@nuxt/ui",
    "@vueuse/motion/nuxt",
  ],
  css: ["@/assets/css/tailwind.css"],
  supabase: {
    redirect: false,
  },
});
