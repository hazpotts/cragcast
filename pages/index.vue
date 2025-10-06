<template>
  <div class="py-10 text-center text-gray-500">Loading…</div>
  <!-- Redirecting to your last mode -->
</template>
<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
const mode = useLocalStorage<'recommend'|'compare'>('mode', 'recommend')
const route = useRoute()
const dest = computed(() => (mode.value === 'compare' ? '/compare' : '/recommend'))
onMounted(() => {
  navigateTo({ path: dest.value, query: { ...route.query } }, { replace: true })
})
</script>
