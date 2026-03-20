/**
 * Tool definitions and executors for the CragCast AI orchestrator.
 * Each tool wraps existing server utilities so the AI can query
 * weather, crags, regions, and MWIS data.
 */

import type { ToolDefinition } from './types'
import { fetchForecastWithRetry } from '../forecast'
import { getCragsByRegion, searchCragByName } from '../crag-db'
import { regions, areas } from '../regions'
import { scoreRegion, scoreCrag } from '../score'
import { haversineKm, driveMinutesApprox } from '../distance'
import { parseDatesParam } from '../dates'
import { checkWarnings } from '../warnings'
import { avg, sum, max } from '../server-utils'

// --- Tool definitions (sent to the model) ---

export const toolDefinitions: ToolDefinition[] = [
  {
    name: 'lookup_crag',
    description: 'Look up a crag by name and return its details (aspect, rock type, route types, tags, coordinates, region) together with the hourly weather forecast for the requested dates. Returns JSON with crag metadata and weather summary (avg/min/max temp, total rain, wind, gusts, cloud cover, rain probability, warnings). Use this as the DEFAULT tool for any question about a specific crag — "Is Stanage dry?", "What\'s the weather at Tremadog?", "Can I climb at Malham tomorrow?". This is the most commonly needed tool. Do NOT use get_crag_score unless the user explicitly asks for a numerical score or rating. Do NOT use get_weather_forecast for named crags — this tool already includes the forecast.',
    parameters: {
      type: 'object',
      properties: {
        crag_name: {
          type: 'string',
          description: 'Name of the crag as climbers know it, e.g. "Stanage", "Tremadog", "Malham Cove", "Froggatt Edge". The search is fuzzy — use the common name.'
        },
        dates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dates to fetch the forecast for, in YYYY-MM-DD format. Must be today or future dates. Example: ["2025-03-15", "2025-03-16"]'
        }
      },
      required: ['crag_name', 'dates']
    }
  },
  {
    name: 'get_crag_score',
    description: 'Score a specific crag\'s climbing conditions from 0 to 100 for the given dates, with detailed modifiers explaining how aspect, shelter, and rock type affect the score. Returns JSON with crag metadata, numerical score, region score, modifier breakdown, scoring rationale, and weather summary. Use ONLY when the user explicitly asks for a score, rating, or "how good" conditions are — e.g. "Rate Stanage for Saturday", "Score conditions at Tremadog", "How good is Malham this weekend?". For simple weather lookups or "is it dry?" questions, use lookup_crag instead.',
    parameters: {
      type: 'object',
      properties: {
        crag_name: {
          type: 'string',
          description: 'Name of the crag to score, e.g. "Stanage", "Tremadog", "Portland". Uses fuzzy matching.'
        },
        dates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dates to score conditions for, in YYYY-MM-DD format. Must be today or future dates.'
        }
      },
      required: ['crag_name', 'dates']
    }
  },
  {
    name: 'rank_regions',
    description: 'Rank all UK climbing regions by overall conditions for the given dates. Returns JSON with an array of top regions sorted by score (0–100), each with region name, area, score, scoring rationale, rock types, drive time, weather summary (temp, wind, rain), and warnings. Optionally filters by drive time from a home location. Use when the user asks "where should I climb?", "best conditions this weekend?", "where\'s dry on Saturday?", or any open-ended venue recommendation. Do NOT use for questions about a specific named crag — use lookup_crag instead.',
    parameters: {
      type: 'object',
      properties: {
        dates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dates to rank for, in YYYY-MM-DD format. Must be today or future dates. Example: ["2025-03-15"]'
        },
        lat: { type: 'number', description: 'User\'s home latitude for distance filtering and drive time calculation. Optional.' },
        lon: { type: 'number', description: 'User\'s home longitude for distance filtering and drive time calculation. Optional.' },
        max_drive_mins: { type: 'number', description: 'Maximum acceptable drive time in minutes. Regions beyond this are excluded. Optional.' },
        top_n: { type: 'number', description: 'Number of top-ranked regions to return. Defaults to 5. Set higher for broader comparisons.' }
      },
      required: ['dates']
    }
  },
  {
    name: 'search_crags',
    description: 'List climbing crags within a specific region. Returns JSON with region name, array of crags (each with name, aspect, rock types, climbing types with route counts, total route count, tags, coordinates, UKC ID), and total count. Use when the user asks "what crags are in the Peak District?", "show me sport climbing in North Wales", or needs to browse crags by area. Requires a region_id — if you don\'t know the ID, call get_region_info first to list all regions.',
    parameters: {
      type: 'object',
      properties: {
        region_id: {
          type: 'string',
          description: 'Region ID to search within. Examples: "peak-n" (Peak District North/Gritstone), "peak-s" (Peak District South/Limestone), "nwales-n" (North Wales Mountains), "lakes-c" (Lake District Central), "swanage" (Dorset). Use get_region_info to discover valid IDs.'
        },
        climb_type: {
          type: 'string',
          enum: ['trad', 'sport', 'boulder'],
          description: 'Filter crags to only those with routes of this type. Optional — omit to return all crags.'
        },
        limit: { type: 'number', description: 'Maximum number of crags to return. Defaults to 10.' }
      },
      required: ['region_id']
    }
  },
  {
    name: 'get_weather_forecast',
    description: 'Fetch hourly weather forecast for a specific UK latitude/longitude over the requested dates. Returns JSON with location, dates, and weather summary (avg/min/max temp in °C, total rain in mm, avg wind and max gusts in mph, cloud cover %, max rain probability %, warnings). Use ONLY when you need weather for exact coordinates that are NOT a named crag — e.g. a user-provided lat/lon, or a location not in the crag database. For any named crag, use lookup_crag instead (it includes the forecast). Cannot return historical weather — only forecasts for today onwards.',
    parameters: {
      type: 'object',
      properties: {
        lat: { type: 'number', description: 'Latitude of the UK location (e.g. 53.35 for Peak District)' },
        lon: { type: 'number', description: 'Longitude of the UK location (e.g. -1.63 for Peak District)' },
        dates: {
          type: 'array',
          items: { type: 'string' },
          description: 'Dates to fetch the forecast for, in YYYY-MM-DD format. Must be today or future dates.'
        }
      },
      required: ['lat', 'lon', 'dates']
    }
  },
  {
    name: 'get_region_info',
    description: 'Get metadata about a UK climbing region — rock types, tags, coordinates, type affinity — or list all available regions grouped by area. Returns JSON with region details when given a region_id, or a grouped list of all regions when called without one. Use when the user asks "tell me about the Lake District", "what regions do you cover?", or when you need to discover valid region IDs for other tools like search_crags.',
    parameters: {
      type: 'object',
      properties: {
        region_id: {
          type: 'string',
          description: 'Specific region ID to look up, e.g. "peak-n", "lakes-c", "pembroke". Omit to list all available regions and their IDs.'
        }
      },
      required: []
    }
  },
  {
    name: 'get_mwis_forecast',
    description: 'Fetch the Mountain Weather Information Service (MWIS) forecast for a UK upland/mountain area. Returns JSON with area name, extracted forecast summary text, freezing level, cloud base, summit wind speeds, and visibility where available, plus a link to the full MWIS page. Use for mountain and upland weather questions — conditions above ~400m diverge dramatically from lowland forecasts (temperature drops ~1°C per 150m, summit winds can be 3x valley speeds). Use when the user asks about mountain conditions, winter climbing, or high-altitude crags in areas like Snowdonia, the Lake District, or the Scottish Highlands.',
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
          description: 'MWIS mountain area to fetch the forecast for. Must be one of the listed values.'
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

/** Replace any past dates with today's date — the forecast API only returns future data. */
function fixPastDates(dates: string[] | undefined): string[] | undefined {
  if (!dates?.length) return dates
  const today = new Date().toISOString().slice(0, 10)
  return dates.map(d => (d < today ? today : d))
}

export async function executeTool(name: string, args: Record<string, any>, ctx: ToolContext): Promise<string> {
  // Guard: parse dates if the model sent a JSON string instead of an array
  if (args.dates && typeof args.dates === 'string') {
    try { args.dates = JSON.parse(args.dates) } catch { args.dates = [args.dates] }
  }
  // Guard: fix past dates before any tool sees them
  if (Array.isArray(args.dates)) {
    args.dates = fixPastDates(args.dates)
  }
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
  console.log(`[search_crags] region="${region_id}" type=${climb_type || 'any'} limit=${limit}`)
  if (!region_id) return JSON.stringify({ error: 'region_id required' })

  const region = regions.find(r => r.id === region_id)
  if (!region) {
    console.warn(`[search_crags] unknown region: "${region_id}"`)
    return JSON.stringify({ error: `Unknown region: ${region_id}. Use get_region_info to list regions.` })
  }

  let crags = await getCragsByRegion(ctx.event, region_id)
  console.log(`[search_crags] D1 returned ${crags.length} crags for region "${region_id}"`)

  // Fallback to seed data if D1 returned nothing
  if (crags.length === 0) {
    console.log(`[search_crags] falling back to seed data for region "${region_id}"`)
    const { ukCragsSeed } = await import('../uk-crags-seed')
    const { findClosestRegionForCrag } = await import('../crag-db')
    crags = ukCragsSeed
      .filter(c => {
        const rId = findClosestRegionForCrag(c.lat, c.lon)
        return rId === region_id
      })
      .map(c => ({
        id: c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: c.name,
        regionId: region_id,
        lat: c.lat,
        lon: c.lon,
        aspect: null,
        rock: [],
        types: {
          ...(c.trad > 0 ? { trad: c.trad } : {}),
          ...(c.sport > 0 ? { sport: c.sport } : {}),
          ...(c.boulder > 0 ? { boulder: c.boulder } : {})
        },
        routeCount: c.totalClimbs,
        tags: [],
        ukcId: null
      }))
  }

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
  console.log(`[lookup_crag] searching for "${crag_name}" dates=${JSON.stringify(dates)}`)
  if (!crag_name) return JSON.stringify({ error: 'crag_name required' })

  // Single query search (D1 with seed data fallback)
  const foundCrag = await searchCragByName(ctx.event, crag_name)
  if (!foundCrag) {
    console.warn(`[lookup_crag] crag "${crag_name}" NOT FOUND`)
    return JSON.stringify({ error: `Crag "${crag_name}" not found in database. Try search_crags to find crags by region.` })
  }
  console.log(`[lookup_crag] found: "${foundCrag.name}" region=${foundCrag.regionId} lat=${foundCrag.lat} lon=${foundCrag.lon}`)

  const foundRegion = regions.find(r => r.id === foundCrag.regionId)
  if (!foundRegion) {
    return JSON.stringify({ error: `Region not found for crag "${crag_name}"` })
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
  console.log(`[get_crag_score] scoring "${crag_name}" dates=${JSON.stringify(dates)}`)
  if (!crag_name || !dates?.length) return JSON.stringify({ error: 'crag_name and dates required' })

  // Single query search (D1 with seed data fallback)
  const foundCrag = await searchCragByName(ctx.event, crag_name)
  if (!foundCrag) {
    console.warn(`[get_crag_score] crag "${crag_name}" NOT FOUND`)
    return JSON.stringify({ error: `Crag "${crag_name}" not found in database. Try search_crags to find crags by region.` })
  }
  console.log(`[get_crag_score] found: "${foundCrag.name}" region=${foundCrag.regionId}`)

  const foundRegion = regions.find(r => r.id === foundCrag.regionId)
  if (!foundRegion) {
    return JSON.stringify({ error: `Region not found for crag "${crag_name}"` })
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
