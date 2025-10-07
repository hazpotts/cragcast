import { getForecast } from "~/server/utils/forecast"
import { regions } from "~/server/utils/regions"
import { haversineKm, driveMinutesApprox } from "~/server/utils/distance"
import { scoreRegion } from "~/server/utils/score"
import { presetDates, parseDate, formatDate } from "~/server/utils/dates"

function sum(a: number[]) { return a.reduce((s, x) => s + x, 0) }
function avg(a: number[]) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0 }
function max(a: number[]) { return a.length ? Math.max(...a) : 0 }
function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

async function fetchForecastWithRetry(event: any, lat: number, lon: number, dates: string[], attempts = 3) {
  let lastErr: any
  for (let i = 0; i < attempts; i++) {
    try {
      const out = await getForecast(event, lat, lon, dates)
      const mini = out?.mini
      if (mini && Array.isArray(mini.hours) && mini.hours.length) return out
      lastErr = new Error('empty-mini')
    } catch (e: any) {
      lastErr = e
    }
    // exponential backoff: 300ms, 600ms, 1200ms
    await sleep(300 * Math.pow(2, i))
  }
  console.warn('[rank] forecast failed after retries', { lat, lon, err: String(lastErr) })
  return null
}

function dailyIcons(mini: { hours: string[]; rainMm: number[]; pop: number[]; gust: number[]; cloud: number[]; temp: number[]; wind: number[] }, dates: string[]) {
  const icons: { date: string; icon: string; tempAvgC: number; windAvgMph: number; rainSumMm: number }[] = []
  for (const d of dates) {
    const idx: number[] = []
    for (let i = 0; i < mini.hours.length; i++) {
      if (mini.hours[i]?.startsWith(d)) idx.push(i)
    }
    if (!idx.length) { icons.push({ date: d, icon: 'cloud', tempAvgC: 0, windAvgMph: 0, rainSumMm: 0 }); continue }
    const r = idx.map(i => mini.rainMm[i] || 0)
    const p = idx.map(i => mini.pop[i] || 0)
    const g = idx.map(i => mini.gust[i] || 0)
    const c = idx.map(i => mini.cloud[i] || 0)
    const t = idx.map(i => mini.temp[i] || 0)
    const w = idx.map(i => (mini as any).wind?.[i] || 0)
    const rainSum = sum(r)
    const popMax = max(p)
    const gustMax = max(g)
    const cloudAvg = avg(c)
    const tempAvg = avg(t)
    const windAvg = avg(w)

    let icon: string
    const precipLikely = (popMax >= 40 || rainSum >= 1)
    const veryWet = (rainSum >= 6 || (popMax >= 80 && rainSum >= 2))
    const thunderRisk = (popMax >= 70 && rainSum >= 4 && gustMax >= 35)
    if (thunderRisk) icon = 'thunder'
    else if (tempAvg <= 1.5 && precipLikely) icon = 'snow'
    else if (tempAvg > 1.5 && tempAvg <= 3 && precipLikely) icon = 'sleet'
    else if (veryWet) icon = 'heavy-rain'
    else if (precipLikely) icon = 'rain'
    else if (cloudAvg < 20) icon = 'sun'
    else if (cloudAvg < 60) icon = 'light-cloud'
    else if (cloudAvg >= 85 && !precipLikely) icon = 'dark-cloud'
    else icon = 'cloud'
    icons.push({
      date: d,
      icon,
      tempAvgC: Math.round(tempAvg * 10) / 10,
      windAvgMph: Math.round(windAvg * 10) / 10,
      rainSumMm: Math.round(rainSum * 10) / 10
    })
  }
  return icons
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const lat = Number(q.lat)
  const lon = Number(q.lon)
  const maxDriveMins = (q.maxDriveMins !== undefined) ? Number(q.maxDriveMins) : Infinity
  const datesParam = (q.dates as string) || ''
  const hasHome = Number.isFinite(lat) && Number.isFinite(lon)

  let dates: string[]
  if (datesParam) {
    dates = datesParam.split(',').map(s => s.trim()).filter(Boolean)
  } else {
    dates = presetDates('next-weekend')
  }
  dates = dates.map(d => formatDate(parseDate(d)))

  const home = { lat, lon }

  const results: any[] = []
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
      // Skip fetching/processing this region entirely
      continue
    }

    const out = await fetchForecastWithRetry(event, pt.lat, pt.lon, dates, 3)
    // If still failing, skip this region for now (no defaults) and continue
    if (!out) { await sleep(100); continue }

    const { mini, updatedAt } = out

    const { score, why } = scoreRegion(mini, {
      rocks: r.rock,
      distanceMins: Number.isFinite(distanceMins) ? distanceMins : 0,
      maxDriveMins
    })

    const locParam = `${encodeURIComponent(String(pt.lat))}%2C+${encodeURIComponent(String(pt.lon))}`
    const avgTempC = Math.round(avg(mini.temp) * 10) / 10
    const avgWindMph = Math.round(avg(mini.wind) * 10) / 10
    const avgRainMm = Math.round(avg(mini.rainMm) * 10) / 10
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
      windy: `https://www.windy.com/${pt.lat.toFixed(3)}/${pt.lon.toFixed(3)}?${pt.lat.toFixed(3)},${pt.lon.toFixed(3)},${zoom}`
    }

    results.push({
      id: r.id,
      name: r.name,
      score,
      why,
      daily: dailyIcons(mini, dates),
      distanceMins,
      updatedAt,
      coords: { lat: pt.lat, lon: pt.lon },
      ukcUrl: `https://www.ukclimbing.com/logbook/crags/?location=${locParam}&distance=20`,
      avgTempC,
      avgWindMph,
      avgRainMm,
      links
    })

    // Small delay between region calls to ease rate limits
    await sleep(100)
  }

  results.sort((a, b) => b.score - a.score)
  return results
})
