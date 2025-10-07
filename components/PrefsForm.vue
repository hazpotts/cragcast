<template>
  <div class="p-0 space-y-4 max-w-[600px] mx-auto">

    <h2 class="text-xl font-semibold">Weather for</h2>
    <UButtonGroup size="sm" :ui="{ base: 'flex flex-wrap' }">
      <UButton :color="whenPreset==='today'?'primary':'gray'" label="Today" @click="setWhen('today')" />
      <UButton :color="whenPreset==='tomorrow'?'primary':'gray'" label="Tomorrow" @click="setWhen('tomorrow')" />
      <UButton :color="whenPreset==='this-weekend'?'primary':'gray'" label="This weekend" @click="setWhen('this-weekend')" />
      <UButton :color="whenPreset==='next-weekend'?'primary':'gray'" label="Next weekend" @click="setWhen('next-weekend')" />
      <UButton :color="whenPreset==='custom'?'primary':'gray'" label="Date(s)" @click="setWhen('custom')" />
    </UButtonGroup>

    <div v-if="whenPreset==='custom'" class="space-y-3">
      <div>
        <div class="text-sm font-medium mb-1">From</div>
        <UButtonGroup size="sm" :ui="{ base: 'flex flex-wrap' }">
          <UButton
            v-for="opt in next7"
            :key="`from-`+opt.iso"
            :label="opt.label"
            :color="customStart===opt.iso ? 'primary' : 'gray'"
            @click="pickStart(opt.iso)"
          />
        </UButtonGroup>
      </div>
      <div>
        <div class="text-sm font-medium mb-1">To</div>
        <UButtonGroup size="sm" :ui="{ base: 'flex flex-wrap' }">
          <UButton
            v-for="opt in next7"
            :key="`to-`+opt.iso"
            :label="opt.label"
            :color="customEnd===opt.iso ? 'primary' : 'gray'"
            :disabled="!customStart"
            @click="pickEnd(opt.iso)"
          />
        </UButtonGroup>
      </div>
      <p v-if="customError" class="text-sm text-red-500">{{ customError }}</p>
    </div>

    <h2 class="text-xl font-semibold">within</h2>
    <UButtonGroup size="sm" :ui="{ base: 'flex flex-wrap' }">
      <UButton :color="selectedMax===30?'primary':'gray'" label="30 min" @click="setMax(30)" />
      <UButton :color="selectedMax===60?'primary':'gray'" label="1 hour" @click="setMax(60)" />
      <UButton :color="selectedMax===120?'primary':'gray'" label="2 hours" @click="setMax(120)" />
      <UButton :color="selectedMax===300?'primary':'gray'" label="5 hours" @click="setMax(300)" />
      <UButton :color="!Number.isFinite(selectedMax as any)?'primary':'gray'" label="No limit" @click="setMax(Infinity as any)" />
    </UButtonGroup>

    <h2 v-if="selectedMax!==Infinity" class="text-xl font-semibold">of</h2>
    <PlaceSearch v-if="selectedMax!==Infinity" @picked="onPicked" />

    <div class="flex items-center gap-2 pt-6">
      <UButton variant="solid" label="Close" @click="onCancel"
        class="bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600" />
      <UButton :disabled="isDisabled" :aria-disabled="isDisabled" label="Show" @click="onConfirm"
        class="px-6 py-2 bg-sky-600 text-white hover:bg-sky-500 disabled:opacity-50 dark:bg-sky-500 dark:hover:bg-sky-400" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { usePrefs } from '~/composables/usePrefs'
import PlaceSearch from '~/components/PlaceSearch.vue'
import { presetDates, formatDate } from '~/utils/dates'

const emit = defineEmits<{ (e: 'confirm'): void; (e:'cancel'): void }>()
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
const isDisabled = computed(() => !mounted.value)
watch(() => prefs.where.value, (v) => console.debug('[PrefsForm] where changed ->', v))
watch(isDisabled, (v) => console.debug('[PrefsForm] CTA disabled ->', v))
const whenPreset = ref<'today'|'tomorrow'|'this-weekend'|'next-weekend'|'custom'>('this-weekend')
// Local max distance selection to avoid relying on route until confirm
const selectedMax = ref<number>(prefs.maxDriveMins.value)
const todayStr = formatDate(new Date())
const next7 = computed(() => {
  const out: { iso: string; label: string }[] = []
  const start = new Date()
  start.setHours(0,0,0,0)
  for (let i=0;i<7;i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    out.push({ iso: formatDate(d), label: d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }) })
  }
  return out
})
const customStart = ref<string>('')
const customEnd = ref<string>('')
const customError = computed(() => {
  if (whenPreset.value !== 'custom') return ''
  // Allow submit with no dates or only one date selected
  if (!customStart.value && !customEnd.value) return ''
  if (customStart.value && !customEnd.value) return ''
  if (!customStart.value && customEnd.value) return ''
  const s = new Date(customStart.value)
  const e = new Date(customEnd.value)
  const now = new Date(); now.setHours(0,0,0,0)
  if (s < now || e < now) return 'Dates must be in the future'
  if (e < s) return 'End must be after start'
  const diff = (e.getTime() - s.getTime()) / (1000*60*60*24)
  if (diff > 7) return 'Range must be 7 days or less'
  return ''
})
function pickStart(iso: string) { customStart.value = customStart.value === iso ? '' : iso }
function pickEnd(iso: string) { customEnd.value = customEnd.value === iso ? '' : iso }
function setMax(v:number) { selectedMax.value = v }
function setWhen(p:'today'|'tomorrow'|'this-weekend'|'next-weekend'|'custom') {
  whenPreset.value = p
  if (p !== 'custom') {
    // Do not write dates to URL yet; only on confirm
    customStart.value = ''
    customEnd.value = ''
  }
}
function onPicked(p:{ lat:number; lon:number; name:string }) {
  console.debug('[PrefsForm] onPicked', p)
  prefs.where.value = p
}
function onConfirm() {
  if (isDisabled.value) return
  if (whenPreset.value === 'custom') {
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
    prefs.dates.value = presetDates(whenPreset.value)
  }
  // Apply max distance on confirm
  prefs.maxDriveMins.value = selectedMax.value
  emit('confirm')
}
function onCancel() {
  emit('cancel')
}
</script>
