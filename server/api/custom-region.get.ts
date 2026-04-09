import { fetchForecastWithRetry } from "~/server/utils/forecast"
import { haversineKm, driveMinutesApprox } from "~/server/utils/distance"
import { scoreRegion } from "~/server/utils/score"
import { parseDatesParam } from "~/server/utils/dates"
import { dailyIcons } from "~/server/utils/icons"
import { avg, circularMeanDeg, degToCompass } from "~/server/utils/server-utils"

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

  const dates = parseDatesParam((q.dates as string) || '', 'tomorrow')

  let distanceMins = 0
  if (hasHome) {
    const km = haversineKm({ lat: homeLat, lon: homeLon }, { lat: cragLat, lon: cragLon })
    distanceMins = driveMinutesApprox(km)
  }

  // Single-crag endpoint: more retries are acceptable; throw on final failure
  const out = await fetchForecastWithRetry(event, cragLat, cragLon, dates, {
    attempts: 4, timeoutMs: 3500, backoffMs: 300, tag: 'custom-region', throwOnFailure: true
  })
  const { mini, updatedAt } = out!
  const { score, why } = scoreRegion(mini, {
    rocks: rocks.length ? rocks : ['other'],
    distanceMins: Number.isFinite(distanceMins) ? distanceMins : 0,
    minDriveMins,
    maxDriveMins
  })

  const avgTempC = Math.round(avg(mini.temp) * 10) / 10
  const avgWindMph = Math.round(avg(mini.wind) * 10) / 10
  const avgWindDir = mini.windDir?.length ? degToCompass(circularMeanDeg(mini.windDir)) : ''
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
    avgWindDir,
    avgRainMm,
    links,
    custom: true
  }
})
