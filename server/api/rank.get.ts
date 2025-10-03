import { getForecast } from "~/server/utils/forecast"
import { regions } from "~/server/utils/regions"
import { haversineKm, driveMinutesApprox } from "~/server/utils/distance"
import { scoreRegion, type ClimbType } from "~/server/utils/score"
import { presetDates, parseDate, formatDate } from "~/server/utils/dates"

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const lat = Number(q.lat)
  const lon = Number(q.lon)
  const maxDriveMins = q.maxDriveMins ? Number(q.maxDriveMins) : 120
  const climbType = (q.climbType as ClimbType) || 'any'
  const datesParam = (q.dates as string) || ''

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw createError({ statusCode: 400, statusMessage: 'lat, lon required' })
  }

  let dates: string[]
  if (datesParam) {
    dates = datesParam.split(',').map(s => s.trim()).filter(Boolean)
  } else {
    dates = presetDates('next-weekend')
  }
  dates = dates.map(d => formatDate(parseDate(d)))

  const home = { lat, lon }

  const results = await Promise.all(regions.map(async (r) => {
    const pt = r.points[0]
    const km = haversineKm(home, { lat: pt.lat, lon: pt.lon })
    const distanceMins = driveMinutesApprox(km)

    const { mini, updatedAt } = await getForecast(event, pt.lat, pt.lon, dates)

    const { score, why } = scoreRegion(mini, {
      rocks: r.rock,
      typeAffinity: r.typeAffinity,
      climbType,
      distanceMins,
      maxDriveMins
    })

    const locParam = `${encodeURIComponent(String(pt.lat))}%2C+${encodeURIComponent(String(pt.lon))}`
    return {
      id: r.id,
      name: r.name,
      score,
      why,
      mini,
      distanceMins,
      updatedAt,
      typeAffinity: r.typeAffinity,
      coords: { lat: pt.lat, lon: pt.lon },
      ukcUrl: `https://www.ukclimbing.com/logbook/crags/?location=${locParam}&distance=20`
    }
  }))

  results.sort((a, b) => b.score - a.score)
  return results
})
