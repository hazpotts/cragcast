# CragCast: prompt engineering, climbing science, and data source playbook

**CragCast can become a significantly more reliable and useful climbing advisor by combining three improvements: a restructured system prompt using ReAct-style reasoning with Llama 3.3 70B, deep rock-type weather logic baked into its knowledge layer, and integration of at least four free UK data APIs that fill critical gaps around rainfall, tides, soil moisture, and Scottish avalanche conditions.** This report synthesizes current best practices across all three domains — AI orchestration, climbing science, and open data — into actionable guidance for the app's next iteration.

---

## Part 1: Prompt engineering for reliable tool orchestration

### System prompt architecture that works with Llama 3.3 70B

The research consensus for tool-calling LLMs converges on a **seven-section system prompt structure**: role and identity, available tools with descriptions, tool selection rules, output format rules, reasoning instructions, edge case handling, and response formatting. This structure maps directly to how Llama 3.3 70B was trained — Meta's own documentation uses a similar pattern for zero-shot function calling.

The most important finding from production benchmarks is that **Llama 3.1/3.3 70B actually outperforms both the 405B model and GPT-4o on tool calling accuracy** in Braintrust's tests, with zero parsing errors (compared to 12/60 for the 8B model). The 70B size is the sweet spot — large enough for reliable tool selection, small enough for Cloudflare Workers AI inference. CragCast's choice of model is well-validated.

For a 7-tool system, explicit routing rules in the system prompt are essential. Rather than relying on the model to infer which tool to use from descriptions alone, state it directly: "For weather queries at a specific crag, use `get_weather_forecast`. For comparing regions, use `rank_regions` first." OpenAI's own function-calling documentation (applicable to the pattern, if not the model) emphasizes that "adding guidance in the system prompt about when and how to use tools may seem repetitive but helps the LLM make better decisions, especially with multiple tools." Research shows accuracy drops significantly beyond 10–15 tools, so CragCast's 7-tool set is safely within the reliable range.

### Tool descriptions are load-bearing infrastructure

Tool descriptions should be treated as **API contracts, not casual summaries**. The OpaqueToolsBench research demonstrates that poor tool descriptions are the single largest source of tool-calling failures — models cannot select the right tool if descriptions are ambiguous or incomplete.

A good tool description for CragCast includes four elements: purpose (what it does), trigger conditions (when to use it), return format (what data comes back), and constraints (what it cannot do or when not to use it). For example:

- ❌ Bad: `"description": "Get weather data"`
- ✅ Good: `"description": "Fetch hourly weather forecast for a UK climbing location over the next 48 hours. Returns temperature, wind speed/direction, precipitation probability, humidity, and cloud cover as JSON. Use when the user asks about current or near-future weather at a specific crag or region. Requires a valid crag name or region identifier from the database. Do NOT use for historical weather — only forecasts."`

Parameter descriptions should include format hints and examples (`"The crag name exactly as stored in the database, e.g. 'stanage_popular'"`), and **enum constraints** where possible to prevent the model from fabricating parameter values. Mark required parameters explicitly.

### Chain-of-thought before tool selection dramatically improves accuracy

The ReAct pattern (Reasoning + Acting) from Yao et al. remains the gold standard for tool-using agents. The core principle: **make the model think out loud before every tool call**. In practice, this means adding a prompt instruction like:

> *Before calling any tool: (1) identify what information the user needs, (2) determine which tool provides it, (3) if multiple tools are needed, plan the order. After receiving results: verify the data makes sense, then synthesize a helpful response.*

This planning step is "the difference between an agent that picks the right tool 60% of the time and one that picks it 85% of the time," according to production benchmarks. Chain-of-thought benefits are proportional to model size, and **70B models benefit significantly**. For CragCast, this could mean the difference between correctly chaining `lookup_crag` → `get_weather_forecast` → `get_crag_score` versus calling `get_weather_forecast` with a made-up crag name.

### Preventing hallucination in the tool-calling loop

Research from arXiv (2412.04141) identifies two categories of tool hallucination: **selection hallucination** (calling the wrong tool, a non-existent tool, or a tool at the wrong time) and **usage hallucination** (incorrect parameters, fabricated parameters, wrong types). Both increase with tool count and with tool description similarity.

The most effective prevention strategies for CragCast:

