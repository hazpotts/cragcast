/**
 * RAG retrieval for the AI orchestrator.
 *
 * Retrieves relevant climbing knowledge from Vectorize based on
 * the user's query and/or tool results. The retrieved context is
 * injected alongside tool results so the LLM can give rock-type-aware,
 * seasonally-appropriate, safety-conscious advice.
 *
 * Falls back gracefully if Vectorize is unavailable (local dev).
 */

import { queryVectors, isVectorizeAvailable } from '../vectorize'
import { knowledgeChunks } from './knowledge'

/** Minimum similarity score to include a result. */
const MIN_SCORE = 0.7

/** Max knowledge chunks to inject per query. */
const MAX_CHUNKS = 3

/**
 * Retrieve relevant climbing knowledge for a user query.
 * Returns formatted context string, or empty string if nothing relevant.
 */
export async function retrieveKnowledge(
  event: any,
  query: string
): Promise<string> {
  // Try Vectorize first
  if (isVectorizeAvailable(event)) {
    try {
      const matches = await queryVectors(event, query, {
        topK: MAX_CHUNKS,
        type: 'knowledge'
      })

      const relevant = matches.filter(m => m.score >= MIN_SCORE)
      if (relevant.length === 0) return ''

      // Look up the full text for matched knowledge chunks
      const texts = relevant.map(m => {
        const id = m.id.replace('knowledge:', '')
        const chunk = knowledgeChunks.find(c => c.id === id)
        return chunk?.text || ''
      }).filter(Boolean)

      if (texts.length === 0) return ''

      return formatKnowledgeContext(texts)
    } catch (e) {
      console.warn('[rag] Vectorize query failed, falling back to tag matching:', (e as Error).message)
    }
  }

  // Fallback: simple tag-based matching when Vectorize is unavailable
  return fallbackTagMatch(query)
}

/**
 * Retrieve crags semantically similar to a query.
 * Used for natural language crag search like "granite sea cliffs in Cornwall".
 */
export async function searchCragsSemantic(
  event: any,
  query: string,
  topK: number = 5
): Promise<Array<{ id: string; score: number; metadata?: Record<string, any> }>> {
  if (!isVectorizeAvailable(event)) return []

  try {
    const matches = await queryVectors(event, query, {
      topK,
      type: 'crag'
    })
    return matches.filter(m => m.score >= 0.65)
  } catch (e) {
    console.warn('[rag] Semantic crag search failed:', (e as Error).message)
    return []
  }
}

/**
 * Format retrieved knowledge chunks into context for the LLM.
 */
function formatKnowledgeContext(texts: string[]): string {
  const joined = texts.map((t, i) => `${i + 1}. ${t}`).join('\n\n')
  return `[Climbing knowledge context — use this to inform your advice]\n\n${joined}`
}

/**
 * Fallback: match knowledge chunks by keyword/tag when Vectorize is unavailable.
 * Less accurate than semantic search but ensures local dev still works.
 */
function fallbackTagMatch(query: string): string {
  const q = query.toLowerCase()

  // Map common query terms to knowledge tags
  const tagScores: Record<string, number> = {}
  const termToTags: Record<string, string[]> = {
    'grit': ['gritstone', 'grit'],
    'gritstone': ['gritstone', 'grit'],
    'limestone': ['limestone'],
    'sandstone': ['sandstone'],
    'slate': ['slate'],
    'granite': ['granite'],
    'rhyolite': ['rhyolite'],
    'dry': ['drying', 'seepage'],
    'drying': ['drying', 'seepage'],
    'wet': ['drying', 'seepage', 'wet-weather'],
    'seep': ['seepage'],
    'tide': ['tidal', 'tide'],
    'tidal': ['tidal', 'tide'],
    'wind': ['wind'],
    'windy': ['wind'],
    'mountain': ['mountain', 'altitude'],
    'winter': ['winter', 'season'],
    'summer': ['summer', 'season'],
    'season': ['season'],
    'friction': ['friction', 'temperature'],
    'temperature': ['temperature', 'friction'],
    'cold': ['temperature', 'friction', 'gritstone'],
    'pembroke': ['pembroke', 'tidal'],
    'gogarth': ['gogarth', 'tidal'],
    'overhang': ['overhang', 'geometry'],
    'safety': ['safety'],
    'danger': ['safety', 'fragile']
  }

  for (const [term, tags] of Object.entries(termToTags)) {
    if (q.includes(term)) {
      for (const tag of tags) {
        tagScores[tag] = (tagScores[tag] || 0) + 1
      }
    }
  }

  if (Object.keys(tagScores).length === 0) return ''

  // Score each knowledge chunk by how many matching tags it has
  const scored = knowledgeChunks.map(chunk => {
    let score = 0
    for (const tag of chunk.tags) {
      score += tagScores[tag] || 0
    }
    return { chunk, score }
  })

  scored.sort((a, b) => b.score - a.score)
  const top = scored.filter(s => s.score > 0).slice(0, MAX_CHUNKS)

  if (top.length === 0) return ''

  return formatKnowledgeContext(top.map(s => s.chunk.text))
}
