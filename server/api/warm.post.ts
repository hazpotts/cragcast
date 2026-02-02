import { getForecast } from "~/server/utils/forecast"
import { regions } from "~/server/utils/regions"
import { presetDates, parseDate, formatDate } from "~/server/utils/dates"

// Concurrency-limited parallel execution
async function parallel<T, R>(items: T[], fn: (item: T) => Promise<R>, concurrency = 6): Promise<R[]> {
  const results: R[] = []
  const pending: Promise<void>[] = []
  let index = 0

  async function runNext(): Promise<void> {
    const i = index++
    if (i >= items.length) return
    results[i] = await fn(items[i])
    await runNext()
  }

  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    pending.push(runNext())
  }
  await Promise.all(pending)
  return results
}

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  
  // Optional auth check - require a secret header in production
  const authHeader = getHeader(event, 'x-warm-secret')
  const expectedSecret = process.env.WARM_SECRET
  if (expectedSecret && authHeader !== expectedSecret) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  // Get dates for next weekend + this weekend
  const thisWeekend = presetDates('this-weekend').map(d => formatDate(parseDate(d)))
  const nextWeekend = presetDates('next-weekend').map(d => formatDate(parseDate(d)))
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
