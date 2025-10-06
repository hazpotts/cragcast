<template>
  <div class="space-y-6">
    <div class="mb-4 flex items-center justify-between">
      <div class="text-sm text-gray-500">
        <template v-if="prefs.where.value">
          Showing for {{ prefs.where.value.name }} · max {{ prefs.maxDriveMins.value }} mins · {{ labelWhen }}
        </template>
        <template v-else>
          No location chosen yet
        </template>
      </div>
      <UButton color="gray" variant="ghost" icon="i-heroicons-adjustments-horizontal" @click="showPrefs=true">Adjust</UButton>
    </div>

    <div v-if="!prefs.where.value" class="text-gray-500">Pick a location to see comparison.</div>
    <CompareTable v-else :rows="items" />

    <USlideover v-model="showPrefs">
      <div class="p-4">
        <PrefsForm ctaLabel="Apply" @confirm="applyPrefs" />
      </div>
    </USlideover>
  </div>
</template>
<script setup lang="ts">
import { usePrefs } from '~/composables/usePrefs'
import { useRank } from '~/composables/useRank'
import CompareTable from '~/components/CompareTable.vue'
import PrefsForm from '~/components/PrefsForm.vue'
const prefs = usePrefs()
const { items, fetchRank } = useRank()
const showPrefs = ref(false)
const labelWhen = computed(() => {
  const ds = (prefs.dates.value || []) as string[]
  if (!ds.length) return 'Dates'
  const d1 = new Date(ds[0])
  const dN = new Date(ds[ds.length - 1])
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  return ds.length === 1 ? fmt(d1) : `${fmt(d1)} – ${fmt(dN)}`
})

onMounted(async () => {
  if (prefs.where.value) await fetchRank()
})
async function applyPrefs() {
  showPrefs.value=false
  if (!prefs.where.value) return
  await fetchRank()
}
</script>
