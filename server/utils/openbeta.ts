/**
 * OpenBeta data importer using the weekly parquet-exporter releases.
 *
 * Downloads the latest parquet file from GitHub, parses it with hyparquet,
 * filters for UK routes, and aggregates individual climbs into crag-level
 * summaries ready for D1 import.
 *
 * Data source: https://github.com/OpenBeta/parquet-exporter
 * Released weekly (Sundays at midnight UTC), ~10MB snappy-compressed parquet.
 */

import { parquetRead } from 'hyparquet'

const RELEASES_API = 'https://api.github.com/repos/OpenBeta/parquet-exporter/releases/latest'

export type OpenBetaCrag = {
  name: string
  cragPath: string
  lat: number
  lon: number
  totalClimbs: number
  trad: number
  sport: number
  boulder: number
}

type ParquetRoute = {
  climb_name: string
  latitude: number
  longitude: number
  country: string
  crag: string
  area: string
  region: string
  state_province: string
  is_sport: boolean
  is_trad: boolean
  is_boulder: boolean
}

/** Fetch the download URL for the latest parquet release asset. */
async function getLatestReleaseUrl(): Promise<{ url: string; version: string }> {
  const res = await fetch(RELEASES_API, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'CragCast/0.1 (+https://cragcast.app)'
    }
  })

  if (!res.ok) {
    throw new Error(`GitHub API error (${res.status}): ${await res.text().catch(() => '')}`)
  }

  const release = await res.json() as {
    tag_name: string
    assets: { name: string; browser_download_url: string }[]
  }

  const parquetAsset = release.assets.find(a => a.name.endsWith('.parquet'))
  if (!parquetAsset) {
    throw new Error(`No .parquet asset found in release ${release.tag_name}`)
  }

  return { url: parquetAsset.browser_download_url, version: release.tag_name }
}

/** Download a parquet file and return it as an ArrayBuffer. */
async function downloadParquet(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'CragCast/0.1 (+https://cragcast.app)' }
  })

  if (!res.ok) {
    throw new Error(`Download failed (${res.status}): ${url}`)
  }

  return await res.arrayBuffer()
}

/**
 * Parse UK routes from the parquet file and aggregate into crag-level data.
 *
 * The parquet file contains individual routes (~229K worldwide).
 * We filter for UK routes, then group by `crag` name + approximate
 * coordinates to produce crag-level summaries.
 */
function aggregateUKCrags(routes: ParquetRoute[]): OpenBetaCrag[] {
  // Group routes by crag name + rounded coordinates (to handle slight coord variations)
  const cragMap = new Map<string, {
    name: string
    cragPath: string
    lats: number[]
    lons: number[]
    count: number
    tradCount: number
    sportCount: number
    boulderCount: number
  }>()

  for (const route of routes) {
    if (!route.crag || !Number.isFinite(route.latitude) || !Number.isFinite(route.longitude)) {
      continue
    }

    // Key by crag name + rounded coords to group nearby routes with the same crag name
    const latRound = Math.round(route.latitude * 100) / 100
    const lonRound = Math.round(route.longitude * 100) / 100
    const key = `${route.crag}|${latRound},${lonRound}`

    let entry = cragMap.get(key)
    if (!entry) {
      entry = {
        name: route.crag,
        cragPath: [route.country, route.state_province, route.region, route.area, route.crag]
          .filter(Boolean).join(' > '),
        lats: [],
        lons: [],
        count: 0,
        tradCount: 0,
        sportCount: 0,
        boulderCount: 0
      }
      cragMap.set(key, entry)
    }

    entry.lats.push(route.latitude)
    entry.lons.push(route.longitude)
    entry.count++
    if (route.is_trad) entry.tradCount++
    if (route.is_sport) entry.sportCount++
    if (route.is_boulder) entry.boulderCount++
  }

  // Convert to crag objects
  const crags: OpenBetaCrag[] = []
  for (const entry of cragMap.values()) {
    if (entry.count === 0) continue

    const avgLat = entry.lats.reduce((s, v) => s + v, 0) / entry.lats.length
    const avgLon = entry.lons.reduce((s, v) => s + v, 0) / entry.lons.length
    const typedTotal = entry.tradCount + entry.sportCount + entry.boulderCount || 1

    crags.push({
      name: entry.name,
      cragPath: entry.cragPath,
      lat: Math.round(avgLat * 10000) / 10000,
      lon: Math.round(avgLon * 10000) / 10000,
      totalClimbs: entry.count,
      trad: entry.tradCount / typedTotal,
      sport: entry.sportCount / typedTotal,
      boulder: entry.boulderCount / typedTotal
    })
  }

  return crags
}

/**
 * Fetch the latest OpenBeta parquet release, parse it, and return
 * aggregated UK crag data ready for DB import.
 */
export async function fetchOpenBetaUKCrags(
  onProgress?: (msg: string) => void
): Promise<OpenBetaCrag[]> {
  onProgress?.('Fetching latest release from OpenBeta/parquet-exporter...')
  const { url, version } = await getLatestReleaseUrl()
  onProgress?.(`Found release ${version}, downloading parquet file...`)

  const buffer = await downloadParquet(url)
  onProgress?.(`Downloaded ${(buffer.byteLength / 1024 / 1024).toFixed(1)}MB, parsing...`)

  // Parse parquet with hyparquet — collect UK routes via onComplete callback
  const ukRoutes: ParquetRoute[] = []
  const columns = ['climb_name', 'latitude', 'longitude', 'country', 'crag', 'area', 'region', 'state_province', 'is_sport', 'is_trad', 'is_boulder']

  await parquetRead({
    file: buffer,
    columns,
    onComplete(rows: any[][]) {
      // rows is an array of column arrays — convert to row objects
      if (!rows.length || !rows[0]) return

      const numRows = rows[0].length
      const countryIdx = columns.indexOf('country')

      for (let i = 0; i < numRows; i++) {
        const country = rows[countryIdx]?.[i]
        if (country !== 'United Kingdom') continue

        const route: any = {}
        for (let c = 0; c < columns.length; c++) {
          route[columns[c]] = rows[c]?.[i]
        }
        ukRoutes.push(route as ParquetRoute)
      }
    }
  })

  onProgress?.(`Parsed parquet: found ${ukRoutes.length} UK routes`)

  const crags = aggregateUKCrags(ukRoutes)
  onProgress?.(`Aggregated into ${crags.length} crags (release ${version})`)

  return crags
}
