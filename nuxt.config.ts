// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
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

  css: ["@/assets/css/main.css"],

  runtimeConfig: {
    // Private (server-only) runtime config goes here if needed
    public: {
      // Prefer standard SUPABASE_* envs in Vercel; these are what the module expects by default.
      // You can also keep NUXT_PUBLIC_* if you like, but set supabase.url/key below explicitly.
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_KEY,
    },
  },

  // Supabase module config
  supabase: {
    // ✅ Use SSR cookies (module will use @supabase/ssr internally)
    useSsrCookies: true,

    // If you prefer the NUXT_PUBLIC_* envs, uncomment the next two lines:
    // url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    // key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,

    // Or stick to the standard env names (recommended on Vercel):
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY,

    // Let the module guard routes and handle OAuth callback
    redirect: true,
    redirectOptions: {
      login: "/login",
      callback: "/confirm", // Must exist in your app & Supabase dashboard
      include: ["/dashboard/**"], // Guard only dashboard pages (tweak as needed)
      exclude: ["/play/bingo/**"], // Example: allow play pages without auth
      saveRedirectToCookie: true, // Remember last attempted route
    },

    // Cookie settings for SSR session
    cookiePrefix: "sb", // Keep simple; module prefixes with project id internally
    cookieOptions: {
      maxAge: 60 * 60 * 24 * 7, // 1 week (does NOT control Supabase session lifetime)
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },

    // Optional: be explicit about PKCE on the browser side
    clientOptions: {
      auth: {
        flowType: "pkce",
      },
    },

    // If you generate DB types, point the module to them:
    // types: "~/types/database.types.ts",
  },

  colorMode: {
    preference: "dark",
    fallback: "dark",
    classSuffix: "",
    storageKey: "color-mode",
  },

  storybook: { port: 6006 },

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
          href:
            "https://fonts.googleapis.com/css2?family=DM+Sans:wght@500;700&" +
            "family=Inter:wght@400;500;600&display=swap",
        },
      ],
    },
  },
});
