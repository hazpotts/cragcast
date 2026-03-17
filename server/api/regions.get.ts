import { regions } from "~/server/utils/regions"
import { crags } from "~/server/utils/crags"

export default defineEventHandler(() => {
  const cragCounts = new Map<string, number>()
  for (const c of crags) {
    cragCounts.set(c.regionId, (cragCounts.get(c.regionId) || 0) + 1)
  }
  return regions.map(r => ({
    ...r,
    cragCount: cragCounts.get(r.id) || 0
  }))
})
