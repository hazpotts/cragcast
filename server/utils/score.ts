import type { MiniSeries } from './forecast'

function avg(a: number[]) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0 }
function max(a: number[]) { return a.length ? Math.max(...a) : 0 }
function sum(a: number[]) { return a.length ? a.reduce((s, x) => s + x, 0) : 0 }

export type RockKind = 'gritstone' | 'limestone' | 'sandstone' | 'volcanic' | 'rhyolite' | 'andesite' | 'other'

function tempTarget(rocks: string[]): { min: number; max: number } {
  const has = (r: string) => rocks.includes(r)
  if (has('gritstone') || has('sandstone')) return { min: 6, max: 12 }
  if (has('limestone')) return { min: 12, max: 18 }
  return { min: 8, max: 16 }
}

export function scoreRegion(mini: MiniSeries, opts: {
  rocks: string[]
  distanceMins: number
  maxDriveMins: number
}): { score: number; why: string[] } {
  const rain = avg(mini.rainMm)
  const pop = avg(mini.pop)
  const wind = avg(mini.wind)
  const gust = max(mini.gust)
  const temp = avg(mini.temp)
  const cloud = avg(mini.cloud)

  const drynessPct = Math.max(0, 100 - (rain * 12 + pop * 0.6)) // 40%
  let drynessScore = (drynessPct / 100) * 40

  let windPenalty = 0
  if (wind > 25) windPenalty += (wind - 25) * 0.8
  if (gust > 30) windPenalty += (gust - 30) * 0.5
  const windScore = Math.max(0, 25 - windPenalty) // out of 25

  const { min, max: tmax } = tempTarget(opts.rocks)
  let frictionPct: number
  if (temp < min) frictionPct = Math.max(0, 1 - (min - temp) / 10)
  else if (temp > tmax) frictionPct = Math.max(0, 1 - (temp - tmax) / 10)
  else frictionPct = 1
  const tempScore = frictionPct * 20

  const cloudBonus = temp > tmax ? (cloud / 100) * 10 : (1 - cloud / 100) * 5
  const baseScore = Math.max(0, Math.min(100, drynessScore + windScore + tempScore + cloudBonus))

  const hasDist = Number.isFinite(opts.distanceMins) && Number.isFinite(opts.maxDriveMins)
  const dist = opts.distanceMins
  const maxMins = Math.max(30, opts.maxDriveMins)
  const distMultiplier = hasDist
    ? (dist <= maxMins ? 1 : Math.max(0.6, 1 - (dist - maxMins) / 180))
    : 1

  const finalScore = Math.round(Math.max(0, Math.min(100, baseScore * distMultiplier)))

  const why: string[] = []
  // Precipitation summary (use both total precip and max probability to avoid conflicts with icons)
  const rainSum = sum(mini.rainMm)
  const popMax = max(mini.pop)
  if (popMax >= 70 || rainSum >= 4) why.push('Rain likely')
  else if (popMax >= 40 || rainSum >= 1) why.push('Showers possible')
  else if (drynessPct >= 90) why.push('Very low rain chance')
  else why.push('Low chance of rain')

  // Wind summary
  if (wind < 10 && gust < 20) why.push('Calm winds')
  else if (wind < 15 && gust < 25) why.push('Light winds')
  else if (gust > 35) why.push('Gusty')

  // Temperature/friction
  if (frictionPct >= 0.9) why.push('Good temps for friction')
  else if (temp > tmax + 4) why.push('Hot')
  else if (temp > tmax) why.push('Warm, seek shade')
  else if (temp >= min && temp <= tmax) why.push('Mild temperatures')

  // Cloud context (only add one cloud message)
  if (cloud < 30 && temp <= tmax) why.push('Sunny spells')
  else if (cloud < 60 && temp <= tmax) why.push('Bright intervals')
  else if (cloud > 70) why.push('Overcast')

  // Distance context only when we have a real distance
  if (hasDist) {
    if (dist <= 45) why.push('Close by')
    else if (dist <= 90) why.push('Within reach')
  }

  return { score: finalScore, why: why.slice(0, 3) }
}
