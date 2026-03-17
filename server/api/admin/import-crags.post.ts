import { ukCragsSeed } from '~/server/utils/uk-crags-seed'
import { importCragsToDb } from '~/server/utils/crag-db'

/**
 * POST /api/admin/import-crags
 *
 * Imports curated UK crag seed data into D1.
 * Can be called manually or by the worker-cron on a schedule.
 *
 * Requires `Authorization: Bearer <ADMIN_API_KEY>` header.
 *
 * Optional query params:
 *   ?dryRun=1  — preview data without writing to DB
 */
export default defineEventHandler(async (event) => {
  // Check admin API key
  const env = event.context?.cloudflare?.env || (event as any).platform?.env || {}
  const adminKey = env.ADMIN_API_KEY
  if (adminKey) {
    const auth = getHeader(event, 'authorization')
    if (auth !== `Bearer ${adminKey}`) {
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
    }
  }

  const q = getQuery(event)
  const dryRun = q.dryRun === '1' || q.dryRun === 'true'

  const log: string[] = []
  const onProgress = (msg: string) => {
    log.push(msg)
    console.log(`[import] ${msg}`)
  }

  try {
    onProgress('Starting UK crag seed import...')

    const crags = ukCragsSeed
    onProgress(`Loaded ${crags.length} crags from seed data`)

    if (dryRun) {
      return {
        ok: true,
        dryRun: true,
        cragsFound: crags.length,
        sample: crags.slice(0, 10),
        log
      }
    }

    const result = await importCragsToDb(event, crags, onProgress)

    return {
      ok: true,
      imported: result.imported,
      updated: result.updated,
      errors: result.errors,
      totalCrags: crags.length,
      log
    }
  } catch (err: any) {
    console.error('[import] Import failed:', err)
    throw createError({
      statusCode: 500,
      statusMessage: `Import failed: ${err.message}`
    })
  }
})
