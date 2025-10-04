<template>
  <div class="space-y-6">
    <section v-if="showPrefs || needsSetup" class="space-y-4">
      <PrefsForm ctaLabel="Get Recommendation" @confirm="savePrefs" />
    </section>

    <section v-else>
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-gray-500">Showing for {{ prefs.where.value.name }} · max {{ prefs.maxDriveMins.value }} mins · {{ labelWhen }}</div>
        <UButton color="gray" variant="ghost" icon="i-heroicons-adjustments-horizontal" @click="showPrefs = true">Adjust</UButton>
      </div>
      <div v-if="pending" class="text-gray-500">Loading…</div>
      <div v-else>
        <div v-if="items[0]" class="mb-6">
          <RegionCard :name="items[0].name" :score="items[0].score" :why="items[0].why" :mini="items[0].mini" :distanceMins="items[0].distanceMins" :updatedAt="items[0].updatedAt" :ukcUrl="items[0].ukcUrl" />
        </div>
        <div class="grid md:grid-cols-2 gap-4">
          <RegionCard v-for="r in items.slice(1,5)" :key="r.id" :name="r.name" :score="r.score" :why="r.why" :mini="r.mini" :distanceMins="r.distanceMins" :updatedAt="r.updatedAt" :ukcUrl="r.ukcUrl" />
        </div>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import { useRank } from '~/composables/useRank'
import PrefsForm from '~/components/PrefsForm.vue'
import RegionCard from '~/components/RegionCard.vue'
const prefs = usePrefs()
const { items, pending, fetchRank } = useRank()
const showPrefs = ref(false)
const hasValidLocation = computed(() => {
  const w = prefs.where.value as any
  if (!w) return false
  const lat = Number(w.lat)
  const lon = Number(w.lon)
  const name = typeof w.name === 'string' ? w.name.trim() : ''
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && name.length > 1
})
const needsSetup = computed(() => !hasValidLocation.value)
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
  if (hasValidLocation.value) await fetchRank()
})

async function savePrefs() {
  if (!prefs.where.value) return
  await fetchRank()
  showPrefs.value = false
}
</script>
