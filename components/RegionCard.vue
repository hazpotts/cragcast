<template>
  <!-- Compact card layout -->
  <UCard v-if="compact" :ui="{ body: { padding: 'p-0 sm:p-0' } }">
    <!-- Weather icons – full-width header -->
    <div class="flex items-center gap-2 bg-slate-400 rounded-t-md px-2 py-1.5 justify-center">
      <img
        v-for="d in daily"
        :key="d.date"
        :src="iconSrc(d.icon)"
        :alt="iconLabel(d.icon)"
        :title="`${iconLabel(d.icon)} – ${d.date}`"
        class="h-12 w-12"
      />
    </div>
    <div class="flex flex-col gap-1.5 px-3 py-2.5">
      <!-- Name + score badge -->
      <div class="flex items-center justify-between">
        <h3 class="text-sm font-semibold truncate">{{ name }}</h3>
        <div class="flex items-center gap-1 shrink-0 ml-1">
          <span
            class="text-xs font-bold px-1.5 py-0.5 rounded-full"
            :class="score >= 70
              ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
              : score >= 40
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'"
          >{{ score }}</span>
          <UPopover>
            <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <Icon name="heroicons:information-circle" class="h-3.5 w-3.5" />
            </button>
            <template #panel>
              <div class="p-3 max-w-[260px] text-sm text-gray-700 dark:text-gray-200">
                A combined score out of 100 reflecting overall climbing conditions, including weather, distance, and other factors.
              </div>
            </template>
          </UPopover>
        </div>
      </div>
      <!-- Stats with icons -->
      <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
        <span v-if="Number.isFinite(avgTempC)" class="inline-flex items-center gap-0.5">
          <Icon name="lucide:thermometer" class="h-3 w-3 text-current" />{{ units.convertTemp(avgTempC) }}{{ units.tempLabel.value }}
        </span>
        <span v-if="Number.isFinite(avgWindMph)" class="inline-flex items-center gap-0.5">
          <Icon name="lucide:wind" class="h-3 w-3 text-current" />{{ units.convertWind(avgWindMph) }} {{ units.windLabel.value }}
        </span>
        <span v-if="Number.isFinite(avgRainMm)" class="inline-flex items-center gap-0.5">
          <Icon name="lucide:droplets" class="h-3 w-3 text-current" />{{ units.convertRain(avgRainMm) }} {{ units.rainLabel.value }}
        </span>
        <span v-if="Number.isFinite(distanceMins as any) && (distanceMins as any) > 0" class="inline-flex items-center gap-0.5">
          <Icon name="heroicons:map-pin" class="h-3 w-3 text-current" />~{{ units.convertDistance(distanceMins as number) }} {{ units.distanceLabel.value }}
        </span>
      </div>
      <!-- Warnings -->
      <div v-if="warnings?.length" class="flex items-center gap-1">
        <UTooltip v-for="(w, i) in warnings" :key="i" :text="w.message">
          <Icon
            name="heroicons:exclamation-triangle-20-solid"
            class="h-4 w-4"
            :class="w.level === 'red' ? 'text-red-500' : 'text-amber-500'"
          />
        </UTooltip>
      </div>
      <!-- Links – shortened labels, single row -->
      <div class="flex flex-wrap items-center gap-1">
        <a v-if="links?.bbc" :href="links.bbc" target="_blank" rel="noopener"
           class="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          BBC
        </a>
        <a v-if="links?.metoffice" :href="links.metoffice" target="_blank" rel="noopener"
           class="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          Met
        </a>
        <a v-if="links?.windy" :href="links.windy" target="_blank" rel="noopener"
           class="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          Windy
        </a>
        <a v-if="links?.yrno" :href="links.yrno" target="_blank" rel="noopener"
           class="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          Yr
        </a>
        <a :href="ukcUrl" target="_blank" rel="noopener"
           class="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          UKC
        </a>
        <button
          v-if="cragCount > 0 && isCragGranularity"
          @click="toggleCrags"
          class="inline-flex items-center gap-0.5 px-2 py-1 rounded text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-200 dark:hover:bg-emerald-900/50"
        >
          <Icon :name="showCrags ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" class="h-3 w-3" />
          {{ cragCount }} crags
        </button>
      </div>
      <!-- Expandable crag cards -->
      <div v-if="showCrags && cragCount > 0 && isCragGranularity" class="mt-1 border-t border-gray-100 dark:border-gray-700 pt-2">
        <div v-if="cragsPending" class="flex items-center gap-2 py-2 text-sm text-gray-500">
          <Icon name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />Loading crags…
        </div>
        <div v-else-if="!cragItems.length" class="py-2 text-sm text-gray-400">No crag data available</div>
        <div v-else class="grid grid-cols-1 gap-2">
          <CragCard v-for="crag in cragItems" :key="crag.id" :crag="crag" />
        </div>
      </div>
    </div>
  </UCard>
  <!-- Full card layout -->
  <UCard v-else>
    <div class="flex gap-4 items-start flex-col sm:flex-row">
      <!-- Left: content -->
      <div class="flex-1 min-w-0 space-y-2">
        <div class="flex items-start justify-between">
          <h3 class="text-lg font-semibold truncate">{{ name }}</h3>
          <div class="flex items-center gap-1.5 ml-2 shrink-0">
            <span
              class="text-base font-bold px-2.5 py-1 rounded-full"
              :class="score >= 70
                ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
                : score >= 40
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
                  : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'"
            >{{ score }}</span>
            <UPopover>
              <button class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <Icon name="heroicons:information-circle" class="h-4 w-4" />
              </button>
              <template #panel>
                <div class="p-3 max-w-[280px] text-sm text-gray-700 dark:text-gray-200">
                  A combined score out of 100 reflecting overall climbing conditions, including weather, distance, and other factors.
                </div>
              </template>
            </UPopover>
          </div>
        </div>
        <div v-if="warnings?.length" class="space-y-1">
          <div
            v-for="(w, i) in warnings"
            :key="i"
            class="flex items-center gap-1.5 text-sm font-medium rounded px-2 py-1"
            :class="w.level === 'red'
              ? 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'"
          >
            <Icon name="heroicons:exclamation-triangle-20-solid" class="h-4 w-4 shrink-0" />
            {{ w.message }}
          </div>
        </div>
        <ul class="list-disc pl-5 text-sm">
          <li v-for="(w,i) in why" :key="i">{{ w }}</li>
        </ul>
        <div class="text-sm text-gray-600 dark:text-gray-300" v-if="Number.isFinite(distanceMins as any) && (distanceMins as any) > 0">
          <div class="inline-flex items-center gap-0.5">
            <Icon name="heroicons:map-pin" class="h-3.5 w-3.5 text-current" />~{{ units.convertDistance(distanceMins as number) }} {{ units.distanceLabel.value }}
          </div>
        </div>
      </div>
      <!-- Right: large weather icons + stats -->
      <div class="w-full sm:w-auto sm:flex-1 flex justify-center">
        <div class="flex flex-wrap gap-3 items-start justify-center sm:justify-end">
          <template v-for="d in daily" :key="d.date">
            <div class="flex flex-col items-center text-sm text-gray-600 dark:text-gray-300">
              <div class="bg-slate-400 rounded p-1">
                <img
                  :src="iconSrc(d.icon)"
                  :alt="iconLabel(d.icon)"
                  :title="`${iconLabel(d.icon)} – ${d.date}`"
                  class="h-20 w-20 sm:h-24 sm:w-24"
                />
              </div>
              <div class="flex flex-col mt-1 mb-1 items-center text-center text-gray-600 dark:text-gray-300">
                <div v-if="Number.isFinite(d.tempAvgC as any)" class="inline-flex items-center gap-0.5"><Icon name="lucide:thermometer" class="h-3.5 w-3.5 text-current" />{{ units.convertTemp(d.tempAvgC) }}{{ units.tempLabel.value }}</div>
                <div v-if="Number.isFinite(d.rainSumMm as any)" class="inline-flex items-center gap-0.5"><Icon name="lucide:droplets" class="h-3.5 w-3.5 text-current" />{{ units.convertRain(d.rainSumMm) }} {{ units.rainLabel.value }}</div>
                <div v-if="Number.isFinite(d.windAvgMph as any)" class="inline-flex items-center gap-0.5"><Icon name="lucide:wind" class="h-3.5 w-3.5 text-current" />{{ units.convertWind(d.windAvgMph) }} {{ units.windLabel.value }}</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
    <!-- Expandable crag list for full card -->
    <div v-if="cragCount > 0 && isCragGranularity" class="mt-3">
      <button
        @click="toggleCrags"
        class="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
      >
        <Icon :name="showCrags ? 'heroicons:chevron-up' : 'heroicons:chevron-down'" class="h-4 w-4" />
        {{ showCrags ? 'Hide' : 'Show' }} {{ cragCount }} crags in this region
      </button>
      <div v-if="showCrags" class="mt-3">
        <div v-if="cragsPending" class="flex items-center gap-2 py-2 text-sm text-gray-500">
          <Icon name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />Loading crags…
        </div>
        <div v-else-if="!cragItems.length" class="py-2 text-sm text-gray-400">No crag data available</div>
        <div v-else class="grid grid-cols-2 gap-3">
          <CragCard v-for="crag in cragItems" :key="crag.id" :crag="crag" />
        </div>
      </div>
    </div>
    <!-- Footer: table link + external links -->
    <div class="mt-4 flex items-center justify-between">
      <div class="flex flex-wrap items-center gap-2">
        <a v-if="links?.bbc" :href="links?.bbc" target="_blank" rel="noopener"
           class="inline-flex items-center px-3 py-2 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          BBC
          <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
        </a>
        <a v-if="links?.metoffice" :href="links?.metoffice" target="_blank" rel="noopener"
           class="inline-flex items-center px-3 py-2 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          Met Office
          <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
        </a>
        <a v-if="links?.windy" :href="links?.windy" target="_blank" rel="noopener"
           class="inline-flex items-center px-3 py-2 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          Windy
          <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
        </a>
        <a v-if="links?.yrno" :href="links?.yrno" target="_blank" rel="noopener"
           class="inline-flex items-center px-3 py-2 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          Yr
          <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
        </a>
        <a :href="ukcUrl" target="_blank" rel="noopener"
           class="inline-flex items-center px-3 py-2 rounded-md bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          UKC
          <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
        </a>
      </div>
    </div>
  </UCard>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useUnits } from '~/composables/useUnits'
