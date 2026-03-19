<template>
  <div class="relative inline-flex cursor-pointer select-none" ref="container" @click.stop="toggleLabel">
    <UTooltip :text="text">
      <slot />
    </UTooltip>
    <Transition
      enter-active-class="transition-opacity duration-150"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150"
      leave-to-class="opacity-0"
    >
      <div
        v-if="showLabel"
        class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs font-medium rounded bg-gray-900 text-white whitespace-nowrap z-50 pointer-events-none dark:bg-gray-700"
      >
        {{ text }}
        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { onClickOutside } from '@vueuse/core'

defineProps<{ text: string }>()

const showLabel = ref(false)
const container = ref<HTMLElement | null>(null)
let closeTimer: ReturnType<typeof setTimeout> | null = null

function toggleLabel() {
  if (showLabel.value) {
    showLabel.value = false
    if (closeTimer) clearTimeout(closeTimer)
  } else {
    showLabel.value = true
    closeTimer = setTimeout(() => { showLabel.value = false }, 2500)
  }
}

onClickOutside(container, () => {
  showLabel.value = false
  if (closeTimer) clearTimeout(closeTimer)
})

onUnmounted(() => {
  if (closeTimer) clearTimeout(closeTimer)
})
</script>
