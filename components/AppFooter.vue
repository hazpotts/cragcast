<template>
  <footer class="mt-12 py-6 px-4 text-sm text-gray-500 dark:text-gray-600">
    <div class="container flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>© {{ year }} CragCast · Open source</div>
      <nav class="flex flex-wrap items-center gap-4">
        <NuxtLink to="/privacy" class="hover:underline">Privacy policy</NuxtLink>
        <a href="https://github.com/hazpotts/cragcast/issues" target="_blank" rel="noopener" class="hover:underline">Feedback</a>
        <a href="https://github.com/hazpotts/cragcast" target="_blank" rel="noopener" class="hover:underline">Contribute</a>
      </nav>
    </div>
  </footer>
</template>
<script setup lang="ts">
const year = new Date().getFullYear()
</script>
