import { getForecast } from "~/server/utils/forecast"
import { regions } from "~/server/utils/regions"
import { getCragsByRegion } from "~/server/utils/crag-db"
import { haversineKm, driveMinutesApprox } from "~/server/utils/distance"
import { scoreRegion, scoreCrag } from "~/server/utils/score"
import { parseDate, formatDate } from "~/server/utils/dates"
import { dailyIcons } from "~/server/utils/icons"
import { checkWarnings } from "~/server/utils/warnings"

function avg(a: number[]) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0 }
function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

async function fetchForecastWithRetry(event: any, lat: number, lon: number, dates: string[], attempts = 3) {
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
    if (i < attempts - 1) await sleep(300 * Math.pow(2, i))
  }
  console.warn('[crags] forecast failed after retries', { lat, lon, err: String(lastErr) })
  return null
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const regionId = String(q.regionId || '')
  const lat = Number(q.lat)
  const lon = Number(q.lon)
  const hasHome = Number.isFinite(lat) && Number.isFinite(lon)
  const minDriveMins = q.minDriveMins ? Number(q.minDriveMins) : 0
  const maxDriveMins = q.maxDriveMins ? Number(q.maxDriveMins) : Infinity
  const datesParam = (q.dates as string) || ''

  if (!regionId) {
    throw createError({ statusCode: 400, statusMessage: 'regionId required' })
  }

  const region = regions.find(r => r.id === regionId)
  if (!region) throw createError({ statusCode: 404, statusMessage: 'region not found' })

  const regionCrags = await getCragsByRegion(event, regionId)
  if (!regionCrags.length) return []

  let dates: string[]
  if (datesParam) {
    dates = datesParam.split(',').map(s => s.trim()).filter(Boolean)
  } else {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const s = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    dates = [s]
  }
  dates = dates.map(d => formatDate(parseDate(d)))

  // Get the region-level forecast for the base score
  const regionPt = region.points[0]
  const regionForecast = await fetchForecastWithRetry(event, regionPt.lat, regionPt.lon, dates)
  if (!regionForecast) {
    throw createError({ statusCode: 503, statusMessage: 'forecast unavailable for region' })
  }

  let regionDistanceMins = 0
  if (hasHome) {
    const km = haversineKm({ lat, lon }, { lat: regionPt.lat, lon: regionPt.lon })
    regionDistanceMins = driveMinutesApprox(km)
  }

  const { score: regionScore } = scoreRegion(regionForecast.mini, {
    rocks: region.rock,
    distanceMins: regionDistanceMins,
    minDriveMins,
    maxDriveMins
  })

  // Score each crag using the region forecast (crags within a region share similar weather)
  const results = regionCrags.map(crag => {
    const { score, modifiers } = scoreCrag(regionScore, regionForecast.mini, {
      aspect: crag.aspect,
      rocks: crag.rock,
      tags: crag.tags
    })

    let distanceMins = 0
    if (hasHome) {
      const km = haversineKm({ lat, lon }, { lat: crag.lat, lon: crag.lon })
      distanceMins = driveMinutesApprox(km)
    }

    return {
      id: crag.id,
      name: crag.name,
      regionId: crag.regionId,
      score,
      modifiers,
      aspect: crag.aspect,
      rock: crag.rock,
      types: crag.types,
      routeCount: crag.routeCount,
      tags: crag.tags,
      coords: { lat: crag.lat, lon: crag.lon },
      distanceMins,
      ukcUrl: `https://www.ukclimbing.com/logbook/crags/?location=${encodeURIComponent(String(crag.lat))}%2C+${encodeURIComponent(String(crag.lon))}&distance=5`
    }
  })

  results.sort((a, b) => b.score - a.score)
  return results
})
