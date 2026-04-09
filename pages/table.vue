<template>
  <div :class="containerClass">
    <ResultsHeader
      v-model="showPrefs"
      :whereName="prefs.where.value?.name || null"
      :distanceLabel="distanceLabel"
      :labelWhen="labelWhen"
      :updatedAt="latestUpdatedAt"
    >
      <template #right>
        <UButton v-if="hasPrefs" class="hidden sm:inline-flex text-sky-700 hover:text-sky-800 dark:text-sky-200 dark:hover:text-sky-100" variant="ghost" @click="shrink=!shrink" :aria-label="shrink ? 'Expand to full width' : 'Shrink to 1000px'">
          <Icon :name="shrink ? 'heroicons-solid:arrows-pointing-out' : 'heroicons-solid:arrows-pointing-in'" class="h-5 w-5" />
        </UButton>
      </template>
    </ResultsHeader>

    <section v-if="showPrefs" class="space-y-4">
      <PrefsForm @confirm="applyPrefs" @cancel="showPrefs=false" @clear="clearTable" />
    </section>

    <section v-else>
      <div class="space-y-6">
        <div class="max-w-sm">
          <UInput v-model="searchQuery" :placeholder="isAreaMode ? 'Search areas...' : (isCragMode ? 'Search crags...' : 'Search regions...')" icon="i-heroicons-magnifying-glass" size="sm" />
        </div>
        <template v-if="!isAreaMode && !isCragMode">
          <section v-if="filteredFavRows.length" aria-label="Favourites">
            <h3 class="text-base font-semibold mb-2">Favourites</h3>
            <CompareTable :rows="filteredFavRows" :favourites="favs" @toggle-favourite="toggleFav" :removable-ids="customCragIds" @remove="onRemoveCustom" />
          </section>
          <section v-if="filteredCustomRows.length" aria-label="Custom locations">
            <h3 class="text-base font-semibold mb-2">Your Locations</h3>
            <CompareTable :rows="filteredCustomRows" :favourites="favs" @toggle-favourite="toggleFav" :removable-ids="customCragIds" @remove="onRemoveCustom" />
          </section>
        </template>
        <section :aria-label="isAreaMode ? 'All areas' : (isCragMode ? 'All crags' : 'All regions')">
          <CompareTable :rows="filteredMainRows" :favourites="isAreaMode || isCragMode ? [] : favs" @toggle-favourite="toggleFav" :nameLabel="isAreaMode ? 'Area' : (isCragMode ? 'Crag' : 'Region')" />
        </section>
        <AddLocation v-if="!isAreaMode && !isCragMode" :count="customCrags.length" @added="onLocationAdded" />
      </div>
    </section>
  </div>

</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePrefs, type PrefsSnapshot } from '~/composables/usePrefs'
import { useUnits } from '~/composables/useUnits'
import { useCustomCrags } from '~/composables/useCustomCrags'
import { useAreas } from '~/composables/useAreas'
import { useCrags, type CragItem } from '~/composables/useCrags'
import CompareTable from '~/components/CompareTable.vue'
import PrefsForm from '~/components/PrefsForm.vue'
import ResultsHeader from '~/components/ResultsHeader.vue'
import AddLocation from '~/components/AddLocation.vue'
const prefs = usePrefs()
const { crags: customCrags, add: addCustomCrag, remove: removeCustomCrag } = useCustomCrags()
const { items: areaItems, fetchAreas } = useAreas()
const { fetchCrags } = useCrags()
const route = useRoute()
const items = ref<any[]>([])
const customItems = ref<any[]>([])
const isAreaMode = computed(() => prefs.granularity.value === 'area')
const isCragMode = computed(() => prefs.granularity.value === 'crag')
const hasUrlDates = computed(() => typeof route.query.dates === 'string' && (route.query.dates as string).length > 0)
const showPrefs = ref(!hasUrlDates.value)
const shrink = ref(false)
const searchQuery = ref('')
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
const labelWhen = computed(() => {
  const ds = (prefs.dates.value || []) as string[]
  if (!ds.length) return 'Dates'
  const d1 = new Date(ds[0])
  const dN = new Date(ds[ds.length - 1])
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  return ds.length === 1 ? fmt(d1) : `${fmt(d1)} – ${fmt(dN)}`
})
const latestUpdatedAt = computed(() => {
  const all = (isAreaMode.value
    ? areaItems.value
    : [...items.value, ...customItems.value]
  ).filter((r: any) => r.updatedAt)
  if (!all.length) return null
  return all.reduce((latest: string, r: any) => r.updatedAt > latest ? r.updatedAt : latest, all[0].updatedAt)
})
const containerClass = computed(() => ['space-y-6', 'px-4', shrink.value ? 'max-w-[1000px] mx-auto' : 'max-w-none'])
const hasPrefs = computed(() => prefs.where.value || prefs.dates.value?.length || prefs.maxDriveMins.value)
const customCragIds = computed(() => customCrags.value.map(c => c.id))
// Favourites
const favs = ref<string[]>([])
function loadFavs() {
  if (!process.client) return
  try { favs.value = JSON.parse(localStorage.getItem('favourites') || '[]') || [] } catch { favs.value = [] }
}
function saveFavs() {
  if (!process.client) return
  try { localStorage.setItem('favourites', JSON.stringify(favs.value)) } catch {}
}
function toggleFav(id: string) {
  const i = favs.value.indexOf(id)
  if (i === -1) favs.value.push(id)
  else favs.value.splice(i, 1)
  saveFavs()
}
const allItems = computed(() => [...items.value, ...customItems.value])
const favRows = computed(() => allItems.value.filter((r: any) => favs.value.includes(r.id) && !r.pending))
const customRows = computed(() => customItems.value.filter((r: any) => !favs.value.includes(r.id)))
const mainRows = computed(() => isAreaMode.value
  ? areaItems.value
  : items.value.filter((r: any) => !favs.value.includes(r.id))
)

