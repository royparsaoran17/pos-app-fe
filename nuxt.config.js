export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,

  css: [
    "bootstrap/dist/css/bootstrap.min.css",
    "bootstrap-icons/font/bootstrap-icons.css",
    "~/assets/css/main.css",
  ],

  modules: ["@pinia/nuxt"],

  app: {
    head: {
      title: "Oh My Tongue - Sistem Kasir",
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "screen-orientation", content: "any" },
      ],
      link: [
        { rel: "icon", type: "image/png", href: "/logo.png" },
        { rel: "manifest", href: "/manifest.json" },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossorigin: "",
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
        },
      ],
      script: [{ src: "/config.js" }],
    },
    pageTransition: { name: "fade", mode: "out-in" },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.VITE_API_BASE_URL || "https://omt-api.gct.my.id",
    },
  },

  router: {
    options: {
      linkActiveClass: "active",
    },
  },

  compatibilityDate: "2024-01-01",
});
