export default defineNuxtConfig({
  devtools: { enabled: false },
  ssr: false,

  css: [
    'bootstrap/dist/css/bootstrap.min.css',
    'bootstrap-icons/font/bootstrap-icons.css',
    '~/assets/css/main.css',
  ],

  modules: ['@pinia/nuxt'],

  app: {
    head: {
      title: 'Oh My Tongue - Sistem Kasir',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/logo.png' },
      ],
    },
    pageTransition: { name: 'fade', mode: 'out-in' },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.VITE_API_BASE_URL || 'http://localhost:9005',
    },
  },

  router: {
    options: {
      linkActiveClass: 'active',
    },
  },

  compatibilityDate: '2024-01-01',
});
