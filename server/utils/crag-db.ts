/**
 * D1 database helpers for crag data.
 *
 * Reads/writes crags from Cloudflare D1 and handles region mapping
 * for imported OpenBeta data based on coordinate proximity.
 */

import { regions } from './regions'
import { haversineKm } from './distance'
import type { OpenBetaCrag } from './openbeta'

export type Crag = {
  id: string
  name: string
  regionId: string
  lat: number
  lon: number
  aspect: string | null
  rock: string[]
  types: { trad?: number; sport?: number; boulder?: number }
  routeCount: number
  tags: string[]
}

type D1Database = {
  prepare: (sql: string) => D1PreparedStatement
  batch: <T = unknown>(stmts: D1PreparedStatement[]) => Promise<D1Result<T>[]>
  exec: (sql: string) => Promise<D1ExecResult>
}

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement
  first: <T = unknown>(col?: string) => Promise<T | null>
  run: () => Promise<D1Result>
  all: <T = unknown>() => Promise<D1Result<T>>
}

type D1Result<T = unknown> = {
  results?: T[]
  success: boolean
  meta?: { changes: number }
}

type D1ExecResult = {
  count: number
  duration: number
}

type CragRow = {
  id: string
  name: string
  region_id: string
  lat: number
  lon: number
  aspect: string | null
  rock: string
  trad: number
  sport: number
  boulder: number
  route_count: number
  tags: string
  openbeta_id: string | null
  source: string
  imported_at: string
  updated_at: string
}

function getDb(event: any): D1Database | null {
  const env = event?.context?.cloudflare?.env || event?.platform?.env || {}
  return env.CRAG_DB || null
}

function rowToCrag(row: CragRow): Crag {
  return {
    id: row.id,
    name: row.name,
    regionId: row.region_id,
    lat: row.lat,
    lon: row.lon,
    aspect: row.aspect as Crag['aspect'],
    rock: JSON.parse(row.rock || '[]'),
    types: {
      ...(row.trad > 0 ? { trad: row.trad } : {}),
      ...(row.sport > 0 ? { sport: row.sport } : {}),
      ...(row.boulder > 0 ? { boulder: row.boulder } : {})
    },
    routeCount: row.route_count,
    tags: JSON.parse(row.tags || '[]')
  }
}

/**
 * Get all crags for a region from D1.
 */
export async function getCragsByRegion(event: any, regionId: string): Promise<Crag[]> {
  const db = getDb(event)
  if (!db) return []

  const result = await db
    .prepare('SELECT * FROM crags WHERE region_id = ? ORDER BY route_count DESC')
    .bind(regionId)
    .all<CragRow>()

  return (result.results || []).map(rowToCrag)
}

/**
 * Get crag count per region from D1.
 */
export async function getCragCountsByRegion(event: any): Promise<Record<string, number>> {
  const db = getDb(event)
  if (!db) return {}

  const result = await db
    .prepare('SELECT region_id, COUNT(*) as count FROM crags GROUP BY region_id')
    .all<{ region_id: string; count: number }>()

  const counts: Record<string, number> = {}
  for (const row of result.results || []) {
    counts[row.region_id] = row.count
  }
  return counts
}

/**
 * Find the closest region for a given coordinate.
 */
function findClosestRegion(lat: number, lon: number): string {
  let bestId = regions[0].id
  let bestDist = Infinity

  for (const region of regions) {
    for (const pt of region.points) {
      const dist = haversineKm({ lat, lon }, { lat: pt.lat, lon: pt.lon })
      if (dist < bestDist) {
        bestDist = dist
        bestId = region.id
      }
    }
  }

  return bestId
}

/**
 * Create a URL-friendly slug from a crag name and path.
 */
