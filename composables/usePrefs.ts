import { computed, type Ref } from 'vue'
import { presetDates } from '~/utils/dates'

export type Location = { lat: number; lon: number; name: string }

type PrefsState = {
  where: Ref<Location | null>
  maxDriveMins: Ref<number>
  dates: Ref<string[]>
  commit: () => Promise<void>
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

    const maxDriveMins = computed<number>({
      get() {
        const q = route.query as any
        const n = q.maxDriveMins !== undefined ? Number(q.maxDriveMins) : NaN
        return Number.isFinite(n) ? n : Infinity
      },
      set(v: number) {
        if (!Number.isFinite(v)) {
          // No limit: clear distance and any stored location
          updateQuery({ maxDriveMins: null, lat: null, lon: null, name: null })
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
        // default to this weekend if not set
        return presetDates('this-weekend')
      },
      set(v: string[]) {
        updateQuery({ dates: (v || []).join(',') })
      }
    }) as unknown as Ref<string[]>

    return { where, maxDriveMins, dates, commit }
  }

  if (process.client) {
    if (!clientState) clientState = build()
    return clientState
  }
  return build()
}
