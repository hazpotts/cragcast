<template>
  <div>
    <UTable :rows="rowsWithSort" :columns="columns" :sort="sort" @update:sort="onSort">
      <template #name-data="{ row }">
        <div class="flex items-center gap-1">
          <UButton
            v-if="row.cragCount > 0"
            variant="ghost"
            size="xs"
            :aria-label="isExpanded(row.id) ? 'Collapse crags' : 'Expand crags'"
            @click="toggleExpand(row.id)"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 -ml-1"
          >
            <Icon :name="isExpanded(row.id) ? 'heroicons:chevron-down' : 'heroicons:chevron-right'" class="h-4 w-4" />
          </UButton>
          <span :class="{ 'ml-5': !row.cragCount }">{{ row.name }}</span>
          <span v-if="row.cragCount > 0" class="text-xs text-gray-400 dark:text-gray-500">({{ row.cragCount }})</span>
        </div>
        <div v-if="isExpanded(row.id)" class="mt-1">
          <CragList :crags="expandedCrags[row.id] || []" :pending="expandedPending[row.id] || false" />
        </div>
      </template>
      <template #fav-data="{ row }">
        <div class="flex items-center gap-1">
          <UButton
            variant="ghost"
            size="xs"
            :aria-label="isFaved(row.id) ? 'Unfavourite' : 'Favourite'"
            @click="toggle(row.id)"
            class="text-yellow-500 hover:text-yellow-600"
          >
            <Icon :name="isFaved(row.id) ? 'heroicons-solid:star' : 'heroicons:star'" class="h-5 w-5" />
          </UButton>
          <UButton
            v-if="isRemovable(row.id)"
            variant="ghost"
            size="xs"
            aria-label="Remove custom crag"
            @click="emit('remove', row.id)"
            class="text-red-400 hover:text-red-600"
          >
            <Icon name="heroicons-solid:trash" class="h-4 w-4" />
          </UButton>
        </div>
      </template>
      <template #areaSort-data="{ row }">
        {{ row.pending ? '…' : row.area }}
      </template>
      <template #avgTempC-header="{ column }">
        <span class="flex items-start gap-1"><Icon name="meteocons:thermometer" class="h-4 w-4 text-current shrink-0" />{{ column.label }}</span>
      </template>
      <template #avgWindMph-header="{ column }">
        <span class="flex items-start gap-1"><Icon name="meteocons:wind" class="h-4 w-4 text-current shrink-0" />{{ column.label }}</span>
      </template>
      <template #avgRainMm-header="{ column }">
        <span class="flex items-start gap-1"><Icon name="meteocons:raindrops" class="h-4 w-4 text-current shrink-0" />{{ column.label }}</span>
      </template>
      <template #distanceMins-header="{ column }">
        <span class="flex items-start gap-1"><Icon name="heroicons:map-pin" class="h-4 w-4 text-current shrink-0" />{{ column.label }}</span>
      </template>
      <template #score-header="{ column }">
        <UPopover>
          <span class="flex items-center gap-1 cursor-pointer">{{ column.label }} <Icon name="heroicons:information-circle" class="h-4 w-4 text-gray-400" /></span>
          <template #panel>
            <div class="p-3 max-w-[280px] text-sm text-gray-700 dark:text-gray-200">
              A combined score out of 100 reflecting overall climbing conditions, including weather, distance, and other factors.
            </div>
          </template>
        </UPopover>
      </template>
      <template #score-data="{ row }">
        <span class="font-semibold">{{ row.pending ? '…' : row.score }}</span>
      </template>
      <template #warnings-data="{ row }">
        <template v-if="!row.pending && !row.error && row.warnings?.length">
          <div class="flex flex-col gap-1">
            <UTooltip v-for="(w, i) in row.warnings" :key="i" :text="w.message">
              <Icon
                name="heroicons:exclamation-triangle-20-solid"
                class="h-5 w-5"
                :class="w.level === 'red' ? 'text-red-500' : 'text-amber-500'"
              />
            </UTooltip>
          </div>
        </template>
      </template>
      <template #weather-data="{ row }">
        <div class="inline-flex justify-center bg-slate-400 rounded px-2 py-1">
          <template v-if="row.pending">
            <div class="flex items-center gap-2 text-lg text-gray-300">
              <span class="animate-pulse">•</span>
              <span class="animate-pulse">•</span>
              <span class="animate-pulse">•</span>
            </div>
          </template>
          <template v-else>
            <div class="flex items-center gap-2">
              <template v-for="d in row.daily" :key="d.date">
                <img :src="iconSrc(d.icon)" :alt="iconLabel(d.icon)" :title="`${iconLabel(d.icon)} – ${d.date}`" class="h-7 w-7 shrink-0" />
              </template>
            </div>
          </template>
        </div>
      </template>
      <template #avgTempC-data="{ row }">
        {{ row.pending ? '…' : units.convertTemp(row.avgTempC) }}
      </template>
      <template #avgWindMph-data="{ row }">
        {{ row.pending ? '…' : units.convertWind(row.avgWindMph) }}
      </template>
      <template #avgRainMm-data="{ row }">
        {{ row.pending ? '…' : units.convertRain(row.avgRainMm) }}
      </template>
      <template #distanceMins-data="{ row }">
        <template v-if="row.pending">…</template>
        <template v-else-if="Number.isFinite(row.distanceMins) && row.distanceMins > 0">{{ units.convertDistance(row.distanceMins) }}</template>
      </template>
      <template #ukc-data="{ row }">
        <template v-if="row.pending">
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
            <a v-if="row.links?.yrno" :href="row.links.yrno" target="_blank" rel="noopener" class="text-gray-500 hover:text-gray-700 underline flex items-center">
              Yr <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
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
import { reactive, computed, ref } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import { useUnits } from '~/composables/useUnits'
import { useCrags, type CragItem } from '~/composables/useCrags'
import CragList from '~/components/CragList.vue'
const props = defineProps<{ rows: any[]; favourites?: string[]; removableIds?: string[] }>()
const emit = defineEmits<{ (e:'toggle-favourite', id: string): void; (e:'remove', id: string): void }>()

