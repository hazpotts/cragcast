import { filterHoursByDates } from './dates'

export type MiniSeries = {
  hours: string[]
  rainMm: number[]
  pop: number[]
  wind: number[]
  gust: number[]
  temp: number[]
  cloud: number[]
}

export type ForecastResult = {
  mini: MiniSeries
  updatedAt: string
  stale?: boolean  // true if serving stale cache while refresh happens
  error?: boolean  // true if this is a fallback empty response due to API error
}

type KV = { get: (k: string) => Promise<string | null>; put: (k: string, v: string, opts?: { expirationTtl?: number }) => Promise<void> }

function kvFromEvent(event: any): KV | null {
  const env = event?.platform?.env || {}
  return (env.CRAGCAST as KV) || (env.CLIMB_KV as KV) || null
}

function cacheKey(lat: number, lon: number, datesKey: string) {
  const ll = `${lat.toFixed(2)},${lon.toFixed(2)}`
  return `forecast:${ll}:${datesKey}`
}

// Stale threshold: return cached data immediately if < 6h old, but refresh in bg if > 2h old
const FRESH_HOURS = 2
const STALE_MAX_HOURS = 12  // Accept stale data up to 12h old rather than waiting for API

async function fetchFromApi(lat: number, lon: number, dates: string[]): Promise<{ mini: MiniSeries; raw?: any }> {
  const url = new URL('https://api.open-meteo.com/v1/forecast')
  url.searchParams.set('latitude', String(lat))
  url.searchParams.set('longitude', String(lon))
  url.searchParams.set('hourly', [
    'precipitation',
    'precipitation_probability',
    'cloudcover',
    'windspeed_10m',
    'windgusts_10m',
    'temperature_2m'
  ].join(','))
  url.searchParams.set('windspeed_unit', 'mph')
  url.searchParams.set('temperature_unit', 'celsius')
  url.searchParams.set('timezone', 'Europe/London')

  const res = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'CragCast/0.1 (+https://cragcast.app)'
    }
  })
  
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Open-Meteo fetch failed (${res.status}): ${body.slice(0, 200)}`)
  }
  
  const data = await res.json()
  const times: string[] = data?.hourly?.time || []
  const pickIdx = filterHoursByDates(times, dates).map(x => x.i)

  const mini: MiniSeries = {
    hours: pickIdx.map(i => times[i]),
    rainMm: pickIdx.map(i => (data.hourly.precipitation?.[i] ?? 0)),
    pop: pickIdx.map(i => (data.hourly.precipitation_probability?.[i] ?? 0)),
    wind: pickIdx.map(i => (data.hourly.windspeed_10m?.[i] ?? 0)),
    gust: pickIdx.map(i => (data.hourly.windgusts_10m?.[i] ?? 0)),
    temp: pickIdx.map(i => (data.hourly.temperature_2m?.[i] ?? 0)),
    cloud: pickIdx.map(i => (data.hourly.cloudcover?.[i] ?? 0))
  }

  return { mini }
}

export async function getForecast(event: any, lat: number, lon: number, dates: string[]): Promise<ForecastResult> {
  const kv = kvFromEvent(event)
  const datesKey = dates.join(',')
  const key = cacheKey(lat, lon, datesKey)

  let cached: { result: ForecastResult; fetchedAt: number } | null = null

  // Try to get cached data
  if (kv) {
    try {
      const raw = await kv.get(key)
      if (raw) {
        cached = JSON.parse(raw)
      }
    } catch (e) {
      console.warn('[forecast] cache read failed', { key, err: String(e) })
    }
  }

  if (cached) {
    const ageH = (Date.now() - cached.fetchedAt) / 36e5
    
    // Fresh enough - return immediately
    if (ageH <= FRESH_HOURS) {
      return cached.result
    }
    
    // Stale but acceptable - return immediately, refresh in background
    if (ageH <= STALE_MAX_HOURS) {
      // Fire-and-forget background refresh (don't await)
      refreshInBackground(event, lat, lon, dates, key, kv).catch(e => 
        console.warn('[forecast] background refresh failed', { lat, lon, err: String(e) })
      )
      return { ...cached.result, stale: true }
    }
  }

  // No cache or too stale - must fetch
  try {
    const { mini } = await fetchFromApi(lat, lon, dates)
    
    const result: ForecastResult = {
      mini,
      updatedAt: new Date().toISOString()
    }

    // Store in cache
    if (kv) {
      try {
        await kv.put(key, JSON.stringify({ result, fetchedAt: Date.now() }), { expirationTtl: 60 * 60 * 24 }) // 24h TTL, we manage staleness ourselves
      } catch (e) {
        console.warn('[forecast] cache write failed', { key, err: String(e) })
      }
    }
    
    return result
  } catch (err: any) {
    console.warn('[forecast] fetch failed', { lat, lon, err: String(err) })
    
    // If we have any cached data (even very stale), return it rather than failing
    if (cached) {
      return { ...cached.result, stale: true, error: true }
    }
    
    // Last resort: empty response
    const empty: MiniSeries = { hours: [], rainMm: [], pop: [], wind: [], gust: [], temp: [], cloud: [] }
    return { mini: empty, updatedAt: new Date().toISOString(), error: true }
  }
}

async function refreshInBackground(event: any, lat: number, lon: number, dates: string[], key: string, kv: KV | null) {
  if (!kv) return
  
  try {
    const { mini } = await fetchFromApi(lat, lon, dates)
    const result: ForecastResult = {
      mini,
      updatedAt: new Date().toISOString()
    }
    await kv.put(key, JSON.stringify({ result, fetchedAt: Date.now() }), { expirationTtl: 60 * 60 * 24 })
  } catch (e) {
    // Already logged in caller
  }
}