- **Explicit negative instructions**: "ONLY use the tools listed above. Do NOT invent tools that don't exist. If you cannot answer with available tools, say so."
- **Temperature zero**: Set `temperature: 0` for all tool-calling inference to maximize determinism. This is critical for Llama models.
- **Output validation**: Instruct the model to verify tool results before presenting them — "After receiving tool results, check that the data makes sense before presenting it to the user. If a tool returns an error, explain the issue rather than fabricating data."
- **Bounded loops**: Set `maxSteps: 5` in the orchestration loop to prevent infinite tool-calling cycles. A typical CragCast query should need 1–3 tool calls.
- **No-tool option**: Explicitly tell the model that some queries can be answered from general climbing knowledge without tool calls — "Only call a tool when you need real-time or location-specific data."

### Multi-turn tool result injection on Cloudflare Workers

For Cloudflare Workers AI, the canonical loop is: send user message + tool definitions → LLM responds with tool_calls → execute tool locally → append result as `tool` role message → send back to LLM for synthesis. Cloudflare's `@cloudflare/ai-utils` package with `runWithTools()` handles this automatically, including the message threading.

Llama 3.x natively uses the `ipython` role for tool results, but Cloudflare's OpenAI-compatible API abstracts this to the standard `tool` role. **Always include the full conversation history** in each inference call so the model has context about what it already retrieved. After each tool result, let the model reason about what it learned before deciding the next action — this prevents the common failure mode of calling multiple tools in sequence without synthesizing intermediate results.

### Handling edge cases and ambiguous queries

The SAGE-Agent research (2025) found that LLM agents with tool-calling capabilities "often fail when user instructions are ambiguous or incomplete." For CragCast, "Is Stanage good tomorrow?" is ambiguous — does the user want weather, rock conditions, crowd levels, or a holistic recommendation? The prompt should instruct the model to either make reasonable assumptions (prefer holistic condition assessment) or ask a focused clarifying question.

Key edge case instructions for the system prompt:

- **Out-of-scope**: "You are a UK rock climbing conditions assistant. For non-climbing or non-UK queries, politely explain your scope."
- **Tool failures**: "If a tool returns an error, tell the user and suggest checking back later. Never fabricate conditions data."
- **Ambiguity resolution**: "For vague location references, assume the most popular UK climbing interpretation. For 'Stanage', default to Stanage Popular End."
- **Safety-first defaults**: "When conditions data is uncertain, err on the side of caution in your recommendation."

---

## Part 2: UK climbing science for smarter condition predictions

### How rock types respond to weather — the core logic CragCast needs

The relationship between rock type and weather is the most critical domain knowledge for CragCast. Each UK rock type has fundamentally different moisture behavior, and getting this wrong means dangerous recommendations.

**Gritstone** is porous and absorbs water into its microstructure. South-facing slabs can dry in 2 hours, but north-facing crack systems may take days. The widely-cited rule of thumb is **48 hours of dry weather minimum** for reliable conditions. Wind and sun exposure matter as much as time. The critical insight for CragCast: gritstone friction is temperature-dependent. Approximately **30% more grip at 0°C versus 20°C**, with an optimal temperature around **5°C** and friction noticeably deteriorating above 15°C. This happens because cold temperatures trap moisture within the rock's micropores, preventing it from lubricating the surface. Above 80% relative humidity, gritstone becomes greasy regardless of whether it has rained. The "gritstone season" runs October through April — CragCast should weight temperature and humidity heavily in gritstone crag scores.

