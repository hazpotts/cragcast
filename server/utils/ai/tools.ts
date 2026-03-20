/**
 * Tool definitions and executors for the CragCast AI orchestrator.
 * Each tool wraps existing server utilities so the AI can query
 * weather, crags, regions, and MWIS data.
 */

import type { ToolDefinition } from './types'
import { fetchForecastWithRetry } from '../forecast'
import { getCragsByRegion } from '../crag-db'
import { regions, areas } from '../regions'
import { scoreRegion, scoreCrag } from '../score'
import { haversineKm, driveMinutesApprox } from '../distance'
import { parseDatesParam } from '../dates'
import { checkWarnings } from '../warnings'
import { avg, sum, max } from '../server-utils'

// --- Tool definitions (sent to the model) ---

export const toolDefinitions: ToolDefinition[] = [
  {
    name: 'get_weather_forecast',
    description: 'Get hourly weather forecast for a specific UK location. Returns temperature, rain, wind, and cloud data. Use this when a user asks about conditions at a specific place.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude of the location' },
        lon: { type: 'number', description: 'Longitude of the location' },
        dates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dates to check in YYYY-MM-DD format. Use today\'s date or upcoming dates.'
        }
      },
      required: ['lat', 'lon', 'dates']
    }
  },
  {
    name: 'search_crags',
    description: 'Search for climbing crags in a specific region. Returns crag names, types (trad/sport/boulder), rock type, aspect, and route count. Use region IDs like "peak-n", "nwales-n", "lakes-c", etc.',
    parameters: {
      type: 'object',
      properties: {
        region_id: { type: 'string', description: 'Region ID to search crags in (e.g. "peak-n", "nwales-n", "lakes-c")' },
        climb_type: {
          type: 'string',
          enum: ['trad', 'sport', 'boulder'],
          description: 'Optional: filter by climbing type'
        },
        limit: { type: 'number', description: 'Max crags to return (default 10)' }
      },
      required: ['region_id']
    }
  },
  {
    name: 'rank_regions',
    description: 'Rank all UK climbing regions by weather conditions for given dates. Returns scored and sorted regions with weather summaries. Optionally filter by distance from a location.',
    parameters: {
      type: 'object',
      properties: {
        dates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dates to rank for in YYYY-MM-DD format'
        },
        lat: { type: 'number', description: 'Optional: user latitude for distance filtering' },
        lon: { type: 'number', description: 'Optional: user longitude for distance filtering' },
        max_drive_mins: { type: 'number', description: 'Optional: max drive time in minutes' },
        top_n: { type: 'number', description: 'Number of top regions to return (default 5)' }
      },
      required: ['dates']
    }
  },
  {
    name: 'lookup_crag',
    description: 'Look up a crag by name. Returns crag details (aspect, rock type, tags, lat/lon, region) and the weather forecast for given dates. Use this for simple questions like "is X dry?" or "what\'s the weather at X?". Does NOT score — use get_crag_score only when the user wants a conditions rating.',
    parameters: {
      type: 'object',
      properties: {
        crag_name: { type: 'string', description: 'Name of the crag (e.g. "Stanage", "Tremadog")' },
        dates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dates to check in YYYY-MM-DD format'
        }
      },
      required: ['crag_name', 'dates']
    }
  },
  {
    name: 'get_crag_score',
    description: 'Score a specific crag\'s climbing conditions (0-100) for given dates. Use this only when the user explicitly wants a score or rating, or asks "how good" conditions are. For simple weather lookups, use lookup_crag instead.',
    parameters: {
      type: 'object',
      properties: {
        crag_name: { type: 'string', description: 'Name of the crag to score (e.g. "Stanage", "Tremadog")' },
        dates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dates to score in YYYY-MM-DD format'
        }
      },
      required: ['crag_name', 'dates']
    }
  },
  {
    name: 'get_region_info',
    description: 'Get information about a climbing region including rock types, tags, and links to external weather services. Also lists available regions if no ID given.',
    parameters: {
      type: 'object',
      properties: {
        region_id: { type: 'string', description: 'Optional: specific region ID. Omit to list all regions.' }
      },
      required: []
    }
  },
  {
    name: 'get_mwis_forecast',
    description: 'Fetch Mountain Weather Information Service forecast for a UK mountain area. Provides detailed mountain weather including cloud base, freezing level, visibility, and wind. Use for mountain/upland regions like Snowdonia, Lake District, Scottish Highlands.',
    parameters: {
      type: 'object',
      properties: {
        area: {
          type: 'string',
          enum: [
            'lake-district',
            'snowdonia-national-park',
            'brecon-beacons',
            'peak-district',
            'yorkshire-dales',
            'north-pennines',
            'scottish-highlands-west',
            'scottish-highlands-east',
            'scottish-highlands-north'
          ],
          description: 'MWIS area to fetch forecast for'
        }
      },
      required: ['area']
    }
  }
]

