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
      <div class="flex-1 flex justify-end">
        <div class="flex flex-wrap gap-4 items-center justify-end">
          <template v-for="d in daily" :key="d.date">
            <Icon
              :name="iconName(d.icon)"
              :title="`${iconLabel(d.icon)} – ${d.date}`"
              class="h-24 w-24 sm:h-28 sm:w-28"
            />
          </template>
        </div>
      </div>
    </div>
    <!-- Footer: external links bottom-right -->
    <div class="mt-4 flex justify-end">
      <div class="flex items-center gap-2">
        <UButton v-if="links?.bbc" :href="links?.bbc" target="_blank" variant="soft" class="bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          BBC
          <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
        </UButton>
        <UButton v-if="links?.metoffice" :href="links?.metoffice" target="_blank" variant="soft" class="bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          Met Office
          <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
        </UButton>
        <UButton v-if="links?.windy" :href="links?.windy" target="_blank" variant="soft" class="bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          Windy
          <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
        </UButton>
        <UButton :href="ukcUrl" target="_blank" variant="soft" class="bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-200 dark:hover:bg-sky-900/50">
          UKC
          <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-1 h-4 w-4" />
        </UButton>
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
}>()

function iconName(code: string): string {
  switch (code) {
    case 'sun': return 'meteocons:clear-day'
    case 'light-cloud': return 'meteocons:partly-cloudy-day'
    case 'cloud': return 'meteocons:cloudy'
    case 'dark-cloud': return 'meteocons:overcast'
    case 'rain': return 'meteocons:rain'
    case 'heavy-rain': return 'meteocons:extreme-rain'
    case 'thunder': return 'meteocons:thunderstorms'
    case 'snow': return 'meteocons:snow'
    case 'sleet': return 'meteocons:sleet'
    default: return 'meteocons:cloudy'
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