**Limestone** behaves oppositely — it is not porous, so the surface itself dries quickly (sometimes within minutes of sun returning). The critical factor is **seepage through cracks and bedding planes** from water-catchment areas above. Crags below moorland or fields can seep for days. However, steep and overhanging limestone (like Malham Cove's central section) can remain dry even during rain, making it climbable year-round. CragCast should distinguish between exposed limestone (quick surface dry, variable seepage) and overhanging venues (often rideable through rain). Limestone is primarily a summer rock in the UK, with polished holds becoming dangerously slippery in cold, damp conditions.

**Sandstone** — particularly southern English sandstone at Harrison's Rocks and similar venues — is **extremely fragile when wet**. The outer layer can dry in a breeze while the interior remains dangerously weak, and holds snap without warning. The BMC advises "multiple days of dry weather in a row" before climbing, and many southern sandstone crags effectively close in winter. CragCast should display strong warnings and potentially block positive recommendations for southern sandstone after recent rainfall. Torridon sandstone in Scotland is notably more resilient.

**Slate** in the Welsh quarries is the opposite extreme — virtually impervious to water, it **dries within an hour of rainfall**. The Dinorwig quarries are the UK's premier wet-weather climbing option. However, slate offers minimal friction; climbing relies on precise footwork on edges rather than smearing. CragCast should flag slate quarries as wet-weather alternatives when other venues are out of condition.

**Granite** (Cornwall, Scotland) has low porosity and dries quickly when wind and sun-exposed — Bosigran "dries miraculously." However, granite suffers from **morning condensation**, especially on smooth faces. Raven Wall at Bosigran becomes "oiled soap" in morning moisture and should be recommended for sunny afternoons. **Rhyolite** mountain crags in Snowdonia seep for extended periods when vegetation above is saturated, typically needing an extended dry spell (3–7 days) in July/August to come into condition.

### Seasonal patterns every recommendation should reflect

CragCast's recommendations should align with well-established seasonal rhythms. **Autumn/winter/spring (October–April)** is gritstone season — cold, dry days with low humidity produce the legendary friction that draws boulderers to the Peak District. **Summer (June–August)** is the time for mountain crags (Cloggy, Idwal), sea cliffs (Pembroke, Gogarth), and sustained limestone sport climbing. **Scottish winter climbing** runs December to March, with mixed routes potentially forming as early as November and snow gullies lasting into late April — conditions are "notoriously fickle" and SAIS forecasts are essential.

North Wales follows a layered pattern: mountain crags need extended dry spells in high summer, sea cliffs (Gogarth) work spring through autumn with tide and bird-ban awareness, the slate quarries function year-round, and Tremadog ("it's always sunny there") often provides dry rock when the mountains are in cloud. Cornwall and Dorset benefit from milder climate and can produce good conditions year-round, with spring through early autumn as peak.

### Tidal crags demand dedicated logic

CragCast must integrate tide awareness for a significant number of UK venues. **Pembroke** has extensive tidal crags with a spring tide range of up to 8 metres — routes are accessed by abseil and climbed out, meaning a rising tide can cut off retreat. **Gogarth on Anglesey** has complex tidal complications; the general rule is "accessible 3 hours either side of low tide" past the Pinnacle. An additional Gogarth hazard is the **Holyhead–Dublin ferry wake** passing North Stack headland at approximately 10:30, 13:15, and 19:30, causing violent water disturbance especially at low tide. Swanage, Portland, parts of the Gower, Lower Pen Trwyn, and Cornwall's Bosigran Ridge all have tidal access considerations. Spring tides (near full/new moon) produce the largest ranges and fastest water movement and are the most dangerous.

### Wind thresholds and the importance of aspect

Wind speed guidance for CragCast should use concrete thresholds: **below 16 km/h (10 mph)** is comfortable everywhere; **16–32 km/h** is noticeable but manageable at sheltered venues; **32–48 km/h** makes exposed crags like Stanage unpleasant with difficult rope management; **above 48 km/h** is genuinely dangerous, with mobility seriously compromised. Above 64 km/h, climbing should not be recommended. Crag aspect relative to wind direction transforms conditions — a west wind makes west-facing sea cliffs wild while east-facing crags become sheltered suntraps. One climber reports climbing in a t-shirt in February on west-facing Gogarth cliffs during an easterly wind. CragCast should cross-reference wind direction with each crag's aspect to produce meaningful shelter estimates.

### Mountain weather diverges dramatically from lowland forecasts

Temperature drops approximately **1°C per 150 metres of altitude gain**. Wind speeds on exposed summits can be 60 mph when valleys see 20 mph. Snowdon's summit receives 3.7 metres of rain annually versus roughly 1 metre at Conwy just 30 km away. MWIS forecasts cover 10 UK mountain areas and provide cloud base, freezing level, and wind speeds at elevation — data that standard weather APIs completely miss. CragCast already uses MWIS, but should weight it heavily for upland crags (above ~400m) and clearly communicate to users when mountain and valley conditions diverge. Temperature inversions, orographic rainfall enhancement on western slopes, and rain shadow effects on eastern slopes all create exploitable micro-conditions that CragCast can surface — for instance, suggesting east-facing crags like Castle Inn Quarry when weather systems approach from the west.

### Seepage prediction depends on crag geometry and catchment

**Overhanging crags dry fastest** and may stay dry during rain — this is the single most useful geometric indicator. Vertical faces dry faster than slabs, which collect and hold water. The factor that causes prolonged seepage is the **catchment area above the crag**: moorland, fields, or dense vegetation above a cliff percolate water through geological features for days. Sea cliffs generally dry in 2–3 hours to 2 days, aided by wind exposure. Slate dries in under an hour. Mountain crags with vegetated catchments above (Cloggy being the archetype) may need 3–7 days of dry weather. The porous sandstones need 48+ hours. CragCast should ideally tag each crag with geometry (overhanging/vertical/slab), aspect, altitude, and whether it has significant catchment above to generate meaningful drying-time estimates.

---

## Part 3: Data sources and APIs to fill CragCast's gaps

### Three free APIs that should be integrated immediately

**The Environment Agency Rainfall API** (`environment.data.gov.uk/flood-monitoring/doc/rainfall`) provides real-time rainfall measurements from approximately 1,000 rain gauges across England at 15-minute resolution. It requires **no API key, no registration**, and is completely free under the Open Government Licence. CragCast can map the nearest rain gauge to each crag and answer "has it actually rained here today?" — the single most important input for rock condition prediction. This is the highest-value, lowest-effort integration available.

**The ADMIRALTY Tidal API** (`developer.admiralty.co.uk`) offers predicted high/low water times and heights for 607 UK coastal stations. The free Discovery tier provides **10,000 requests per month** with 7-day forecasts — more than sufficient for a climbing app. Registration provides an API key passed as a header. A Python wrapper (`ukhotides`) exists on GitHub. For the ~50+ tidal crags in CragCast's database, this transforms tidal safety from "check a tide table website" to in-app automated warnings. This should be complemented by the **Environment Agency Tide Gauge API** (`environment.data.gov.uk/flood-monitoring/doc/tidegauge`), which provides real-time actual tide levels from ~43 gauges — useful for detecting storm surge deviations from predicted tides.

**Open-Meteo's UKMO model option** may already be available to CragCast. Open-Meteo ingests the Met Office UKV 2km deterministic model and serves it through its standard API. If CragCast specifies the UKMO model for UK queries, it gets Met Office-quality **2km resolution** forecasts with zero additional integration — just a parameter change.

### Medium-term integrations with strong value

**The Met Office DataHub** (`datahub.metoffice.gov.uk`) provides site-specific hourly, 3-hourly, and daily forecasts via GeoJSON for any lat/lon coordinate. The free tier allows **360 API calls per day** — enough for CragCast's needs. This complements Open-Meteo with official Met Office data and parameters like visibility and fog probability that matter for mountain crags.

**Met Office UK Composite Radar on AWS** (`registry.opendata.aws/met-office-uk-radar-observations/`) delivers real-time rainfall radar imagery in HDF5 format, updated every 15 minutes, completely free under CC BY-SA. Processing HDF5 requires server-side computation, but this enables a "is it raining at my crag right now?" feature with 1km resolution — transformative for same-day climbing decisions.

**COSMOS-UK** (`cosmos.ceh.ac.uk`) provides near-real-time soil moisture data from 51 stations across the UK under the Open Government Licence, free with no registration. Soil moisture is a direct proxy for boggy approach conditions and overall ground saturation affecting seepage. CragCast could map the nearest COSMOS station to each crag area and display an "approach bogginess" indicator — especially valuable for Peak District moorland, Scottish mountain approaches, and any crag with a long walk-in.

**OpenBeta's GraphQL API** (`api.openbeta.io`) provides climbing area hierarchies, route data, grades (including British grades), coordinates, and climb counts — all under a **CC0 public domain licence**. This is the only large-scale CC0-licensed climbing database, making it ideal for enriching CragCast's crag data with route counts, grade distributions, and supplementary location data without legal risk. It does not have any UK locations at present though, so can only be used when choosing to support the US and other countries.

### Scottish winter climbing needs SAIS integration

The Scottish Avalanche Information Service (`sais.gov.uk`) publishes daily avalanche hazard forecasts for 6 regions (Lochaber, Glencoe, Creag Meagaidh, Northern Cairngorms, Southern Cairngorms, Torridon) with hazard levels 1–5, stability narratives, and aspect/altitude danger roses. **No formal API exists**, but SAIS is a member of the European Avalanche Warning Services (EAWS), which uses the standardized CAAMLv6/JSON format — undocumented endpoints may exist. At minimum, CragCast should link directly to SAIS forecasts for any Scottish winter climbing query. A more ambitious approach would involve scraping structured data from region pages or approaching SAIS about a data-sharing arrangement.

### Data sources that are valuable but access-restricted

**UKClimbing** hosts 593,602 routes across 2,538 crags and has dedicated conditions pages showing recent ascents that effectively report climbability — but its API is **closed with no plans to open**. The conditions data (`ukclimbing.com/logbook/conditions/`) is the gold standard for UK climbing conditions. CragCast should either pursue a formal data partnership or simply link users to UKC conditions pages for crags of interest.

**theCrag.com** has a documented API (`thecrag.com/en/article/api`) covering 90,000+ crags and 917,000+ routes worldwide, but access **requires a signed legal agreement** and they only support "the most promising project ideas." Caching restrictions make it impractical for server-side use. Worth approaching with a partnership proposal, but not reliable as a primary data source.

**Mountain Project's API was deprecated** after the onX acquisition and is not usable.

### Building CragCast's unique data advantage

Since no existing API provides structured, real-time climbing condition reports, CragCast should build its own **crowd-sourced condition reporting layer**. A simple interface — "How is [Crag X] today?" with options like Dry / Damp / Wet / Seepage / Unclimbable, plus optional photo upload — would create a unique dataset that no competitor has. Over time, this community data combined with weather history could train predictive models for drying times specific to each crag.

Additional supplementary sources worth integrating include **OpenStreetMap climbing data** (ODbL licence, useful for approach paths and parking locations via the Overpass API), curated **webcam links** from MWIS and climbing community compilations mapped to crag areas, and the **RainViewer API** (`rainviewer.com/api.html`) for easy-to-integrate radar map tile overlays showing real-time precipitation.

### Priority integration roadmap

| Priority | Source | Auth required | Effort | Key endpoint |
|----------|--------|--------------|--------|-------------|
| Critical | EA Rainfall API | None | Very low | `environment.data.gov.uk/flood-monitoring/id/stations?parameter=rainfall` |
| Critical | ADMIRALTY Tidal API | API key (free) | Low | `admiraltyapi.azure-api.net/uktidalapi/api/V1/Stations/{id}/TidalEvents` |
| Critical | Open-Meteo UKMO model | Already in use | None | Add `&models=ukmo_seamless` parameter |
| High | Met Office DataHub | API key (free) | Medium | `datahub.metoffice.gov.uk` |
| High | EA Tide Gauge (real-time) | None | Low | `environment.data.gov.uk/flood-monitoring/id/stations?type=TideGauge` |
| High | COSMOS-UK soil moisture | None | Medium | `cosmos-api.ceh.ac.uk` |
| High | OpenBeta GraphQL | None | Medium | `api.openbeta.io` |
| Medium | Met Office Radar (AWS) | None | High | `registry.opendata.aws/met-office-uk-radar-observations/` |
| Medium | SAIS avalanche data | None (scrape) | Medium-high | `sais.gov.uk/{region}/` |

---

## Conclusion: where these three threads converge

The most impactful improvements to CragCast sit at the intersection of all three research areas. A system prompt that encodes rock-type weather logic — knowing that slate dries in an hour, sandstone needs days, and gritstone friction peaks at 5°C — enables the LLM to give qualitatively better recommendations even without additional tool calls. Integrating the EA Rainfall API and ADMIRALTY Tidal API fills the two largest safety-critical data gaps (recent precipitation for rock condition prediction, and tide times for coastal crag access) with minimal development effort and zero cost. And structuring the prompt with explicit tool routing rules, chain-of-thought reasoning instructions, and bounded orchestration loops will make Llama 3.3 70B's tool selection as reliable as possible across CragCast's 7-tool set.

The unique long-term opportunity is building a crowd-sourced condition reporting feature. No existing API provides structured, real-time UK crag conditions — the data simply does not exist in machine-readable form. CragCast can create this dataset, correlate it with weather history and soil moisture, and eventually predict conditions rather than just reporting them. That prediction engine, combining the climbing domain knowledge documented above with the environmental data APIs identified here, would make CragCast genuinely indispensable to UK climbers.