import type { MiniSeries } from './forecast'
import type { Aspect } from './crags'

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
  minDriveMins?: number
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
  const minMins = opts.minDriveMins ?? 0
  const maxMins = Math.max(30, opts.maxDriveMins)
  let distMultiplier = 1
  if (hasDist) {
    if (dist >= minMins && dist <= maxMins) distMultiplier = 1
    else if (dist > maxMins) distMultiplier = Math.max(0.6, 1 - (dist - maxMins) / 180)
    else if (minMins > 0 && dist < minMins) distMultiplier = Math.max(0.6, 1 - (minMins - dist) / 180)
  }

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
    if (minMins > 0 && dist < minMins) why.push('Closer than preferred')
    else if (dist > maxMins) why.push('Further than preferred')
    else if (dist <= 45) why.push('Close by')
    else if (dist <= 90) why.push('Within reach')
  }

  return { score: finalScore, why: why.slice(0, 3) }
}

// --- Crag-level scoring ---

const ASPECT_DEGREES: Record<string, number> = {
  N: 0, NE: 45, E: 90, SE: 135, S: 180, SW: 225, W: 270, NW: 315
}

/** Angle difference between two compass bearings (0-180) */
function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b) % 360 + 360) % 360)
  return d > 180 ? 360 - d : d
}

/**
 * Score an individual crag by adjusting the region base score with
 * aspect, shelter/exposure, and drying modifiers.
 * Returns a score in the same 0-100 range.
 */
export function scoreCrag(
  regionScore: number,
  mini: MiniSeries,
  opts: {
    aspect: Aspect | null
    rocks: string[]
    tags: string[]
  }
): { score: number; modifiers: string[] } {
  const temp = avg(mini.temp)
  const wind = avg(mini.wind)
  const rain = sum(mini.rainMm)
  const pop = avg(mini.pop)
  const avgWindDir = mini.windDir?.length ? avg(mini.windDir) : null
  const modifiers: string[] = []

  let adjustment = 0

  // --- Aspect + temperature ---
  if (opts.aspect) {
    const deg = ASPECT_DEGREES[opts.aspect]
    // South-facing (135-225°) gets solar warming bonus in cold weather
    const isSouthish = deg >= 135 && deg <= 225
    // North-facing (315-360, 0-45°) gets shade bonus in hot weather
    const isNorthish = deg <= 45 || deg >= 315

    if (isSouthish && temp < 10) {
      // Cold day + south-facing = solar warming benefit
      const bonus = Math.min(6, (10 - temp) * 0.6)
      adjustment += bonus
      modifiers.push('Sun-warmed (south-facing)')
    } else if (isNorthish && temp > 18) {
      // Hot day + north-facing = shade benefit
      const bonus = Math.min(6, (temp - 18) * 0.6)
      adjustment += bonus
      modifiers.push('Shaded (north-facing)')
    }

    // East-facing bonus in the morning sun (general small bonus for climbers who go early)
    if (opts.aspect === 'E' || opts.aspect === 'SE') {
      if (temp < 14) {
        adjustment += 2
        modifiers.push('Morning sun')
      }
    }
  }

  // --- Aspect + wind direction (shelter) ---
  if (opts.aspect && avgWindDir !== null && wind > 15) {
    const aspectDeg = ASPECT_DEGREES[opts.aspect]
    const diff = angleDiff(aspectDeg, avgWindDir)

    if (diff >= 120) {
      // Crag faces away from wind — sheltered
      const bonus = Math.min(5, (wind - 15) * 0.3)
      adjustment += bonus
      modifiers.push('Sheltered from wind')
    } else if (diff <= 45) {
      // Crag faces into the wind — exposed
      const penalty = Math.min(5, (wind - 15) * 0.3)
      adjustment -= penalty
      modifiers.push('Facing the wind')
    }
  }

  // --- Exposure / shelter tags ---
  const isExposed = opts.tags.includes('exposed') || opts.tags.includes('wind-exposed')
  const isSheltered = opts.tags.includes('sheltered')

  if (isExposed && wind > 20) {
    const penalty = Math.min(5, (wind - 20) * 0.4)
    adjustment -= penalty
    if (!modifiers.some(m => m.includes('wind'))) modifiers.push('Exposed site')
  }
  if (isSheltered && wind > 20) {
    const bonus = Math.min(4, (wind - 20) * 0.3)
    adjustment += bonus
    if (!modifiers.some(m => m.includes('wind') || m.includes('helter'))) modifiers.push('Sheltered site')
  }

  // --- Drying speed after rain ---
  if (rain > 2 || pop > 50) {
    const isQuickDry = opts.tags.includes('quick-dry')
    const isSeaCliff = opts.tags.includes('sea-cliff')
    const isNorthFacing = opts.aspect === 'N' || opts.aspect === 'NE' || opts.aspect === 'NW'

    if (isQuickDry || isSeaCliff) {
      adjustment += 3
      modifiers.push('Dries quickly')
    } else if (isSheltered && isNorthFacing) {
      adjustment -= 3
      modifiers.push('Stays wet after rain')
    }
  }

  const finalScore = Math.round(Math.max(0, Math.min(100, regionScore + adjustment)))
  return { score: finalScore, modifiers }
}