// --- Expandable crag sub-rows ---
const expandedRegions = ref<Set<string>>(new Set())
const expandedCrags = ref<Record<string, CragItem[]>>({})
const expandedPending = ref<Record<string, boolean>>({})
const { fetchCrags } = useCrags()
const prefs = usePrefs()

function isExpanded(regionId: string) {
  return expandedRegions.value.has(regionId)
}

async function toggleExpand(regionId: string) {
  if (expandedRegions.value.has(regionId)) {
    expandedRegions.value.delete(regionId)
    // Force reactivity
    expandedRegions.value = new Set(expandedRegions.value)
    return
  }

  expandedRegions.value.add(regionId)
  expandedRegions.value = new Set(expandedRegions.value)

  // Fetch crags if not already loaded
  if (!expandedCrags.value[regionId]) {
    expandedPending.value = { ...expandedPending.value, [regionId]: true }
    const w = prefs.where.value as any
    const items = await fetchCrags(regionId, {
      lat: Number(w?.lat) || undefined,
      lon: Number(w?.lon) || undefined,
      dates: (prefs.dates.value || []).join(','),
      minDriveMins: prefs.minDriveMins.value > 0 ? prefs.minDriveMins.value : undefined,
      maxDriveMins: Number.isFinite(prefs.maxDriveMins.value) ? prefs.maxDriveMins.value : undefined
    })
    expandedCrags.value = { ...expandedCrags.value, [regionId]: items }
    expandedPending.value = { ...expandedPending.value, [regionId]: false }
  }
}
const rowsWithSort = computed(() => (props.rows || []).map((r: any) => ({
  ...r,
  areaSort: `${r?.area ?? ''} | ${r?.name ?? ''}`
})))
function isFaved(id: string) { return Array.isArray(props.favourites) && props.favourites.includes(id) }
function isRemovable(id: string) { return Array.isArray(props.removableIds) && props.removableIds.includes(id) }
function toggle(id: string) { emit('toggle-favourite', id) }
const units = useUnits()
// Show distance column when any distance filter is active
const showDistance = computed(() => Number.isFinite(prefs.maxDriveMins.value) || prefs.minDriveMins.value > 0)
const columns = computed(() => {
  const cols = [
    { key: 'name', label: 'Region' },
    { key: 'warnings', label: '' },
    { key: 'weather', label: 'Weather' },
    { key: 'avgTempC', label: `Temp (${units.tempLabel.value})` },
    { key: 'avgWindMph', label: `Wind (${units.windLabel.value})` },
    { key: 'avgRainMm', label: `Rain (${units.rainLabel.value})` },
    // distance inserted conditionally at index 6
    { key: 'areaSort', label: 'Area', sortable: true },
    { key: 'score', label: 'Score', sortable: true },
    { key: 'ukc', label: 'Links' },
    { key: 'fav', label: 'Favourite' }
  ] as any[]
  if (showDistance.value) cols.splice(6, 0, { key: 'distanceMins', label: `Distance (${units.distanceLabel.value})`, sortable: true })
  return cols
})
let sort = reactive({ column: 'score', direction: 'desc' as const })
function onSort(s: any) { sort = s }

