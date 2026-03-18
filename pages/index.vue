<template>
  <div class="py-10 text-center text-gray-500">
    <span v-if="!stuck">Loading…</span>
    <div v-else class="space-y-2">
      <p>Taking longer than expected.</p>
      <NuxtLink :to="{ path: dest, query: $route.query }" replace class="text-sky-600 underline">Go to {{ dest }}</NuxtLink>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
const mode = useLocalStorage<'table'|'cards'>('mode', 'table')
const route = useRoute()
const dest = computed(() => `/${mode.value}`)
const stuck = ref(false)
onMounted(async () => {
  try {
    await navigateTo({ path: dest.value, query: { ...route.query } }, { replace: true })
  } catch {
    stuck.value = true
  }
  setTimeout(() => { stuck.value = true }, 3000)
})
</script>
