import { defineNuxtConfig } from 'nuxt/config'
// Nuxt 3 config for Cloudflare Pages
export default defineNuxtConfig({
  nitro: {
    preset: 'cloudflare-pages'
  },
  modules: [
    '@nuxt/ui',
    '@nuxtjs/tailwindcss',
    '@vueuse/nuxt',
    'nuxt-icon'
  ],
  css: ['~/assets/css/tailwind.css'],
  typescript: {
    strict: true,
    typeCheck: false
  },
  components: [{
    path: '~/app/components',
    pathPrefix: false
  }],
  runtimeConfig: {
    public: {
      googlePlacesEnabled: process.env.NUXT_PUBLIC_GOOGLE_PLACES_ENABLED === '1',
      googlePlacesApiKey: process.env.NUXT_PUBLIC_GOOGLE_PLACES_API_KEY || ''
    }
  }
})