function matchesSearch(row: any) {
  if (!searchQuery.value) return true
  const q = searchQuery.value.toLowerCase()
  return (row.name || '').toLowerCase().includes(q) || (row.area || '').toLowerCase().includes(q) || (row.regionCount !== undefined && String(row.regionCount).includes(q))
}
const filteredFavRows = computed(() => favRows.value.filter(matchesSearch))
const filteredCustomRows = computed(() => customRows.value.filter(matchesSearch))
const filteredMainRows = computed(() => mainRows.value.filter(matchesSearch))

// Simple client cache for compare
const TTL_MS = 5 * 60 * 1000
let routeWatchTimer: any = null

// AbortController for the sequential loadCompare loop
let compareController: AbortController | null = null

function compareCacheKey(snap: PrefsSnapshot) {
  const latKey = snap.lat !== undefined && Number.isFinite(snap.lat) ? String(snap.lat) : 'na'
  const lonKey = snap.lon !== undefined && Number.isFinite(snap.lon) ? String(snap.lon) : 'na'
  const minKey = snap.minDriveMins > 0 ? String(snap.minDriveMins) : '0'
  const distKey = Number.isFinite(snap.maxDriveMins) ? String(snap.maxDriveMins) : 'inf'
  const granKey = snap.granularity === 'crag' ? 'crag' : 'region'
  return `compare:${latKey}:${lonKey}:${minKey}-${distKey}:${snap.dates.join(',')}:${granKey}`
}
function readCache(snap: PrefsSnapshot) {
  if (!process.client) return null
  try {
    const raw = localStorage.getItem(compareCacheKey(snap))
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== 'object') return null
    if (Date.now() - Number(obj.t || 0) > TTL_MS) return null
    return Array.isArray(obj.v) ? obj.v : null
  } catch { return null }
}
function writeCache(snap: PrefsSnapshot) {
  if (!process.client) return
  try { localStorage.setItem(compareCacheKey(snap), JSON.stringify({ t: Date.now(), v: items.value })) } catch {}
}

async function onLocationAdded(crag: { name: string; lat: number; lon: number; rock: string[] }) {
  const added = addCustomCrag(crag)
  if (!added) return
  if (hasUrlDates.value) {
    await loadCustomCrag(added.id, crag.name, crag.lat, crag.lon, crag.rock, prefs.snapshot())
  }
}

function onRemoveCustom(id: string) {
  removeCustomCrag(id)
  customItems.value = customItems.value.filter(r => r.id !== id)
  const fi = favs.value.indexOf(id)
  if (fi !== -1) { favs.value.splice(fi, 1); saveFavs() }
}

async function loadCustomCrag(id: string, name: string, lat: number, lon: number, rock: string[], snap: PrefsSnapshot) {
  customItems.value = [...customItems.value.filter(r => r.id !== id), { id, name, area: 'Custom', pending: true }]

  const paramsBase: any = { dates: snap.dates.join(',') }
  if (snap.lat !== undefined && Number.isFinite(snap.lat)) { paramsBase.lat = snap.lat; paramsBase.lon = snap.lon }
  if (snap.minDriveMins > 0) paramsBase.minDriveMins = snap.minDriveMins
  if (Number.isFinite(snap.maxDriveMins)) paramsBase.maxDriveMins = snap.maxDriveMins

  try {
    const row = await $fetch<any>('/api/custom-region', {
      params: { id, name, cragLat: lat, cragLon: lon, rocks: rock.join(','), ...paramsBase }
    })
    const idx = customItems.value.findIndex(r => r.id === id)
    if (idx !== -1) customItems.value[idx] = row
  } catch {
    const idx = customItems.value.findIndex(r => r.id === id)
    if (idx !== -1) customItems.value[idx] = { ...customItems.value[idx], pending: false, error: true }
  }
}

async function loadAllCustomCrags(snap: PrefsSnapshot) {
  customItems.value = []
  for (const crag of customCrags.value) {
    await loadCustomCrag(crag.id, crag.name, crag.lat, crag.lon, crag.rock, snap)
  }
}

onMounted(async () => {
  loadFavs()
  if (hasUrlDates.value && !items.value?.length) {
    const snap = prefs.snapshot()
    if (snap.granularity === 'area') {
      await fetchAreas(snap)
    } else {
      const cached = readCache(snap)
      if (cached) items.value = cached
      else await loadCompare(snap)
      if (snap.granularity !== 'crag') await loadAllCustomCrags(snap)
    }
  }
})

