import { getLastImportLog } from '~/server/utils/crag-db'

/**
 * GET /api/admin/import-status
 *
 * Returns the most recent import log entry.
 */
export default defineEventHandler(async (event) => {
  const log = await getLastImportLog(event)

  if (!log) {
    return { hasImported: false, message: 'No imports have been run yet' }
  }

  return { hasImported: true, ...log }
})