// --- Tool executors ---

type ToolContext = {
  event: any
}

export async function executeTool(name: string, args: Record<string, any>, ctx: ToolContext): Promise<string> {
  switch (name) {
    case 'get_weather_forecast':
      return executeGetWeatherForecast(args, ctx)
    case 'search_crags':
      return executeSearchCrags(args, ctx)
    case 'rank_regions':
      return executeRankRegions(args, ctx)
    case 'lookup_crag':
      return executeLookupCrag(args, ctx)
    case 'get_crag_score':
      return executeGetCragScore(args, ctx)
    case 'get_region_info':
      return executeGetRegionInfo(args)
    case 'get_mwis_forecast':
      return executeGetMwisForecast(args)
    default:
      return JSON.stringify({ error: `Unknown tool: ${name}` })
  }
}

async function executeGetWeatherForecast(args: Record<string, any>, ctx: ToolContext): Promise<string> {
  const { lat, lon, dates } = args
  if (!lat || !lon || !dates?.length) return JSON.stringify({ error: 'lat, lon, and dates required' })

  const forecast = await fetchForecastWithRetry(ctx.event, lat, lon, dates, {
    attempts: 2, timeoutMs: 5000, tag: 'ai-weather', throwOnFailure: false
  })

  if (!forecast || !forecast.mini.hours.length) {
    return JSON.stringify({ error: 'Could not fetch forecast for this location' })
  }

  const m = forecast.mini
  const warnings = checkWarnings(m, dates)

  return JSON.stringify({
    location: { lat, lon },
    dates,
    summary: {
      avgTempC: Math.round(avg(m.temp) * 10) / 10,
      minTempC: Math.round(Math.min(...m.temp) * 10) / 10,
      maxTempC: Math.round(Math.max(...m.temp) * 10) / 10,
      totalRainMm: Math.round(sum(m.rainMm) * 10) / 10,
      avgWindMph: Math.round(avg(m.wind) * 10) / 10,
      maxGustMph: Math.round(max(m.gust) * 10) / 10,
      avgCloudPct: Math.round(avg(m.cloud)),
      maxRainProbPct: Math.round(max(m.pop))
    },
    warnings: warnings.length ? warnings : undefined,
    updatedAt: forecast.updatedAt
  })
}

async function executeSearchCrags(args: Record<string, any>, ctx: ToolContext): Promise<string> {
  const { region_id, climb_type, limit = 10 } = args
  if (!region_id) return JSON.stringify({ error: 'region_id required' })

  const region = regions.find(r => r.id === region_id)
  if (!region) return JSON.stringify({ error: `Unknown region: ${region_id}. Use get_region_info to list regions.` })

  let crags = await getCragsByRegion(ctx.event, region_id)

  if (climb_type) {
    crags = crags.filter(c => {
      const t = c.types as Record<string, number>
      return (t[climb_type] || 0) > 0
    })
  }

  const results = crags.slice(0, limit).map(c => ({
    name: c.name,
    aspect: c.aspect,
    rock: c.rock,
    types: c.types,
    routeCount: c.routeCount,
    tags: c.tags,
    lat: c.lat,
    lon: c.lon,
    ukcId: c.ukcId
  }))

  return JSON.stringify({
    region: region.name,
    regionId: region_id,
    crags: results,
    total: crags.length
  })
}

