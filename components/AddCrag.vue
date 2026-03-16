<template>
  <div class="space-y-3">
    <div class="flex items-center gap-2">
      <UButton v-if="!open" size="sm" variant="soft" @click="open = true"
        class="bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/30 dark:text-sky-300 dark:hover:bg-sky-900/50">
        <Icon name="heroicons-solid:plus" class="mr-1 h-4 w-4" />
        Add crag
      </UButton>
    </div>
    <div v-if="open" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3 max-w-md">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold">Add a custom crag</h4>
        <UButton size="xs" variant="ghost" icon="i-heroicons-x-mark" @click="close" />
      </div>
      <div>
        <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Search for a location</label>
        <PlaceSearch @picked="onPlacePicked" />
      </div>
      <div v-if="picked" class="text-sm text-gray-600 dark:text-gray-400">
        {{ picked.name }} ({{ picked.lat.toFixed(4) }}, {{ picked.lon.toFixed(4) }})
      </div>
      <div>
        <label class="text-sm text-gray-600 dark:text-gray-400 mb-1 block">Rock type (optional)</label>
        <div class="flex flex-wrap gap-1">
          <UButton v-for="r in rockOptions" :key="r" size="xs"
            :color="selectedRocks.includes(r) ? 'primary' : 'gray'"
            @click="toggleRock(r)">
            {{ r }}
          </UButton>
        </div>
      </div>
      <UButton :disabled="!picked" size="sm" label="Add" @click="onAdd"
        class="px-4 bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import PlaceSearch from '~/components/PlaceSearch.vue'

const emit = defineEmits<{ (e: 'added', crag: { name: string; lat: number; lon: number; rock: string[] }): void }>()

const open = ref(false)
const picked = ref<{ lat: number; lon: number; name: string } | null>(null)
const selectedRocks = ref<string[]>([])

const rockOptions = ['grit', 'limestone', 'sandstone', 'granite', 'slate', 'rhyolite', 'quartzite']

function toggleRock(r: string) {
  const idx = selectedRocks.value.indexOf(r)
  if (idx === -1) selectedRocks.value.push(r)
  else selectedRocks.value.splice(idx, 1)
}

function onPlacePicked(p: { lat: number; lon: number; name: string }) {
  picked.value = p
}

function onAdd() {
  if (!picked.value) return
  emit('added', {
    name: picked.value.name,
    lat: picked.value.lat,
    lon: picked.value.lon,
    rock: selectedRocks.value.length ? [...selectedRocks.value] : []
  })
  close()
}

function close() {
  open.value = false
  picked.value = null
  selectedRocks.value = []
}
</script>
