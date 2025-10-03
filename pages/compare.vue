<template>
  <div class="space-y-6">
    <div class="mb-4 flex items-center justify-between">
      <div class="text-sm text-gray-500">Showing for {{ prefs.where.value.name }} · max {{ prefs.maxDriveMins.value }} mins · {{ labelWhen }}</div>
      <UButton color="gray" variant="ghost" icon="i-heroicons-adjustments-horizontal" @click="showPrefs=true">Adjust</UButton>
    </div>

    <CompareTable :rows="items" />

    <USlideover v-model="showPrefs">
      <div class="p-4 space-y-4">
        <h2 class="text-xl font-semibold">Where?</h2>
        <PlaceSearch @picked="onPicked" />
        <h2 class="text-xl font-semibold">Max distance</h2>
        <URange v-model="prefs.maxDriveMins.value" :min="30" :max="240" :step="10" />
        <h2 class="text-xl font-semibold">When?</h2>
        <WhenPicker v-model="prefs.when.value" />
        <h2 class="text-xl font-semibold">Climbing type (optional)</h2>
        <URadioGroup v-model="prefs.type.value" :options="types" />
        <div>
          <UButton label="Apply" @click="applyPrefs" />
        </div>
      </div>
    </USlideover>
  </div>
</template>
<script setup lang="ts">
import { usePrefs } from '~/composables/usePrefs'
import { useRank } from '~/composables/useRank'
import CompareTable from '~/app/components/CompareTable.vue'
import PlaceSearch from '~/app/components/PlaceSearch.vue'
import WhenPicker from '~/app/components/WhenPicker.vue'
const prefs = usePrefs()
const { items, fetchRank } = useRank()
const showPrefs = ref(false)
const types = [
  { value: 'any', label: 'Any' },
  { value: 'trad', label: 'Trad' },
  { value: 'sport', label: 'Sport' },
  { value: 'boulder', label: 'Boulder' },
]
const labelWhen = computed(() => {
  const m: any = { 'today': 'Today', 'tomorrow': 'Tomorrow', 'this-weekend': 'This weekend', 'next-weekend': 'Next weekend', 'custom': 'Custom' }
  return m[prefs.when.value]
})

onMounted(async () => {
  await fetchRank()
})
function onPicked(p:{ lat:number; lon:number; name:string }) { prefs.where.value = p }
async function applyPrefs() { showPrefs.value=false; await fetchRank() }
</script>
