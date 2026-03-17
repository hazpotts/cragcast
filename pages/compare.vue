<template>
  <div :class="containerClass">
    <section v-if="showPrefs" class="space-y-4">
      <PrefsForm @confirm="applyPrefs" @cancel="showPrefs=false" />
    </section>
    <section v-else>
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-gray-500">
          <template v-if="prefs.where.value">
            Showing for {{ prefs.where.value.name }} · {{ distanceLabel }} · {{ labelWhen }}
          </template>
          <template v-else>
            Showing for UK-wide · {{ labelWhen }}
          </template>
        </div>
        <div class="flex items-center gap-2">
          <UButton
            variant="ghost"
            @click="showPrefs=true"
            class="text-sky-700 hover:text-sky-800 dark:text-sky-200 dark:hover:text-sky-100"
          >
            <Icon name="heroicons-solid:adjustments-horizontal" class="mr-1 h-5 w-5" />
            Adjust
          </UButton>
          <UButton class="text-sky-700 hover:text-sky-800 dark:text-sky-200 dark:hover:text-sky-100" variant="ghost" @click="shrink=!shrink" :aria-label="shrink ? 'Expand to full width' : 'Shrink to 1000px'">
            <Icon :name="shrink ? 'heroicons-solid:arrows-pointing-out' : 'heroicons-solid:arrows-pointing-in'" class="h-5 w-5" />
          </UButton>
        </div>
      </div>
      <div class="space-y-6">
        <section v-if="favRows.length" aria-label="Favourites">
          <h3 class="text-base font-semibold mb-2">Favourites</h3>
          <CompareTable :rows="favRows" :favourites="favs" @toggle-favourite="toggleFav" :removable-ids="customCragIds" @remove="onRemoveCustom" />
        </section>
        <section v-if="customRows.length" aria-label="Custom crags">
          <h3 class="text-base font-semibold mb-2">Your Crags</h3>
          <CompareTable :rows="customRows" :favourites="favs" @toggle-favourite="toggleFav" :removable-ids="customCragIds" @remove="onRemoveCustom" />
        </section>
        <section aria-label="All regions">
          <CompareTable :rows="mainRows" :favourites="favs" @toggle-favourite="toggleFav" />
        </section>
        <AddCrag @added="onCragAdded" />
      </div>
    </section>
  </div>

</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import { useCustomCrags } from '~/composables/useCustomCrags'
import CompareTable from '~/components/CompareTable.vue'
import PrefsForm from '~/components/PrefsForm.vue'
import AddCrag from '~/components/AddCrag.vue'
const prefs = usePrefs()
const { crags: customCrags, add: addCustomCrag, remove: removeCustomCrag } = useCustomCrags()
const route = useRoute()
const items = ref<any[]>([])
const customItems = ref<any[]>([])
const hasUrlDates = computed(() => typeof route.query.dates === 'string' && (route.query.dates as string).length > 0)
const showPrefs = ref(!hasUrlDates.value)
const shrink = ref(false)
const ignoreNextWatch = ref(false)
const distanceLabel = computed(() => {
  const min = prefs.minDriveMins.value
  const max = prefs.maxDriveMins.value
  const hasMax = Number.isFinite(max)
  if (!hasMax && min <= 0) return 'No distance limit'
  if (min > 0 && hasMax) return `${min}–${max} mins`
  if (min > 0) return `${min}+ mins`
  return `max ${max} mins`
})
const labelWhen = computed(() => {
  const ds = (prefs.dates.value || []) as string[]
  if (!ds.length) return 'Dates'
  const d1 = new Date(ds[0])
  const dN = new Date(ds[ds.length - 1])
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  return ds.length === 1 ? fmt(d1) : `${fmt(d1)} – ${fmt(dN)}`
})
const containerClass = computed(() => ['space-y-6', 'px-4', shrink.value ? 'max-w-[1000px] mx-auto' : 'max-w-none'])
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
const mainRows = computed(() => items.value.filter((r: any) => !favs.value.includes(r.id)))

// Simple client cache for compare
const TTL_MS = 5 * 60 * 1000
let routeWatchTimer: any = null
function cacheKey() {
  const w:any = prefs.where.value || {}
  const latKey = Number.isFinite(Number(w.lat)) ? String(w.lat) : 'na'
  const lonKey = Number.isFinite(Number(w.lon)) ? String(w.lon) : 'na'
  const d = (prefs.dates.value || []).join(',')
  const minKey = prefs.minDriveMins.value > 0 ? String(prefs.minDriveMins.value) : '0'
  const distKey = Number.isFinite(prefs.maxDriveMins.value) ? String(prefs.maxDriveMins.value) : 'inf'
  return `compare:${latKey}:${lonKey}:${minKey}-${distKey}:${d}`
}
function readCache() {
  if (!process.client) return null
  try {
    const raw = localStorage.getItem(cacheKey())
    if (!raw) return null
    const obj = JSON.parse(raw)
    if (!obj || typeof obj !== 'object') return null
    if (Date.now() - Number(obj.t || 0) > TTL_MS) return null
    return Array.isArray(obj.v) ? obj.v : null
  } catch { return null }
}
function writeCache() {
  if (!process.client) return
  try { localStorage.setItem(cacheKey(), JSON.stringify({ t: Date.now(), v: items.value })) } catch {}
}

