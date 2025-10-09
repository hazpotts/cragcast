import { ref } from 'vue'
import { usePrefs } from './usePrefs'

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
  avgRainMm: number
  links: { bbc: string; metoffice: string; windy: string }
}

export function useRank() {
  const { where, maxDriveMins, dates } = usePrefs()
  const items = ref<RankItem[]>([])
  const pending = ref(false)
  const error = ref<string | null>(null)
  const TTL_MS = 5 * 60 * 1000 // 5 minutes

  function cacheKey(customDates?: string[]) {
    const w = where.value as any
    const lat = Number(w?.lat)
    const lon = Number(w?.lon)
    const latKey = Number.isFinite(lat) ? String(lat) : 'na'
    const lonKey = Number.isFinite(lon) ? String(lon) : 'na'
    const d = ((customDates ?? dates.value) || []).join(',')
    const distKey = Number.isFinite(maxDriveMins.value) ? String(maxDriveMins.value) : 'inf'
    return `rank:${latKey}:${lonKey}:${distKey}:${d}`
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

  async function fetchRank(customDates?: string[]) {
    pending.value = true
    error.value = null
    try {
      console.debug('[useRank] fetchRank:start', { where: where.value, maxDriveMins: maxDriveMins.value, dates: customDates || dates.value })
      const w = where.value as any
      const lat = Number(w?.lat)
      const lon = Number(w?.lon)
      console.debug('[useRank] parsed location', { lat, lon })
      // location is optional; when absent we fetch without distance
      const pickedDates = customDates ?? dates.value
      // Client cache: if present and fresh, load instantly
      const key = cacheKey(pickedDates)
      const cached = readCache(key)
      if (cached) {
        items.value = cached
        return
      }
      const params = new URLSearchParams()
      if (Number.isFinite(lat)) params.set('lat', String(lat))
      if (Number.isFinite(lon)) params.set('lon', String(lon))
      if (Number.isFinite(maxDriveMins.value)) {
        params.set('maxDriveMins', String(maxDriveMins.value))
      }
      params.set('dates', pickedDates.join(','))
      const url = `/api/rank?${params.toString()}`
      console.debug('[useRank] GET', url)
      // Add a client-side timeout to avoid hanging skeletons on mobile networks
      const controller = new AbortController()
      const timeoutMs = 15000
      const to = setTimeout(() => controller.abort(), timeoutMs)
      let json: any
      try {
        const res = await fetch(url, { signal: controller.signal })
        json = await res.json()
      } finally {
        clearTimeout(to)
      }
      items.value = json
      // Persist to client cache
      writeCache(key, json)
      console.debug('[useRank] fetchRank:ok', { count: Array.isArray(json) ? json.length : null })
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        error.value = `Timed out after 15s fetching results`
      } else {
        error.value = e?.message || 'Failed to fetch rank'
      }
      console.error('[useRank] fetchRank:error', e)
    } finally {
      pending.value = false
      console.debug('[useRank] fetchRank:end', { pending: pending.value, error: error.value })
    }
  }

  return { items, pending, error, fetchRank }
}
