import { defineNuxtConfig } from 'nuxt/config'
// Nuxt 3 config for Cloudflare Pages
export default defineNuxtConfig({
  compatibilityDate: '2025-10-04',
  nitro: {
    preset: 'cloudflare'
  },
  modules: [
    '@nuxt/ui',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt'
  ],
  css: ['~/assets/css/tailwind.css'],
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {}
    }
  },
  typescript: {
    strict: true,
    typeCheck: false
  },
  runtimeConfig: {
    public: {
      googlePlacesEnabled: process.env.NUXT_PUBLIC_GOOGLE_PLACES_ENABLED === '1',
      googlePlacesApiKey: process.env.NUXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''
    }
  }
})
