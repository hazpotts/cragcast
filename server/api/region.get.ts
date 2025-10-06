import { getForecast } from "~/server/utils/forecast"
import { regions } from "~/server/utils/regions"
import { haversineKm, driveMinutesApprox } from "~/server/utils/distance"
import { scoreRegion } from "~/server/utils/score"
import { parseDate, formatDate } from "~/server/utils/dates"

function sum(a: number[]) { return a.reduce((s, x) => s + x, 0) }
function avg(a: number[]) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0 }
function max(a: number[]) { return a.length ? Math.max(...a) : 0 }
function sleep(ms: number) { return new Promise(res => setTimeout(res, ms)) }

async function fetchForecastWithRetry(event: any, lat: number, lon: number, dates: string[], attempts = 4) {
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
    await sleep(300 * Math.pow(2, i))
  }
  throw createError({ statusCode: 503, statusMessage: `forecast unavailable: ${String(lastErr)}` })
}

function dailyIcons(mini: { hours: string[]; rainMm: number[]; pop: number[]; gust: number[]; cloud: number[]; temp: number[] }, dates: string[]) {
  const icons: { date: string; icon: string }[] = []
  for (const d of dates) {
    const idx: number[] = []
    for (let i = 0; i < mini.hours.length; i++) {
      if (mini.hours[i]?.startsWith(d)) idx.push(i)
    }
    if (!idx.length) { icons.push({ date: d, icon: 'cloud' }); continue }
    const r = idx.map(i => mini.rainMm[i] || 0)
    const p = idx.map(i => mini.pop[i] || 0)
    const g = idx.map(i => mini.gust[i] || 0)
    const c = idx.map(i => mini.cloud[i] || 0)
    const t = idx.map(i => mini.temp[i] || 0)
    const rainSum = sum(r)
    const popMax = max(p)
    const gustMax = max(g)
    const cloudAvg = avg(c)
    const tempAvg = avg(t)

    let icon: string
    const precipLikely = (popMax >= 40 || rainSum >= 1)
    if (popMax >= 70 && rainSum >= 2 && gustMax >= 40) icon = 'thunder'
    else if (tempAvg <= 1.5 && precipLikely) icon = 'snow'
    else if (tempAvg > 1.5 && tempAvg <= 3 && precipLikely) icon = 'sleet'
    else if (popMax >= 70 || rainSum >= 4) icon = 'heavy-rain'
    else if (precipLikely) icon = 'rain'
    else if (cloudAvg < 20) icon = 'sun'
    else if (cloudAvg < 60) icon = 'light-cloud'
    else if (cloudAvg >= 80) icon = 'dark-cloud'
    else icon = 'cloud'
    icons.push({ date: d, icon })
  }
  return icons
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const id = String(q.id || '')
  const lat = Number(q.lat)
  const lon = Number(q.lon)
  const hasHome = Number.isFinite(lat) && Number.isFinite(lon)
  const maxDriveMins = q.maxDriveMins ? Number(q.maxDriveMins) : Infinity
  const datesParam = (q.dates as string) || ''
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'id required' })
  }
  const region = regions.find(r => r.id === id)
  if (!region) throw createError({ statusCode: 404, statusMessage: 'region not found' })

  let dates: string[]
  if (datesParam) {
    dates = datesParam.split(',').map(s => s.trim()).filter(Boolean)
  } else {
    // default to tomorrow if not provided, but realistically UI sends explicit dates
    const d = new Date()
    d.setDate(d.getDate() + 1)
    const s = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    dates = [s]
  }
  dates = dates.map(d => formatDate(parseDate(d)))

  const pt = region.points[0]
  let distanceMins = 0
  if (hasHome) {
    const km = haversineKm({ lat, lon }, { lat: pt.lat, lon: pt.lon })
    distanceMins = driveMinutesApprox(km)
  }

  const out = await fetchForecastWithRetry(event, pt.lat, pt.lon, dates, 4)
  const { mini, updatedAt } = out
  const { score, why } = scoreRegion(mini, {
    rocks: region.rock,
    distanceMins: Number.isFinite(distanceMins) ? distanceMins : 0,
    maxDriveMins
  })

  const avgTempC = Math.round(avg(mini.temp) * 10) / 10
  const avgWindMph = Math.round(avg(mini.wind) * 10) / 10
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
    windy: `https://www.windy.com/${pt.lat.toFixed(3)}/${pt.lon.toFixed(3)}?${pt.lat.toFixed(3)},${pt.lon.toFixed(3)},${zoom}`
  }

  return {
    id: region.id,
    name: region.name,
    area: (region as any).area,
    score,
    why,
    daily: dailyIcons(mini, dates),
    distanceMins: Number.isFinite(distanceMins) ? distanceMins : 0,
    updatedAt,
    coords: { lat: pt.lat, lon: pt.lon },
    ukcUrl: `https://www.ukclimbing.com/logbook/crags/?location=${encodeURIComponent(String(pt.lat))}%2C+${encodeURIComponent(String(pt.lon))}&distance=20`,
    avgTempC,
    avgWindMph,
    avgRainMm,
    links
  }
})
