import { fetchForecastWithRetry } from "~/server/utils/forecast"
import { areas, regions } from "~/server/utils/regions"
import { haversineKm, driveMinutesApprox } from "~/server/utils/distance"
import { scoreRegion } from "~/server/utils/score"
import { parseDatesParam } from "~/server/utils/dates"
import { dailyIcons } from "~/server/utils/icons"
import { checkWarnings } from "~/server/utils/warnings"
import { avg, sum, parallel, circularMeanDeg, degToCompass } from "~/server/utils/server-utils"

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const lat = Number(q.lat)
  const lon = Number(q.lon)
  const minDriveMins = q.minDriveMins ? Number(q.minDriveMins) : 0
  const maxDriveMins = q.maxDriveMins ? Number(q.maxDriveMins) : Infinity
  const hasHome = Number.isFinite(lat) && Number.isFinite(lon)

  const dates = parseDatesParam((q.dates as string) || '', 'next-weekend')

  // Collect rock types and region count per area (by area name)
  const rocksByArea: Record<string, Set<string>> = {}
  const regionCountsByArea: Record<string, number> = {}
  for (const r of regions) {
    if (!r.area) continue
    if (!rocksByArea[r.area]) rocksByArea[r.area] = new Set()
    for (const rock of r.rock) rocksByArea[r.area].add(rock)
    regionCountsByArea[r.area] = (regionCountsByArea[r.area] || 0) + 1
  }

  // Pre-filter areas by distance
  type AreaWithDistance = { area: typeof areas[0]; distanceMins: number }
  const candidateAreas: AreaWithDistance[] = []
  for (const area of areas) {
    let distanceMins = 0
    if (hasHome) {
      const km = haversineKm({ lat, lon }, { lat: area.lat, lon: area.lon })
      distanceMins = driveMinutesApprox(km)
    }
    const unlimited = !hasHome || !Number.isFinite(maxDriveMins)
    if (!unlimited && distanceMins > maxDriveMins) continue
    if (hasHome && minDriveMins > 0 && distanceMins < minDriveMins) continue
    candidateAreas.push({ area, distanceMins })
  }

  // Fetch forecasts for all area centroids in parallel
  const forecasts = await parallel(candidateAreas, ({ area }) =>
    fetchForecastWithRetry(event, area.lat, area.lon, dates, { attempts: 2, timeoutMs: 4000, backoffMs: 200, tag: 'areas' })
  , 8)

  const results: any[] = []
  for (let i = 0; i < candidateAreas.length; i++) {
    const { area, distanceMins } = candidateAreas[i]
    const out = forecasts[i]
    if (!out) continue

    const { mini, updatedAt } = out
    const rocks = Array.from(rocksByArea[area.name] || [])
    const { score, why } = scoreRegion(mini, { rocks, distanceMins, minDriveMins, maxDriveMins })

    const avgTempC = Math.round(avg(mini.temp) * 10) / 10
    const avgWindMph = Math.round(avg(mini.wind) * 10) / 10
    const avgWindDir = mini.windDir?.length ? degToCompass(circularMeanDeg(mini.windDir)) : ''
    const totalRainMm = Math.round(sum(mini.rainMm) * 10) / 10
    const warnings = checkWarnings(mini, dates)

    const links = {
      bbc: `https://www.bbc.co.uk/weather?lat=${area.lat}&lon=${area.lon}`,
      metoffice: `https://www.metoffice.gov.uk/weather/search?query=${encodeURIComponent(area.name)}`,
      windy: `https://www.windy.com/${area.lat.toFixed(3)}/${area.lon.toFixed(3)}?${area.lat.toFixed(3)},${area.lon.toFixed(3)},7`,
      yrno: `https://www.yr.no/en/forecast/daily-table/${area.lat.toFixed(4)},${area.lon.toFixed(4)}`
    }

    results.push({
      id: area.id,
      name: area.name,
      score,
      why,
      ...(warnings.length ? { warnings } : {}),
      daily: dailyIcons(mini, dates),
      distanceMins,
      updatedAt,
      coords: { lat: area.lat, lon: area.lon },
      ukcUrl: `https://www.ukclimbing.com/logbook/crags/?location=${encodeURIComponent(String(area.lat))}%2C+${encodeURIComponent(String(area.lon))}&distance=50`,
      avgTempC,
      avgWindMph,
      avgWindDir,
      totalRainMm,
      links,
      regionCount: regionCountsByArea[area.name] || 0
    })
  }

  results.sort((a, b) => b.score - a.score)
  return results
})