import iconSun from '~/assets/images/icons/SVGs/wsymbol_0001_sunny.svg'
import iconHazySun from '~/assets/images/icons/SVGs/wsymbol_0005_hazy_sun.svg'
import iconLightCloud from '~/assets/images/icons/SVGs/wsymbol_0002_sunny_intervals.svg'
import iconCloud from '~/assets/images/icons/SVGs/wsymbol_0003_white_cloud.svg'
import iconMostlyCloudy from '~/assets/images/icons/SVGs/wsymbol_0043_mostly_cloudy.svg'
import iconDarkCloud from '~/assets/images/icons/SVGs/wsymbol_0004_black_low_cloud.svg'
import iconDrizzle from '~/assets/images/icons/SVGs/wsymbol_0048_drizzle.svg'
import iconRain from '~/assets/images/icons/SVGs/wsymbol_0017_cloudy_with_light_rain.svg'
import iconHeavyRain from '~/assets/images/icons/SVGs/wsymbol_0018_cloudy_with_heavy_rain.svg'
import iconFreezingRain from '~/assets/images/icons/SVGs/wsymbol_0050_freezing_rain.svg'
import iconSleet from '~/assets/images/icons/SVGs/wsymbol_0021_cloudy_with_sleet.svg'
import iconSnow from '~/assets/images/icons/SVGs/wsymbol_0019_cloudy_with_light_snow.svg'
import iconHeavySnow from '~/assets/images/icons/SVGs/wsymbol_0020_cloudy_with_heavy_snow.svg'
import iconBlizzard from '~/assets/images/icons/SVGs/wsymbol_0054_blizzard.svg'
import iconThunder from '~/assets/images/icons/SVGs/wsymbol_0024_thunderstorms.svg'
import iconWindy from '~/assets/images/icons/SVGs/wsymbol_0060_windy.svg'

function iconSrc(code: string): string {
  switch (code) {
    case 'sun': return iconSun
    case 'hazy-sun': return iconHazySun
    case 'light-cloud': return iconLightCloud
    case 'cloud': return iconCloud
    case 'mostly-cloudy': return iconMostlyCloudy
    case 'dark-cloud': return iconDarkCloud
    case 'drizzle': return iconDrizzle
    case 'rain': return iconRain
    case 'heavy-rain': return iconHeavyRain
    case 'freezing-rain': return iconFreezingRain
    case 'sleet': return iconSleet
    case 'snow': return iconSnow
    case 'heavy-snow': return iconHeavySnow
    case 'blizzard': return iconBlizzard
    case 'thunder': return iconThunder
    case 'windy': return iconWindy
    default: return iconCloud
  }
}
function iconLabel(code: string): string {
  switch (code) {
    case 'sun': return 'Sunny'
    case 'hazy-sun': return 'Hazy sun'
    case 'light-cloud': return 'Partly cloudy'
    case 'cloud': return 'Cloudy'
    case 'mostly-cloudy': return 'Mostly cloudy'
    case 'dark-cloud': return 'Overcast'
    case 'drizzle': return 'Drizzle'
    case 'rain': return 'Rain'
    case 'heavy-rain': return 'Heavy rain'
    case 'freezing-rain': return 'Freezing rain'
    case 'sleet': return 'Sleet'
    case 'snow': return 'Snow'
    case 'heavy-snow': return 'Heavy snow'
    case 'blizzard': return 'Blizzard'
    case 'thunder': return 'Thunderstorms'
    case 'windy': return 'Windy'
    default: return 'Cloudy'
  }
}
</script>
