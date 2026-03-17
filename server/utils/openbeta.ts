/**
 * OpenBeta GraphQL API client for fetching climbing area data.
 *
 * Queries the OpenBeta API recursively to find all leaf areas (crags)
 * under the United Kingdom. Leaf areas are the lowest level of the
 * hierarchy — they contain climbs directly rather than child areas.
 */

const OPENBETA_API = 'https://api.openbeta.io'

export type OpenBetaCrag = {
  uuid: string
  name: string
  pathTokens: string[]
  lat: number
  lon: number
  totalClimbs: number
  trad: number
  sport: number
  boulder: number
}

type AreaNode = {
  uuid: string
  area_name: string
  pathTokens: string[]
  totalClimbs: number
  metadata: {
    lat: number
    lng: number
    leaf: boolean
    isBoulder: boolean
  }
  aggregate?: {
    byDiscipline?: {
      trad?: { total?: number }
      sport?: { total?: number }
      bouldering?: { total?: number }
    }
  }
  children?: AreaNode[]
}

const AREA_FRAGMENT = `
  uuid
  area_name
  pathTokens
  totalClimbs
  metadata { lat lng leaf isBoulder }
  aggregate {
    byDiscipline {
      trad { total }
      sport { total }
      bouldering { total }
    }
  }
`

async function gql<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(OPENBETA_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'CragCast/0.1 (+https://cragcast.app)'
    },
    body: JSON.stringify({ query, variables })
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`OpenBeta API error (${res.status}): ${body.slice(0, 300)}`)
  }

  const json = await res.json() as { data?: T; errors?: { message: string }[] }
  if (json.errors?.length) {
    throw new Error(`OpenBeta GraphQL errors: ${json.errors.map(e => e.message).join('; ')}`)
  }
  if (!json.data) {
    throw new Error('OpenBeta returned no data')
  }
  return json.data
}

/**
 * Fetch a single area and its immediate children by UUID.
 */
async function fetchArea(uuid: string): Promise<AreaNode | null> {
  const query = `
    query GetArea($uuid: ID) {
      area(uuid: $uuid) {
        ${AREA_FRAGMENT}
        children {
          ${AREA_FRAGMENT}
        }
      }
    }
  `
  const data = await gql<{ area: AreaNode | null }>(query, { uuid })
  return data.area
}

/**
 * Search for the UK top-level area by name.
 */
async function findUKArea(): Promise<AreaNode | null> {
  // Try common path tokens for the UK in OpenBeta
  const candidates = ['United Kingdom', 'UK', 'Great Britain']

  for (const name of candidates) {
    const query = `
      query SearchAreas($filter: Filter) {
        areas(filter: $filter) {
          ${AREA_FRAGMENT}
        }
      }
    `
    const data = await gql<{ areas: AreaNode[] }>(query, {
      filter: { area_name: { match: name } }
    })

    if (data.areas?.length) {
      // Find the top-level country area (shortest pathTokens)
      const sorted = data.areas.sort((a, b) => a.pathTokens.length - b.pathTokens.length)
      return sorted[0]
    }
  }

  return null
}

function nodeToOpenBetaCrag(node: AreaNode): OpenBetaCrag {
  const disc = node.aggregate?.byDiscipline
  const tradCount = disc?.trad?.total ?? 0
  const sportCount = disc?.sport?.total ?? 0
  const boulderCount = disc?.bouldering?.total ?? 0
  const total = tradCount + sportCount + boulderCount || 1

  return {
    uuid: node.uuid,
    name: node.area_name,
    pathTokens: node.pathTokens,
    lat: node.metadata.lat,
    lon: node.metadata.lng,
    totalClimbs: node.totalClimbs,
    trad: tradCount / total,
    sport: sportCount / total,
    boulder: boulderCount / total
  }
}

/**
 * Recursively collect all leaf areas (crags) under a given parent area.
 * Performs breadth-first traversal, fetching children as needed.
 */
async function collectLeafAreas(
  rootUuid: string,
  onProgress?: (msg: string) => void
): Promise<OpenBetaCrag[]> {
  const crags: OpenBetaCrag[] = []
  const queue: string[] = [rootUuid]
  const visited = new Set<string>()

  while (queue.length > 0) {
    const uuid = queue.shift()!
    if (visited.has(uuid)) continue
    visited.add(uuid)

    const area = await fetchArea(uuid)
    if (!area) continue

    if (area.metadata.leaf) {
      // This is a crag (leaf area) — only include if it has climbs
      if (area.totalClimbs > 0) {
        crags.push(nodeToOpenBetaCrag(area))
        onProgress?.(`Found crag: ${area.area_name} (${area.totalClimbs} climbs)`)
      }
      continue
    }

    // Process children
    if (area.children?.length) {
      for (const child of area.children) {
        if (child.metadata.leaf && child.totalClimbs > 0) {
          crags.push(nodeToOpenBetaCrag(child))
          visited.add(child.uuid)
        } else if (!child.metadata.leaf) {
          queue.push(child.uuid)
        }
      }
      onProgress?.(`Explored ${area.area_name}: ${area.children.length} sub-areas, ${crags.length} crags so far`)
    }
  }

  return crags
}

/**
 * Fetch all UK crags from OpenBeta.
 * Returns an array of normalised crag objects ready for DB import.
 */
export async function fetchOpenBetaUKCrags(
  onProgress?: (msg: string) => void
): Promise<OpenBetaCrag[]> {
  onProgress?.('Searching for UK area in OpenBeta...')

  const uk = await findUKArea()
  if (!uk) {
    throw new Error('Could not find United Kingdom area in OpenBeta. The API may be down or the data structure may have changed.')
  }

  onProgress?.(`Found UK area: ${uk.area_name} (uuid: ${uk.uuid})`)

  const crags = await collectLeafAreas(uk.uuid, onProgress)
  onProgress?.(`Import complete: ${crags.length} crags found`)

  return crags
}
