import { ref } from 'vue'
import type { PrefsSnapshot } from './usePrefs'

export type AreaItem = {
  id: string
  name: string
  score: number
  why: string[]
  warnings?: { level: string; type: string; message: string }[]
  daily: { date: string; icon: string; tempAvgC: number; windAvgMph: number; rainSumMm: number }[]
  distanceMins: number
  updatedAt: string
  coords: { lat: number; lon: number }
  ukcUrl: string
  avgTempC: number
  avgWindMph: number
  totalRainMm: number
  links: { bbc: string; metoffice: string; windy: string; yrno?: string }
  regionCount: number
}

let activeController: AbortController | null = null

export function useAreas() {
  const items = ref<AreaItem[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function fetchAreas(params: PrefsSnapshot) {
    if (activeController) activeController.abort()
    const controller = new AbortController()
    activeController = controller

    pending.value = true
    error.value = null
    try {
      const qp = new URLSearchParams()
      if (params.lat !== undefined && Number.isFinite(params.lat)) {
        qp.set('lat', String(params.lat))
        qp.set('lon', String(params.lon))
      }
      if (params.minDriveMins > 0) qp.set('minDriveMins', String(params.minDriveMins))
      if (Number.isFinite(params.maxDriveMins)) qp.set('maxDriveMins', String(params.maxDriveMins))
      qp.set('dates', params.dates.join(','))

      const res = await fetch(`/api/areas?${qp}`, { signal: controller.signal })
      if (controller.signal.aborted) return
      items.value = await res.json()
    } catch (e: any) {
      if (controller.signal.aborted) return
      error.value = e?.message || 'Failed to fetch areas'
    } finally {
      if (activeController === controller) {
        pending.value = false
        activeController = null
      }
    }
  }

  return { items, pending, error, fetchAreas }
}
