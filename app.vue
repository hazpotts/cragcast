<template>
  <div class="app">
    <header class="p-4">
      <a href="/" aria-label="CragCast home" class="flex items-center gap-2">
        <img :src="logoUrl64" alt="CragCast" class="h-8 w-auto" />
        <span class="text-sky-600 dark:text-sky-400 text-xl font-semibold">CragCast</span>
      </a>
      <ModeToggle />
    </header>
    <main class="p-4">
      <NuxtPage />
    </main>
    <AppFooter />
  </div>
</template>
<script setup lang="ts">
import logoUrl32 from '~/assets/images/logo_32.webp?url'
import logoUrl64 from '~/assets/images/logo_64.webp?url'
useHead({
  title: 'CragCast',
  link: [
    { rel: 'icon', type: 'image/png', href: logoUrl32 },
  ]
})
</script>

<style>
:root { color-scheme: light dark; }
body { margin: 0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, "Noto Color Emoji", sans-serif; }
.container { max-width: 1100px; margin: 0 auto; padding: 1rem; }
header { display: flex; align-items: center; justify-content: space-between; }
/* Sticky footer using flex column */
.app { min-height: 100vh; display: flex; flex-direction: column; }
.app main { flex: 1 1 auto; }
</style>
