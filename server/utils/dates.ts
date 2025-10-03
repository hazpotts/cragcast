export type WhenPreset = 'today' | 'tomorrow' | 'this-weekend' | 'next-weekend' | 'custom'

export function formatDate(d: Date) {
  const y = d.getFullYear()
  const m = `${d.getMonth() + 1}`.padStart(2, '0')
  const day = `${d.getDate()}`.padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function presetDates(preset: WhenPreset, now = new Date()): string[] {
  const local = new Date(now)
  local.setHours(0, 0, 0, 0)

  if (preset === 'today') return [formatDate(local)]

  if (preset === 'tomorrow') {
    const d = new Date(local)
    d.setDate(d.getDate() + 1)
    return [formatDate(d)]
  }

  const weekend = getWeekend(local)
  if (preset === 'this-weekend') return weekend

  if (preset === 'next-weekend') {
    const sat = parseDate(weekend[0])
    sat.setDate(sat.getDate() + 7)
    const sun = new Date(sat)
    sun.setDate(sat.getDate() + 1)
    return [formatDate(sat), formatDate(sun)]
  }

  return [formatDate(local)]
}

export function getWeekend(d: Date): string[] {
  // Weekend = Saturday and Sunday
  const day = d.getDay() // 0 Sun ... 6 Sat
  const daysUntilSat = (6 - day + 7) % 7
  const sat = new Date(d)
  sat.setDate(sat.getDate() + daysUntilSat)
  const sun = new Date(sat)
  sun.setDate(sun.getDate() + 1)
  return [formatDate(sat), formatDate(sun)]
}

export function parseDate(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function filterHoursByDates(times: string[], dates: string[]) {
  const set = new Set(dates)
  return times.map((t, i) => ({ t, i })).filter(({ t }) => set.has(t.slice(0, 10)))
}
