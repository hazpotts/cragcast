<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-2 relative">
      <UInput
        ref="inputRef"
        v-model="query"
        placeholder="Search a place"
        @input="onType"
        @update:modelValue="onType"
        @keydown.enter="onEnter"
        class="w-80"
      />
      <UButton icon="i-heroicons-map-pin" variant="ghost" :title="'Use browser location'" @click="useGeo" />

      <div v-if="!useGoogle && allowSuggest && suggestions.length"
           class="absolute left-0 top-full mt-1 w-80 max-h-64 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow z-20">
        <ul>
          <li v-for="(s,i) in suggestions" :key="i"
              class="px-3 py-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 text-sm text-gray-900 dark:text-gray-100"
              @mousedown.prevent="pickSuggestion(s)">
            {{ s.name }}
          </li>
        </ul>
      </div>
    </div>
    <div class="text-sm text-gray-500" v-if="placeName">Selected: {{ placeName }}</div>
  </div>
</template>
<script setup lang="ts">
import { watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'
import { usePrefs } from '~/composables/usePrefs'
const emit = defineEmits<{ (e:'picked', v:{ lat:number; lon:number; name:string }): void }>()
const cfg = useRuntimeConfig() as any
const pub = cfg.public || {}
const useGoogle = !!pub.googlePlacesEnabled && !!pub.googlePlacesApiKey
const query = ref('')
const placeName = ref('')
const inputRef = ref<any>(null)
const suggestions = ref<{ name: string; lat: number; lon: number }[]>([])
const loading = ref(false)
const allowSuggest = ref(false) // only show dropdown due to user typing

function normalizeName(raw: string, address?: any): string {
  // Prefer structured fields if available
  const a = address || {}
  const structured = a.city || a.town || a.village || a.hamlet || a.suburb || a.neighbourhood || a.county || a.state
  let name = String(structured || raw || '').trim()
  // If still contains commas, take first non-numeric, non-empty segment
  const parts = name.split(',').map((s: string) => s.trim()).filter(Boolean)
  const firstGood = parts.find(p => !/^\d+$/.test(p) && p.toLowerCase() !== 'unnamed road')
  name = firstGood || parts[0] || name
  return name
}

async function useGeo() {
  console.log('[PlaceSearch] useGeo clicked')
  if (!('geolocation' in navigator)) return
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords
    const lat4 = Number(latitude.toFixed(4))
    const lon4 = Number(longitude.toFixed(4))
    let friendly = 'My location'
    try {
      const url = new URL('https://nominatim.openstreetmap.org/reverse')
      url.searchParams.set('lat', String(lat4))
      url.searchParams.set('lon', String(lon4))
      url.searchParams.set('format', 'jsonv2')
      const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } })
      const data = await res.json()
      if (data) friendly = normalizeName(String(data.display_name || ''), data.address)
    } catch (e) {}
    const nameShort = normalizeName(friendly)
    placeName.value = nameShort
    query.value = nameShort
    allowSuggest.value = false
    suggestions.value = []
    console.log('[PlaceSearch] geolocation success', { lat4, lon4, nameShort })
    emit('picked', { lat: lat4, lon: lon4, name: nameShort })
    console.log('[PlaceSearch] emitted picked (geo)')
  })
}

const fetchSuggest = useDebounceFn(async () => {
  if (useGoogle) return // Google Autocomplete UI will handle suggestions
  const q = query.value.trim()
  if (!q) { suggestions.value = []; return }
  try {
    loading.value = true
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', q)
    url.searchParams.set('format', 'jsonv2')
    url.searchParams.set('limit', '8')
    const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } })
    const data = await res.json()
    const list = Array.isArray(data) ? data.slice(0, 8).map((d:any) => ({
      name: normalizeName(String(d.display_name || ''), d.address),
      lat: Number(d.lat),
      lon: Number(d.lon)
    })) : []
    suggestions.value = list
    console.log('[PlaceSearch] OSM suggest', { count: list.length })
  } catch (e) {
    suggestions.value = []
  } finally {
    loading.value = false
  }
}, 300)

function onType() {
  allowSuggest.value = true
  fetchSuggest()
}

watch(query, () => { if (allowSuggest.value) fetchSuggest() })

function pickSuggestion(s: { name:string; lat:number; lon:number }) {
  const nameShort = normalizeName(s.name)
  const lat4 = Number(s.lat.toFixed(4))
  const lon4 = Number(s.lon.toFixed(4))
  placeName.value = nameShort
  query.value = nameShort
  emit('picked', { lat: lat4, lon: lon4, name: nameShort })
  suggestions.value = []
  allowSuggest.value = false
  console.log('[PlaceSearch] emitted picked (osm suggest)', { nameShort, lat4, lon4 })
}

async function onEnter() {
  if (suggestions.value.length) {
    pickSuggestion(suggestions.value[0])
    return
  }
  // Fallback to single-shot geocode of current query
  const q = query.value.trim()
  if (!q) return
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', q)
    url.searchParams.set('format', 'jsonv2')
    const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } })
    const data = await res.json()
    if (Array.isArray(data) && data[0]) {
      const d = data[0]
      pickSuggestion({ name: normalizeName(String(d.display_name || ''), d.address), lat: Number(d.lat), lon: Number(d.lon) })
    }
  } catch (e) {}
}

onMounted(() => {
  // Pre-fill from prefs on load/refresh without opening suggestions
  const prefs = usePrefs()
  if (prefs.where.value) {
    placeName.value = prefs.where.value.name
    query.value = prefs.where.value.name
    allowSuggest.value = false
  }
  if (!useGoogle) return
  const g = (window as any).google
  if (!g?.maps?.places) return
  const el = inputRef.value?.$el?.querySelector('input') || inputRef.value?.input
  if (!el) return
  const ac = new g.maps.places.Autocomplete(el as HTMLInputElement, { fields: ['geometry','name','formatted_address'] })
  console.log('[PlaceSearch] Google Autocomplete initialised')
  ac.addListener('place_changed', () => {
    const p = ac.getPlace()
    const loc = p?.geometry?.location
    if (!loc) return
    const lat4 = Number(loc.lat().toFixed(4))
    const lon4 = Number(loc.lng().toFixed(4))
    const rawName = p.formatted_address || p.name || ''
    const nameShort = normalizeName(rawName)
    placeName.value = nameShort
    query.value = nameShort
    emit('picked', { lat: lat4, lon: lon4, name: nameShort })
    console.log('[PlaceSearch] emitted picked (autocomplete)', { lat4, lon4, nameShort })
  })
})
</script>
