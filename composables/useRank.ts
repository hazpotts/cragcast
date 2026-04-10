import { ref } from 'vue'
import type { PrefsSnapshot } from './usePrefs'
import { useCustomCrags } from './useCustomCrags'

export type RankItem = {
  id: string
  name: string
  score: number
  why: string[]
  daily: { date: string; icon: string; tempAvgC: number; windAvgMph: number; rainSumMm: number }[]
  distanceMins: number
  updatedAt: string
  coords: { lat: number; lon: number }
  ukcUrl: string
  avgTempC: number
  avgWindMph: number
  totalRainMm: number
  links: { bbc: string; metoffice: string; windy: string; yrno?: string }
  cragCount?: number
}

const TTL_MS = 5 * 60 * 1000 // 5 minutes

// Module-level AbortController so new fetches cancel previous ones
let activeController: AbortController | null = null

export function useRank() {
  const items = ref<RankItem[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)

  function cacheKey(p: PrefsSnapshot) {
    const latKey = p.lat !== undefined && Number.isFinite(p.lat) ? String(p.lat) : 'na'
    const lonKey = p.lon !== undefined && Number.isFinite(p.lon) ? String(p.lon) : 'na'
    const minKey = p.minDriveMins > 0 ? String(p.minDriveMins) : '0'
    const distKey = Number.isFinite(p.maxDriveMins) ? String(p.maxDriveMins) : 'inf'
    return `rank:${latKey}:${lonKey}:${minKey}-${distKey}:${p.dates.join(',')}`
  }
  function readCache(key: string): RankItem[] | null {
    if (!process.client) return null
    try {
      const raw = localStorage.getItem(key)
      if (!raw) return null
      const obj = JSON.parse(raw)
      if (!obj || typeof obj !== 'object') return null
      if (Date.now() - Number(obj.t || 0) > TTL_MS) return null
      return Array.isArray(obj.v) ? obj.v as RankItem[] : null
    } catch { return null }
  }
  function writeCache(key: string, value: RankItem[]) {
    if (!process.client) return
    try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), v: value })) } catch {}
  }

  async function fetchRank(params: PrefsSnapshot) {
    // Cancel any in-flight fetch
    if (activeController) activeController.abort()
    const controller = new AbortController()
    activeController = controller

    pending.value = true
    error.value = null
    try {
      const lat = params.lat
      const lon = params.lon
      const pickedDates = params.dates
      if (!pickedDates.length) return

      // Client cache: if present and fresh, load instantly
      const key = cacheKey(params)
      const cached = readCache(key)
      if (cached) {
        items.value = cached
        return
      }

      const qp = new URLSearchParams()
      if (lat !== undefined && Number.isFinite(lat)) qp.set('lat', String(lat))
      if (lon !== undefined && Number.isFinite(lon)) qp.set('lon', String(lon))
      if (params.minDriveMins > 0) qp.set('minDriveMins', String(params.minDriveMins))
      if (Number.isFinite(params.maxDriveMins)) qp.set('maxDriveMins', String(params.maxDriveMins))
      qp.set('dates', pickedDates.join(','))
      const url = `/api/rank?${qp.toString()}`

      // 15s timeout to avoid hanging skeletons on mobile networks
      const timeoutId = setTimeout(() => controller.abort(new Error('Request timeout after 15s')), 15000)
      let json: any
      try {
        const res = await fetch(url, { signal: controller.signal })
        json = await res.json()
      } finally {
        clearTimeout(timeoutId)
      }

      // Cancelled while fetching — discard results
      if (controller.signal.aborted) return

      // Also fetch custom crags and merge into results
      const { crags } = useCustomCrags()
      if (crags.value.length) {
        const customResults = await Promise.allSettled(
          crags.value.map(async (crag) => {
            const cParams: any = {
              id: crag.id, name: crag.name,
              cragLat: crag.lat, cragLon: crag.lon,
              rocks: crag.rock.join(','),
              dates: pickedDates.join(',')
            }
            if (lat !== undefined && Number.isFinite(lat)) { cParams.lat = lat; cParams.lon = lon }
            if (params.minDriveMins > 0) cParams.minDriveMins = params.minDriveMins
            if (Number.isFinite(params.maxDriveMins)) cParams.maxDriveMins = params.maxDriveMins
            return $fetch<any>('/api/custom-region', { params: cParams, signal: controller.signal })
          })
        )
        if (controller.signal.aborted) return
        for (const r of customResults) {
          if (r.status === 'fulfilled' && r.value) json.push(r.value)
        }
        json.sort((a: any, b: any) => b.score - a.score)
      }

      // Final abort check before writing results
      if (controller.signal.aborted) return

      items.value = json
      writeCache(key, json)
    } catch (e: any) {
      // Aborted by a newer fetch — not an error
      if (controller.signal.aborted) return
      if (e?.name === 'AbortError') {
        error.value = 'Timed out after 15s fetching results'
      } else {
        error.value = e?.message || 'Failed to fetch rank'
      }
    } finally {
      // Only clear pending if this is still the active fetch
      if (activeController === controller) {
        pending.value = false
        activeController = null
      }
    }
  }

  return { items, pending, error, fetchRank }
}
