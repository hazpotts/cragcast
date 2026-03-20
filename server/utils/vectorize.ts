/**
 * Vectorize utilities for RAG — embedding, upserting, and querying.
 *
 * Uses Cloudflare Workers AI for embeddings (@cf/baai/bge-base-en-v1.5, 768d)
 * and Cloudflare Vectorize for storage/retrieval.
 *
 * Two vector types share the same index:
 *  - "knowledge": climbing science chunks (rock types, seasons, safety)
 *  - "crag": enriched crag descriptions for semantic search
 */

const EMBEDDING_MODEL = '@cf/baai/bge-base-en-v1.5'

export type VectorMetadata = {
  type: 'knowledge' | 'crag'
  tags?: string[]
  regionId?: string
  rockTypes?: string[]
}

type VectorizeIndex = {
  upsert: (vectors: Array<{ id: string; values: number[]; metadata?: Record<string, any> }>) => Promise<{ mutationId?: string }>
  query: (vector: number[], options: { topK: number; filter?: Record<string, any>; returnMetadata?: boolean | string }) => Promise<{ matches: Array<{ id: string; score: number; metadata?: Record<string, any> }> }>
  getByIds: (ids: string[]) => Promise<Array<{ id: string; values: number[]; metadata?: Record<string, any> }>>
  deleteByIds: (ids: string[]) => Promise<{ count: number }>
}

function getBindings(event: any): { ai: any; vectorize: VectorizeIndex | null } {
  const env = event?.context?.cloudflare?.env || event?.platform?.env || {}
  return {
    ai: env.AI,
    vectorize: env.VECTORIZE || null
  }
}

/**
 * Generate embeddings for one or more texts using Workers AI.
 * Returns an array of 768-dimensional vectors.
 */
export async function generateEmbeddings(ai: any, texts: string[]): Promise<number[][]> {
  const result = await ai.run(EMBEDDING_MODEL, { text: texts })
  return result.data
}

/**
 * Upsert vectors into the Vectorize index.
 * Batches into groups of 100 to stay within API limits.
 */
export async function upsertVectors(
  event: any,
  vectors: Array<{ id: string; text: string; metadata: VectorMetadata }>
): Promise<{ indexed: number }> {
  const { ai, vectorize } = getBindings(event)
  if (!vectorize) throw new Error('VECTORIZE binding not available')
  if (!ai) throw new Error('AI binding not available')

  let indexed = 0
  const BATCH_SIZE = 100

  for (let i = 0; i < vectors.length; i += BATCH_SIZE) {
    const batch = vectors.slice(i, i + BATCH_SIZE)
    const texts = batch.map(v => v.text)
    const embeddings = await generateEmbeddings(ai, texts)

    const vectorData = batch.map((v, j) => ({
      id: v.id,
      values: embeddings[j],
      metadata: v.metadata as Record<string, any>
    }))

    await vectorize.upsert(vectorData)
    indexed += batch.length
  }

  return { indexed }
}

/**
 * Query the Vectorize index for relevant context.
 * Returns matching vector IDs, scores, and metadata.
 */
export async function queryVectors(
  event: any,
  queryText: string,
  options: {
    topK?: number
    type?: 'knowledge' | 'crag'
  } = {}
): Promise<Array<{ id: string; score: number; metadata?: VectorMetadata }>> {
  const { ai, vectorize } = getBindings(event)
  if (!vectorize || !ai) return []

  const { topK = 3, type } = options

  const embeddings = await generateEmbeddings(ai, [queryText])
  const queryVector = embeddings[0]

  const filter = type ? { type } : undefined

  const results = await vectorize.query(queryVector, {
    topK,
    filter,
    returnMetadata: 'all'
  })

  return results.matches.map(m => ({
    id: m.id,
    score: m.score,
    metadata: m.metadata as VectorMetadata | undefined
  }))
}

/**
 * Check if Vectorize is available (graceful degradation for local dev).
 */
export function isVectorizeAvailable(event: any): boolean {
  const { vectorize } = getBindings(event)
  return vectorize !== null
}
