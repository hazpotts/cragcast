import { fetchForecastWithRetry } from "~/server/utils/forecast"
import { regions } from "~/server/utils/regions"
import { getCragsByRegion } from "~/server/utils/crag-db"
import { haversineKm, driveMinutesApprox } from "~/server/utils/distance"
import { scoreRegion, scoreCrag } from "~/server/utils/score"
import { parseDatesParam } from "~/server/utils/dates"
import { dailyIcons } from "~/server/utils/icons"
import { checkWarnings } from "~/server/utils/warnings"
import { avg, sum, parallel, circularMeanDeg, degToCompass } from "~/server/utils/server-utils"

const coordKey = (lat: number, lon: number) => `${lat.toFixed(2)},${lon.toFixed(2)}`

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const regionId = String(q.regionId || '')
  const lat = Number(q.lat)
  const lon = Number(q.lon)
  const hasHome = Number.isFinite(lat) && Number.isFinite(lon)
  const minDriveMins = q.minDriveMins ? Number(q.minDriveMins) : 0
  const maxDriveMins = q.maxDriveMins ? Number(q.maxDriveMins) : Infinity

  if (!regionId) {
    throw createError({ statusCode: 400, statusMessage: 'regionId required' })
  }

  const region = regions.find(r => r.id === regionId)
  if (!region) throw createError({ statusCode: 404, statusMessage: 'region not found' })

  const regionCrags = await getCragsByRegion(event, regionId)
  if (!regionCrags.length) return []

  const dates = parseDatesParam((q.dates as string) || '', 'tomorrow')

  // Deduplicate by rounded coordinates (~1.1km precision, matches forecast cache granularity)
  const keyToCoord = new Map<string, { lat: number; lon: number }>()
  for (const crag of regionCrags) {
    const key = coordKey(crag.lat, crag.lon)
    if (!keyToCoord.has(key)) keyToCoord.set(key, { lat: crag.lat, lon: crag.lon })
  }
  const uniqueCoords = [...keyToCoord.entries()].map(([key, coord]) => ({ key, ...coord }))

  // Fetch forecasts for all unique crag coordinates in parallel
  const forecastResults = await parallel(uniqueCoords, ({ lat: cLat, lon: cLon }) =>
    fetchForecastWithRetry(event, cLat, cLon, dates, { attempts: 3, timeoutMs: 3500, backoffMs: 300, tag: 'crags' })
  , 8)

  const forecastMap = new Map<string, any>()
  for (let i = 0; i < uniqueCoords.length; i++) {
    forecastMap.set(uniqueCoords[i].key, forecastResults[i])
  }

  // Score each crag using its own forecast and coordinates
  const results: any[] = []
  for (const crag of regionCrags) {
    const key = coordKey(crag.lat, crag.lon)
    const cragForecast = forecastMap.get(key)
    if (!cragForecast) continue

    let distanceMins = 0
    if (hasHome) {
      const km = haversineKm({ lat, lon }, { lat: crag.lat, lon: crag.lon })
      distanceMins = driveMinutesApprox(km)
    }

    const { score: baseScore, why } = scoreRegion(cragForecast.mini, {
      rocks: crag.rock,
      distanceMins,
      minDriveMins,
      maxDriveMins
    })

    const { score, modifiers } = scoreCrag(baseScore, cragForecast.mini, {
      aspect: crag.aspect,
      rocks: crag.rock,
      tags: crag.tags
    })

    const links = {
      windy: `https://www.windy.com/${crag.lat.toFixed(3)}/${crag.lon.toFixed(3)}?${crag.lat.toFixed(3)},${crag.lon.toFixed(3)},12`,
      yrno: `https://www.yr.no/en/forecast/daily-table/${crag.lat.toFixed(4)},${crag.lon.toFixed(4)}`
    }

    const warnings = checkWarnings(cragForecast.mini, dates)
    const daily = dailyIcons(cragForecast.mini, dates)
    const avgTempC = Math.round(avg(cragForecast.mini.temp) * 10) / 10
    const avgWindMph = Math.round(avg(cragForecast.mini.wind) * 10) / 10
    const avgWindDir = cragForecast.mini.windDir?.length ? degToCompass(circularMeanDeg(cragForecast.mini.windDir)) : ''
    const totalRainMm = Math.round(sum(cragForecast.mini.rainMm) * 10) / 10

    results.push({
      id: crag.id,
      name: crag.name,
      regionId: crag.regionId,
      score,
      modifiers,
      why,
      warnings,
      daily,
      avgTempC,
      avgWindMph,
      avgWindDir,
      totalRainMm,
      aspect: crag.aspect,
      rock: crag.rock,
      types: crag.types,
      routeCount: crag.routeCount,
      tags: crag.tags,
      coords: { lat: crag.lat, lon: crag.lon },
      distanceMins,
      ukcUrl: crag.ukcId
        ? `https://www.ukclimbing.com/logbook/crags/${crag.ukcId}/`
        : `https://www.ukclimbing.com/logbook/crags/?name=${encodeURIComponent(crag.name)}`,
      links
    })
  }

  results.sort((a, b) => b.score - a.score)
  return results
})
