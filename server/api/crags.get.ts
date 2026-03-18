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

async function parallel<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency = 6): Promise<R[]> {
  const results: R[] = []
  const pending: Promise<void>[] = []
  let index = 0
  async function runNext(): Promise<void> {
    const i = index++
    if (i >= items.length) return
    results[i] = await fn(items[i])
    await runNext()
  }
  for (let i = 0; i < Math.min(concurrency, items.length); i++) pending.push(runNext())
  await Promise.all(pending)
  return results
}

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

const coordKey = (lat: number, lon: number) => `${lat.toFixed(2)},${lon.toFixed(2)}`

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

  // Deduplicate by rounded coordinates (~1.1km precision, matches forecast cache granularity)
  const keyToCoord = new Map<string, { lat: number; lon: number }>()
  for (const crag of regionCrags) {
    const key = coordKey(crag.lat, crag.lon)
    if (!keyToCoord.has(key)) keyToCoord.set(key, { lat: crag.lat, lon: crag.lon })
  }
  const uniqueCoords = [...keyToCoord.entries()].map(([key, coord]) => ({ key, ...coord }))

  // Fetch forecasts for all unique crag coordinates in parallel
  const forecastResults = await parallel(uniqueCoords, ({ lat: cLat, lon: cLon }) =>
    fetchForecastWithRetry(event, cLat, cLon, dates), 8)

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
      bbc: `https://www.bbc.co.uk/weather?lat=${crag.lat}&lon=${crag.lon}`,
      metoffice: `https://www.metoffice.gov.uk/weather/search?query=${encodeURIComponent(crag.name)}`,
      windy: `https://www.windy.com/${crag.lat.toFixed(3)}/${crag.lon.toFixed(3)}?${crag.lat.toFixed(3)},${crag.lon.toFixed(3)},12`,
      yrno: `https://www.yr.no/en/forecast/daily-table/${crag.lat.toFixed(4)},${crag.lon.toFixed(4)}`
    }

    const warnings = checkWarnings(cragForecast.mini, dates)
    const daily = dailyIcons(cragForecast.mini, dates)
    const avgTempC = Math.round(avg(cragForecast.mini.temp) * 10) / 10
    const avgWindMph = Math.round(avg(cragForecast.mini.wind) * 10) / 10
    const avgRainMm = Math.round(avg(cragForecast.mini.rainMm) * 10) / 10

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
      avgRainMm,
      aspect: crag.aspect,
      rock: crag.rock,
      types: crag.types,
      routeCount: crag.routeCount,
      tags: crag.tags,
      coords: { lat: crag.lat, lon: crag.lon },
      distanceMins,
      ukcUrl: `https://www.ukclimbing.com/logbook/crags/?location=${encodeURIComponent(String(crag.lat))}%2C+${encodeURIComponent(String(crag.lon))}&distance=5`,
      links
    })
  }

  results.sort((a, b) => b.score - a.score)
  return results
})
