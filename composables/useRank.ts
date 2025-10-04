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
  const { where, maxDriveMins, when, type } = usePrefs()
  const items = ref<RankItem[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function fetchRank(customDates?: string[]) {
    pending.value = true
    error.value = null
    try {
      console.debug('[useRank] fetchRank:start', {
        where: where.value,
        maxDriveMins: maxDriveMins.value,
        when: when.value,
        type: type.value,
        customDates
      })
      const w = where.value as any
      const lat = Number(w?.lat)
      const lon = Number(w?.lon)
      console.debug('[useRank] parsed location', { lat, lon })
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        items.value = []
        error.value = 'Please pick a location'
        console.debug('[useRank] fetchRank:abort no location')
        return
      }
      const dates = customDates ?? presetDates(when.value as WhenPreset)
      const params = new URLSearchParams()
      params.set('lat', String(lat))
      params.set('lon', String(lon))
      params.set('maxDriveMins', String(maxDriveMins.value))
      params.set('climbType', type.value)
      params.set('dates', dates.join(','))
      const url = `/api/rank?${params.toString()}`
      console.debug('[useRank] GET', url)
      const res = await fetch(url)
      const json = await res.json()
      items.value = json
      console.debug('[useRank] fetchRank:ok', { count: Array.isArray(json) ? json.length : null })
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch rank'
      console.error('[useRank] fetchRank:error', e)
    } finally {
      pending.value = false
      console.debug('[useRank] fetchRank:end', { pending: pending.value, error: error.value })
    }
  }

  return { items, pending, error, fetchRank }
}