// Handles browser back/forward, direct URL edits, and post-commit URL updates.
watch(() => route.query, () => {
  if (routeWatchTimer) clearTimeout(routeWatchTimer)
  // Immediately clear stale results to prevent flash of out-of-range content
  if (!showPrefs.value && hasUrlDates.value) {
    items.value = []
    customItems.value = []
    areaItems.value = [] as any
  }
  routeWatchTimer = setTimeout(async () => {
    const has = hasUrlDates.value
    showPrefs.value = !has
    if (has) {
      const snap = prefs.snapshot()
      if (snap.granularity === 'area') {
        items.value = []
        customItems.value = []
        await fetchAreas(snap)
      } else {
        areaItems.value = [] as any
        const cached = readCache(snap)
        if (cached) items.value = cached
        else await loadCompare(snap)
        if (snap.granularity !== 'crag') await loadAllCustomCrags(snap)
      }
    } else {
      items.value = []
      customItems.value = []
      areaItems.value = [] as any
    }
  }, 150)
}, { deep: true })

async function applyPrefs() {
  showPrefs.value = false
  items.value = []
  customItems.value = []
  areaItems.value = [] as any
  await prefs.commit()
  // Route watcher fires after commit and handles the fetch
}
function clearTable() {
  if (compareController) compareController.abort()
  if (process.client) window.location.replace('/table')
}

async function loadCompare(snap: PrefsSnapshot) {
  // Cancel any previous in-flight compare loop
  if (compareController) compareController.abort()
  const controller = new AbortController()
  compareController = controller

  items.value = []
  // 1) Load region list (names & ids)
  const regionList = await $fetch<any[]>('/api/regions', { signal: controller.signal })
  if (controller.signal.aborted) return

  const paramsBase: any = { dates: snap.dates.join(',') }
  if (snap.lat !== undefined && Number.isFinite(snap.lat)) { paramsBase.lat = snap.lat; paramsBase.lon = snap.lon }
  if (snap.minDriveMins > 0) paramsBase.minDriveMins = snap.minDriveMins
  if (Number.isFinite(snap.maxDriveMins)) paramsBase.maxDriveMins = snap.maxDriveMins

  if (snap.granularity === 'crag') {
    // Crag mode: load all crags as flat rows, using region weather data
    for (const r of regionList) {
      if (controller.signal.aborted) return
      try {
        const [regionRow, cragItems] = await Promise.all([
          $fetch<any>('/api/region', { params: { id: r.id, ...paramsBase }, signal: controller.signal }),
          fetchCrags(r.id, {
            lat: snap.lat,
            lon: snap.lon,
            dates: snap.dates.join(','),
            minDriveMins: snap.minDriveMins > 0 ? snap.minDriveMins : undefined,
            maxDriveMins: Number.isFinite(snap.maxDriveMins) ? snap.maxDriveMins : undefined
          })
        ])
        if (controller.signal.aborted) return
        const newRows = cragItems.map((crag: CragItem) => ({
          ...crag,
          region: r.name,
          daily: regionRow.daily,
          avgTempC: regionRow.avgTempC,
          avgWindMph: regionRow.avgWindMph,
          avgWindDir: regionRow.avgWindDir,
          avgRainMm: regionRow.avgRainMm,
          warnings: regionRow.warnings,
          cragCount: 0,
          pending: false
        }))
        items.value = [...items.value, ...newRows]
        await new Promise(res => setTimeout(res, 120))
      } catch (e) {
        if (controller.signal.aborted) return
      }
    }
  } else {
    // Region mode: prefill table with placeholder rows, then load each region
    items.value = regionList.map(r => ({ id: r.id, name: r.name, area: (r as any).area, cragCount: (r as any).cragCount || 0, pending: true }))

    // 2) Fetch each region individually with a small delay to avoid rate limits
    for (const r of regionList) {
      if (controller.signal.aborted) return

      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout per region
      try {
        const row = await $fetch<any>('/api/region', {
          params: { id: r.id, ...paramsBase },
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        if (controller.signal.aborted) return

        const unlimited = !Number.isFinite(snap.maxDriveMins)
        const tooFar = !unlimited && row.distanceMins > snap.maxDriveMins
        const tooClose = snap.minDriveMins > 0 && row.distanceMins < snap.minDriveMins
        if (tooFar || tooClose) {
          items.value = items.value.filter((x: any) => x.id !== r.id)
        } else {
          const idx = items.value.findIndex((x: any) => x.id === r.id)
          if (idx !== -1) items.value[idx] = row
        }
        writeCache(snap)
        await new Promise(res => setTimeout(res, 120))
      } catch (e) {
        clearTimeout(timeoutId)
        if (controller.signal.aborted) return
        const idx = items.value.findIndex((x: any) => x.id === r.id)
        if (idx !== -1) {
          items.value[idx] = { ...items.value[idx], pending: false, error: true }
        }
      }
    }
  }

  if (compareController === controller) compareController = null
}
</script>
