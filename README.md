# CragCast – UK climbing conditions (Nuxt 3 + Cloudflare Pages)

CragCast is a UK‑wide climbing conditions app with two modes: Recommend and Compare. It fetches weather from Open‑Meteo, caches forecasts in Cloudflare KV, and ranks sub‑regions by climbability.

## Overview
- Nuxt 3 (TypeScript, Vite) • Node 20 • pnpm
- Cloudflare Pages Functions (Nitro preset: `cloudflare-pages`)
- Tailwind CSS + Nuxt UI for the interface
- Weather: Open‑Meteo (keyless), cache via Cloudflare KV

## Quick start
```bash
# Ensure Node 20 and pnpm
nvm use || nvm install 20
corepack enable && corepack prepare pnpm@9.0.0 --activate

# Install and run
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
- Set `NUXT_PUBLIC_GOOGLE_PLACES_ENABLED=1` and provide a browser‑restricted key to enable Google Places search. Otherwise, a minimal OSM/Nominatim fallback is used.

## Commands
- `pnpm dev` – Start Nuxt dev server
- `pnpm build` – Production build (Cloudflare Pages)
- `pnpm preview` – Preview the production build
- `pnpm test` – Run all tests (Vitest)
- `pnpm test:unit` – Unit tests only
- `pnpm test:e2e` – Cypress (skeleton)

## Testing
- Unit (Vitest): scoring and date helpers
- E2E (Cypress): skeleton present; add flows for first‑run prompts, top recommendation, compare table, and freshness enforcement

## Structure
```
/server/api/
  rank.get.ts      # GET /api/rank – scoring + freshness
  regions.get.ts   # GET /api/regions – static catalogue
/server/utils/
  forecast.ts      # Open‑Meteo + KV cache + ≤12h freshness
  score.ts         # scoring algorithm
  regions.ts       # sub‑region catalogue
  dates.ts         # weekend helpers + formatting
  distance.ts      # haversine + drive‑time approximation
/app/components/   # ModeToggle, WhenPicker, RegionCard, CompareTable, MiniChart, PlaceSearch
/app/composables/  # usePrefs (localStorage), useRank (fetch /api/rank)
/pages/            # index redirect, recommend, compare
```

## Deployment (Cloudflare Pages)
1. Create a Pages project. Build using standard Nuxt commands.
2. Nitro preset is already `cloudflare-pages` in `nuxt.config.ts`.
3. Bind KV with binding name `CLIMB_KV` in Pages settings.
4. Deploy. All `/api/*` endpoints run in Pages Functions.

For a deeper explanation of modes, scoring, data sources, and API, see `DOCS.md`.