async function onCragAdded(crag: { name: string; lat: number; lon: number; rock: string[] }) {
  const added = addCustomCrag(crag)
  // If we have dates loaded, immediately fetch weather for this crag
  if (hasUrlDates.value) {
    await loadCustomCrag(added.id, crag.name, crag.lat, crag.lon, crag.rock)
  }
}

function onRemoveCustom(id: string) {
  removeCustomCrag(id)
  customItems.value = customItems.value.filter(r => r.id !== id)
  // Also remove from favourites
  const fi = favs.value.indexOf(id)
  if (fi !== -1) { favs.value.splice(fi, 1); saveFavs() }
}

async function loadCustomCrag(id: string, name: string, lat: number, lon: number, rock: string[]) {
  // Add placeholder
  customItems.value = [...customItems.value.filter(r => r.id !== id), { id, name, area: 'Custom', pending: true }]

  const paramsBase: any = { dates: (prefs.dates.value || []).join(',') }
  const w: any = prefs.where.value || {}
  if (Number.isFinite(Number(w.lat))) paramsBase.lat = w.lat
  if (Number.isFinite(Number(w.lon))) paramsBase.lon = w.lon
  if (prefs.minDriveMins.value > 0) paramsBase.minDriveMins = prefs.minDriveMins.value
  if (Number.isFinite(prefs.maxDriveMins.value)) paramsBase.maxDriveMins = prefs.maxDriveMins.value

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

async function loadAllCustomCrags() {
  customItems.value = []
  for (const crag of customCrags.value) {
    await loadCustomCrag(crag.id, crag.name, crag.lat, crag.lon, crag.rock)
  }
}

onMounted(async () => {
  loadFavs()
  if (hasUrlDates.value && !items.value?.length) {
    const cached = readCache()
    if (cached) items.value = cached
    else await loadCompare()
    await loadAllCustomCrags()
  }
})
watch(() => route.query, () => {
  if (routeWatchTimer) clearTimeout(routeWatchTimer)
  routeWatchTimer = setTimeout(async () => {
    if (ignoreNextWatch.value) { ignoreNextWatch.value = false; return }
    if (showPrefs.value) return
    const has = hasUrlDates.value
    showPrefs.value = !has
    if (has) {
      const cached = readCache()
      if (cached) items.value = cached
      else await loadCompare()
      await loadAllCustomCrags()
    } else {
      items.value = []
      customItems.value = []
    }
  }, 150)
}, { deep: true })
async function applyPrefs() {
  ignoreNextWatch.value = true
  showPrefs.value = false
  // Load immediately using prefs (does not depend on route update timing)
  await prefs.commit()
  await loadCompare()
  await loadAllCustomCrags()
}

async function loadCompare() {
  items.value = []
  // 1) Load region list (names & ids)
  const regionList = await $fetch<any[]>('/api/regions')
  // Prefill table with placeholder rows
  items.value = regionList.map(r => ({ id: r.id, name: r.name, area: (r as any).area, pending: true }))

  const paramsBase: any = {
    dates: (prefs.dates.value || []).join(',')
  }
  const w:any = prefs.where.value || {}
  if (Number.isFinite(Number(w.lat))) paramsBase.lat = w.lat
  if (Number.isFinite(Number(w.lon))) paramsBase.lon = w.lon
  if (prefs.minDriveMins.value > 0) paramsBase.minDriveMins = prefs.minDriveMins.value
  if (Number.isFinite(prefs.maxDriveMins.value)) paramsBase.maxDriveMins = prefs.maxDriveMins.value

  // 2) Fetch each region individually with a small delay to avoid rate limits
  for (const r of regionList) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout per region
    try {
      const row = await $fetch<any>('/api/region', {
        params: { id: r.id, ...paramsBase },
        signal: controller.signal
      })
      clearTimeout(timeoutId)
      const unlimited = !Number.isFinite(prefs.maxDriveMins.value)
      const tooFar = !unlimited && row.distanceMins > (prefs.maxDriveMins.value as number)
      const tooClose = prefs.minDriveMins.value > 0 && row.distanceMins < prefs.minDriveMins.value
      if (tooFar || tooClose) {
        // Remove placeholder when filtered out
        items.value = items.value.filter((x: any) => x.id !== r.id)
      } else {
        const idx = items.value.findIndex((x: any) => x.id === r.id)
        if (idx !== -1) items.value[idx] = row
      }
      writeCache()
      await new Promise(res => setTimeout(res, 120))
    } catch (e) {
      clearTimeout(timeoutId)
      // Mark row as failed instead of leaving it pending
      const idx = items.value.findIndex((x: any) => x.id === r.id)
      if (idx !== -1) {
        items.value[idx] = { ...items.value[idx], pending: false, error: true }
      }
    }
  }
}
</script>
