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
      <PrefsForm @confirm="savePrefs" @cancel="showPrefs=false" @clear="clearPrefs" />
    </section>
    <section v-else>
      <div v-if="activePending" class="space-y-4">
        <SkeletonCard />
      </div>
      <div v-else>
        <div v-if="activeItems[0]" class="mb-6">
          <RegionCard
            :regionId="activeItems[0].id"
            :name="activeItems[0].name"
            :score="activeItems[0].score"
            :why="activeItems[0].why"
            :warnings="activeItems[0].warnings"
            :daily="activeItems[0].daily"
            :distanceMins="Number(activeItems[0].distanceMins ?? 0)"
            :ukcUrl="activeItems[0].ukcUrl"
            :links="activeItems[0].links"
            :avgTempC="activeItems[0].avgTempC"
            :avgRainMm="activeItems[0].avgRainMm"
            :avgWindMph="activeItems[0].avgWindMph"
            :cragCount="activeItems[0].cragCount || 0"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
            <RegionCard
              v-for="r in activeItems.slice(1, visibleCount + 1)"
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
import { useAreas } from '~/composables/useAreas'
import { formatShortDayLabel } from '~/utils/dates'
import PrefsForm from '~/components/PrefsForm.vue'
import SkeletonCard from '~/components/SkeletonCard.vue'
import RegionCard from '~/components/RegionCard.vue'
import ResultsHeader from '~/components/ResultsHeader.vue'
const prefs = usePrefs()
const { items: rankItems, pending: rankPending, fetchRank } = useRank()
const { items: areaItems, pending: areaPending, fetchAreas } = useAreas()
const showPrefs = ref(true)
const CARDS_PAGE_SIZE = 4
const visibleCount = ref(CARDS_PAGE_SIZE)

const isAreaMode = computed(() => prefs.granularity.value === 'area')
const activeItems = computed(() => isAreaMode.value ? areaItems.value : rankItems.value)
const activePending = computed(() => isAreaMode.value ? areaPending.value : rankPending.value)

const hasMoreCards = computed(() => activeItems.value && activeItems.value.length > 1 && (visibleCount.value + 1) < activeItems.value.length)
const route = useRoute()
const latestUpdatedAt = computed(() => {
  const all = (activeItems.value || []).filter((r: any) => r.updatedAt)
  if (!all.length) return null
  return all.reduce((latest: string, r: any) => r.updatedAt > latest ? r.updatedAt : latest, all[0].updatedAt)
})
const hasUrlDates = computed(() => typeof route.query.dates === 'string' && route.query.dates.length > 0)
let routeWatchTimer: any = null
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

function fetchActive(snap: ReturnType<typeof prefs.snapshot>) {
  if (snap.granularity === 'area') fetchAreas(snap)
  else fetchRank(snap)
}

onMounted(() => {
  showPrefs.value = !hasUrlDates.value
  if (hasUrlDates.value && !activeItems.value?.length) {
    fetchActive(prefs.snapshot())
  }
})

watch(() => route.query, () => {
  if (routeWatchTimer) clearTimeout(routeWatchTimer)
  if (!showPrefs.value && hasUrlDates.value) {
    rankItems.value = [] as any
    areaItems.value = [] as any
  }
  routeWatchTimer = setTimeout(() => {
    const has = hasUrlDates.value
    showPrefs.value = !has
    if (has) {
      visibleCount.value = CARDS_PAGE_SIZE
      fetchActive(prefs.snapshot())
    } else {
      rankItems.value = [] as any
      areaItems.value = [] as any
      visibleCount.value = CARDS_PAGE_SIZE
    }
  }, 150)
}, { deep: true })

async function savePrefs() {
  const snap = prefs.snapshot()
  showPrefs.value = false
  visibleCount.value = CARDS_PAGE_SIZE
  rankItems.value = [] as any
  areaItems.value = [] as any
  prefs.commit()
  fetchActive(snap)
}
async function clearPrefs() {
  showPrefs.value = true
  rankItems.value = [] as any
  areaItems.value = [] as any
  visibleCount.value = CARDS_PAGE_SIZE
  prefs.where.value = null
  prefs.maxDriveMins.value = null
  prefs.dates.value = []
  await prefs.commit()
}
</script>
