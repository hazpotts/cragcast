<template>
  <div v-if="pending" class="flex items-center gap-2 py-2 px-4 text-sm text-gray-500">
    <Icon name="heroicons:arrow-path" class="h-4 w-4 animate-spin" />
    Loading crags…
  </div>
  <div v-else-if="!crags.length" class="py-2 px-4 text-sm text-gray-400">
    No crag data available
  </div>
  <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
    <div
      v-for="crag in crags"
      :key="crag.id"
      class="flex items-center gap-3 py-2 px-4 text-sm hover:bg-gray-50 dark:hover:bg-gray-800/50"
    >
      <!-- Crag name -->
      <div class="min-w-[140px] font-medium text-gray-700 dark:text-gray-200">
        {{ crag.name }}
      </div>

      <!-- Score badge -->
      <span
        class="text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0"
        :class="crag.score >= 70
          ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200'
          : crag.score >= 40
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200'"
      >{{ crag.score }}</span>

      <!-- Aspect -->
      <span v-if="crag.aspect" class="text-xs text-gray-500 dark:text-gray-400 shrink-0">
        <Icon name="heroicons:arrow-up" class="h-3 w-3 inline-block" :style="{ transform: `rotate(${aspectRotation(crag.aspect)}deg)` }" />
        {{ crag.aspect }}
      </span>

      <!-- Rock type -->
      <span class="text-xs text-gray-500 dark:text-gray-400 truncate">
        {{ crag.rock.join(', ') }}
      </span>

      <!-- Route count -->
      <span class="text-xs text-gray-500 dark:text-gray-400 shrink-0">
        {{ crag.routeCount }} routes
      </span>

      <!-- Climb types -->
      <div class="flex gap-1 shrink-0">
        <span v-if="crag.types.trad" class="text-xs px-1 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200">trad</span>
        <span v-if="crag.types.sport" class="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">sport</span>
        <span v-if="crag.types.boulder" class="text-xs px-1 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200">boulder</span>
      </div>

      <!-- Modifiers -->
      <div class="flex gap-1 flex-wrap">
        <span
          v-for="(mod, i) in crag.modifiers"
          :key="i"
          class="text-xs px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200"
        >{{ mod }}</span>
      </div>

      <!-- External links -->
      <div class="ml-auto flex items-center gap-1 shrink-0">
        <a v-if="crag.links?.windy" :href="crag.links.windy" target="_blank" rel="noopener"
           class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          Windy <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-0.5 h-3 w-3 inline" />
        </a>
        <a v-if="crag.links?.yrno" :href="crag.links.yrno" target="_blank" rel="noopener"
           class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          Yr <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-0.5 h-3 w-3 inline" />
        </a>
        <a :href="crag.ukcUrl" target="_blank" rel="noopener"
           class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          UKC <Icon name="heroicons-solid:arrow-top-right-on-square" class="ml-0.5 h-3 w-3 inline" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { CragItem } from '~/composables/useCrags'

defineProps<{
  crags: CragItem[]
  pending: boolean
}>()

const ASPECT_ROTATIONS: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315
}

function aspectRotation(aspect: string): number {
  return ASPECT_ROTATIONS[aspect] ?? 0
}
</script>
