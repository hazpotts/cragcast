<template>
  <div class="p-0 space-y-4">

    <h2 class="text-xl font-semibold">Show weather for</h2>
    <UButtonGroup size="sm">
      <UButton :color="whenPreset==='today'?'primary':'gray'" label="Today" @click="setWhen('today')" />
      <UButton :color="whenPreset==='tomorrow'?'primary':'gray'" label="Tomorrow" @click="setWhen('tomorrow')" />
      <UButton :color="whenPreset==='this-weekend'?'primary':'gray'" label="This weekend" @click="setWhen('this-weekend')" />
      <UButton :color="whenPreset==='next-weekend'?'primary':'gray'" label="Next weekend" @click="setWhen('next-weekend')" />
    </UButtonGroup>

    <h2 class="text-xl font-semibold">within</h2>
    <UButtonGroup size="sm">
      <UButton :color="prefs.maxDriveMins.value===30?'primary':'gray'" label="30 min" @click="setMax(30)" />
      <UButton :color="prefs.maxDriveMins.value===60?'primary':'gray'" label="1 hour" @click="setMax(60)" />
      <UButton :color="prefs.maxDriveMins.value===120?'primary':'gray'" label="2 hours" @click="setMax(120)" />
      <UButton :color="prefs.maxDriveMins.value===9999?'primary':'gray'" label="No limit" @click="setMax(9999)" />
    </UButtonGroup>

    <h2 class="text-xl font-semibold">of</h2>
    <PlaceSearch @picked="onPicked" />

    <div>
      <UButton :disabled="isDisabled" :aria-disabled="isDisabled" :label="ctaLabel" @click="onConfirm" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import PlaceSearch from '~/components/PlaceSearch.vue'
import { presetDates } from '~/utils/dates'

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
const whenPreset = ref<'today'|'tomorrow'|'this-weekend'|'next-weekend'>('this-weekend')
function setMax(v:number) { prefs.maxDriveMins.value = v }
function setWhen(p:'today'|'tomorrow'|'this-weekend'|'next-weekend') {
  whenPreset.value = p
  prefs.dates.value = presetDates(p)
}
function onPicked(p:{ lat:number; lon:number; name:string }) {
  console.debug('[PrefsForm] onPicked', p)
  prefs.where.value = p
}
function onConfirm() {
  if (isDisabled.value) return
  emit('confirm')
}
</script>
