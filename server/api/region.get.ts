import { fetchForecastWithRetry } from "~/server/utils/forecast"
import { regions } from "~/server/utils/regions"
import { getCragCountsByRegion } from "~/server/utils/crag-db"
import { haversineKm, driveMinutesApprox } from "~/server/utils/distance"
import { scoreRegion } from "~/server/utils/score"
import { parseDatesParam } from "~/server/utils/dates"
import { dailyIcons } from "~/server/utils/icons"
import { checkWarnings } from "~/server/utils/warnings"
import { avg, circularMeanDeg, degToCompass } from "~/server/utils/server-utils"

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const id = String(q.id || '')
  const lat = Number(q.lat)
  const lon = Number(q.lon)
  const hasHome = Number.isFinite(lat) && Number.isFinite(lon)
  const minDriveMins = q.minDriveMins ? Number(q.minDriveMins) : 0
  const maxDriveMins = q.maxDriveMins ? Number(q.maxDriveMins) : Infinity

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id required' })
  }
  const region = regions.find(r => r.id === id)
  if (!region) throw createError({ statusCode: 404, statusMessage: 'region not found' })

  const dates = parseDatesParam((q.dates as string) || '', 'tomorrow')

  const pt = region.points[0]
  let distanceMins = 0
  if (hasHome) {
    const km = haversineKm({ lat, lon }, { lat: pt.lat, lon: pt.lon })
    distanceMins = driveMinutesApprox(km)
  }

  // Single-region endpoint: more retries are acceptable; throw on final failure
  const out = await fetchForecastWithRetry(event, pt.lat, pt.lon, dates, {
    attempts: 4, timeoutMs: 3500, backoffMs: 300, tag: 'region', throwOnFailure: true
  })
  const { mini, updatedAt } = out!
  const { score, why } = scoreRegion(mini, {
    rocks: region.rock,
    distanceMins: Number.isFinite(distanceMins) ? distanceMins : 0,
    minDriveMins,
    maxDriveMins
  })

  const avgTempC = Math.round(avg(mini.temp) * 10) / 10
  const avgWindMph = Math.round(avg(mini.wind) * 10) / 10
  const avgWindDir = mini.windDir?.length ? degToCompass(circularMeanDeg(mini.windDir)) : ''
  const avgRainMm = Math.round(avg(mini.rainMm) * 10) / 10
  const firstDate = dates[0]
  const zoom = region.external?.windyZoom ?? 8
  const bbcId = region.external?.bbcId
  const metId = region.external?.metOfficeId
  const links = {
    bbc: bbcId
      ? `https://www.bbc.co.uk/weather/${encodeURIComponent(bbcId)}`
      : `https://www.bbc.co.uk/weather?lat=${encodeURIComponent(String(pt.lat))}&lon=${encodeURIComponent(String(pt.lon))}`,
    metoffice: metId
      ? `https://weather.metoffice.gov.uk/forecast/${encodeURIComponent(metId)}?n#?date=${encodeURIComponent(firstDate)}`
      : `https://www.metoffice.gov.uk/weather/search?query=${encodeURIComponent(region.name)}`,
    windy: `https://www.windy.com/${pt.lat.toFixed(3)}/${pt.lon.toFixed(3)}?${pt.lat.toFixed(3)},${pt.lon.toFixed(3)},${zoom}`,
    yrno: `https://www.yr.no/en/forecast/daily-table/${pt.lat.toFixed(4)},${pt.lon.toFixed(4)}`
  }

  const warnings = checkWarnings(mini, dates)

  return {
    id: region.id,
    name: region.name,
    area: (region as any).area,
    score,
    why,
    ...(warnings.length ? { warnings } : {}),
    daily: dailyIcons(mini, dates),
    distanceMins: Number.isFinite(distanceMins) ? distanceMins : 0,
    updatedAt,
    coords: { lat: pt.lat, lon: pt.lon },
    ukcUrl: `https://www.ukclimbing.com/logbook/crags/?location=${encodeURIComponent(String(pt.lat))}%2C+${encodeURIComponent(String(pt.lon))}&distance=20`,
    avgTempC,
    avgWindMph,
    avgWindDir,
    avgRainMm,
    links,
    cragCount: (await getCragCountsByRegion(event))[region.id] || 0
  }
})
