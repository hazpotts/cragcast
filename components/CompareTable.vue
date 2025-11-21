<template>
  <div>
    <UTable :rows="rowsWithSort" :columns="columns" :sort="sort" @update:sort="onSort">
      <template #fav-data="{ row }">
        <UButton
          variant="ghost"
          size="xs"
          :aria-label="isFaved(row.id) ? 'Unfavourite' : 'Favourite'"
          @click="toggle(row.id)"
          class="text-yellow-500 hover:text-yellow-600"
        >
          <Icon :name="isFaved(row.id) ? 'heroicons-solid:star' : 'heroicons:star'" class="h-5 w-5" />
        </UButton>
      </template>
      <template #areaSort-data="{ row }">
        <template v-if="row.error">
          <span class="text-red-500">Failed</span>
        </template>
        <template v-else>
          {{ row.pending ? '…' : row.area }}
        </template>
      </template>
      <template #score-data="{ row }">
        <template v-if="row.error">
          <span class="text-red-500">—</span>
        </template>
        <template v-else>
          <span class="font-semibold">{{ row.pending ? '…' : row.score }}</span>
        </template>
      </template>
      <template #weather-data="{ row }">
        <div class="flex justify-center bg-gray-400 rounded px-2 py-1">
          <template v-if="row.error">
            <div class="flex items-center gap-2">
              <Icon name="heroicons:exclamation-triangle" class="h-6 w-6 text-red-500" title="Failed to load weather data" />
            </div>
          </template>
          <template v-else-if="row.pending">
            <div class="flex items-center gap-2 text-lg text-gray-300">
              <span class="animate-pulse">•</span>
              <span class="animate-pulse">•</span>
              <span class="animate-pulse">•</span>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center gap-2">
              <template v-for="d in row.daily" :key="d.date">
                <Icon :name="iconName(d.icon)" :title="`${iconLabel(d.icon)} – ${d.date}`" class="h-7 w-7" />
              </template>
            </div>
          </template>
        </div>
      </template>
      <template #avgTempC-data="{ row }">
        <template v-if="row.error">
          <span class="text-red-500">—</span>
        </template>
        <template v-else>
          {{ row.pending ? '…' : `${row.avgTempC} °C` }}
        </template>
      </template>
      <template #avgWindMph-data="{ row }">
        <template v-if="row.error">
          <span class="text-red-500">—</span>
        </template>
        <template v-else>
          {{ row.pending ? '…' : `${row.avgWindMph} mph` }}
        </template>
      </template>
      <template #avgRainMm-data="{ row }">
        <template v-if="row.error">
          <span class="text-red-500">—</span>
        </template>
        <template v-else>
          {{ row.pending ? '…' : `${row.avgRainMm} mm` }}
        </template>
      </template>
      <template #distanceMins-data="{ row }">
        <template v-if="row.error">
          <span class="text-red-500">—</span>
        </template>
        <template v-else-if="row.pending">…</template>
        <template v-else-if="Number.isFinite(row.distanceMins) && row.distanceMins > 0">{{ `${row.distanceMins} mins` }}</template>
        <!-- else: render nothing to hide the dash -->
      </template>
      <template #updatedAt-data="{ row }">
        <template v-if="row.error">
          <span class="text-red-500">—</span>
        </template>
        <template v-else>
          <span>{{ row.pending ? '…' : new Date(row.updatedAt).toLocaleString() }}</span>
        </template>
      </template>
      <template #ukc-data="{ row }">
        <template v-if="row.error">
          <span class="text-red-500">—</span>
        </template>
        <template v-else-if="row.pending">
          <span class="text-gray-400">—</span>
        </template>
        <template v-else>
          <div class="flex items-center gap-2">
            <a :href="row.links?.bbc" target="_blank" rel="noopener" class="text-gray-500 hover:text-gray-700 underline flex items-center">
              BBC <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
            </a>
            <a :href="row.links?.metoffice" target="_blank" rel="noopener" class="text-gray-500 hover:text-gray-700 underline flex items-center">
              Met Office <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
            </a>
            <a :href="row.links?.windy" target="_blank" rel="noopener" class="text-gray-500 hover:text-gray-700 underline flex items-center">
              Windy <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
            </a>
            <a :href="row.ukcUrl" target="_blank" rel="noopener" class="text-gray-500 hover:text-gray-700 underline flex items-center">
              UKC <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
            </a>
          </div>
        </template>
      </template>
    </UTable>
  </div>
</template>
<script setup lang="ts">
import { reactive, computed } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
const props = defineProps<{ rows: any[]; favourites?: string[] }>()
const emit = defineEmits<{ (e:'toggle-favourite', id: string): void }>()
const rowsWithSort = computed(() => (props.rows || []).map((r: any) => ({
  ...r,
  areaSort: `${r?.area ?? ''} | ${r?.name ?? ''}`
})))
function isFaved(id: string) { return Array.isArray(props.favourites) && props.favourites.includes(id) }
function toggle(id: string) { emit('toggle-favourite', id) }
// don't include distance if mindrive not set
const prefs = usePrefs()
const showDistance = computed(() => Number.isFinite(prefs.maxDriveMins.value))
const columns = computed(() => {
  const cols = [
    { key: 'name', label: 'Region' },
    { key: 'weather', label: 'Weather' },
    { key: 'avgTempC', label: 'Avg Temp' },
    { key: 'avgWindMph', label: 'Avg Wind' },
    { key: 'avgRainMm', label: 'Avg Rain' },
    { key: 'updatedAt', label: 'Updated' },
    // distance inserted conditionally at index 6
    { key: 'areaSort', label: 'Area', sortable: true },
    { key: 'score', label: 'Score', sortable: true },
    { key: 'ukc', label: 'Links' },
    { key: 'fav', label: 'Favourite' }
  ] as any[]
  if (showDistance.value) cols.splice(6, 0, { key: 'distanceMins', label: 'Distance', sortable: true })
  return cols
})
let sort = reactive({ column: 'score', direction: 'desc' as const })
function onSort(s: any) { sort = s }

function iconName(code: string): string {
  switch (code) {
    case 'sun': return 'meteocons:clear-day-fill'
    case 'light-cloud': return 'meteocons:partly-cloudy-day-fill'
    case 'cloud': return 'meteocons:cloudy-fill'
    case 'dark-cloud': return 'meteocons:overcast-fill'
    case 'rain': return 'meteocons:rain-fill'
    case 'heavy-rain': return 'meteocons:extreme-rain-fill'
    case 'thunder': return 'meteocons:thunderstorms-fill'
    case 'snow': return 'meteocons:snow-fill'
    case 'sleet': return 'meteocons:sleet-fill'
    default: return 'meteocons:cloudy-fill'
  }
}
function iconLabel(code: string): string {
  switch (code) {
    case 'sun': return 'Sunny'
    case 'light-cloud': return 'Partly cloudy'
    case 'cloud': return 'Cloudy'
    case 'dark-cloud': return 'Overcast'
    case 'rain': return 'Rain'
    case 'heavy-rain': return 'Heavy rain'
    case 'thunder': return 'Thunderstorms'
    case 'snow': return 'Snow'
    case 'sleet': return 'Sleet'
    default: return 'Cloudy'
  }
}
// Built-in colours from Meteocons, no custom classes needed
</script>