async function executeRankRegions(args: Record<string, any>, ctx: ToolContext): Promise<string> {
  const dates = args.dates || parseDatesParam('', 'next-weekend')
  const topN = args.top_n || 5
  const hasHome = Number.isFinite(args.lat) && Number.isFinite(args.lon)
  const maxDrive = args.max_drive_mins || Infinity

  const ranked: Array<{
    id: string; name: string; area?: string; score: number; why: string[];
    rock: string[]; distanceMins: number; avgTempC: number; avgWindMph: number; totalRainMm: number;
    warnings: any[]
  }> = []

  for (const r of regions) {
    const pt = r.points[0]
    let distanceMins = 0
    if (hasHome) {
      const km = haversineKm({ lat: args.lat, lon: args.lon }, pt)
      distanceMins = driveMinutesApprox(km)
      if (distanceMins > maxDrive) continue
    }

    const forecast = await fetchForecastWithRetry(ctx.event, pt.lat, pt.lon, dates, {
      attempts: 1, timeoutMs: 4000, tag: 'ai-rank'
    })
    if (!forecast?.mini?.hours?.length) continue

    const m = forecast.mini
    const { score, why } = scoreRegion(m, {
      rocks: r.rock,
      distanceMins,
      maxDriveMins: maxDrive
    })

    const warnings = checkWarnings(m, dates)

    ranked.push({
      id: r.id,
      name: r.name,
      area: r.area,
      score,
      why,
      rock: r.rock,
      distanceMins: hasHome ? distanceMins : 0,
      avgTempC: Math.round(avg(m.temp) * 10) / 10,
      avgWindMph: Math.round(avg(m.wind) * 10) / 10,
      totalRainMm: Math.round(sum(m.rainMm) * 10) / 10,
      warnings
    })
  }

  ranked.sort((a, b) => b.score - a.score)

  return JSON.stringify({
    dates,
    topRegions: ranked.slice(0, topN)
  })
}

async function executeLookupCrag(args: Record<string, any>, ctx: ToolContext): Promise<string> {
  const { crag_name, dates } = args
  if (!crag_name) return JSON.stringify({ error: 'crag_name required' })

  const needle = crag_name.toLowerCase()
  let foundCrag: any = null
  let foundRegion: any = null

  for (const r of regions) {
    const crags = await getCragsByRegion(ctx.event, r.id)
    const match = crags.find(c => c.name.toLowerCase().includes(needle))
    if (match) {
      foundCrag = match
      foundRegion = r
      break
    }
  }

  if (!foundCrag || !foundRegion) {
    return JSON.stringify({ error: `Crag "${crag_name}" not found in database. Try search_crags to find crags by region.` })
  }

  const result: Record<string, any> = {
    crag: {
      name: foundCrag.name,
      region: foundRegion.name,
      regionId: foundRegion.id,
      aspect: foundCrag.aspect,
      rock: foundCrag.rock,
      types: foundCrag.types,
      routeCount: foundCrag.routeCount,
      tags: foundCrag.tags,
      lat: foundCrag.lat,
      lon: foundCrag.lon
    }
  }

  // Fetch weather if dates provided
  if (dates?.length) {
    const pt = foundRegion.points[0]
    const forecast = await fetchForecastWithRetry(ctx.event, pt.lat, pt.lon, dates, {
      attempts: 2, timeoutMs: 5000, tag: 'ai-lookup', throwOnFailure: false
    })

    if (forecast?.mini?.hours?.length) {
      const m = forecast.mini
      const warnings = checkWarnings(m, dates)
      result.weather = {
        dates,
        avgTempC: Math.round(avg(m.temp) * 10) / 10,
        minTempC: Math.round(Math.min(...m.temp) * 10) / 10,
        maxTempC: Math.round(Math.max(...m.temp) * 10) / 10,
        totalRainMm: Math.round(sum(m.rainMm) * 10) / 10,
        maxRainProbPct: Math.round(max(m.pop)),
        avgWindMph: Math.round(avg(m.wind) * 10) / 10,
        maxGustMph: Math.round(max(m.gust) * 10) / 10,
        avgCloudPct: Math.round(avg(m.cloud))
      }
      if (warnings.length) result.weather.warnings = warnings
      result.weather.updatedAt = forecast.updatedAt
    } else {
      result.weather = { error: 'Could not fetch forecast' }
    }
  }

  return JSON.stringify(result)
}

