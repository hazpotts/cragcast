import { describe, it, expect } from 'vitest'
import { scoreRegion } from '~/server/utils/score'

const mini = { hours:[], rainMm:[0,0,0], pop:[0,0,0], wind:[10,12,8], gust:[15,18,20], temp:[10,11,12], cloud:[20,30,40] }

describe('score', () => {
  it('scores reasonably for dry, light winds', () => {
    const r = scoreRegion(mini, { rocks:['gritstone'], distanceMins:30, maxDriveMins:120 })
    expect(r.score).toBeGreaterThan(50)
  })
})
