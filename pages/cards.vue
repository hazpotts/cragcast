<template>
  <div class="space-y-6 max-w-[600px] mx-auto">
    <ResultsHeader
      v-model="showPrefs"
      :whereName="(prefs.where.value as any)?.name || null"
      :distanceLabel="distanceLabel"
      :labelWhen="labelWhen"
      :updatedAt="latestUpdatedAt"
    />

    <section v-if="showPrefs" class="space-y-4">
      <PrefsForm @confirm="savePrefs" @cancel="showPrefs=false" />
    </section>
    <section v-else>
      <div v-if="pending" class="space-y-4">
        <SkeletonCard />
      </div>
      <div v-else>
        <div v-if="items[0]" class="mb-6">
          <RegionCard
            :regionId="items[0].id"
            :name="items[0].name"
            :score="items[0].score"
            :why="items[0].why"
            :warnings="items[0].warnings"
            :daily="items[0].daily"
            :distanceMins="Number(items[0].distanceMins ?? 0)"
            :ukcUrl="items[0].ukcUrl"
            :links="items[0].links"
            :avgTempC="items[0].avgTempC"
            :avgRainMm="items[0].avgRainMm"
            :avgWindMph="items[0].avgWindMph"
            :cragCount="items[0].cragCount || 0"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
            <RegionCard
              v-for="r in items.slice(1, visibleCount + 1)"
              :key="r.id"
              :regionId="r.id"
              :name="r.name"
              :score="r.score"
              :why="r.why"
              :warnings="r.warnings"
              :daily="r.daily"
              :distanceMins="Number(r.distanceMins ?? 0)"
              :ukcUrl="r.ukcUrl"
              :links="r.links"
              :avgTempC="r.avgTempC"
              :avgRainMm="r.avgRainMm"
              :avgWindMph="r.avgWindMph"
              :cragCount="r.cragCount || 0"
              compact
            />
          <p v-if="!prefs.where.value" class="col-span-2 text-sm text-gray-500">Add a location to get local results.</p>
          <div v-if="hasMoreCards" class="col-span-2 flex justify-center mt-2">
            <UButton variant="soft" @click="visibleCount += CARDS_PAGE_SIZE">
              Show more
            </UButton>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import { useUnits } from '~/composables/useUnits'
import { useRank } from '~/composables/useRank'
import { formatShortDayLabel } from '~/utils/dates'
import PrefsForm from '~/components/PrefsForm.vue'
import SkeletonCard from '~/components/SkeletonCard.vue'
import RegionCard from '~/components/RegionCard.vue'
import ResultsHeader from '~/components/ResultsHeader.vue'
const prefs = usePrefs()
const { items, pending, fetchRank } = useRank()
const showPrefs = ref(true)
const CARDS_PAGE_SIZE = 4
const visibleCount = ref(CARDS_PAGE_SIZE)
const hasMoreCards = computed(() => items.value && items.value.length > 1 && (visibleCount.value + 1) < items.value.length)
const route = useRoute()
const latestUpdatedAt = computed(() => {
  const all = (items.value || []).filter((r: any) => r.updatedAt)
  if (!all.length) return null
  return all.reduce((latest: string, r: any) => r.updatedAt > latest ? r.updatedAt : latest, all[0].updatedAt)
})
const hasUrlDates = computed(() => typeof route.query.dates === 'string' && route.query.dates.length > 0)
let routeWatchTimer: any = null
const ignoreNextWatch = ref(false)
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
  const fmt = (d: Date) => formatShortDayLabel(d)
  return ds.length === 1 ? fmt(d1) : `${fmt(d1)} – ${fmt(dN)}`
})
const units = useUnits()
const distanceLabel = computed(() => {
  const min = prefs.minDriveMins.value
  const max = prefs.maxDriveMins.value
  const hasMax = Number.isFinite(max)
  if (!hasMax && min <= 0) return 'No distance limit'
  const label = units.distanceLabel.value
  if (min > 0 && hasMax) return `${units.convertDistance(min)}–${units.convertDistance(max)} ${label}`
  if (min > 0) return `${units.convertDistance(min)}+ ${label}`
  return `max ${units.convertDistance(max)} ${label}`
})

onMounted(async () => {
  showPrefs.value = !hasUrlDates.value
  if (hasUrlDates.value && !items.value?.length) await fetchRank()
})

watch(() => route.query, () => {
  if (ignoreNextWatch.value) { ignoreNextWatch.value = false; return }
  if (routeWatchTimer) clearTimeout(routeWatchTimer)
  // Immediately clear stale results to prevent flash of out-of-range content
  if (!showPrefs.value && hasUrlDates.value) {
    items.value = [] as any
  }
  routeWatchTimer = setTimeout(async () => {
    const has = hasUrlDates.value
    showPrefs.value = !has
    if (has) {
      visibleCount.value = CARDS_PAGE_SIZE
      await fetchRank()
    } else {
      // Clear list when no URL dates
      items.value = [] as any
      visibleCount.value = CARDS_PAGE_SIZE
    }
  }, 150)
}, { deep: true })

async function savePrefs() {
  // Close form first so skeleton section can show immediately
  ignoreNextWatch.value = true
  showPrefs.value = false
  visibleCount.value = CARDS_PAGE_SIZE
  // Ensure dates/maxDrive are flushed to URL before fetching
  await prefs.commit()
  // Trigger fetch without awaiting so pending state renders skeleton
  fetchRank()
}
</script>
