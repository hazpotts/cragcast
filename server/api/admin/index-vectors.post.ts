/**
 * POST /api/admin/index-vectors
 *
 * Indexes climbing knowledge chunks and crag data into Vectorize
 * for RAG retrieval and semantic search.
 *
 * Requires `Authorization: Bearer <ADMIN_API_KEY>` header.
 *
 * Optional query params:
 *   ?type=knowledge  — only index knowledge chunks
 *   ?type=crags      — only index crag data
 *   (omit to index both)
 */

import { knowledgeChunks } from '~/server/utils/ai/knowledge'
import { upsertVectors, type VectorMetadata } from '~/server/utils/vectorize'
import { regions } from '~/server/utils/regions'

export default defineEventHandler(async (event) => {
  // Auth check — same pattern as import-crags
  const env = event.context?.cloudflare?.env || (event as any).platform?.env || {}
  const adminKey = env.ADMIN_API_KEY
  if (!adminKey) {
    throw createError({ statusCode: 500, statusMessage: 'ADMIN_API_KEY not configured' })
  }
  const auth = getHeader(event, 'authorization')
  if (auth !== `Bearer ${adminKey}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const q = getQuery(event)
  const typeFilter = q.type as string | undefined

  const log: string[] = []
  let totalIndexed = 0

  // --- Index knowledge chunks ---
  if (!typeFilter || typeFilter === 'knowledge') {
    log.push(`Indexing ${knowledgeChunks.length} knowledge chunks...`)

    const knowledgeVectors = knowledgeChunks.map(chunk => ({
      id: `knowledge:${chunk.id}`,
      text: chunk.text,
      metadata: {
        type: 'knowledge' as const,
        tags: chunk.tags
      }
    }))

    try {
      const result = await upsertVectors(event, knowledgeVectors)
      log.push(`Indexed ${result.indexed} knowledge vectors`)
      totalIndexed += result.indexed
    } catch (e: any) {
      log.push(`Knowledge indexing error: ${e.message}`)
    }
  }

  // --- Index crag data ---
  if (!typeFilter || typeFilter === 'crags') {
    // Get crags from D1 or seed data
    const { getCragsByRegion } = await import('~/server/utils/crag-db')
    const { ukCragsSeed } = await import('~/server/utils/uk-crags-seed')
    const { findClosestRegionForCrag } = await import('~/server/utils/crag-db')

    const allCrags: Array<{ id: string; text: string; metadata: VectorMetadata }> = []

    // Try D1 first, fall back to seed data
    let cragCount = 0
    for (const region of regions) {
      const crags = await getCragsByRegion(event, region.id)
      for (const crag of crags) {
        const description = buildCragDescription(crag.name, region.name, crag.rock, crag.aspect, crag.types, crag.tags, crag.routeCount)
        allCrags.push({
          id: `crag:${crag.id}`,
          text: description,
          metadata: {
            type: 'crag',
            tags: crag.tags,
            regionId: region.id,
            rockTypes: crag.rock
          }
        })
        cragCount++
      }
    }

    // Fallback to seed data if D1 returned nothing
    if (cragCount === 0) {
      log.push('No crags in D1, falling back to seed data...')
      for (const seed of ukCragsSeed) {
        const regionId = findClosestRegionForCrag(seed.lat, seed.lon)
        const region = regions.find(r => r.id === regionId)
        const types: Record<string, number> = {}
        if (seed.trad > 0) types.trad = seed.trad
        if (seed.sport > 0) types.sport = seed.sport
        if (seed.boulder > 0) types.boulder = seed.boulder

        const description = buildCragDescription(
          seed.name,
          region?.name || 'Unknown',
          region?.rock || [],
          null,
          types,
          [],
          seed.totalClimbs
        )
        const id = seed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        allCrags.push({
          id: `crag:${id}`,
          text: description,
          metadata: {
            type: 'crag',
            tags: [],
            regionId: regionId,
            rockTypes: region?.rock || []
          }
        })
      }
    }

    log.push(`Indexing ${allCrags.length} crags...`)

    try {
      const result = await upsertVectors(event, allCrags)
      log.push(`Indexed ${result.indexed} crag vectors`)
      totalIndexed += result.indexed
    } catch (e: any) {
      log.push(`Crag indexing error: ${e.message}`)
    }
  }

  log.push(`Total indexed: ${totalIndexed}`)

  return { ok: true, totalIndexed, log }
})

/**
 * Build a rich text description of a crag for embedding.
 * Includes all searchable attributes in natural language.
 */
function buildCragDescription(
  name: string,
  regionName: string,
  rock: string[],
  aspect: string | null,
  types: Record<string, number>,
  tags: string[],
  routeCount: number
): string {
  const parts = [`${name} is a climbing crag in ${regionName}.`]

  if (rock.length) {
    parts.push(`Rock type: ${rock.join(', ')}.`)
  }

  const climbTypes = Object.entries(types)
    .filter(([, count]) => count > 0)
    .map(([type]) => type)
  if (climbTypes.length) {
    parts.push(`Climbing styles: ${climbTypes.join(', ')}.`)
  }

  if (routeCount > 0) {
    parts.push(`Approximately ${routeCount} routes.`)
  }

  if (aspect) {
    parts.push(`Aspect: ${aspect}-facing.`)
  }

  if (tags.length) {
    parts.push(`Features: ${tags.join(', ')}.`)
  }

  return parts.join(' ')
}
