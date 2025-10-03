# CragCast – Detailed Documentation

## 1. Project Setup
- Framework: Nuxt 3 (TypeScript, Vite)
- Deployment Target: Cloudflare Pages (Nitro preset `cloudflare-pages`)
- Language: TypeScript
- Package Manager: pnpm
- Node: 20 (via nvm)
- Styling: Tailwind CSS + Nuxt UI

## 2. Modes
- Recommend (`/recommend`)
  - Shows the top ranked region as a hero card
  - Below, shows runner‑ups (compact cards)
- Compare (`/compare`)
  - Responsive table/grid of all regions
  - Columns: Region, Score, Rain, Wind, Temp, Distance, Updated
  - Sorting: Score (default), Distance
  - Toggle in header via `ModeToggle.vue` and persisted in `localStorage` (`mode`)

## 3. First‑Run Flow
Prompts:
1) Where? Use my location (Geolocation API) or search via Google Places (optional; fallback to OSM).
2) Max distance (slider, default 120 minutes).
3) When? Presets: Today, Tomorrow, This weekend, Next weekend (default), Custom.
4) Climbing type (optional): Trad, Sport, Boulder, Any (default).

Stored in `localStorage` under `climb.prefs.*` via `usePrefs.ts`.

## 4. API Endpoints
- `GET /api/regions` – returns static region catalogue
- `GET /api/rank` – params: `lat, lon, maxDriveMins, climbType, dates=YYYY-MM-DD[,YYYY-MM-DD]`
  - Returns sorted list with: `id, name, score, why[], mini{...}, distanceMins, updatedAt, typeAffinity?`
  - Enforces ≤12h freshness via `server/utils/forecast.ts`

## 5. Data Sources
- Weather: Open‑Meteo (keyless)
- Cache: Cloudflare KV (binding `CLIMB_KV`)
  - Cache key per location × date(s)
  - Store ~3h, enforce ≤12h freshness; refetch if stale
- Regions: Static list in `server/utils/regions.ts`

## 6. Scoring Algorithm
Implemented in `server/utils/score.ts`.
- Dryness (40%): penalise rain (mm) + precipitation probability
- Wind (25%): penalise average >25 mph, gusts >30 mph
- Temperature/friction (20%): grit 6–12 °C, limestone 12–18 °C
- Cloud (5–10%): sun aids drying, shade helps in heat
- Distance decay: multiplier fades beyond `maxDriveMins`
- Type affinity: mild multiplier 0.9–1.0
- Output: 0–100 and up to 3 “why” bullet points

## 7. File Structure
```
/server/api/
  rank.get.ts
  regions.get.ts
/server/utils/
  forecast.ts
  score.ts
  regions.ts
  dates.ts
  distance.ts
/app/components/
  ModeToggle.vue
  WhenPicker.vue
  RegionCard.vue
  CompareTable.vue
  MiniChart.vue
  PlaceSearch.vue
/app/composables/
  usePrefs.ts
  useRank.ts
/pages/
  index.vue
  recommend.vue
  compare.vue
```

## 8. UI Details
- Recommend
  - Hero card with top region (score, 3 reasons, mini charts, updatedAt)
  - Runner‑ups as compact cards below
- Compare
  - Grid/table with mini bar‑spark charts for rain, wind, temp

## 9. Testing
- Unit (Vitest): `score.ts` basics, `dates.ts` helpers
- E2E (Cypress): add tests for first‑run prompts, recommend top pick, compare table, freshness

## 10. Deployment (Cloudflare Pages)
- Nitro preset `cloudflare-pages` is configured in `nuxt.config.ts`
- KV binding `CLIMB_KV` must be added in Pages project settings
- All `/api/*` endpoints run in Pages Functions

## 11. Configuration and Environment
- `.env.example` defines public environment variables used client‑side:
  - `NUXT_PUBLIC_GOOGLE_PLACES_ENABLED` (0/1)
  - `NUXT_PUBLIC_GOOGLE_PLACES_API_KEY`
- `nuxt.config.ts` reads these via `runtimeConfig.public.*`
- When Places is disabled, `PlaceSearch.vue` falls back to OSM/Nominatim

## 12. Notes
- British English copy and labels (“Where?”). Short, action‑oriented wording.
- No login or accounts.
- Default view is recommendation for next weekend.
