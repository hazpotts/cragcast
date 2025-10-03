<template>
  <div class="space-y-6">
    <div v-if="!mounted" class="text-gray-500">Loading…</div>
    <section v-else-if="firstRun" class="space-y-4">
      <h2 class="text-xl font-semibold">Where?</h2>
      <PlaceSearch @picked="onPicked" />
      <h2 class="text-xl font-semibold">Max distance</h2>
      <URange v-model="prefs.maxDriveMins.value" :min="30" :max="240" :step="10" />
      <h2 class="text-xl font-semibold">When?</h2>
      <WhenPicker v-model="prefs.when.value" />
      <h2 class="text-xl font-semibold">Climbing type (optional)</h2>
      <URadioGroup v-model="prefs.type.value" :options="types" />
      <div>
        <UButton label="Save" @click="savePrefs" />
      </div>
    </section>

    <section v-else>
      <div class="mb-4 flex items-center justify-between">
        <div class="text-sm text-gray-500">Showing for {{ prefs.where.value.name }} · max {{ prefs.maxDriveMins.value }} mins · {{ labelWhen }}</div>
        <UButton color="gray" variant="ghost" icon="i-heroicons-adjustments-horizontal" @click="firstRun=true">Adjust</UButton>
      </div>
      <div v-if="pending" class="text-gray-500">Loading…</div>
      <div v-else>
        <div v-if="items[0]" class="mb-6">
          <RegionCard :name="items[0].name" :score="items[0].score" :why="items[0].why" :mini="items[0].mini" :distanceMins="items[0].distanceMins" :updatedAt="items[0].updatedAt" :ukcUrl="items[0].ukcUrl" />
        </div>
        <div class="grid md:grid-cols-2 gap-4">
          <RegionCard v-for="r in items.slice(1,5)" :key="r.id" :name="r.name" :score="r.score" :why="r.why" :mini="r.mini" :distanceMins="r.distanceMins" :updatedAt="r.updatedAt" :ukcUrl="r.ukcUrl" />
        </div>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import { useRank } from '~/composables/useRank'
import PlaceSearch from '~/app/components/PlaceSearch.vue'
import WhenPicker from '~/app/components/WhenPicker.vue'
import RegionCard from '~/app/components/RegionCard.vue'
const prefs = process.client
  ? usePrefs()
  : ({
      where: ref({ lat: 51.5074, lon: -0.1278, name: 'London' }),
      maxDriveMins: ref(120),
      when: ref('next-weekend'),
      type: ref('any')
    } as any)
const { items, pending, fetchRank } = useRank()
const mounted = ref(false)
const firstRun = ref(false)
const types = [
  { value: 'any', label: 'Any' },
  { value: 'trad', label: 'Trad' },
  { value: 'sport', label: 'Sport' },
  { value: 'boulder', label: 'Boulder' },
]
const labelWhen = computed(() => {
  if (!mounted.value) return ''
  const m: any = { 'today': 'Today', 'tomorrow': 'Tomorrow', 'this-weekend': 'This weekend', 'next-weekend': 'Next weekend', 'custom': 'Custom' }
  return m[prefs.when.value]
})

onMounted(async () => {
  mounted.value = true
  // determine first-run if no explicit where stored by user
  firstRun.value = !localStorage.getItem('climb.prefs.where.set')
  if (!firstRun.value) await fetchRank()
})

function onPicked(p:{ lat:number; lon:number; name:string }) {
  prefs.where.value = p
}

async function savePrefs() {
  localStorage.setItem('climb.prefs.where.set', '1')
  await fetchRank()
  firstRun.value = false
}
</script>
