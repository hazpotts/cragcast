# CragCast Project Plan

## Next Actions
1. Expand seed data to ~500 UK crags with lat/lng and metadata
2. Add granularity selector buttons (Crag / Region / Area) to the initial form
3. Add issue tracker (use GitHub Issues if possible)
4. Allow add to desktop (PWA)
5. Improve AI chat reliability (model quality, error recovery, streaming)

---

## Advanced Recommendations Roadmap

### Phase 1 – Crag Data Integration ✅ DONE

**Goal:** Import individual crag data so the scoring system can make finer-grained recommendations at the crag level rather than only at the region level.

**What was built:**
- D1 database schema (`migrations/0001_create_crags.sql`, `0002_add_ukc_id.sql`) with `crags` and `import_log` tables
- Crag data model: `{ id, name, regionId, lat, lon, aspect, rock[], types: {trad, sport, boulder}, routeCount, tags[], ukcId }`
- Admin import endpoint (`POST /api/admin/import-crags`) with auth, batch processing, UPSERT
- Crags auto-assigned to closest region by haversine distance
- `scoreCrag()` function with aspect+temp, aspect+wind, exposure/shelter, drying speed modifiers
- `GET /api/crags?regionId=x` endpoint returning scored crags with distance
- Expandable crag list in `RegionCard.vue` (accordion) and `CompareTable.vue` (indented sub-rows)
- `CragList.vue` component showing name, score, aspect, rock types, route count, climb types, modifiers, UKC link

**Remaining work:**
- Expand seed data from ~100 to ~500 UK crags

### Phase 2 – MWIS & External Forecast Sources (Partial)

**Goal:** Pull in Mountain Weather Information Service forecasts to enrich recommendations.

**What was built:**
- MWIS HTML scraping tool for the AI chat (`get_mwis_forecast` in tools.ts)
- Covers 9 UK mountain areas (Lake District, Snowdonia, Peak District, etc.)
- Extracts: summary text, freezing level, cloud base, summit winds, visibility

**Remaining work:**
- Cron-based MWIS ingestion (currently fetched on-demand by AI)
- MWIS data in KV cache for use by scoring engine
- MWIS badge/icon on region cards
- Scoring impact: cloud base below crag altitude, visibility penalties

### Phase 3 – User Accounts & UKC Logbook Import

**Goal:** Allow users to create accounts and upload their UKC logbook so recommendations factor in personal climbing history.

**User accounts:**
- Simple auth (email/password or OAuth)
- Profile stores: home location, preferences, logbook data
- Favourites and custom crags persist to account instead of localStorage

**UKC logbook integration:**
- Upload UKC logbook CSV/export
- Parse logbook to extract: crags visited, grades climbed, styles, dates, star ratings
- Store parsed logbook per user

**Scoring impact from logbook:**
- **Familiarity bonus:** Crags the user has visited before get a small bonus
- **Novelty mode (optional toggle):** Suggest crags the user hasn't been to
- **Grade-appropriate crags:** Boost crags where available grades match user's range
- **Style match:** If user logs mostly trad, boost trad-heavy crags

### Phase 4 – User Preferences Form

**Goal:** Let users fill in a preferences form that persistently influences recommendations.

**Preferences to capture:**
- Climbing type (multi-select with weighting)
- Experience level: Beginner / intermediate / advanced
- Grade range per discipline
- Rock type preference
- Conditions tolerance (rain/wind)
- Shelter preference
- Willingness to walk in

### Phase 5 – AI Chat Interface ✅ DONE

**Goal:** Add a conversational AI assistant that uses weather, crag, and region data to answer natural-language questions about where to climb.

**What was built:**
- Chat page (`/chat`) with streaming message interface
- AI orchestrator with tool-use loop (max 5 rounds per turn)
- 7 tools: `lookup_crag`, `get_crag_score`, `get_weather_forecast`, `search_crags`, `rank_regions`, `get_region_info`, `get_mwis_forecast`
- System prompt with tool selection guide (picks simplest tool for each question type)
- SSE streaming with token, tool_call, done, error events
- `useChat.ts` composable managing message state and SSE parsing
- Climbing-themed thinking phrases cycling every 5s while loading
- Tool call indicators in the UI
- Suggested prompts for first-time users
- `ChatMessage.vue` with bouncing dot animation and tool indicators
- `ChatInput.vue` text input bar

**Remaining work:**
- Improve Llama model reliability (error recovery, refusal handling)
- Inject user preferences/location from `usePrefs` as context
- Rate limiting (planned but not yet implemented)
- Session persistence (currently in-memory only)

---

## Bugs
- ✅ **Distance filter doesn't update UI on URL param change:** Fixed — removed the `showPrefs` guard from the route watcher.
- ✅ **Filtered results flash before hiding:** Fixed — stale items are cleared immediately when the route query changes.
