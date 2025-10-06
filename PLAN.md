# CragCast Build Plan

## Milestones
- [x] Scaffold Nuxt 3 (TypeScript, pnpm, Vite) targeting Cloudflare Pages
- [x] Cloudflare KV binding (CLIMB_KV) and wrangler config for local dev
- [x] API: /api/regions and /api/rank with 3h freshness via KV + Open-Meteo
- [x] Utilities: forecast, score, regions, dates, distance
- [x] Styling: Tailwind + Nuxt UI integration
- [x] UI Components: ModeToggle, WhenPicker, RegionCard, CompareTable, MiniChart, PlaceSearch
- [x] Composables: usePrefs, useRank
- [x] Pages: index redirect, recommend, compare with first-run flow
- [x] UKC links per region (API ukcUrl + UI buttons)
- [ ] Testing: vitest unit, cypress e2e skeleton
- [ ] Deploy: Cloudflare Pages (preset), domain cragcast.app

## Configuration & Docs
- [x] Nuxt UI theme in app.config.ts
- [x] `.env.example` and public runtime config for Google Places
- [x] README with getting started, env, commands, testing, deploy
- [x] DOCS.md with extensive details

## Notes
- Local dev uses Node 20 via nvm and pnpm. See README for commands.
- Google Places optional; fallback geocoder provided for dev.

## Next Actions
1. Add severe weather warnings
2. Add AI page with crag info
    - crag info api suggested by ai
    - MWIS
    - tell it to read UKC if possible?
    - Have it locked town to only advise on these things
    - Feed it the users prefs first
    - Plan for how to suggest crags
    - Cache initial results and rate limit




