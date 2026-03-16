import type { MiniSeries } from './forecast'

export type WarningLevel = 'amber' | 'red'

export type WeatherWarning = {
  level: WarningLevel
  type: string
  message: string
}

function max(a: number[]) { return a.length ? Math.max(...a) : 0 }
function avg(a: number[]) { return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0 }
function sum(a: number[]) { return a.reduce((s, x) => s + x, 0) }

/**
 * Analyse a forecast mini-series and return any severe weather warnings.
 * Thresholds are tuned for UK outdoor climbing safety.
 */
export function checkWarnings(mini: MiniSeries, dates: string[]): WeatherWarning[] {
  const warnings: WeatherWarning[] = []

  for (const d of dates) {
    const idx: number[] = []
    for (let i = 0; i < mini.hours.length; i++) {
      if (mini.hours[i]?.startsWith(d)) idx.push(i)
    }
    if (!idx.length) continue

    const gusts = idx.map(i => mini.gust[i] || 0)
    const winds = idx.map(i => mini.wind[i] || 0)
    const rain = idx.map(i => mini.rainMm[i] || 0)
    const pop = idx.map(i => mini.pop[i] || 0)
    const temps = idx.map(i => mini.temp[i] || 0)

    const gustMax = max(gusts)
    const windAvg = avg(winds)
    const rainSum = sum(rain)
    const popMax = max(pop)
    const tempMin = Math.min(...temps)
    const tempMax = Math.max(...temps)

    const thunderRisk = popMax >= 60 && rainSum >= 3 && gustMax >= 30

    // Lightning / thunder – red
    if (thunderRisk) {
      warnings.push({ level: 'red', type: 'thunder', message: `Thunderstorm risk on ${fmtDate(d)}` })
    }

    // Extreme wind – red (gusts > 45 mph, dangerous on any crag)
    if (gustMax >= 45) {
      warnings.push({ level: 'red', type: 'wind', message: `Dangerous gusts of ${Math.round(gustMax)} mph on ${fmtDate(d)}` })
    }
    // High wind – amber (gusts > 30 mph, risky on exposed rock)
    else if (gustMax >= 30) {
      warnings.push({ level: 'amber', type: 'wind', message: `Strong gusts of ${Math.round(gustMax)} mph on ${fmtDate(d)}` })
    }

    // Very heavy rain – red (> 10mm, rock will be soaked)
    if (rainSum >= 10) {
      warnings.push({ level: 'red', type: 'rain', message: `Very heavy rain (${Math.round(rainSum)} mm) on ${fmtDate(d)}` })
    }
    // Heavy rain – amber (> 4mm, wet rock likely)
    else if (rainSum >= 4) {
      warnings.push({ level: 'amber', type: 'rain', message: `Heavy rain (${Math.round(rainSum)} mm) on ${fmtDate(d)}` })
    }

    // Freezing – amber (min temp below 0°C)
    if (tempMin <= 0) {
      warnings.push({ level: 'amber', type: 'cold', message: `Freezing conditions (${Math.round(tempMin)}°C) on ${fmtDate(d)}` })
    }

    // Extreme heat – amber (max temp > 28°C)
    if (tempMax >= 28) {
      warnings.push({ level: 'amber', type: 'heat', message: `Very hot (${Math.round(tempMax)}°C) on ${fmtDate(d)}` })
    }

    // Snow / ice – amber
    if (tempMin <= 2 && popMax >= 30 && rainSum >= 0.5) {
      warnings.push({ level: 'amber', type: 'snow', message: `Snow or ice likely on ${fmtDate(d)}` })
    }
  }

  // Deduplicate: keep highest-level warning per type
  const byType = new Map<string, WeatherWarning>()
  for (const w of warnings) {
    const existing = byType.get(w.type)
    if (!existing || levelRank(w.level) > levelRank(existing.level)) {
      byType.set(w.type, w)
    }
  }

  return Array.from(byType.values()).sort((a, b) => levelRank(b.level) - levelRank(a.level))
}

function levelRank(l: WarningLevel): number {
  return l === 'red' ? 2 : 1
}

function fmtDate(d: string): string {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}
