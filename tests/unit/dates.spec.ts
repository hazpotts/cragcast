import { describe, it, expect } from 'vitest'
import { presetDates, getWeekend, formatDate } from '~/server/utils/dates'

describe('dates', () => {
  it('next weekend returns sat+sun', () => {
    const d = new Date('2025-01-01T00:00:00Z')
    const [sat, sun] = presetDates('next-weekend', d)
    expect(sat).toMatch(/\d{4}-\d{2}-\d{2}/)
    expect(sun).toMatch(/\d{4}-\d{2}-\d{2}/)
  })
})
