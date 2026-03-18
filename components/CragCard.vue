<template>
  <UCard :ui="{ body: { padding: 'p-0 sm:p-0' } }">
    <!-- Weather icons – full-width header -->
    <div class="flex items-center gap-2 bg-slate-400 rounded-t-md px-2 py-1.5 justify-center">
      <img
        v-for="d in crag.daily"
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
        <h3 class="text-sm font-semibold truncate">{{ crag.name }}</h3>
        <span
          class="text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1"
          :class="crag.score >= 70
            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
            : crag.score >= 40
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'"
        >{{ crag.score }}</span>
      </div>

      <!-- Why bullets -->
      <ul class="list-disc pl-4 text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
        <li v-for="(w, i) in crag.why" :key="i">{{ w }}</li>
      </ul>

      <!-- Stats -->
      <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
        <span v-if="Number.isFinite(crag.avgTempC)" class="inline-flex items-center gap-0.5">
          <Icon name="lucide:thermometer" class="h-3 w-3 text-current" />{{ units.convertTemp(crag.avgTempC) }}{{ units.tempLabel.value }}
        </span>
        <span v-if="Number.isFinite(crag.avgWindMph)" class="inline-flex items-center gap-0.5">
          <Icon name="lucide:wind" class="h-3 w-3 text-current" />{{ units.convertWind(crag.avgWindMph) }} {{ units.windLabel.value }}
        </span>
        <span v-if="Number.isFinite(crag.avgRainMm)" class="inline-flex items-center gap-0.5">
          <Icon name="lucide:droplets" class="h-3 w-3 text-current" />{{ units.convertRain(crag.avgRainMm) }} {{ units.rainLabel.value }}
        </span>
        <span v-if="crag.distanceMins > 0" class="inline-flex items-center gap-0.5">
          <Icon name="heroicons:map-pin" class="h-3 w-3 text-current" />~{{ units.convertDistance(crag.distanceMins) }} {{ units.distanceLabel.value }}
        </span>
      </div>

      <!-- Crag details: aspect, rock, types -->
      <div class="flex flex-wrap gap-1 text-xs">
        <span v-if="crag.aspect" class="inline-flex items-center gap-0.5 text-gray-500 dark:text-gray-400">
          <Icon name="heroicons:arrow-up" class="h-3 w-3 inline-block" :style="{ transform: `rotate(${aspectRotation(crag.aspect)}deg)` }" />{{ crag.aspect }}
        </span>
        <span v-if="crag.rock.length" class="text-gray-500 dark:text-gray-400">{{ crag.rock.join(', ') }}</span>
        <span v-if="crag.types.trad" class="px-1 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200">trad</span>
        <span v-if="crag.types.sport" class="px-1 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">sport</span>
        <span v-if="crag.types.boulder" class="px-1 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">boulder</span>
        <span v-if="crag.routeCount" class="text-gray-400 dark:text-gray-500">{{ crag.routeCount }} routes</span>
      </div>

      <!-- Warnings -->
      <div v-if="crag.warnings?.length" class="flex items-center gap-1">
        <UTooltip v-for="(w, i) in crag.warnings" :key="i" :text="w.message">
          <Icon
            name="heroicons:exclamation-triangle-20-solid"
            class="h-4 w-4"
            :class="w.level === 'red' ? 'text-red-500' : 'text-amber-500'"
          />
        </UTooltip>
      </div>

      <!-- Modifiers -->
      <div v-if="crag.modifiers.length" class="flex flex-wrap gap-1">
        <span
          v-for="(mod, i) in crag.modifiers"
          :key="i"
          class="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
        >{{ mod }}</span>
      </div>

      <!-- External links -->
      <div class="flex flex-wrap items-center gap-1">
        <a v-if="crag.links?.bbc" :href="crag.links.bbc" target="_blank" rel="noopener"
           class="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          BBC
        </a>
        <a v-if="crag.links?.metoffice" :href="crag.links.metoffice" target="_blank" rel="noopener"
           class="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          Met
        </a>
        <a v-if="crag.links?.windy" :href="crag.links.windy" target="_blank" rel="noopener"
           class="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          Windy
        </a>
        <a v-if="crag.links?.yrno" :href="crag.links.yrno" target="_blank" rel="noopener"
           class="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          Yr
        </a>
        <a :href="crag.ukcUrl" target="_blank" rel="noopener"
           class="inline-flex items-center px-2 py-1 rounded text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          UKC
        </a>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { useUnits } from '~/composables/useUnits'
import type { CragItem } from '~/composables/useCrags'

defineProps<{ crag: CragItem }>()

const units = useUnits()

const ASPECT_ROTATIONS: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315
}
function aspectRotation(aspect: string): number {
  return ASPECT_ROTATIONS[aspect] ?? 0
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
