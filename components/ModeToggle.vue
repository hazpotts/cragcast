<template>
  <div class="flex items-center gap-2">
    <UButtonGroup size="sm" :ui="{ rounded: 'rounded-full' }">
      <UButton :color="mode === 'recommend' ? 'primary' : 'gray'" label="Recommend" @click="set('recommend')"/>
      <UButton :color="mode === 'compare' ? 'primary' : 'gray'" label="Compare" @click="set('compare')"/>
    </UButtonGroup>
  </div>
</template>
<script setup lang="ts">
import { useLocalStorage } from '@vueuse/core'
const router = useRouter()
const modeStorage = useLocalStorage<'recommend' | 'compare'>('mode', 'recommend')
const mode = computed(() => modeStorage.value)
function set(m: 'recommend' | 'compare') {
  modeStorage.value = m
  router.push({ path: m === 'recommend' ? '/recommend' : '/compare' })
}
</script>
