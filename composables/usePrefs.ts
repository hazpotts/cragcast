import { computed, type Ref } from 'vue'
import { presetDates } from '~/utils/dates'

export type Location = { lat: number; lon: number; name: string }

type PrefsState = {
  where: Ref<Location | null>
  maxDriveMins: Ref<number>
  dates: Ref<string[]>
}

let clientState: PrefsState | null = null

export const usePrefs = () => {
  if (clientState) return clientState
  const route = useRoute()
  const router = useRouter()

  const updateQuery = (patch: Record<string, any>) => {
    const q = { ...route.query }
    for (const k of Object.keys(patch)) {
      const v = patch[k]
      if (v === undefined || v === null || v === '') delete (q as any)[k]
      else (q as any)[k] = String(v)
    }
    router.replace({ query: q })
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
      return Number.isFinite(n) ? n : 120
    },
    set(v: number) {
      updateQuery({ maxDriveMins: v })
    }
  })

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
  })

  clientState = { where, maxDriveMins, dates }
  return clientState
}
