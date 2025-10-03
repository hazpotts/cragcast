<template>
  <UCard>
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">{{ name }}</h3>
        <div class="text-2xl font-bold">{{ score }}</div>
      </div>
      <div class="text-sm text-gray-500">Updated {{ new Date(updatedAt).toLocaleString() }}</div>
      <MiniChart :rain="mini.rainMm" :wind="mini.wind" :temp="mini.temp" />
      <ul class="list-disc pl-5 text-sm">
        <li v-for="(w,i) in why" :key="i">{{ w }}</li>
      </ul>
      <div class="flex items-center justify-between text-sm">
        <div>Distance: ~{{ distanceMins }} mins</div>
        <UButton color="gray" variant="link" :href="ukcUrl" target="_blank" rel="noopener">View on UKC</UButton>
      </div>
    </div>
  </UCard>
</template>
<script setup lang="ts">
import MiniChart from './MiniChart.vue'
const props = defineProps<{
  name: string
  score: number
  why: string[]
  mini: { rainMm: number[]; wind: number[]; temp: number[] }
  distanceMins: number
  updatedAt: string
  ukcUrl: string
}>()
</script>
