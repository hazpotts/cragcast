<template>
  <div class="app">
    <header class="container">
      <h1>CragCast</h1>
      <ModeToggle />
    </header>
    <main class="container">
      <NuxtPage />
    </main>
  </div>
</template>

<style>
:root { color-scheme: light dark; }
body { margin: 0; font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji, Segoe UI Symbol, "Noto Color Emoji", sans-serif; }
.container { max-width: 1100px; margin: 0 auto; padding: 1rem; }
header { display: flex; align-items: center; justify-content: space-between; }
</style>
