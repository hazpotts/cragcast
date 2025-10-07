<template>
  <div class="space-y-6 max-w-[600px] mx-auto">
    <section v-if="showPrefs" class="space-y-4">
      <PrefsForm @confirm="savePrefs" @cancel="showPrefs=false" />
    </section>
    <section v-else>
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          <template v-if="prefs.where.value">
            Showing for {{ (prefs.where.value as any).name }} · {{ distanceLabel }} · {{ labelWhen }}
          </template>
          <template v-else>
            Showing for UK-wide · {{ labelWhen }}
          </template>
        </div>
        <UButton variant="ghost" @click="showPrefs = true" class="text-sky-700 hover:text-sky-800 dark:text-sky-200 dark:hover:text-sky-100">
          <Icon name="heroicons:adjustments-horizontal-20-solid" class="mr-1 h-5 w-5" />
          Adjust
        </UButton>
      </div>
      <div v-if="pending" class="space-y-4">
        <SkeletonCard />
      </div>
      <div v-else>
        <div v-if="items[0]" class="mb-6">
          <RegionCard
            :name="items[0].name"
            :score="items[0].score"
            :why="items[0].why"
            :daily="items[0].daily"
            :distanceMins="Number(items[0].distanceMins ?? 0)"
            :updatedAt="items[0].updatedAt"
            :ukcUrl="items[0].ukcUrl"
            :links="items[0].links"
            :avgTempC="items[0].avgTempC"
            :avgRainMm="items[0].avgRainMm"
            :avgWindMph="items[0].avgWindMph"
          />
        </div>
        <div class="flex flex-col gap-4">
          <template>
            <RegionCard
              v-for="r in items.slice(1, visibleCount)"
              :key="r.id"
              :name="r.name"
              :score="r.score"
              :why="r.why"
              :daily="r.daily"
              :distanceMins="Number(r.distanceMins ?? 0)"
              :updatedAt="r.updatedAt"
              :ukcUrl="r.ukcUrl"
              :links="r.links"
              :avgTempC="r.avgTempC"
              :avgRainMm="r.avgRainMm"
              :avgWindMph="r.avgWindMph"
            />
          </template>
          <p v-if="!prefs.where.value" class="text-sm text-gray-500">Add a location to get local results.</p>
          <!--
          <UButton v-if="items.length > visibleCount" label="Show more" variant="soft" @click="showMore()"
            class="bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/50" /> -->
        </div>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import { useRank } from '~/composables/useRank'
import PrefsForm from '~/components/PrefsForm.vue'
import SkeletonCard from '~/components/SkeletonCard.vue'
import RegionCard from '~/components/RegionCard.vue'
const prefs = usePrefs()
const { items, pending, fetchRank } = useRank()
const showPrefs = ref(true)
const visibleCount = ref(6) // show top 1, then next 5 by default
function showMore() { visibleCount.value += 5 }
const route = useRoute()
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
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  return ds.length === 1 ? fmt(d1) : `${fmt(d1)} – ${fmt(dN)}`
})
const distanceLabel = computed(() => Number.isFinite(prefs.maxDriveMins.value)
  ? `max ${prefs.maxDriveMins.value} mins`
  : 'No distance limit')

onMounted(async () => {
  showPrefs.value = !hasUrlDates.value
  if (hasUrlDates.value && !items.value?.length) await fetchRank()
})

watch(() => route.query, () => {
  if (ignoreNextWatch.value) { ignoreNextWatch.value = false; return }
  if (routeWatchTimer) clearTimeout(routeWatchTimer)
  routeWatchTimer = setTimeout(async () => {
    if (showPrefs.value) return
    const has = hasUrlDates.value
    showPrefs.value = !has
    if (has) {
      await fetchRank()
    } else {
      // Clear list when no URL dates
      items.value = [] as any
      visibleCount.value = 6
    }
  }, 150)
}, { deep: true })

async function savePrefs() {
  // Close form first so skeleton section can show immediately
  ignoreNextWatch.value = true
  showPrefs.value = false
  visibleCount.value = 6
  // Ensure dates/maxDrive are flushed to URL before fetching
  await prefs.commit()
  // Trigger fetch without awaiting so pending state renders skeleton
  fetchRank()
}
</script>
