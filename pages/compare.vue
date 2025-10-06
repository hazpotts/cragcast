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
            Showing {{ labelWhen }}
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
          <CompareTable :rows="favRows" :favourites="favs" @toggle-favourite="toggleFav" />
        </section>
        <section aria-label="All regions">
          <CompareTable :rows="mainRows" :favourites="favs" @toggle-favourite="toggleFav" />
        </section>
      </div>
    </section>
  </div>
  
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import CompareTable from '~/components/CompareTable.vue'
import PrefsForm from '~/components/PrefsForm.vue'
const prefs = usePrefs()
const route = useRoute()
const items = ref<any[]>([])
const showPrefs = ref(true)
const shrink = ref(false)
const distanceLabel = computed(() => Number.isFinite(prefs.maxDriveMins.value)
  ? `max ${prefs.maxDriveMins.value} mins`
  : 'No distance limit')
const labelWhen = computed(() => {
  const ds = (prefs.dates.value || []) as string[]
  if (!ds.length) return 'Dates'
  const d1 = new Date(ds[0])
  const dN = new Date(ds[ds.length - 1])
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  return ds.length === 1 ? fmt(d1) : `${fmt(d1)} – ${fmt(dN)}`
})
const containerClass = computed(() => ['space-y-6', 'px-4', shrink.value ? 'max-w-[1000px] mx-auto' : 'max-w-none'])
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
const favRows = computed(() => items.value.filter((r: any) => favs.value.includes(r.id) && !r.pending))
const mainRows = computed(() => items.value.filter((r: any) => !favs.value.includes(r.id)))

// Simple client cache for compare
const TTL_MS = 5 * 60 * 1000
const hasUrlDates = computed(() => typeof route.query.dates === 'string' && (route.query.dates as string).length > 0)
let routeWatchTimer: any = null
function cacheKey() {
  const w:any = prefs.where.value || {}
  const latKey = Number.isFinite(Number(w.lat)) ? String(w.lat) : 'na'
  const lonKey = Number.isFinite(Number(w.lon)) ? String(w.lon) : 'na'
  const d = (prefs.dates.value || []).join(',')
  const distKey = Number.isFinite(prefs.maxDriveMins.value) ? String(prefs.maxDriveMins.value) : 'inf'
  return `compare:${latKey}:${lonKey}:${distKey}:${d}`
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

onMounted(async () => {
  showPrefs.value = !hasUrlDates.value
  loadFavs()
  if (hasUrlDates.value && !items.value?.length) {
    const cached = readCache()
    if (cached) items.value = cached
    else await loadCompare()
  }
})
watch(() => route.query, () => {
  if (routeWatchTimer) clearTimeout(routeWatchTimer)
  routeWatchTimer = setTimeout(async () => {
    if (showPrefs.value) return
    const has = hasUrlDates.value
    showPrefs.value = !has
    if (has) {
      const cached = readCache()
      if (cached) items.value = cached
      else await loadCompare()
    } else {
      items.value = []
    }
  }, 150)
}, { deep: true })
async function applyPrefs() {
  if (hasUrlDates.value) {
    await loadCompare()
    showPrefs.value = false
  } else {
    showPrefs.value = true
  }
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
  if (Number.isFinite(prefs.maxDriveMins.value)) paramsBase.maxDriveMins = prefs.maxDriveMins.value

  // 2) Fetch each region individually with a small delay to avoid rate limits
  for (const r of regionList) {
    try {
      const row = await $fetch<any>('/api/region', { params: { id: r.id, ...paramsBase } })
      const unlimited = !Number.isFinite(prefs.maxDriveMins.value)
      if (!unlimited && row.distanceMins > (prefs.maxDriveMins.value as number)) {
        // Remove placeholder when filtered out
        items.value = items.value.filter((x: any) => x.id !== r.id)
      } else {
        const idx = items.value.findIndex((x: any) => x.id === r.id)
        if (idx !== -1) items.value[idx] = row
      }
      writeCache()
      await new Promise(res => setTimeout(res, 120))
    } catch (e) {
      // Leave placeholder row; we could mark as failed if desired
    }
  }
}
</script>
