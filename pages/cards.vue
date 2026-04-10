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
        <!-- Crag mode: show individual crag cards -->
        <div v-if="isCragMode" class="grid grid-cols-2 gap-4">
          <CragCard
            v-for="crag in cragItems.slice(0, visibleCount)"
            :key="crag.id"
            :crag="crag"
          />
          <p v-if="!prefs.where.value" class="col-span-2 text-sm text-gray-500">Add a location to get local results.</p>
          <div v-if="hasMoreCards" class="col-span-2 flex justify-center mt-2">
            <UButton variant="soft" @click="visibleCount += CARDS_PAGE_SIZE">
              Show more
            </UButton>
          </div>
        </div>
        <!-- Region / area mode -->
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
              :totalRainMm="activeItems[0].totalRainMm"
              :avgWindMph="activeItems[0].avgWindMph"
              :avgWindDir="activeItems[0].avgWindDir"
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
              :totalRainMm="r.totalRainMm"
              :avgWindMph="r.avgWindMph"
              :avgWindDir="r.avgWindDir"
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
import { useCrags, type CragItem } from '~/composables/useCrags'
import { formatShortDayLabel } from '~/utils/dates'
import PrefsForm from '~/components/PrefsForm.vue'
import SkeletonCard from '~/components/SkeletonCard.vue'
import RegionCard from '~/components/RegionCard.vue'
import CragCard from '~/components/CragCard.vue'
import ResultsHeader from '~/components/ResultsHeader.vue'
const prefs = usePrefs()
const { items: rankItems, pending: rankPending, fetchRank } = useRank()
const { items: areaItems, pending: areaPending, fetchAreas } = useAreas()
const { fetchCrags } = useCrags()
const showPrefs = ref(true)
const CARDS_PAGE_SIZE = 4
const visibleCount = ref(CARDS_PAGE_SIZE)

const isAreaMode = computed(() => prefs.granularity.value === 'area')
const isCragMode = computed(() => prefs.granularity.value === 'crag')

// Crag mode: flat list of all crags sorted by score
const cragItems = ref<CragItem[]>([])
const cragsPending = ref(false)

const activeItems = computed(() => isAreaMode.value ? areaItems.value : rankItems.value)
const activePending = computed(() => isCragMode.value ? cragsPending.value : (isAreaMode.value ? areaPending.value : rankPending.value))

const hasMoreCards = computed(() => {
  if (isCragMode.value) return cragItems.value.length > visibleCount.value
  return activeItems.value && activeItems.value.length > 1 && (visibleCount.value + 1) < activeItems.value.length
})
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

async function fetchAllCrags(snap: ReturnType<typeof prefs.snapshot>) {
  cragsPending.value = true
  cragItems.value = []
  try {
    const regionList = await $fetch<any[]>('/api/regions')
    const all: CragItem[] = []
    for (const r of regionList) {
      const crags = await fetchCrags(r.id, {
        lat: snap.lat,
        lon: snap.lon,
        dates: snap.dates.join(','),
        minDriveMins: snap.minDriveMins > 0 ? snap.minDriveMins : undefined,
        maxDriveMins: Number.isFinite(snap.maxDriveMins) ? snap.maxDriveMins : undefined
      })
      all.push(...crags)
    }
    all.sort((a, b) => b.score - a.score)
    cragItems.value = all
  } finally {
    cragsPending.value = false
  }
}

function fetchActive(snap: ReturnType<typeof prefs.snapshot>) {
  if (snap.granularity === 'area') fetchAreas(snap)
  else if (snap.granularity === 'crag') fetchAllCrags(snap)
  else fetchRank(snap)
}

onMounted(() => {
  showPrefs.value = !hasUrlDates.value
  if (hasUrlDates.value && !activeItems.value?.length && !cragItems.value.length) {
    fetchActive(prefs.snapshot())
  }
})

watch(() => route.query, () => {
  if (routeWatchTimer) clearTimeout(routeWatchTimer)
  if (!showPrefs.value && hasUrlDates.value) {
    rankItems.value = [] as any
    areaItems.value = [] as any
    cragItems.value = []
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
      cragItems.value = []
      visibleCount.value = CARDS_PAGE_SIZE
    }
  }, 150)
}, { deep: true })

async function savePrefs() {
  showPrefs.value = false
  visibleCount.value = CARDS_PAGE_SIZE
  rankItems.value = [] as any
  areaItems.value = [] as any
  cragItems.value = []
  await prefs.commit()
  // Route watcher fires after commit and handles the fetch
}
function clearPrefs() {
  if (process.client) window.location.replace('/')
}
</script>
