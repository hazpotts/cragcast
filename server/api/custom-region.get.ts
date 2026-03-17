import { getForecast } from "~/server/utils/forecast"
import { haversineKm, driveMinutesApprox } from "~/server/utils/distance"
import { scoreRegion } from "~/server/utils/score"
import { parseDate, formatDate } from "~/server/utils/dates"
import { dailyIcons } from "~/server/utils/icons"

function avg(a: number[]) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0 }
function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

async function fetchForecastWithRetry(event: any, lat: number, lon: number, dates: string[], attempts = 4) {
  let lastErr: any
  for (let i = 0; i < attempts; i++) {
    try {
      const ATTEMPT_TIMEOUT_MS = 3500
      const out = await Promise.race([
        getForecast(event, lat, lon, dates),
        new Promise((_, rej) => setTimeout(() => rej(new Error('forecast-timeout')), ATTEMPT_TIMEOUT_MS))
      ]) as any
      const mini = out?.mini
      if (mini && Array.isArray(mini.hours) && mini.hours.length) return out
      lastErr = new Error('empty-mini')
    } catch (e: any) {
      lastErr = e
    }
    await sleep(300 * Math.pow(2, i))
  }
  console.warn('[custom-region] forecast failed after retries', { lat, lon, err: String(lastErr) })
  throw createError({ statusCode: 503, statusMessage: `forecast unavailable: ${String(lastErr)}` })
}

/** Reverse-geocode lat/lon to nearest town name via Nominatim */
async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2&zoom=10`
    const res = await fetch(url, {
      headers: { 'Accept': 'application/json', 'User-Agent': 'CragCast/1.0' }
    })
    const data = await res.json() as any
    const addr = data?.address || {}
    return addr.city || addr.town || addr.village || addr.hamlet || addr.county || data?.name || ''
  } catch {
    return ''
  }
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const id = String(q.id || '')
  const name = String(q.name || '')
  const cragLat = Number(q.cragLat)
  const cragLon = Number(q.cragLon)
  const rocks = q.rocks ? String(q.rocks).split(',').filter(Boolean) : []

  if (!id || !name || !Number.isFinite(cragLat) || !Number.isFinite(cragLon)) {
    throw createError({ statusCode: 400, statusMessage: 'id, name, cragLat, cragLon required' })
  }

  const homeLat = Number(q.lat)
  const homeLon = Number(q.lon)
  const hasHome = Number.isFinite(homeLat) && Number.isFinite(homeLon)
  const minDriveMins = q.minDriveMins ? Number(q.minDriveMins) : 0
  const maxDriveMins = q.maxDriveMins ? Number(q.maxDriveMins) : Infinity
  const datesParam = (q.dates as string) || ''

  let dates: string[]
  if (datesParam) {
    dates = datesParam.split(',').map(s => s.trim()).filter(Boolean)
  } else {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    dates = [s]
  }
  dates = dates.map(d => formatDate(parseDate(d)))

  let distanceMins = 0
  if (hasHome) {
    const km = haversineKm({ lat: homeLat, lon: homeLon }, { lat: cragLat, lon: cragLon })
    distanceMins = driveMinutesApprox(km)
  }

  const out = await fetchForecastWithRetry(event, cragLat, cragLon, dates, 4)
  const { mini, updatedAt } = out
  const { score, why } = scoreRegion(mini, {
    rocks: rocks.length ? rocks : ['other'],
    distanceMins: Number.isFinite(distanceMins) ? distanceMins : 0,
    minDriveMins,
    maxDriveMins
  })

  const avgTempC = Math.round(avg(mini.temp) * 10) / 10
  const avgWindMph = Math.round(avg(mini.wind) * 10) / 10
  const avgRainMm = Math.round(avg(mini.rainMm) * 10) / 10
  const firstDate = dates[0]

  // Reverse geocode for BBC/Met Office links (nearest town)
  const town = await reverseGeocode(cragLat, cragLon)

  const links = {
    bbc: `https://www.bbc.co.uk/weather?lat=${encodeURIComponent(String(cragLat))}&lon=${encodeURIComponent(String(cragLon))}`,
    metoffice: town
      ? `https://www.metoffice.gov.uk/weather/search?query=${encodeURIComponent(town)}`
      : `https://www.metoffice.gov.uk/weather/search?query=${encodeURIComponent(String(cragLat) + ',' + String(cragLon))}`,
    windy: `https://www.windy.com/${cragLat.toFixed(3)}/${cragLon.toFixed(3)}?${cragLat.toFixed(3)},${cragLon.toFixed(3)},10`,
    yrno: `https://www.yr.no/en/forecast/daily-table/${cragLat.toFixed(4)},${cragLon.toFixed(4)}`
  }

  return {
    id,
    name,
    area: 'Custom',
    score,
    why,
    daily: dailyIcons(mini, dates),
    distanceMins: Number.isFinite(distanceMins) ? distanceMins : 0,
    updatedAt,
    coords: { lat: cragLat, lon: cragLon },
    ukcUrl: `https://www.ukclimbing.com/logbook/crags/?location=${encodeURIComponent(String(cragLat))}%2C+${encodeURIComponent(String(cragLon))}&distance=20`,
    avgTempC,
    avgWindMph,
    avgRainMm,
    links,
    custom: true
  }
})