function slugify(name: string, cragPath: string): string {
  // Use last two segments of the path for uniqueness
  const segments = cragPath.split(' > ')
  const parts = [...segments.slice(-2), name]
  return parts
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/**
 * Import OpenBeta crags into D1.
 * Uses UPSERT to preserve manually-set fields (aspect, rock, tags)
 * while updating OpenBeta-sourced fields (name, coords, route counts).
 */
export async function importCragsToDb(
  event: any,
  openBetaCrags: OpenBetaCrag[],
  onProgress?: (msg: string) => void
): Promise<{ imported: number; updated: number; errors: string[] }> {
  const db = getDb(event)
  if (!db) {
    throw new Error('D1 database (CRAG_DB) not available. Check your Cloudflare Pages bindings.')
  }

  // Start import log
  const logResult = await db
    .prepare("INSERT INTO import_log (status, source) VALUES ('running', 'openbeta')")
    .run()
  const logId = logResult.meta?.changes ? logResult.meta.changes : null

  const errors: string[] = []
  let imported = 0
  let updated = 0

  // Process in batches of 50
  const BATCH_SIZE = 50
  for (let i = 0; i < openBetaCrags.length; i += BATCH_SIZE) {
    const batch = openBetaCrags.slice(i, i + BATCH_SIZE)
    const stmts: D1PreparedStatement[] = []

    for (const crag of batch) {
      try {
        if (!Number.isFinite(crag.lat) || !Number.isFinite(crag.lon)) {
          errors.push(`Skipped ${crag.name}: invalid coordinates`)
          continue
        }

        const regionId = findClosestRegion(crag.lat, crag.lon)
        const id = slugify(crag.name, crag.cragPath)

        // Check if this crag already exists (by id)
        const existing = await db
          .prepare('SELECT id, aspect, rock, tags FROM crags WHERE id = ?')
          .bind(id)
          .first<CragRow>()

        if (existing) {
          // Update only OpenBeta-sourced fields, preserve manual enrichments
          stmts.push(
            db
              .prepare(`
                UPDATE crags SET
                  name = ?, lat = ?, lon = ?, region_id = ?,
                  trad = ?, sport = ?, boulder = ?,
                  route_count = ?, imported_at = datetime('now'), updated_at = datetime('now')
                WHERE id = ?
              `)
              .bind(
                crag.name, crag.lat, crag.lon, regionId,
                crag.trad, crag.sport, crag.boulder,
                crag.totalClimbs, id
              )
          )
          updated++
        } else {
          // Insert new crag
          stmts.push(
            db
              .prepare(`
                INSERT INTO crags (id, name, region_id, lat, lon, trad, sport, boulder, route_count, source)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'openbeta-parquet')
              `)
              .bind(
                id, crag.name, regionId, crag.lat, crag.lon,
                crag.trad, crag.sport, crag.boulder,
                crag.totalClimbs
              )
          )
          imported++
        }
      } catch (e: any) {
        errors.push(`Error processing ${crag.name}: ${e.message}`)
      }
    }

    if (stmts.length > 0) {
      try {
        await db.batch(stmts)
      } catch (e: any) {
        errors.push(`Batch insert error at offset ${i}: ${e.message}`)
      }
    }

    onProgress?.(`Processed ${Math.min(i + BATCH_SIZE, openBetaCrags.length)}/${openBetaCrags.length} crags`)
  }

  // Update import log
  if (logId) {
    await db
      .prepare(`
        UPDATE import_log SET
          completed_at = datetime('now'),
          status = 'complete',
          crags_imported = ?,
          crags_updated = ?,
          errors = ?
        WHERE id = (SELECT MAX(id) FROM import_log WHERE status = 'running')
      `)
      .bind(imported, updated, JSON.stringify(errors))
      .run()
  }

  return { imported, updated, errors }
}

/**
 * Get the last import log entry.
 */
export async function getLastImportLog(event: any): Promise<{
  started_at: string
  completed_at: string | null
  status: string
  crags_imported: number
  crags_updated: number
  errors: string[]
} | null> {
  const db = getDb(event)
  if (!db) return null

  const row = await db
    .prepare('SELECT * FROM import_log ORDER BY id DESC LIMIT 1')
    .first<{
      started_at: string
      completed_at: string | null
      status: string
      crags_imported: number
      crags_updated: number
      errors: string
    }>()

  if (!row) return null
  return { ...row, errors: JSON.parse(row.errors || '[]') }
}