async function executeGetCragScore(args: Record<string, any>, ctx: ToolContext): Promise<string> {
  const { crag_name, dates } = args
  if (!crag_name || !dates?.length) return JSON.stringify({ error: 'crag_name and dates required' })

  // Search all regions for the crag by name (case-insensitive partial match)
  const needle = crag_name.toLowerCase()
  let foundCrag: any = null
  let foundRegion: any = null

  for (const r of regions) {
    const crags = await getCragsByRegion(ctx.event, r.id)
    const match = crags.find(c => c.name.toLowerCase().includes(needle))
    if (match) {
      foundCrag = match
      foundRegion = r
      break
    }
  }

  if (!foundCrag || !foundRegion) {
    return JSON.stringify({ error: `Crag "${crag_name}" not found in database. Try search_crags to find crags by region.` })
  }

  const pt = foundRegion.points[0]
  const forecast = await fetchForecastWithRetry(ctx.event, pt.lat, pt.lon, dates, {
    attempts: 2, timeoutMs: 5000, tag: 'ai-crag', throwOnFailure: false
  })

  if (!forecast?.mini?.hours?.length) {
    return JSON.stringify({ error: 'Could not fetch forecast for this crag' })
  }

  const m = forecast.mini
  const { score: regionScore, why } = scoreRegion(m, {
    rocks: foundRegion.rock,
    distanceMins: 0,
    maxDriveMins: Infinity
  })

  const { score: cragScore, modifiers } = scoreCrag(regionScore, m, {
    aspect: foundCrag.aspect,
    rocks: foundCrag.rock,
    tags: foundCrag.tags
  })

  const warnings = checkWarnings(m, dates)

  return JSON.stringify({
    crag: {
      name: foundCrag.name,
      region: foundRegion.name,
      aspect: foundCrag.aspect,
      rock: foundCrag.rock,
      types: foundCrag.types,
      routeCount: foundCrag.routeCount,
      tags: foundCrag.tags
    },
    score: cragScore,
    regionScore,
    modifiers,
    why,
    weather: {
      avgTempC: Math.round(avg(m.temp) * 10) / 10,
      totalRainMm: Math.round(sum(m.rainMm) * 10) / 10,
      avgWindMph: Math.round(avg(m.wind) * 10) / 10,
      maxGustMph: Math.round(max(m.gust) * 10) / 10,
      avgCloudPct: Math.round(avg(m.cloud))
    },
    warnings: warnings.length ? warnings : undefined,
    dates
  })
}

function executeGetRegionInfo(args: Record<string, any>): string {
  if (args.region_id) {
    const r = regions.find(x => x.id === args.region_id)
    if (!r) return JSON.stringify({ error: `Unknown region: ${args.region_id}` })
    return JSON.stringify({
      id: r.id,
      name: r.name,
      area: r.area,
      rock: r.rock,
      tags: r.tags,
      coordinates: r.points[0],
      typeAffinity: r.typeAffinity
    })
  }

  // List all regions grouped by area
  const grouped: Record<string, Array<{ id: string; name: string; rock: string[] }>> = {}
  for (const r of regions) {
    const area = r.area || 'Other'
    if (!grouped[area]) grouped[area] = []
    grouped[area].push({ id: r.id, name: r.name, rock: r.rock })
  }
  return JSON.stringify({ areas: grouped })
}

