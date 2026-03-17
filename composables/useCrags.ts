import { ref, type Ref } from 'vue'

export type CragItem = {
  id: string
  name: string
  regionId: string
  score: number
  modifiers: string[]
  aspect: string | null
  rock: string[]
  types: { trad?: number; sport?: number; boulder?: number }
  routeCount: number
  tags: string[]
  coords: { lat: number; lon: number }
  distanceMins: number
  ukcUrl: string
}

// Per-region cache of crag data
const cache = new Map<string, { items: CragItem[]; t: number }>()
const TTL_MS = 5 * 60 * 1000

export function useCrags() {
  const pending = ref(false)

  async function fetchCrags(
    regionId: string,
    opts: { lat?: number; lon?: number; dates: string; minDriveMins?: number; maxDriveMins?: number }
  ): Promise<CragItem[]> {
    const cacheKey = `crags:${regionId}:${opts.dates}:${opts.lat ?? 'na'}:${opts.lon ?? 'na'}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.t < TTL_MS) {
      return cached.items
    }

    pending.value = true
    try {
      const params: any = { regionId, dates: opts.dates }
      if (opts.lat !== undefined) params.lat = opts.lat
      if (opts.lon !== undefined) params.lon = opts.lon
      if (opts.minDriveMins) params.minDriveMins = opts.minDriveMins
      if (opts.maxDriveMins !== undefined && Number.isFinite(opts.maxDriveMins)) params.maxDriveMins = opts.maxDriveMins

      const items = await $fetch<CragItem[]>('/api/crags', { params })
      cache.set(cacheKey, { items, t: Date.now() })
      return items
    } catch (e) {
      console.warn('[useCrags] fetch failed', { regionId, err: String(e) })
      return []
    } finally {
      pending.value = false
    }
  }

  return { fetchCrags, pending }
}
