# CragCast Project Plan

## Next Actions
1. Check implementation
2. Allow add to desktop
3. Testing
4. Add granularity selector buttons (Crag / Region / Area) to the initial form so users can choose the level of detail in results — requires storing lat/lng and metadata for areas and crags to support this
5. Add issue tracker (use GitHub Issues if possible)
6. Expand seed data to ~500 UK crags with lat/lng and metadata to support area/region/crag granularity

---

## Advanced Recommendations Roadmap

### Phase 1 – OpenBeta Crag Data Integration

**Goal:** Import individual crag data from [OpenBeta.io](https://openbeta.io) so the scoring system can make finer-grained recommendations at the crag level rather than only at the region level.

**Data to pull from OpenBeta:**
- Crag name, location (lat/lng)
- Aspect / orientation (N, S, E, W, etc.)
- Rock type (gritstone, limestone, slate, rhyolite, sandstone, etc.)
- Route counts and grade spread
- Climb types available (trad, sport, boulder)

**Map crags to regions:**
- Each crag is assigned to its parent region (by proximity or explicit mapping)
- Crags become sub-items of existing regions — regions remain the primary navigation unit

**UI approach — crags as subsets of regions:**
- Region cards/table rows stay as-is and remain the default view
- Add an expandable crag list within each region card (accordion/drawer)
- Each crag row shows: name, aspect, rock type, crag-level score, route count
- Crags within a region are sorted by their crag-level score
- In table view, regions can be expanded to show child crags as indented sub-rows
- Optional "All crags" flat view as a future addition if useful

**Crag-level scoring enhancements to `scoreRegion` (extend into `scoreCrag`):**
- **Aspect + temperature:** South-facing crags get a bonus on cold days (solar warming), north-facing crags get a bonus on hot days (shade). East-facing good for morning sun, west for afternoon
- **Aspect + wind direction:** Crags facing away from the prevailing wind direction score higher on windy days (sheltered)
- **Rock type + temperature:** Gritstone/sandstone friction is best in cold-to-cool temps (6–12°C). Limestone is more forgiving in warmer temps (12–18°C). Slate and smooth volcanic rock are unpleasant in the cold — penalise more heavily below 5°C
- **Exposure / shelter tags:** Exposed crags penalised more on windy days; sheltered crags less affected. Sheltered valley crags may dry slower after rain
- **Drying speed:** Exposed, windy-aspect crags score better the day after heavy rain. Sheltered, north-facing crags penalised after recent rain (stay wet longer)

**Implementation steps:**
1. Write an OpenBeta data import script (their GraphQL API or bulk data dump)
2. Create a `Crag` data model: `{ id, name, regionId, lat, lon, aspect, rock[], types, routeCount, tags[] }`
3. Store crag data in a static JSON file (or KV) — this is reference data, not frequently changing
4. Add `scoreCrag()` function that extends the region score with aspect/rock/exposure modifiers
5. Add API endpoint `GET /api/crags?regionId=x` returning scored crags for a region
6. Update `RegionCard.vue` with expandable crag list
7. Update `CompareTable.vue` with expandable crag sub-rows

### Phase 2 – MWIS & External Forecast Sources

**Goal:** Pull in Mountain Weather Information Service (MWIS) forecasts to enrich recommendations and surface relevant mountain weather context.

**Data to use:**
- MWIS area forecasts (text summaries, freezing level, cloud base, visibility)
- Map MWIS areas to CragCast regions
- Use MWIS data to improve scoring for mountain/upland regions (cloud base below crag altitude = bad, visibility warnings, freezing level info)

**Scoring impact:**
- Cloud base below crag altitude → penalty (especially for mountain crags)
- Visibility poor → small penalty
- MWIS "good day" language → small bonus

**UI:**
- Show MWIS summary text on region cards when available (collapsible)
- Link to full MWIS report
- MWIS badge/icon on regions that have mountain weather data

### Phase 3 – User Accounts & UKC Logbook Import

**Goal:** Allow users to create accounts and upload their UKC logbook so recommendations factor in personal climbing history.

**User accounts:**
- Simple auth (email/password or OAuth)
- Profile stores: home location, preferences, logbook data
- Favourites and custom crags persist to account instead of localStorage

**UKC logbook integration:**
- Upload UKC logbook CSV/export
- Parse logbook to extract: crags visited, grades climbed, styles (trad/sport/boulder), dates, star ratings
- Store parsed logbook per user

**Scoring impact from logbook:**
- **Familiarity bonus:** Crags the user has visited before get a small bonus (known approach, beta)
- **Novelty mode (optional toggle):** Invert the bonus — suggest crags the user hasn't been to
- **Grade-appropriate crags:** Boost crags where the available grades match the user's climbing range
- **Style match:** If user logs mostly trad, boost trad-heavy crags

### Phase 4 – User Preferences Form

**Goal:** Let users fill in a preferences form that persistently influences recommendations, without needing a logbook.

**Preferences to capture:**
- **Climbing type:** Trad, sport, bouldering, mountaineering, ice climbing, scrambling (multi-select with weighting)
- **Experience level:** Beginner / intermediate / advanced (affects grade-matching)
- **Grade range:** Optional min-max grade input per discipline
- **Rock type preference:** Optional preference for grit, limestone, etc.
- **Conditions preference:** E.g. "I don't mind rain" or "I prefer dry only"
- **Shelter preference:** Exposed vs sheltered
- **Willingness to walk in:** Short approach vs happy with long walk-ins

**Scoring impact:**
- Type affinity weights are applied to crags that have matching climb types
- Rock preference adds a small bonus to preferred rock types
- Condition tolerance adjusts the rain/wind penalty thresholds
- All preferences are saved to user profile (Phase 3) or localStorage (if no account)

**UI:**
- New preferences page/modal accessible from settings
- Sliders or pill-selectors for multi-select options
- "How much does this matter?" weighting per preference (low / medium / high)
- Preview: show top 3 recommendations changing in real-time as prefs are adjusted

### Phase 5 – AI Chat Interface

**Goal:** Add a conversational AI assistant that uses all the data from Phases 1–4 to answer natural-language questions about where to climb.

**Approach:**
- Chat page with a simple message interface
- AI has access to: weather forecasts, crag data, MWIS summaries, user preferences, user logbook
- Locked down to climbing/weather advisory only
- Example queries:
  - "Where should I go this weekend for sport climbing?"
  - "What's the best gritstone crag tomorrow that I haven't been to?"
  - "Is Stanage going to be dry on Saturday?"

**Implementation:**
- Feed system prompt with user prefs, top-ranked crags/regions, and current weather context
- Return structured data (crag suggestions with scores) alongside natural language
- Cache initial context per session and rate-limit API calls
- Surface MWIS info, weather warnings, and crag details inline in chat responses

---

## Bugs
- **Distance filter doesn't update UI on URL param change:** When changing distance (e.g. 120 → 60 mins), the URL updates but the displayed results don't re-filter until a hard refresh. The route watcher or computed state isn't reacting to the `maxDriveMins` query param change.
- **Filtered results flash before hiding:** When the distance filter is active, results outside the range briefly appear then disappear as the page loads. Results should never render if they fall outside the distance filter — apply the filter before/during initial render, not after.
- fix show more
- logo
