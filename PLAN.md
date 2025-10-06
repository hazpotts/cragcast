# CragCast Build Plan

## Milestones
- [x] Scaffold Nuxt 3 (TypeScript, pnpm, Vite) targeting Cloudflare Pages
- [x] Cloudflare KV binding (CLIMB_KV) and wrangler config for local dev
- [x] API: /api/regions and /api/rank with 12h freshness via KV + Open-Meteo
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
1. Switch to get parameters in the url instead of local storage
2. Change location search to auto-complete, when user clicks result add it, remove search button, place cross hair location icon to the right of the input field to use for the browser API, remove use my location button, add hover text instead
3. Change location distance to 30 min, 1 hour, 2 hours, no limit, keep number as value, just use these options in the UI, use buttons like for when
4. Switch to pure dates for when, presets just in UI
5. Make interface maximum width 600px on recommed page, keep all results as single card on a row, hide additionals initially, with button to show
6. Add square to regions to calculate range of travel to time
7. Add Cypress e2e tests and polish UI/empty states
