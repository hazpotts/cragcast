# CragCast – UK climbing conditions (Nuxt 3 + Cloudflare Pages)

CragCast is a UK-wide climbing conditions app. It fetches weather from Open-Meteo, scores regions and crags by climbability, and includes a conversational AI assistant for natural-language questions about where to climb.

## Overview
- Nuxt 3 (TypeScript, Vite) + Node 20 + pnpm
- Cloudflare Pages Functions (Nitro preset: `cloudflare-pages`)
- Cloudflare Workers AI (Llama 3.3 70B) for the chat assistant
- Cloudflare D1 (SQLite) for crag data
- Cloudflare KV for forecast caching
- Tailwind CSS + Nuxt UI for the interface
- Weather: Open-Meteo (keyless)

## Features

### Recommend & Compare modes
- **Cards view** (`/cards`) — Top-ranked regions as hero + runner-up cards
- **Table view** (`/table`) — Sortable grid of all regions with mini charts
- Expandable crag lists within each region showing individual crag scores

### AI Chat (`/chat`)
- Conversational assistant for climbing conditions questions
- Streams responses via Server-Sent Events (SSE)
- Tool-use loop: AI calls weather, crag, and region tools as needed
- Climbing-themed thinking phrases while loading ("Chalking up...", "Reading the topo...")
- 7 tools available: `lookup_crag`, `get_crag_score`, `get_weather_forecast`, `search_crags`, `rank_regions`, `get_region_info`, `get_mwis_forecast`

### Scoring
- Region scoring (0-100): dryness (40%), wind (25%), temperature/friction (20%), cloud (5-10%), distance decay
- Crag scoring: adjusts region score by aspect, wind shelter, exposure tags, drying speed
- Rock-type-aware temperature ranges (gritstone 6-12°C, limestone 12-18°C)

### Crag database
- ~100 UK crags with lat/lon, aspect, rock type, climb types, route counts, tags
- D1 database with admin import endpoint
- Auto-assigned to nearest region by haversine distance

## Quick start
```bash
nvm use || nvm install 20
corepack enable && corepack prepare pnpm@9.0.0 --activate

pnpm install
pnpm dev
```
Dev server: http://localhost:3000

## Environment (.env)
Copy `.env.example` to `.env` and edit as needed:
```
NUXT_PUBLIC_GOOGLE_PLACES_ENABLED=0
NUXT_PUBLIC_GOOGLE_PLACES_API_KEY=
```
- Set `NUXT_PUBLIC_GOOGLE_PLACES_ENABLED=1` and provide a browser-restricted key to enable Google Places search. Otherwise, a minimal OSM/Nominatim fallback is used.

## Commands
- `pnpm dev` — Start Nuxt dev server
- `pnpm build` — Production build (Cloudflare Pages)
- `pnpm preview` — Preview the production build
- `pnpm test` — Run all tests (Vitest)
- `pnpm test:unit` — Unit tests only
- `pnpm test:e2e` — Cypress (skeleton)

## Project structure
```
/pages/
  index.vue              # Default redirect
  cards.vue              # Recommend mode (hero + runner-ups)
  table.vue              # Compare mode (sortable grid)
  chat.vue               # AI chat interface
  privacy.vue            # Privacy policy

/components/
  ChatMessage.vue        # Chat message bubble (thinking phrases, tool indicators)
  ChatInput.vue          # Chat text input bar
  CragList.vue           # Expandable crag list per region
  CragCard.vue           # Individual crag card
  RegionCard.vue         # Region recommendation card
  CompareTable.vue       # Compare mode table
  MiniChart.vue          # Sparkline charts for weather data
  PrefsForm.vue          # User preferences form
  PlaceSearch.vue        # Location search (Google Places / OSM fallback)
  ModeToggle.vue         # Cards/table mode switcher
  WeatherIcon.vue        # Weather condition icons
  ResultsHeader.vue      # Results summary header
  AppFooter.vue          # App footer with nav links
  ...

/composables/
  useChat.ts             # Chat state, SSE parsing, thinking phrases
  usePrefs.ts            # User preferences (localStorage)
  useRank.ts             # Fetch /api/rank
  useCrags.ts            # Fetch /api/crags
  useAreas.ts            # Area groupings
  useUnits.ts            # Unit preferences (metric/imperial)
  useCustomCrags.ts      # Custom crag management

/server/api/
  chat.post.ts           # POST /api/chat — AI SSE endpoint
  rank.get.ts            # GET /api/rank — scoring + freshness
  regions.get.ts         # GET /api/regions — static catalogue
  crags.get.ts           # GET /api/crags — scored crags by region
  areas.get.ts           # GET /api/areas — area groupings
  region.get.ts          # GET /api/region — single region detail
  custom-region.get.ts   # GET /api/custom-region — custom location scoring
  warm.post.ts           # POST /api/warm — cache warming trigger
  admin/
    import-crags.post.ts # POST /api/admin/import-crags — seed crag data
    import-status.get.ts # GET /api/admin/import-status — import log

/server/utils/
  ai/
    orchestrator.ts      # Tool-use loop (max 5 rounds)
    tools.ts             # 7 tool definitions + executors
    system-prompt.ts     # AI system prompt with tool selection guide
    types.ts             # ChatMessage, ToolCall, ToolDefinition types
  forecast.ts            # Open-Meteo + KV cache + freshness
  score.ts               # Region scoring + crag scoring
  regions.ts             # Sub-region catalogue (35 regions)
  crag-db.ts             # D1 database queries
  crags.ts               # Crag utilities
  dates.ts               # Weekend helpers + formatting
  distance.ts            # Haversine + drive-time approximation
  warnings.ts            # Weather warnings (red/amber thresholds)
  icons.ts               # Weather icon mapping
  server-utils.ts        # avg, sum, max helpers
  uk-crags-seed.ts       # ~100 UK crags seed data
  openbeta.ts            # OpenBeta import (unused for UK)

/migrations/
  0001_create_crags.sql  # Crags + import_log tables
  0002_add_ukc_id.sql    # UKC ID column

/worker-cron/            # Cache warming cron worker (every 2h)
```

## Deployment (Cloudflare Pages)
1. Create a Pages project. Build using standard Nuxt commands.
2. Nitro preset is already `cloudflare-pages` in `nuxt.config.ts`.
3. Bind KV with binding name `CLIMB_KV` in Pages settings.
4. Bind D1 database for crag data.
5. Workers AI binding (`[ai]`) is configured in `wrangler.toml`.
6. Deploy. All `/api/*` endpoints run in Pages Functions.

For detailed documentation see `DOCS.md`.
