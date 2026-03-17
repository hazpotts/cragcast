<template>
  <div class="mb-4 flex justify-end">
    <div v-if="!modelValue" class="flex-1 text-sm text-gray-500">
      <template v-if="whereName">
        Showing {{ labelWhen }} · {{ whereName }} · {{ distanceLabel }}
      </template>
      <template v-else-if="hasPrefs">
        Showing {{ labelWhen }} · UK-wide
      </template>
      <div v-if="updatedAt && !modelValue" class="text-xs text-gray-400 mt-0.5">
        Data updated {{ new Date(updatedAt).toLocaleString() }}
      </div>
    </div>
    <div class="flex items-center gap-2">
      <UButton
        v-if="hasPrefs"
        variant="ghost"
        :aria-pressed="modelValue"
        @click="$emit('update:modelValue', !modelValue)"
        class="text-sky-700 hover:text-sky-800 dark:text-sky-200 dark:hover:text-sky-100"
      >
        <Icon name="heroicons-solid:adjustments-horizontal" class="mr-1 h-5 w-5" />
        <span>{{ modelValue ? 'Close' : 'Adjust' }}</span>
      </UButton>
      <slot name="right" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
const props = defineProps<{
  modelValue: boolean
  whereName?: string | null
  distanceLabel?: string
  labelWhen: string
  updatedAt?: string | null
}>()
const emit = defineEmits<{ (e:'update:modelValue', v:boolean): void }>()
const hasPrefs = computed(() => {
  const prefs = usePrefs()
  return prefs.where.value || prefs.dates.value || prefs.maxDriveMins.value
})
</script>
