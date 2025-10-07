<template>
  <UCard>
    <div class="flex gap-4 items-start">
      <!-- Left: content -->
      <div class="flex-1 min-w-0 space-y-2">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold truncate">{{ name }}</h3>
          <!-- score retained in code, intentionally not displayed -->
        </div>
        <div class="text-sm text-gray-500">Updated {{ new Date(updatedAt).toLocaleString() }}</div>
        <ul class="list-disc pl-5 text-sm">
          <li v-for="(w,i) in why" :key="i">{{ w }}</li>
        </ul>
        <div class="text-sm" v-if="Number.isFinite(distanceMins as any) && (distanceMins as any) > 0">
          <div>
            Distance: ~{{ distanceMins }} mins
          </div>
        </div>
      </div>
      <!-- Right: large weather icons -->
      <div class="flex-1 flex justify-center">
        <div class="flex flex-wrap gap-6 items-start justify-end">
          <template v-for="d in daily" :key="d.date">
            <div class="flex flex-col items-center text-sm text-gray-600 dark:text-gray-300">
              <Icon
                :name="iconName(d.icon)"
                :title="`${iconLabel(d.icon)} – ${d.date}`"
                class="h-20 w-20 sm:h-24 sm:w-24 -mt-5 -mb-3"
              />
              <div class="mt-1 mb-2 text-center">
                <div v-if="Number.isFinite(d.tempAvgC as any)">{{ d.tempAvgC }}°C</div>
                <div v-if="Number.isFinite(d.rainSumMm as any)">{{ d.rainSumMm }} mm</div>
                <div v-if="Number.isFinite(d.windAvgMph as any)">{{ d.windAvgMph }} mph</div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
    <!-- Footer: external links bottom-right -->
    <div class="mt-4 flex justify-end">
      <div class="flex items-center gap-2">
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
const props = defineProps<{
  name: string
  score: number
  why: string[]
  daily: { date: string; icon: string }[]
  distanceMins: number | null
  updatedAt: string
  ukcUrl: string
  links?: { bbc: string; metoffice: string; windy: string }
  avgTempC: number
  avgWindMph: number
  avgRainMm: number
}>()

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
</script>
