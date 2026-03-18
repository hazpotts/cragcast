<template>
  <div class="p-0 space-y-4 max-w-[600px] mx-auto">

    <h2 class="text-xl font-semibold">Forecast for</h2>
    <div class="flex flex-wrap gap-2">
      <UButton size="sm" :color="selectedWhenPreset==='today'?'primary':'gray'" label="Today" @click="setWhen('today')" />
      <UButton size="sm" :color="selectedWhenPreset==='tomorrow'?'primary':'gray'" label="Tomorrow" @click="setWhen('tomorrow')" />
      <UButton size="sm" :color="selectedWhenPreset==='this-weekend'?'primary':'gray'" label="This weekend" @click="setWhen('this-weekend')" />
      <UButton size="sm" :color="selectedWhenPreset==='next-weekend'?'primary':'gray'" label="Next weekend" @click="setWhen('next-weekend')" />
      <UButton size="sm" :color="selectedWhenPreset==='custom'?'primary':'gray'" label="Date(s)" @click="setWhen('custom')" />
    </div>

    <div v-if="selectedWhenPreset==='custom'" class="space-y-3">
      <div>
        <div class="text-sm font-medium mb-1">From</div>
        <div class="flex flex-wrap gap-2">
          <UButton size="sm"
            v-for="opt in next7"
            :key="`from-`+opt.iso"
            :label="opt.label"
            :color="customStart===opt.iso ? 'primary' : 'gray'"
            @click="pickStart(opt.iso)"
          />
        </div>
      </div>
      <div>
        <div class="text-sm font-medium mb-1">To</div>
        <div class="flex flex-wrap gap-2">
          <UButton size="sm"
            v-for="opt in next7"
            :key="`to-`+opt.iso"
            :label="opt.label"
            :color="customEnd===opt.iso ? 'primary' : 'gray'"
            :disabled="!customStart"
            @click="pickEnd(opt.iso)"
          />
        </div>
      </div>
      <p v-if="customError" class="text-sm text-red-500">{{ customError }}</p>
    </div>

    <h2 class="text-xl font-semibold">Location</h2>
    <PlaceSearch @picked="onPicked" />

    <h2 v-if="selectedLocation || hasValidLocation" class="text-xl font-semibold">Max distance</h2>
    <div v-if="selectedLocation || hasValidLocation" class="flex flex-wrap gap-2">
      <UButton size="sm" :color="selectedMax===30?'primary':'gray'" :label="driveLabel(30)" @click="setMax(30)" />
      <UButton size="sm" :color="selectedMax===60?'primary':'gray'" :label="driveLabel(60)" @click="setMax(60)" />
      <UButton size="sm" :color="selectedMax===120?'primary':'gray'" :label="driveLabel(120)" @click="setMax(120)" />
      <UButton size="sm" :color="selectedMax===300?'primary':'gray'" :label="driveLabel(300)" @click="setMax(300)" />
      <UButton size="sm" :color="!Number.isFinite(selectedMax as any)?'primary':'gray'" label="No limit" @click="setMax(Infinity as any)" />
    </div>

    <h2 class="text-xl font-semibold">Detail level</h2>
    <div class="flex flex-wrap gap-2">
      <UButton size="sm" :color="selectedGranularity==='area'?'primary':'gray'" label="Area" @click="selectedGranularity='area'" />
      <UButton size="sm" :color="selectedGranularity==='region'?'primary':'gray'" label="Region" @click="selectedGranularity='region'" />
      <UButton size="sm" :color="selectedGranularity==='crag'?'primary':'gray'" label="Crag" @click="selectedGranularity='crag'" />
    </div>

    <div class="flex items-center gap-2 pt-6">
      <UButton :disabled="isDisabled" :aria-disabled="isDisabled" label="Show" @click="onConfirm"
        class="px-6 py-2 bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400" />
      <UButton :disabled="isDisabled" :aria-disabled="isDisabled" label="Clear" @click="onClear"
        class="px-6 py-2 bg-gray-600 text-white hover:bg-gray-500 disabled:opacity-50 dark:bg-gray-500 dark:hover:bg-gray-400" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import { useUnits } from '~/composables/useUnits'
