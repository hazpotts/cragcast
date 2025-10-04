import { useLocalStorage } from '@vueuse/core'
import type { WhenPreset } from '~/utils/dates'
export type ClimbType = 'any'|'trad'|'sport'|'boulder'

import { ref, watch } from 'vue'

export type Location = { lat: number; lon: number; name: string }

export const DEFAULT_PREFS = {
  where: null as Location | null,
  maxDriveMins: 120,
  when: 'this-weekend' as WhenPreset,
  type: 'any' as ClimbType
}

type PrefsState = {
  where: Ref<Location | null>
  maxDriveMins: Ref<number>
  when: Ref<WhenPreset>
  type: Ref<ClimbType>
}

let clientState: PrefsState | null = null

export const usePrefs = () => {
  if (process.client) {
    if (clientState) return clientState
    const where = useLocalStorage<Location | null>('climb.prefs.where', DEFAULT_PREFS.where)
    const maxDriveMins = useLocalStorage<number>('climb.prefs.maxDriveMins', DEFAULT_PREFS.maxDriveMins)
    const when = useLocalStorage<WhenPreset>('climb.prefs.when', DEFAULT_PREFS.when)
    const type = useLocalStorage<ClimbType>('climb.prefs.type', DEFAULT_PREFS.type)
    // Migration: if a previous version stored a string (e.g. "[object Object]"), reset it to null
    if (typeof where.value === 'string') {
      try {
        const parsed = JSON.parse(where.value as any)
        if (parsed && typeof parsed === 'object' && 'lat' in parsed && 'lon' in parsed && 'name' in parsed) {
          where.value = parsed as Location
        } else {
          where.value = null
        }
      } catch {
        where.value = null
      }
    }
    console.debug('[Prefs] init (client)', { where: where.value, maxDriveMins: maxDriveMins.value, when: when.value, type: type.value })
    watch(where, (v: Location | null) => console.debug('[Prefs] where ->', v), { deep: true })
    watch(maxDriveMins, (v: number) => console.debug('[Prefs] maxDriveMins ->', v))
    watch(when, (v: WhenPreset) => console.debug('[Prefs] when ->', v))
    watch(type, (v: ClimbType) => console.debug('[Prefs] type ->', v))
    clientState = { where, maxDriveMins, when, type }
    return clientState
  }
  // SSR-safe refs using the same central defaults
  const where = ref<Location | null>(DEFAULT_PREFS.where)
  const maxDriveMins = ref(DEFAULT_PREFS.maxDriveMins)
  const when = ref<WhenPreset>(DEFAULT_PREFS.when)
  const type = ref<ClimbType>(DEFAULT_PREFS.type)
  console.debug('[Prefs] init (server)', { where: where.value, maxDriveMins: maxDriveMins.value, when: when.value, type: type.value })
  return { where, maxDriveMins, when, type }
}
