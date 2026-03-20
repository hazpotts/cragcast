# CragCast Conversational AI – Implementation Plan

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│  Chat UI (pages/chat.vue)                               │
│  - Message list with streaming responses                │
│  - Suggested prompts for first-time users               │
│  - Mobile-friendly, matches existing CragCast style     │
└───────────────┬─────────────────────────────────────────┘
                │ SSE (Server-Sent Events)
                ▼
┌─────────────────────────────────────────────────────────┐
│  POST /api/chat  (server/api/chat.post.ts)              │
│  - Accepts { messages[], sessionId }                    │
│  - Rate-limits by IP (e.g. 20 req/hr)                   │
│  - Returns SSE stream                                   │
└───────────────┬─────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│  Orchestrator (server/utils/ai/orchestrator.ts)         │
│  - System prompt: climbing advisor, locked to domain    │
│  - Tool-use loop: AI decides which tools to call        │
│  - Streams final text response back via SSE             │
│  - Max 5 tool calls per turn (safety limit)             │
└───────┬───────┬───────┬───────┬───────┬─────────────────┘
        │       │       │       │       │
        ▼       ▼       ▼       ▼       ▼
   ┌────────┐┌───────┐┌─────┐┌──────┐┌───────┐
   │Weather ││Crags  ││Rank ││MWIS  ││Region │
   │Forecast││Search ││     ││      ││Info   │
   └────────┘└───────┘└─────┘└──────┘└───────┘
```

## Components to Build

### 1. Cloudflare Workers AI Binding
- Add `[ai]` binding to `wrangler.toml`
- Model: `@cf/meta/llama-3.3-70b-instruct-fp8-fast` (best tool-use support on CF)
- No API key needed – runs on Cloudflare's inference network

### 2. AI Orchestrator (`server/utils/ai/orchestrator.ts`)
The core tool-use loop:
1. Build messages array with system prompt + conversation history
2. Call Workers AI with tool definitions
3. If AI returns tool calls → execute them, append results, re-call AI
4. If AI returns text → stream it back
5. Max 5 iterations to prevent runaway loops

**System prompt** – locked down:
- "You are CragCast, a UK climbing conditions advisor"
- Only answer questions about climbing, weather, and crag conditions
- Always cite data sources (which tool provided the info)
- Use British English
- Keep responses concise and actionable

### 3. Tools (`server/utils/ai/tools.ts`)

| Tool | Description | Inputs | Source |
|------|-------------|--------|--------|
| `get_weather_forecast` | Hourly forecast for a location | `lat, lon, dates[]` | Open-Meteo (existing `fetchForecast`) |
| `search_crags` | Find crags by criteria | `regionId?, type?, rock?, limit?` | D1 database (existing `crag-db.ts`) |
| `rank_regions` | Get top-ranked regions | `lat, lon, dates[], maxDriveMins?, climbType?` | Existing scoring engine |
| `get_crag_score` | Score a specific crag | `cragId, dates[]` | Existing `scoreCrag()` |
| `get_region_info` | Region metadata + links | `regionId` | Static regions data |
| `get_mwis_forecast` | Mountain weather forecast | `regionId` | KV store (cron-ingested) |

### 4. MWIS Cron Ingestion
- Add to existing `worker-cron` – fetch MWIS area forecasts
- Store in KV as `mwis:{areaId}` with JSON: `{ summary, freezingLevel, cloudBase, visibility, confidence, fetchedAt }`
- Map MWIS areas to CragCast regions (MWIS has ~10 UK mountain areas)
- Run on cron: every 6 hours (MWIS updates twice daily)
- Fetch via standard HTTP from MWIS public pages, parse the structured data

### 5. Chat API Endpoint (`server/api/chat.post.ts`)
- **Method:** POST
- **Body:** `{ messages: Array<{role, content}>, sessionId?: string }`
- **Response:** SSE stream (`text/event-stream`)
- **Events:** `{ event: 'token' | 'tool_call' | 'done' | 'error', data: string }`
- **Rate limiting:** Simple KV-based counter per IP, 20 requests/hour
- **Session:** Optional sessionId for conversation continuity (messages stored client-side)

### 6. Chat UI (`pages/chat.vue`)
- New page at `/chat`
- Components:
  - `ChatMessage.vue` – renders user/assistant messages with markdown
  - `ChatInput.vue` – text input with send button
- Suggested prompts on empty state:
  - "Where should I climb this weekend?"
  - "What are the best gritstone crags tomorrow?"
  - "Is Stanage going to be dry on Saturday?"
- Streams tokens as they arrive via SSE
- Shows tool call indicators ("Checking weather...", "Searching crags...")
- Messages stored in sessionStorage (no persistence)
- Nav link in header/footer

### 7. Composable (`composables/useChat.ts`)
- Manages message state
- Handles SSE connection lifecycle
- Provides `sendMessage(text)`, `messages`, `isStreaming`
- Auto-injects user location + dates from `usePrefs` as context

## File Changes Summary

**New files:**
- `server/api/chat.post.ts` – SSE chat endpoint
- `server/utils/ai/orchestrator.ts` – tool-use loop
- `server/utils/ai/tools.ts` – tool definitions + executors
- `server/utils/ai/system-prompt.ts` – system prompt
- `server/utils/ai/types.ts` – TypeScript types
- `pages/chat.vue` – chat page
- `components/ChatMessage.vue` – message bubble
- `components/ChatInput.vue` – input bar
- `composables/useChat.ts` – chat state management

**Modified files:**
- `wrangler.toml` – add `[ai]` binding
- `worker-cron/src/index.ts` – add MWIS ingestion
- `worker-cron/wrangler.toml` – add KV binding for MWIS
- `components/AppFooter.vue` – add chat nav link
- `nuxt.config.ts` – no changes expected (Pages preset handles AI binding)

## Deployment Notes

- Develops on branch `claude/conversational-ai-orchestrator-ksIM5`
- Target: staging branch (merge after implementation)
- Workers AI binding requires `[ai]` in wrangler.toml – works in both local dev and deployed Pages
- MWIS cron worker needs KV binding for MWIS data storage
- No new API keys required (Workers AI is included in Cloudflare plan)

## Open Questions / Risks

1. **Workers AI tool-use support:** Llama 3.3 70B on CF supports function calling but quality may vary vs Claude/GPT-4. If tool use is unreliable, we can fall back to a structured prompt approach (inject tool results into context manually).
2. **MWIS data access:** MWIS doesn't have a public API. We'll need to fetch and parse their forecast pages. If their format changes, the parser breaks. Alternative: start without MWIS, add it as a follow-up.
3. **SSE on Cloudflare Pages:** Pages Functions support streaming responses but with a 30s timeout on free plan (100s on paid). Long tool-use chains could hit this. Mitigation: limit to 5 tool calls.
4. **Rate limiting:** KV-based rate limiting is eventually consistent. Could allow burst above limit briefly. Acceptable for staging.
