import { regions } from "~/server/utils/regions"
import { getCragCountsByRegion } from "~/server/utils/crag-db"

export default defineEventHandler(async (event) => {
  const cragCounts = await getCragCountsByRegion(event)
  return regions.map(r => ({
    ...r,
    cragCount: cragCounts[r.id] || 0
  }))
})