import { usePrefs } from '~/composables/usePrefs'
import { useCrags, type CragItem } from '~/composables/useCrags'
import CragCard from '~/components/CragCard.vue'
const units = useUnits()
const router = useRouter()
const route = useRoute()
function goToTable() {
  const modeStorage = useLocalStorage<'table'|'cards'>('mode', 'table')
  modeStorage.value = 'table'
  router.push({ path: '/table', query: { ...route.query } })
}
const props = defineProps<{
  regionId?: string
  name: string
  score: number
  why: string[]
  warnings?: { level: string; type: string; message: string }[]
  daily: { date: string; icon: string; tempAvgC: number; windAvgMph: number; rainSumMm: number }[]
  distanceMins: number | null
  ukcUrl: string
  links?: { bbc: string; metoffice: string; windy: string; yrno?: string }
  avgTempC: number
  avgWindMph: number
  avgRainMm: number
  compact?: boolean
  cragCount?: number
}>()

// Crag expansion
const showCrags = ref(false)
const cragItems = ref<CragItem[]>([])
const cragsPending = ref(false)
const { fetchCrags } = useCrags()
const prefs = usePrefs()

const cragCount = computed(() => props.cragCount || 0)
const isCragGranularity = computed(() => prefs.granularity.value === 'crag')

async function toggleCrags() {
  showCrags.value = !showCrags.value
  if (showCrags.value && !cragItems.value.length && props.regionId) {
    cragsPending.value = true
    const w = prefs.where.value as any
    cragItems.value = await fetchCrags(props.regionId, {
      lat: Number(w?.lat) || undefined,
      lon: Number(w?.lon) || undefined,
      dates: (prefs.dates.value || []).join(','),
      minDriveMins: prefs.minDriveMins.value > 0 ? prefs.minDriveMins.value : undefined,
      maxDriveMins: Number.isFinite(prefs.maxDriveMins.value) ? prefs.maxDriveMins.value : undefined
    })
    cragsPending.value = false
  }
}

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
