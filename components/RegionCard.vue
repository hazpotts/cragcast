<template>
  <UCard>
    <div class="flex gap-4 items-start flex-col sm:flex-row">
      <!-- Left: content -->
      <div class="flex-1 min-w-0 space-y-2">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold truncate">{{ name }}</h3>
          <!-- score retained in code, intentionally not displayed -->
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
        <div class="text-sm" v-if="Number.isFinite(distanceMins as any) && (distanceMins as any) > 0">
          <div>
            Distance: ~{{ units.convertDistance(distanceMins as number) }} {{ units.distanceLabel.value }}
          </div>
        </div>
      </div>
      <!-- Right: large weather icons -->
      <div class="w-full sm:w-auto sm:flex-1 flex justify-center">
        <div class="flex flex-wrap gap-2 items-start justify-center sm:justify-end bg-gray-400 rounded px-2 py-1">
          <template v-for="d in daily" :key="d.date">
            <div class="flex items-center sm:flex-col sm:items-center text-sm text-gray-600 dark:text-gray-300">
              <img
                :src="iconSrc(d.icon)"
                :alt="iconLabel(d.icon)"
                :title="`${iconLabel(d.icon)} – ${d.date}`"
                class="h-20 w-20 sm:h-24 sm:w-24 mr-3 sm:mr-0 sm:-mt-4 sm:-mb-3"
              />
              <div class="mt-0 sm:mt-1 sm:mb-2 text-left sm:text-center">
                <div v-if="Number.isFinite(d.tempAvgC as any)">{{ units.convertTemp(d.tempAvgC) }}{{ units.tempLabel.value }}</div>
                <div v-if="Number.isFinite(d.rainSumMm as any)">{{ units.convertRain(d.rainSumMm) }} {{ units.rainLabel.value }}</div>
                <div v-if="Number.isFinite(d.windAvgMph as any)">{{ units.convertWind(d.windAvgMph) }} {{ units.windLabel.value }}</div>
              </div>
            </div>
          </template>
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
import { useLocalStorage } from '@vueuse/core'
import { useUnits } from '~/composables/useUnits'
const units = useUnits()
const router = useRouter()
const route = useRoute()
function goToTable() {
  const modeStorage = useLocalStorage<'table'|'cards'>('mode', 'table')
  modeStorage.value = 'table'
  router.push({ path: '/table', query: { ...route.query } })
}
const props = defineProps<{
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
}>()

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
