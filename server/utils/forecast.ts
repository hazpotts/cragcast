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

export async function getForecast(event: any, lat: number, lon: number, dates: string[]): Promise<ForecastResult> {
  const kv = kvFromEvent(event)
  const datesKey = dates.join(',')
  const key = cacheKey(lat, lon, datesKey)

  if (kv) {
    const cached = await kv.get(key)
    if (cached) {
      try {
        const parsed = JSON.parse(cached) as { result: ForecastResult; fetchedAt: number }
        const ageH = (Date.now() - parsed.fetchedAt) / 36e5
        // Aligned with cache TTL: 3 hours
        if (ageH <= 3) {
          console.debug('[forecast] Cache HIT', { lat, lon, ageMinutes: Math.round(ageH * 60) })
          return parsed.result
        }
        console.debug('[forecast] Cache STALE', { lat, lon, ageHours: ageH.toFixed(2) })
        // else fallthrough to refresh
      } catch {
        // ignore
      }
    } else {
      console.debug('[forecast] Cache MISS', { lat, lon })
    }
  }

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

  let data: any
  const fetchStart = Date.now()
  try {
    const res = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'CragCast/0.1 (+https://cragcast.app)'
      }
    })
    const fetchMs = Date.now() - fetchStart
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      console.warn('[forecast] API error', { lat, lon, status: res.status, fetchMs })
      throw createError({ statusCode: 502, statusMessage: `Open-Meteo fetch failed (${res.status})`, data: { url: url.toString(), body } })
    }
    data = await res.json()
    console.debug('[forecast] API fetch success', { lat, lon, fetchMs })
  } catch (err: any) {
    // As a last resort, return an empty mini-series so UI can render, but mark as error
    console.warn('[forecast] fetch failed, returning empty fallback', { lat, lon, err: String(err) })
    const empty: MiniSeries = { hours: [], rainMm: [], pop: [], wind: [], gust: [], temp: [], cloud: [] }
    return { mini: empty, updatedAt: new Date().toISOString(), error: true }
  }

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

  const result: ForecastResult = {
    mini,
    updatedAt: new Date().toISOString()
  }

  if (kv) {
    // Store for ~3 hours
    await kv.put(key, JSON.stringify({ result, fetchedAt: Date.now() }), { expirationTtl: 60 * 60 * 3 })
  }
  return result
}
