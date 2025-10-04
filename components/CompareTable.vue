<template>
  <div>
    <UTable :rows="rows" :columns="columns" :sort="sort" @update:sort="s=>sort=s">
      <template #score-data="{ row }">
        <span class="font-semibold">{{ row.score }}</span>
      </template>
      <template #rain-data="{ row }">
        <MiniChart :rain="row.mini.rainMm" :wind="[]" :temp="[]" />
      </template>
      <template #wind-data="{ row }">
        <MiniChart :rain="[]" :wind="row.mini.wind" :temp="[]" />
      </template>
      <template #temp-data="{ row }">
        <MiniChart :rain="[]" :wind="[]" :temp="row.mini.temp" />
      </template>
      <template #ukc-data="{ row }">
        <UButton color="gray" variant="link" :href="row.ukcUrl" target="_blank" rel="noopener">UKC</UButton>
      </template>
    </UTable>
  </div>
</template>
<script setup lang="ts">
import MiniChart from './MiniChart.vue'
const props = defineProps<{ rows: any[] }>()
const columns = [
  { key: 'name', label: 'Region' },
  { key: 'score', label: 'Score', sortable: true },
  { key: 'rain', label: 'Rain' },
  { key: 'wind', label: 'Wind' },
  { key: 'temp', label: 'Temp' },
  { key: 'distanceMins', label: 'Distance', sortable: true },
  { key: 'updatedAt', label: 'Updated' },
  { key: 'ukc', label: 'UKC' }
]
let sort = reactive({ column: 'score', direction: 'desc' as const })
</script>
