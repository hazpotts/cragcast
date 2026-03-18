import { computed, ref, type Ref } from 'vue'
import { presetDates } from '~/utils/dates'

export type Location = { lat: number; lon: number; name: string }

export type PrefsSnapshot = {
  lat?: number
  lon?: number
  name?: string
  dates: string[]
  minDriveMins: number
  maxDriveMins: number
}

type PrefsState = {
  where: Ref<Location | null>
  minDriveMins: Ref<number>
  maxDriveMins: Ref<number>
  dates: Ref<string[]>
  whenPreset: Ref<'today'|'tomorrow'|'this-weekend'|'next-weekend'|'custom'>
  commit: () => Promise<void>
  snapshot: () => PrefsSnapshot
}

let clientState: PrefsState | null = null

export const usePrefs = () => {
  const route = useRoute()
  const router = useRouter()

  const build = (): PrefsState => {
    // Batch route query updates within the same tick to prevent overwrites
    let pendingPatch: Record<string, any> = {}
    let updateTimer: any = null
    const flushQuery = async () => {
      if (!process.client) { pendingPatch = {}; updateTimer = null; return }
      const q = { ...route.query }
      for (const k of Object.keys(pendingPatch)) {
        const v = pendingPatch[k]
        if (v === undefined || v === null || v === '') delete (q as any)[k]
        else (q as any)[k] = String(v)
      }
      pendingPatch = {}
      updateTimer = null
      await router.replace({ query: q })
    }
    const updateQuery = (patch: Record<string, any>) => {
      if (!process.client) return
      pendingPatch = { ...pendingPatch, ...patch }
      if (updateTimer) return
      updateTimer = setTimeout(() => { flushQuery() }, 0)
    }
    const commit = async () => {
      if (!process.client) { pendingPatch = {}; if (updateTimer) { clearTimeout(updateTimer); updateTimer = null } ; return }
      if (updateTimer) { clearTimeout(updateTimer); updateTimer = null }
      await flushQuery()
    }

    // Returns the merged pending+committed state as a plain object.
    // This gives callers the "truth" without waiting for router.replace().
    const snapshot = (): PrefsSnapshot => {
      const q = { ...route.query } as any
      for (const k of Object.keys(pendingPatch)) {
        const v = pendingPatch[k]
        if (v === undefined || v === null || v === '') delete q[k]
        else q[k] = String(v)
      }
      const lat = q.lat !== undefined ? Number(q.lat) : undefined
      const lon = q.lon !== undefined ? Number(q.lon) : undefined
      const name = typeof q.name === 'string' ? q.name : undefined
      const ds = typeof q.dates === 'string' ? q.dates.split(',').map((x: string) => x.trim()).filter(Boolean) : []
      const minN = q.minDriveMins !== undefined ? Number(q.minDriveMins) : NaN
      const maxN = q.maxDriveMins !== undefined ? Number(q.maxDriveMins) : NaN
      return {
        lat: Number.isFinite(lat) ? lat : undefined,
        lon: Number.isFinite(lon) ? lon : undefined,
        name: name || undefined,
        dates: ds,
        minDriveMins: Number.isFinite(minN) && minN > 0 ? minN : 0,
        maxDriveMins: Number.isFinite(maxN) ? maxN : Infinity,
      }
    }

    const where = computed<Location | null>({
      get() {
        const q = route.query as any
        const lat = q.lat !== undefined ? Number(q.lat) : NaN
        const lon = q.lon !== undefined ? Number(q.lon) : NaN
        const name = typeof q.name === 'string' ? q.name : ''
        if (Number.isFinite(lat) && Number.isFinite(lon) && name) return { lat, lon, name }
        return null
      },
      set(v) {
        if (!v) return updateQuery({ lat: null, lon: null, name: null })
        const nameShort = (typeof v.name === 'string' ? v.name : '').split(',')[0]?.trim() || ''
        const lat4 = Number(Number(v.lat).toFixed(4))
        const lon4 = Number(Number(v.lon).toFixed(4))
        updateQuery({ lat: lat4, lon: lon4, name: nameShort })
      }
    }) as unknown as Ref<Location | null>

    const minDriveMins = computed<number>({
      get() {
        const q = route.query as any
        const n = q.minDriveMins !== undefined ? Number(q.minDriveMins) : NaN
        return Number.isFinite(n) && n > 0 ? n : 0
      },
      set(v: number) {
        updateQuery({ minDriveMins: v > 0 ? v : null })
      }
    }) as unknown as Ref<number>

    const maxDriveMins = computed<number>({
      get() {
        const q = route.query as any
        const n = q.maxDriveMins !== undefined ? Number(q.maxDriveMins) : NaN
        return Number.isFinite(n) ? n : Infinity
      },
      set(v: number) {
        if (!Number.isFinite(v)) {
          // No limit: clear distance filters but keep location for scoring
          updateQuery({ maxDriveMins: null, minDriveMins: null })
        } else {
          updateQuery({ maxDriveMins: v })
        }
      }
    }) as unknown as Ref<number>

    const dates = computed<string[]>({
      get() {
        const q = route.query as any
        const s = typeof q.dates === 'string' ? q.dates : ''
        const arr = s.split(',').map(x => x.trim()).filter(Boolean)
        if (arr.length) return arr
        return []
      },
      set(v: string[]) {
        updateQuery({ dates: (v || []).join(',') })
      }
    }) as unknown as Ref<string[]>

    const whenPreset = ref<'today'|'tomorrow'|'this-weekend'|'next-weekend'|'custom'>('this-weekend')

    return { where, minDriveMins, maxDriveMins, dates, whenPreset, commit, snapshot }
  }

  if (process.client) {
    if (!clientState) clientState = build()
    return clientState
  }
  return build()
}