async function executeGetMwisForecast(args: Record<string, any>): Promise<string> {
  const { area } = args
  if (!area) return JSON.stringify({ error: 'area required' })

  // Map MWIS area names to their URL paths
  const mwisAreas: Record<string, { url: string; group: string }> = {
    'lake-district': { url: 'lake-district', group: 'english-and-welsh' },
    'snowdonia-national-park': { url: 'snowdonia-national-park', group: 'english-and-welsh' },
    'brecon-beacons': { url: 'brecon-beacons', group: 'english-and-welsh' },
    'peak-district': { url: 'peak-district', group: 'english-and-welsh' },
    'yorkshire-dales': { url: 'yorkshire-dales', group: 'english-and-welsh' },
    'north-pennines': { url: 'north-pennines', group: 'english-and-welsh' },
    'scottish-highlands-west': { url: 'west-highlands', group: 'scottish' },
    'scottish-highlands-east': { url: 'east-highlands', group: 'scottish' },
    'scottish-highlands-north': { url: 'north-west-highlands', group: 'scottish' }
  }

  const mapping = mwisAreas[area]
  if (!mapping) return JSON.stringify({ error: `Unknown MWIS area: ${area}` })

  try {
    const url = `https://www.mwis.org.uk/forecasts/${mapping.group}/${mapping.url}`
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'CragCast/0.1 (+https://cragcast.app)',
        'Accept': 'text/html'
      }
    })

    if (!res.ok) {
      return JSON.stringify({ error: `MWIS returned ${res.status}`, area })
    }

    const html = await res.text()
    const forecast = parseMwisHtml(html, area)
    return JSON.stringify(forecast)
  } catch (e: any) {
    return JSON.stringify({ error: `Failed to fetch MWIS: ${e.message}`, area })
  }
}

/** Parse MWIS HTML forecast page to extract key weather info. */
function parseMwisHtml(html: string, area: string): Record<string, any> {
  const result: Record<string, any> = { area, source: 'MWIS' }

  // Extract forecast summary text blocks
  const summaryBlocks: string[] = []
  // MWIS uses div.forecast-text or similar blocks with forecast content
  // Extract text between common MWIS markers

  // Try to get the main forecast text content
  // MWIS structure: forecast days with headers and body text
  const dayMatches = html.matchAll(/<div[^>]*class="[^"]*day-forecast[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi)
  for (const match of dayMatches) {
    const block = match[1]
    // Strip HTML tags to get plain text
    const text = block.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    if (text.length > 20) summaryBlocks.push(text)
  }

  // Fallback: extract any substantial text paragraphs from the forecast area
  if (summaryBlocks.length === 0) {
    const forecastSection = html.match(/class="[^"]*forecast[^"]*"[\s\S]*?(<p[\s\S]*?)<\/section>/i)
    if (forecastSection) {
      const paras = forecastSection[1].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)
      for (const p of paras) {
        const text = p[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        if (text.length > 20) summaryBlocks.push(text)
      }
    }
  }

  // Extract freezing level if mentioned
  const freezingMatch = html.match(/freezing\s*level[^<]*?(\d{2,4})\s*m/i)
  if (freezingMatch) result.freezingLevelM = parseInt(freezingMatch[1])

  // Extract cloud base / hill fog
  const cloudBaseMatch = html.match(/cloud\s*(?:base|level)[^<]*?(\d{2,4})\s*m/i)
  if (cloudBaseMatch) result.cloudBaseM = parseInt(cloudBaseMatch[1])

  // Extract wind info
  const windMatch = html.match(/(?:summit|plateau|ridge)\s*winds?[^<]*?(\d+)\s*(?:to\s*(\d+)\s*)?mph/i)
  if (windMatch) {
    result.summitWindMph = windMatch[2] ? parseInt(windMatch[2]) : parseInt(windMatch[1])
  }

  // Extract visibility info
  const visMatch = html.match(/visibility[^<]*?(good|moderate|poor|very poor|excellent)/i)
  if (visMatch) result.visibility = visMatch[1].toLowerCase()

  result.summaryText = summaryBlocks.length
    ? summaryBlocks.slice(0, 3).join('\n\n')
    : 'Could not extract detailed forecast text. Visit MWIS directly for full details.'

  result.url = `https://www.mwis.org.uk/forecasts`

  return result
}
