<template>
  <div class="space-y-6 max-w-[600px] mx-auto">
    <section v-if="showPrefs" class="space-y-4">
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
        <div class="flex flex-col gap-4">
          <template v-if="showMore">
            <RegionCard v-for="r in items.slice(1)" :key="r.id" :name="r.name" :score="r.score" :why="r.why" :mini="r.mini" :distanceMins="r.distanceMins" :updatedAt="r.updatedAt" :ukcUrl="r.ukcUrl" />
          </template>
          <UButton v-else-if="items.length > 1" label="Show more" color="gray" variant="soft" @click="showMore=true" />
        </div>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import { useRank } from '~/composables/useRank'
import PrefsForm from '~/components/PrefsForm.vue'
import RegionCard from '~/components/RegionCard.vue'
const prefs = usePrefs()
const { items, pending, fetchRank } = useRank()
const showPrefs = ref(true)
const showMore = ref(false)
const hasValidLocation = computed(() => {
  const w = prefs.where.value as any
  if (!w) return false
  const lat = Number(w.lat)
  const lon = Number(w.lon)
  const name = typeof w.name === 'string' ? w.name.trim() : ''
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && name.length > 1
})
const labelWhen = computed(() => {
  const ds = (prefs.dates.value || []) as string[]
  if (!ds.length) return 'Dates'
  const d1 = new Date(ds[0])
  const dN = new Date(ds[ds.length - 1])
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  return ds.length === 1 ? fmt(d1) : `${fmt(d1)} – ${fmt(dN)}`
})

async function savePrefs() {
  if (!prefs.where.value) return
  await fetchRank()
  showPrefs.value = false
  showMore.value = false
}
</script>
