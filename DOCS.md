# CragCast – Detailed Documentation

## 1. Project Setup
- Framework: Nuxt 3 (TypeScript, Vite)
- Deployment Target: Cloudflare Pages (Nitro preset `cloudflare-pages`)
- Language: TypeScript
- Package Manager: pnpm
- Node: 20 (via nvm)
- Styling: Tailwind CSS + Nuxt UI
- AI: Cloudflare Workers AI (Llama 3.3 70B)
- Database: Cloudflare D1 (SQLite) for crag data
- Cache: Cloudflare KV for weather forecasts

## 2. Modes

### Cards (`/cards`)
- Shows the top ranked region as a hero card
- Below, shows runner-ups (compact cards)
- Each card is expandable to show individual crags with scores

### Table (`/table`)
- Responsive table/grid of all regions
- Columns: Region, Score, Rain, Wind, Temp, Distance, Updated
- Sorting: Score (default), Distance
- Expandable rows show crags within each region

### AI Chat (`/chat`)
- Conversational interface for natural-language climbing questions
- Streams responses in real-time via SSE
- Shows climbing-themed thinking phrases while loading
- Tool call indicators show what the AI is doing (e.g. "Looking up crag...", "Checking weather...")
- Suggested prompts for first-time users

Mode toggling is persisted in `localStorage` (`mode`).

## 3. First-Run Flow
Prompts:
1) Where? Use my location (Geolocation API) or search via Google Places (optional; fallback to OSM).
2) Max distance (slider, default 120 minutes).
3) When? Presets: Today, Tomorrow, This weekend, Next weekend (default), Custom.
4) Climbing type (optional): Trad, Sport, Boulder, Any (default).

Stored in `localStorage` under `climb.prefs.*` via `usePrefs.ts`.

## 4. API Endpoints

### Core endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rank` | GET | Ranked regions with scores. Params: `lat, lon, maxDriveMins, climbType, dates` |
| `/api/regions` | GET | Static region catalogue |
| `/api/region` | GET | Single region detail |
| `/api/areas` | GET | Area groupings |
| `/api/crags` | GET | Scored crags by region. Params: `regionId, lat, lon, dates` |
| `/api/custom-region` | GET | Score a custom lat/lon location |
| `/api/warm` | POST | Trigger cache warming |

### AI Chat endpoint
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat` | POST | Conversational AI. Body: `{ messages: [{role, content}] }`. Returns SSE stream. |

**Chat SSE events:**
- `token` — Text chunk of the AI response
- `tool_call` — Friendly name of a tool being called (e.g. "Looking up crag...")
- `done` — Stream complete
- `error` — Error message

**Chat limits:**
- Max 20 messages per request
- Max 1000 characters per message
- Last message must be from user

### Admin endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/import-crags` | POST | Seed crag data into D1 |
| `/api/admin/import-status` | GET | Import log |

## 5. AI Chat System

### Architecture
```
User message
  → POST /api/chat (SSE endpoint)
    → Orchestrator (tool-use loop, max 5 rounds)
      → AI model (Llama 3.3 70B on Cloudflare Workers AI)
        → Tool calls (if needed) → execute → feed results back → re-call AI
        → Text response → stream via SSE
```

### Orchestrator (`server/utils/ai/orchestrator.ts`)
The orchestrator runs an iterative tool-use loop:
1. Sends system prompt + conversation history + tool definitions to the AI model
2. If the AI returns tool calls → executes them, appends results to history, loops
3. If the AI returns text → streams it back via the `onToken` callback
4. Max 5 rounds to prevent runaway loops
5. Sends `onDone` when complete or `onError` on failure

### Tools (`server/utils/ai/tools.ts`)

| Tool | Purpose | When to use |
|------|---------|-------------|
| `lookup_crag` | Find a crag by name, return details + weather forecast | Simple questions: "is X dry?", "weather at X?" |
| `get_crag_score` | Score a crag 0-100 with modifiers | When user wants an explicit rating |
| `get_weather_forecast` | Hourly forecast for a lat/lon | Raw weather data for a location |
| `search_crags` | List crags in a region by type | "What crags are in the Peak?" |
| `rank_regions` | Score and rank all UK regions | "Where should I climb this weekend?" |
| `get_region_info` | Region metadata (rock types, tags, links) | "Tell me about the Lake District" |
| `get_mwis_forecast` | Mountain Weather Information Service forecast | Mountain/upland weather questions |

### System prompt (`server/utils/ai/system-prompt.ts`)
- Identity: "CragCast, a UK climbing conditions advisor"
- Includes a tool selection guide so the AI picks the simplest tool for each question type
- Locked to climbing/weather topics only
- British English
- Instructs the AI to always respond with a helpful summary after tool calls

### Client-side chat (`composables/useChat.ts`)
- Manages message state with `ref<ChatMsg[]>`
- Parses SSE stream from `/api/chat`
- Cycles climbing-themed thinking phrases every 5s while waiting:
  - "Reading the topo...", "Chalking up...", "Checking the seepage...", "Eyeing up the crux...", etc.
- Shows tool call indicators as they arrive
- Clears thinking state once content starts streaming

