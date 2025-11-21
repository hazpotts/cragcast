type MiniSeries = {
  hours: string[]
  rainMm: number[]
  pop: number[]
  gust: number[]
  cloud: number[]
  temp: number[]
  wind: number[]
}

type DailyIcon = {
  date: string
  icon: string
  tempAvgC: number
  windAvgMph: number
  rainSumMm: number
}

function sum(a: number[]) {
  return a.reduce((s, x) => s + x, 0)
}

function avg(a: number[]) {
  return a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0
}

function max(a: number[]) {
  return a.length ? Math.max(...a) : 0
}

/**
 * Generate daily weather icons from mini-series forecast data
 * Uses consistent thresholds for weather conditions across all endpoints
 */
export function dailyIcons(mini: MiniSeries, dates: string[]): DailyIcon[] {
  const icons: DailyIcon[] = []

  for (const d of dates) {
    // Find all hourly indices for this date
    const idx: number[] = []
    for (let i = 0; i < mini.hours.length; i++) {
      if (mini.hours[i]?.startsWith(d)) idx.push(i)
    }

    // No data for this date - use default cloud icon
    if (!idx.length) {
      icons.push({ date: d, icon: 'cloud', tempAvgC: 0, windAvgMph: 0, rainSumMm: 0 })
      continue
    }

    // Extract data for this date's hours
    const r = idx.map(i => mini.rainMm[i] || 0)
    const p = idx.map(i => mini.pop[i] || 0)
    const g = idx.map(i => mini.gust[i] || 0)
    const c = idx.map(i => mini.cloud[i] || 0)
    const t = idx.map(i => mini.temp[i] || 0)
    const w = idx.map(i => mini.wind[i] || 0)

    // Calculate daily aggregates
    const rainSum = sum(r)
    const popMax = max(p)
    const gustMax = max(g)
    const cloudAvg = avg(c)
    const tempAvg = avg(t)
    const windAvg = avg(w)

    // Determine weather icon using consistent thresholds
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
