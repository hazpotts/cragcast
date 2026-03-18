import { getForecast } from "~/server/utils/forecast"
import { regions } from "~/server/utils/regions"
import { parseDatesParam } from "~/server/utils/dates"
import { parallel } from "~/server/utils/server-utils"

export default defineEventHandler(async (event) => {
  // Require the same ADMIN_API_KEY used by the import endpoint
  const env = event.context?.cloudflare?.env || (event as any).platform?.env || {}
  const adminKey = env.ADMIN_API_KEY
  if (!adminKey) {
    throw createError({ statusCode: 500, statusMessage: 'ADMIN_API_KEY not configured' })
  }
  const auth = getHeader(event, 'authorization')
  if (auth !== `Bearer ${adminKey}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const startTime = Date.now()

  // Get dates for next weekend + this weekend
  const thisWeekend = parseDatesParam('', 'this-weekend')
  const nextWeekend = parseDatesParam('', 'next-weekend')
  const allDates = [...new Set([...thisWeekend, ...nextWeekend])]

  const results: { region: string; success: boolean; error?: string }[] = []

  // Warm cache for all regions in parallel
  await parallel(regions, async (r) => {
    const pt = r.points[0]
    try {
      // Fetch for combined dates to warm the most likely queries
      await getForecast(event, pt.lat, pt.lon, allDates)
      results.push({ region: r.id, success: true })
    } catch (e: any) {
      results.push({ region: r.id, success: false, error: String(e) })
    }
  }, 10) // Higher concurrency for warming

  const elapsed = Date.now() - startTime
  const successCount = results.filter(r => r.success).length
  const failCount = results.filter(r => !r.success).length

  return {
    ok: true,
    elapsed,
    regions: regions.length,
    success: successCount,
    failed: failCount,
    failures: results.filter(r => !r.success)
  }
})
