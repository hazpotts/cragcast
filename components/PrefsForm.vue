<template>
  <div class="p-0 space-y-4">
    <h2 class="text-xl font-semibold">Where?</h2>
    <PlaceSearch @picked="onPicked" />

    <h2 class="text-xl font-semibold">Max distance</h2>
    <URange v-model="prefs.maxDriveMins.value" :min="30" :max="240" :step="10" />

    <h2 class="text-xl font-semibold">When?</h2>
    <WhenPicker v-model="prefs.when.value" />

    <h2 class="text-xl font-semibold">Climbing type (optional)</h2>
    <URadioGroup v-model="prefs.type.value" :options="types" />

    <div>
      <UButton :disabled="isDisabled" :aria-disabled="isDisabled" :label="ctaLabel" @click="onConfirm" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import PlaceSearch from '~/components/PlaceSearch.vue'
import WhenPicker from '~/components/WhenPicker.vue'

const props = defineProps<{ ctaLabel?: string }>()
const emit = defineEmits<{ (e: 'confirm'): void }>()
const prefs = usePrefs()
// Keep disabled on server and until mounted to avoid hydration mismatch
const mounted = ref(false)
onMounted(() => { mounted.value = true })
const hasValidLocation = computed(() => {
  const w = prefs.where.value as any
  if (!w) return false
  const lat = Number(w.lat)
  const lon = Number(w.lon)
  const name = typeof w.name === 'string' ? w.name.trim() : ''
  return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180 && name.length > 1
})
const isDisabled = computed(() => !mounted.value || !hasValidLocation.value)
watch(() => prefs.where.value, (v) => console.debug('[PrefsForm] where changed ->', v))
watch(isDisabled, (v) => console.debug('[PrefsForm] CTA disabled ->', v))
const types = [
  { value: 'any', label: 'Any' },
  { value: 'trad', label: 'Trad' },
  { value: 'sport', label: 'Sport' },
  { value: 'boulder', label: 'Boulder' },
]
function onPicked(p:{ lat:number; lon:number; name:string }) {
  console.debug('[PrefsForm] onPicked', p)
  prefs.where.value = p
}
function onConfirm() {
  if (isDisabled.value) return
  emit('confirm')
}
</script>
