<template>
  <div class="flex items-center gap-2">
    <UButtonGroup size="sm" :ui="{ rounded: 'rounded-full' }">
      <UButton
        label="Best"
        @click="set('recommend')"
        variant="soft"
        :class="mode === 'recommend'
          ? 'bg-sky-600 text-sky-50 hover:bg-sky-500 dark:bg-sky-500 dark:text-sky-50 dark:hover:bg-sky-400'
          : 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50'"
      />
      <UButton
        label="Compare"
        @click="set('compare')"
        variant="soft"
        :class="mode === 'compare'
          ? 'bg-sky-600 text-sky-50 hover:bg-sky-500 dark:bg-sky-500 dark:text-sky-50 dark:hover:bg-sky-400'
          : 'bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50'"
      />
    </UButtonGroup>
  </div>
</template>
<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
const router = useRouter()
const route = useRoute()
const modeStorage = useLocalStorage<'recommend' | 'compare'>('mode', 'recommend')
const mode = computed(() => modeStorage.value)
function set(m: 'recommend' | 'compare') {
  modeStorage.value = m
  router.push({ path: m === 'recommend' ? '/recommend' : '/compare', query: { ...route.query } })
}
</script>
