import { ref } from 'vue'
import { usePrefs, type ClimbType, type WhenPreset } from './usePrefs'
import { presetDates } from '~/utils/dates'

export type RankItem = {
  id: string
  name: string
  score: number
  why: string[]
  mini: { hours: string[]; rainMm: number[]; pop: number[]; wind: number[]; gust: number[]; temp: number[]; cloud: number[] }
  distanceMins: number
  updatedAt: string
  coords: { lat: number; lon: number }
  ukcUrl: string
}

export function useRank() {
  const prefs = process.client
    ? usePrefs()
    : ({
        where: ref({ lat: 51.5074, lon: -0.1278, name: 'London' }),
        maxDriveMins: ref(120),
        when: ref('next-weekend' as WhenPreset),
        type: ref('any' as ClimbType)
      } as const)
  const { where, maxDriveMins, when, type } = prefs
  const items = ref<RankItem[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function fetchRank(customDates?: string[]) {
    pending.value = true
    error.value = null
    try {
      const dates = customDates ?? presetDates(when.value as WhenPreset)
      const params = new URLSearchParams()
      params.set('lat', String(where.value.lat))
      params.set('lon', String(where.value.lon))
      params.set('maxDriveMins', String(maxDriveMins.value))
      params.set('climbType', type.value)
      params.set('dates', dates.join(','))
      const res = await fetch(`/api/rank?${params.toString()}`)
      items.value = await res.json()
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch rank'
      console.error('fetchRank error', e)
    } finally {
      pending.value = false
    }
  }

  return { items, pending, error, fetchRank }
}