### Chat UI components
- `ChatMessage.vue` — Message bubble with thinking animation (bouncing dots), tool call indicators, and content
- `ChatInput.vue` — Text input with send button
- `pages/chat.vue` — Full chat page with message list and suggested prompts

## 6. Data Sources

### Weather
- **Open-Meteo** (keyless) — Hourly forecasts: temperature, rain, wind, gusts, cloud cover, precipitation probability
- **MWIS** (Mountain Weather Information Service) — Scraped HTML for mountain areas: cloud base, freezing level, visibility, summit winds
- Cache: Cloudflare KV (binding `CLIMB_KV`), ~3h store, ≤12h freshness enforcement

### Crag database
- ~100 UK crags stored in Cloudflare D1
- Schema: `id, name, regionId, lat, lon, aspect, rock[], types: {trad, sport, boulder}, routeCount, tags[], ukcId`
- Seed data in `server/utils/uk-crags-seed.ts`
- Admin import endpoint with batch UPSERT
- Crags auto-assigned to closest region by haversine distance

### Regions
- 35 UK climbing sub-regions defined in `server/utils/regions.ts`
- Grouped into areas (Peak District, North Wales, Lake District, etc.)
- Each region has: id, name, area, rock types, tags, coordinates, type affinity

## 7. Scoring Algorithm

### Region scoring (`scoreRegion`)
Produces a 0-100 score from hourly forecast data:

| Factor | Weight | Detail |
|--------|--------|--------|
| Dryness | 40% | Rain amount × 12 + precipitation probability × 0.6 |
| Wind | 25% | Penalty if avg > 25 mph or gusts > 30 mph |
| Temperature | 20% | Rock-type-aware ideal ranges: grit 6-12°C, limestone 12-18°C, other 8-16°C |
| Cloud | 5-10% | Sun bonus varies based on temperature |
| Distance | multiplier | Fades score beyond user's `maxDriveMins` |
| Type affinity | multiplier | 0.9-1.0 based on climbing type match |

Returns score + up to 3 "why" bullet points (e.g. "Rain likely", "Good temps for friction").

### Crag scoring (`scoreCrag`)
Adjusts region score for individual crag characteristics:
- **Aspect + temperature**: South-facing gets +6 on cold days, north-facing +6 on hot days
- **Aspect + wind**: Sheltered from prevailing wind +5, exposed -5
- **Tags**: `exposed`, `sheltered`, `quick-dry` apply specific bonuses/penalties
- **Drying**: Quick-dry crags +3 if rain expected; north-facing sheltered -3 (stays wet)

Returns adjusted score + modifiers (e.g. "Sun-warmed (south-facing)", "Sheltered from wind").

### Weather warnings (`server/utils/warnings.ts`)
- Red/amber thresholds for wind, rain, and temperature
- Surfaced in API responses and AI chat answers

## 8. UI Components

### Results views
- `RegionCard.vue` — Hero/compact card with score, reasons, mini charts, expandable crag list
- `CompareTable.vue` — Sortable table with indented crag sub-rows
- `CragList.vue` — Crag accordion: name, score, aspect, rock, route count, types, modifiers, UKC link
- `CragCard.vue` — Individual crag detail card
- `MiniChart.vue` — Sparkline bar charts for rain, wind, temp

### Preferences & navigation
- `PrefsForm.vue` — Location, distance, date, and climb type selectors
- `PlaceSearch.vue` — Google Places (or OSM fallback) search
- `ModeToggle.vue` — Cards/table mode switch
- `ResultsHeader.vue` — Summary with active filters
- `UnitsSelector.vue` — Metric/imperial toggle
- `WeatherIcon.vue` — Condition-based weather icons

### Chat
- `ChatMessage.vue` — Renders user/assistant messages with thinking animation and tool indicators
- `ChatInput.vue` — Text input bar with send button

## 9. Testing
- Unit (Vitest): scoring algorithm, date helpers
- E2E (Cypress): skeleton present for first-run prompts, recommend flow, compare table, freshness

## 10. Deployment (Cloudflare Pages)
- Nitro preset `cloudflare-pages` configured in `nuxt.config.ts`
- **KV binding**: `CLIMB_KV` — forecast cache
- **D1 binding**: crag database
- **AI binding**: `[ai]` in `wrangler.toml` — Cloudflare Workers AI (no API key needed)
- All `/api/*` endpoints run in Pages Functions
- Cache warmer cron worker runs every 2h (`worker-cron/`)

## 11. Configuration and Environment
- `.env.example` defines public environment variables:
  - `NUXT_PUBLIC_GOOGLE_PLACES_ENABLED` (0/1)
  - `NUXT_PUBLIC_GOOGLE_PLACES_API_KEY`
- `nuxt.config.ts` reads these via `runtimeConfig.public.*`
- When Places is disabled, `PlaceSearch.vue` falls back to OSM/Nominatim

## 12. Cache Warmer (`worker-cron/`)
- Separate Cloudflare Worker on a 2-hour cron schedule
- Pre-populates KV cache for all 35 regions so users get fast responses
- Deployed automatically via GitHub Actions alongside the main app
