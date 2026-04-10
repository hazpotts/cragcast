import { getForecast, fetchForecastWithRetry } from "~/server/utils/forecast"
import { regions } from "~/server/utils/regions"
import { getCragCountsByRegion } from "~/server/utils/crag-db"
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
  const minDriveMins = (q.minDriveMins !== undefined) ? Number(q.minDriveMins) : 0
  const maxDriveMins = (q.maxDriveMins !== undefined) ? Number(q.maxDriveMins) : Infinity
  const hasHome = Number.isFinite(lat) && Number.isFinite(lon)

  const dates = parseDatesParam((q.dates as string) || '', 'next-weekend')

  const home = { lat, lon }

  // Pre-filter regions by distance if home is set
  type RegionWithDistance = { region: typeof regions[0]; distanceMins: number; pt: { lat: number; lon: number } }
  const candidateRegions: RegionWithDistance[] = []

  for (const r of regions) {
    const pt = r.points[0]
    let distanceMins = 0
    if (hasHome) {
      const km = haversineKm(home, { lat: pt.lat, lon: pt.lon })
      distanceMins = driveMinutesApprox(km)
    }

    // Only enforce a hard distance filter when we have a home location and a finite max
    const unlimited = !hasHome || !Number.isFinite(maxDriveMins)
    if (!unlimited && Number.isFinite(distanceMins) && distanceMins > maxDriveMins) {
      continue
    }
    // Filter out regions closer than the minimum
    if (hasHome && minDriveMins > 0 && Number.isFinite(distanceMins) && distanceMins < minDriveMins) {
      continue
    }

    candidateRegions.push({ region: r, distanceMins, pt })
  }

  // Fetch forecasts in parallel with concurrency limit
  const forecasts = await parallel(candidateRegions, ({ pt }) =>
    fetchForecastWithRetry(event, pt.lat, pt.lon, dates, { attempts: 2, timeoutMs: 4000, backoffMs: 200, tag: 'rank' })
  , 8)

  // Get crag counts from D1
  const cragCounts = await getCragCountsByRegion(event)

  // Build results from forecasts
  const results: any[] = []
  for (let i = 0; i < candidateRegions.length; i++) {
    const { region: r, distanceMins, pt } = candidateRegions[i]
    const out = forecasts[i]

    // Skip if forecast failed
    if (!out) continue

    const { mini, updatedAt } = out

    const { score, why } = scoreRegion(mini, {
      rocks: r.rock,
      distanceMins: Number.isFinite(distanceMins) ? distanceMins : 0,
      minDriveMins,
      maxDriveMins
    })

    const locParam = `${encodeURIComponent(String(pt.lat))}%2C+${encodeURIComponent(String(pt.lon))}`
    const avgTempC = Math.round(avg(mini.temp) * 10) / 10
    const avgWindMph = Math.round(avg(mini.wind) * 10) / 10
    const avgWindDir = mini.windDir?.length ? degToCompass(circularMeanDeg(mini.windDir)) : ''
    const totalRainMm = Math.round(sum(mini.rainMm) * 10) / 10
    const firstDate = dates[0]
    const zoom = r.external?.windyZoom ?? 8
    const bbcId = r.external?.bbcId
    const metId = r.external?.metOfficeId
    const links = {
      bbc: bbcId
        ? `https://www.bbc.co.uk/weather/${encodeURIComponent(bbcId)}`
        : `https://www.bbc.co.uk/weather?lat=${encodeURIComponent(String(pt.lat))}&lon=${encodeURIComponent(String(pt.lon))}`,
      metoffice: metId
        ? `https://weather.metoffice.gov.uk/forecast/${encodeURIComponent(metId)}?n#?date=${encodeURIComponent(firstDate)}`
        : `https://www.metoffice.gov.uk/weather/search?query=${encodeURIComponent(r.name)}`,
      windy: `https://www.windy.com/${pt.lat.toFixed(3)}/${pt.lon.toFixed(3)}?${pt.lat.toFixed(3)},${pt.lon.toFixed(3)},${zoom}`,
      yrno: `https://www.yr.no/en/forecast/daily-table/${pt.lat.toFixed(4)},${pt.lon.toFixed(4)}`
    }

    const warnings = checkWarnings(mini, dates)

    results.push({
      id: r.id,
      name: r.name,
      score,
      why,
      ...(warnings.length ? { warnings } : {}),
      daily: dailyIcons(mini, dates),
      distanceMins,
      updatedAt,
      coords: { lat: pt.lat, lon: pt.lon },
      ukcUrl: `https://www.ukclimbing.com/logbook/crags/?location=${locParam}&distance=20`,
      avgTempC,
      avgWindMph,
      avgWindDir,
      totalRainMm,
      links,
      cragCount: cragCounts[r.id] || 0
    })
  }

  results.sort((a, b) => b.score - a.score)
  return results
})
