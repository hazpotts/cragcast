<template>
  <div class="flex flex-col gap-3">
    <div class="flex gap-2">
      <UButton icon="i-heroicons-map-pin" label="Use my location" @click="useGeo" />
      <UInput ref="inputRef" v-model="query" placeholder="Search a place" @keydown.enter="geocode" class="w-80" />
      <UButton label="Search" @click="geocode" />
    </div>
    <div class="text-sm text-gray-500" v-if="placeName">Selected: {{ placeName }}</div>
  </div>
</template>
<script setup lang="ts">
const emit = defineEmits<{ (e:'picked', v:{ lat:number; lon:number; name:string }): void }>()
const cfg = useRuntimeConfig() as any
const pub = cfg.public || {}
const useGoogle = !!pub.googlePlacesEnabled && !!pub.googlePlacesApiKey
const query = ref('')
const placeName = ref('')
const inputRef = ref<any>(null)

async function useGeo() {
  console.log('[PlaceSearch] useGeo clicked')
  if (!('geolocation' in navigator)) return
  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords
    placeName.value = 'My location'
    console.log('[PlaceSearch] geolocation success', { latitude, longitude })
    emit('picked', { lat: latitude, lon: longitude, name: 'My location' })
    console.log('[PlaceSearch] emitted picked (geo)')
  })
}

async function geocode() {
  console.log('[PlaceSearch] geocode start', { query: query.value, useGoogle })
  if (!query.value) return
  try {
    if (useGoogle && (window as any).google?.maps?.places) {
      // Use Places Text Search via PlacesService with a dummy map
      const service = new (window as any).google.maps.places.PlacesService(document.createElement('div'))
      service.textSearch({ query: query.value }, (results: any[], status: any) => {
        console.log('[PlaceSearch] google textSearch callback', { status, count: results?.length })
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && results[0]) {
          const r = results[0]
          const lat = r.geometry.location.lat()
          const lon = r.geometry.location.lng()
          placeName.value = r.formatted_address || r.name
          emit('picked', { lat, lon, name: placeName.value })
          console.log('[PlaceSearch] emitted picked (google)', { lat, lon, name: placeName.value })
        }
      })
      return
    }
    console.log('[PlaceSearch] using OSM/Nominatim')
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', query.value)
    url.searchParams.set('format', 'json')
    const res = await fetch(url.toString(), { headers: { 'Accept': 'application/json' } })
    const data = await res.json()
    console.log('[PlaceSearch] OSM response', { count: Array.isArray(data) ? data.length : null })
    if (Array.isArray(data) && data[0]) {
      const lat = parseFloat(data[0].lat)
      const lon = parseFloat(data[0].lon)
      placeName.value = data[0].display_name
      emit('picked', { lat, lon, name: placeName.value })
      console.log('[PlaceSearch] emitted picked (osm)', { lat, lon, name: placeName.value })
    }
  } catch (e) {}
}

onMounted(() => {
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
    const lat = loc.lat()
    const lon = loc.lng()
    placeName.value = p.formatted_address || p.name
    query.value = placeName.value
    emit('picked', { lat, lon, name: placeName.value })
    console.log('[PlaceSearch] emitted picked (autocomplete)', { lat, lon, name: placeName.value })
  })
})
</script>
