<template>
  <div class="flex flex-wrap items-center gap-2">
    <UButtonGroup size="sm">
      <UButton v-for="p in presets" :key="p.key" :label="p.label" :color="p.key===modelValue? 'primary':'gray'" @click="$emit('update:modelValue', p.key)"/>
    </UButtonGroup>
  </div>
</template>
<script setup lang="ts">
export type WhenPreset = 'today'|'tomorrow'|'this-weekend'|'next-weekend'|'custom'
const props = defineProps<{ modelValue: WhenPreset }>()
const presets = [
  { key: 'today', label: 'Today' },
  { key: 'tomorrow', label: 'Tomorrow' },
  { key: 'this-weekend', label: 'This weekend' },
  { key: 'next-weekend', label: 'Next weekend' },
  { key: 'custom', label: 'Custom' }
]
</script>
