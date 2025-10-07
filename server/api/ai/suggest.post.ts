import { defineEventHandler, readBody, createError } from 'h3'
import { ofetch } from 'ofetch'
import OpenAI from 'openai'

// Simple in-memory rate limit and caches
const buckets = new Map<string, { tokens: number; last: number }>()
const suggestionCache = new Map<string, { value: any; exp: number }>()
const externalCache = new Map<string, { value: any; exp: number }>()

function now() { return Date.now() }
function keyFromEvent(event: any) {
  const ip = (event.node.req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || event.node.req.socket.remoteAddress || 'unknown'
  const ua = event.node.req.headers['user-agent'] || ''
  return `${ip}|${ua}`
}
function bucketCheck(k: string, rate: number, perMs: number) {
  const b = buckets.get(k) || { tokens: rate, last: now() }
  const elapsed = now() - b.last
  const refill = Math.floor(elapsed / perMs) * rate
  b.tokens = Math.min(rate, b.tokens + (refill || 0))
  b.last = b.last + Math.floor(elapsed / perMs) * perMs
  if (b.tokens <= 0) { buckets.set(k, b); return false }
  b.tokens -= 1
  buckets.set(k, b)
  return true
}
function cacheGet(map: Map<string, any>, key: string) {
  const v = map.get(key)
  if (!v) return null
  if (v.exp && v.exp < now()) { map.delete(key); return null }
  return v.value
}
function cacheSet(map: Map<string, any>, key: string, value: any, ttlMs: number) {
  map.set(key, { value, exp: now() + ttlMs })
}
async function cachedFetch<T>(url: string, opts: any, ttlMs = 10 * 60 * 1000): Promise<T> {
  const k = `${url}|${JSON.stringify(opts || {})}`
  const hit = cacheGet(externalCache, k)
  if (hit) return hit as T
  const out = await ofetch<T>(url, opts)
  cacheSet(externalCache, k, out, ttlMs)
  return out
}

function ensureClimbingOnly(prompt: string) {
  const p = prompt.toLowerCase()
  if (!/(climb|climbing|crag|boulder|trad|sport|mountain|route)/.test(p)) return false
  return true
}

async function getRank(prefs?: any) {
  const q: any = {}
  if (prefs?.where?.lat && prefs?.where?.lon) { q.lat = prefs.where.lat; q.lon = prefs.where.lon }
  if (Number.isFinite(prefs?.maxDriveMins)) q.maxDriveMins = prefs.maxDriveMins
  if (Array.isArray(prefs?.dates) && prefs.dates.length) q.dates = (prefs.dates as string[]).join(',')
  const url = '/api/rank'
  const data = await ofetch<any>(url, { method: 'GET', query: q, baseURL: process.env.NUXT_PUBLIC_BASE_URL || 'http://localhost:3000' })
  return data
}

async function getMWISSummary(_areas: string[]) {
  return [] as any[]
}

async function llmSuggest(context: any, userPrompt: string): Promise<{ html: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const items = (context?.rank?.items || []).slice(0, 5)
    const html = [
      '<div>',
      '<p>No AI key configured; showing a basic ranked list.</p>',
      '<ol>',
      ...items.map((r: any) => `<li><strong>${r.name}</strong> – score ${r.score} – <a href="${r.ukcUrl}" target="_blank" rel="noopener">UKC</a></li>`),
      '</ol>',
      '</div>'
    ].join('')
    return { html }
  }
  // Global OpenAI egress limiter (e.g. 30 req/minute)
  if (!bucketCheck('OPENAI_GLOBAL', 30, 60_000)) {
    const items = (context?.rank?.items || []).slice(0, 5)
    const html = [
      '<div>',
      '<p>AI temporarily rate limited; showing a basic ranked list.</p>',
      '<ol>',
      ...items.map((r: any) => `<li><strong>${r.name}</strong> – score ${r.score} – <a href="${r.ukcUrl}" target="_blank" rel="noopener">UKC</a></li>`),
      '</ol>',
      '</div>'
    ].join('')
    return { html }
  }
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const sys = `You are an assistant that suggests UK rock climbing locations based only on:
- Crag/region info, weather forecasts, and MWIS mountain weather. Use UK English.
- Never answer non-climbing, non-weather questions. If asked, refuse and steer back to climbing.
- Consider user preferences (dates, location, drive time). Prefer lower rain, safe wind, and suitable temps.
- Include short rationale and link out to UKC or forecast sources provided. Return clean, minimal HTML.
- Avoid medical/safety advice beyond citing MWIS hazards.
- Do not invent sources; only use those provided.`
  const content = {
    userPrompt,
    prefs: context?.prefs || {},
    topRegions: (context?.rank?.items || []).slice(0, 8).map((r: any) => ({
      id: r.id, name: r.name, area: r.area, score: r.score, links: r.links, ukcUrl: r.ukcUrl,
      daily: r.daily
    })),
    mwis: context?.mwis || []
  }
  const messages = [
    { role: 'system', content: sys },
    { role: 'user', content: `Using this JSON context, suggest where to climb and why. Output HTML only.\n\n${JSON.stringify(content)}` }
  ]
  // Retry with exponential backoff on 429/5xx
  const attempts = 3
  let lastErr: any = null
  const client = new OpenAI({ apiKey })
  for (let i = 0; i < attempts; i++) {
    try {
      const resp = await client.chat.completions.create({
        model,
        messages: messages as any,
        temperature: 0.2
      })
      const html = resp?.choices?.[0]?.message?.content || '<p>No response</p>'
      return { html }
    } catch (e: any) {
      lastErr = e
      const status = e?.status || e?.response?.status || e?.statusCode || 0
      if (status === 429 || (status >= 500 && status < 600)) {
        const backoff = 500 * Math.pow(2, i)
        await new Promise(res => setTimeout(res, backoff))
        continue
      }
      break
    }
  }
  // Fallback when rate-limited or failed
  const items = (context?.rank?.items || []).slice(0, 5)
  const html = [
    '<div>',
    '<p>AI request limited; showing a basic ranked list.</p>',
    '<ol>',
    ...items.map((r: any) => `<li><strong>${r.name}</strong> – score ${r.score} – <a href="${r.ukcUrl}" target="_blank" rel="noopener">UKC</a></li>`),
    '</ol>',
    '</div>'
  ].join('')
  return { html }
}

export default defineEventHandler(async (event) => {
  const idKey = keyFromEvent(event)
  if (!bucketCheck(idKey, 5, 60_000)) throw createError({ statusCode: 429, statusMessage: 'Rate limit' })
  const body = await readBody(event)
  const prompt = String(body?.prompt || '')
  const prefs = body?.prefs || null
  if (prompt.length < 8) throw createError({ statusCode: 400, statusMessage: 'Prompt too short' })
  if (!ensureClimbingOnly(prompt)) throw createError({ statusCode: 400, statusMessage: 'Prompt must relate to climbing' })

  const cacheKey = JSON.stringify({ prompt, prefs })
  const cached = cacheGet(suggestionCache, cacheKey)
  if (cached) return cached

  let rank: any = null
  try { rank = await getRank(prefs) } catch {}
  const mwis = await getMWISSummary([])

  const context = { prefs, rank, mwis }
  const out = await llmSuggest(context, prompt)
  cacheSet(suggestionCache, cacheKey, out, 5 * 60 * 1000)
  return out
})