import PlaceSearch from '~/components/PlaceSearch.vue'
import { presetDates, formatDate, formatShortDayLabel } from '~/utils/dates'

const emit = defineEmits<{ (e: 'confirm'): void; (e:'clear'): void }>()
const prefs = usePrefs()
const units = useUnits()
function driveLabel(mins: number): string {
  if (units.distanceUnit.value === 'mins') {
    if (mins < 60) return `${mins} min`
    const h = mins / 60
    return h === 1 ? '1 hour' : `${h} hours`
  }
  return `${units.convertDistance(mins)} ${units.distanceLabel.value}`
}
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
const isDisabled = computed(() => !mounted.value)
const selectedWhenPreset = ref<'today'|'tomorrow'|'this-weekend'|'next-weekend'|'custom'>('this-weekend')
const selectedMax = ref<number>(prefs.maxDriveMins.value)
const selectedGranularity = ref<'area'|'region'|'crag'>(prefs.granularity.value)
const selectedLocation = ref<Location | null>(null)
const next7 = computed(() => {
  const out: { iso: string; label: string }[] = []
  const start = new Date()
  start.setHours(0,0,0,0)
  for (let i=0;i<7;i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    out.push({ iso: formatDate(d), label: formatShortDayLabel(d) })
  }
  return out
})
const customStart = ref<string>('')
const customEnd = ref<string>('')
const customError = computed(() => {
  if (selectedWhenPreset.value !== 'custom') return ''
  // Allow submit with no dates or only one date selected
  if (!customStart.value && !customEnd.value) return ''
  if (customStart.value && !customEnd.value) return ''
  if (!customStart.value && customEnd.value) return ''
  const s = new Date(customStart.value)
  const e = new Date(customEnd.value)
  const now = new Date(); now.setHours(0,0,0,0)
  if (s < now || e < now) return 'Dates must be in the future'
  if (e <= s) return 'To must be after From'
  const diff = (e.getTime() - s.getTime()) / (1000*60*60*24)
  if (diff > 7) return 'Range must be 7 days or less'
  return ''
})
function pickStart(iso: string) { customStart.value = customStart.value === iso ? '' : iso }
function pickEnd(iso: string) { customEnd.value = customEnd.value === iso ? '' : iso }
function setMax(v:number) { selectedMax.value = v }
function setWhen(p:'today'|'tomorrow'|'this-weekend'|'next-weekend'|'custom') {
  selectedWhenPreset.value = p
  prefs.whenPreset.value = p
  if (p !== 'custom') {
    // Do not write dates to URL yet; only on confirm
    customStart.value = ''
    customEnd.value = ''
  }
}
function onPicked(p:{ lat:number; lon:number; name:string }) {
  selectedLocation.value = p
}
function onConfirm() {
  if (isDisabled.value) return
  if (selectedWhenPreset.value === 'custom') {
    if (customError.value) return
    const s = customStart.value
    const e = customEnd.value
    if (s && e) {
      const ds = s === e ? [s] : [s, e]
      prefs.dates.value = ds
    } else if (s && !e) {
      prefs.dates.value = [s]
    } // if neither selected, leave previous dates as-is
  } else {
    prefs.dates.value = presetDates(selectedWhenPreset.value)
  }
  if (selectedLocation.value) {
    prefs.where.value = selectedLocation.value
  }
  // Apply max distance and granularity on confirm
  prefs.maxDriveMins.value = selectedMax.value
  prefs.granularity.value = selectedGranularity.value
  emit('confirm')
}
function onClear() {
  selectedLocation.value = null
  selectedMax.value = Infinity
  selectedWhenPreset.value = 'this-weekend'
  selectedGranularity.value = 'region'  // default on clear
  emit('clear')
}
</script>
