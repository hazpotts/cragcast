<template>
  <div class="flex items-center gap-2">
    <UButtonGroup size="sm" :ui="{ rounded: 'rounded-full' }">
      <UButton
        label="Table"
        @click="set('table')"
        variant="soft"
        :class="mode === 'table'
          ? 'bg-sky-800 text-sky-50 hover:bg-sky-500 dark:bg-sky-500 dark:text-sky-50 dark:hover:bg-sky-400'
          : 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50'"
      />
      <UButton
        label="Cards"
        @click="set('cards')"
        variant="soft"
        :class="mode === 'cards'
          ? 'bg-sky-800 text-sky-50 hover:bg-sky-500 dark:bg-sky-500 dark:text-sky-50 dark:hover:bg-sky-400'
          : 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50'"
      />
    </UButtonGroup>
  </div>
</template>
<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
const router = useRouter()
const route = useRoute()
const modeStorage = useLocalStorage<'table' | 'cards'>('mode', 'table')
const mode = computed(() => modeStorage.value)
function set(m: 'table' | 'cards') {
  modeStorage.value = m
  router.push({ path: `/${m}`, query: { ...route.query } })
}
</script>
