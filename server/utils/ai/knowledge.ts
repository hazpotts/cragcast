/**
 * Climbing knowledge chunks for RAG retrieval.
 *
 * Each chunk is a semantically coherent piece of climbing science
 * from the RESEARCH.md Part 2. These get embedded and stored in
 * Vectorize so the orchestrator can retrieve relevant context
 * based on the user's query and tool results.
 *
 * Chunks are tagged with categories so we can filter by relevance.
 */

export type KnowledgeChunk = {
  id: string
  text: string
  tags: string[]
}

export const knowledgeChunks: KnowledgeChunk[] = [
  // --- Rock type behaviour ---
  {
    id: 'rock-gritstone',
    tags: ['rock-type', 'gritstone', 'grit', 'drying', 'friction', 'temperature'],
    text: `Gritstone is porous and absorbs water into its microstructure. South-facing slabs can dry in 2 hours, but north-facing crack systems may take days. The rule of thumb is 48 hours of dry weather minimum for reliable conditions. Wind and sun exposure matter as much as time. Gritstone friction is temperature-dependent: approximately 30% more grip at 0°C versus 20°C, with optimal temperature around 5°C and friction noticeably deteriorating above 15°C. This happens because cold temperatures trap moisture within the rock's micropores, preventing it from lubricating the surface. Above 80% relative humidity, gritstone becomes greasy regardless of whether it has rained. The "gritstone season" runs October through April. CragCast should weight temperature and humidity heavily in gritstone crag scores.`
  },
  {
    id: 'rock-limestone',
    tags: ['rock-type', 'limestone', 'drying', 'seepage'],
    text: `Limestone is not porous, so the surface itself dries quickly — sometimes within minutes of sun returning. The critical factor is seepage through cracks and bedding planes from water-catchment areas above. Crags below moorland or fields can seep for days. However, steep and overhanging limestone (like Malham Cove's central section) can remain dry even during rain, making it climbable year-round. Distinguish between exposed limestone (quick surface dry, variable seepage) and overhanging venues (often rideable through rain). Limestone is primarily a summer rock in the UK, with polished holds becoming dangerously slippery in cold, damp conditions.`
  },
  {
    id: 'rock-sandstone',
    tags: ['rock-type', 'sandstone', 'drying', 'safety', 'fragile'],
    text: `Southern English sandstone at Harrison's Rocks and similar venues is extremely fragile when wet. The outer layer can dry in a breeze while the interior remains dangerously weak, and holds snap without warning. The BMC advises multiple days of dry weather in a row before climbing, and many southern sandstone crags effectively close in winter. CragCast should display strong warnings and potentially block positive recommendations for southern sandstone after recent rainfall. Torridon sandstone in Scotland is notably more resilient and behaves differently.`
  },
  {
    id: 'rock-slate',
    tags: ['rock-type', 'slate', 'drying', 'wet-weather'],
    text: `Slate in the Welsh quarries (Dinorwig and similar) is virtually impervious to water and dries within an hour of rainfall. The Dinorwig quarries are the UK's premier wet-weather climbing option. However, slate offers minimal friction — climbing relies on precise footwork on edges rather than smearing. Slate quarries should be flagged as wet-weather alternatives when other venues are out of condition.`
  },
  {
    id: 'rock-granite',
    tags: ['rock-type', 'granite', 'drying', 'condensation'],
    text: `Granite in Cornwall and Scotland has low porosity and dries quickly when wind and sun-exposed — Bosigran "dries miraculously." However, granite suffers from morning condensation, especially on smooth faces. Raven Wall at Bosigran becomes "oiled soap" in morning moisture and should be recommended for sunny afternoons rather than early mornings. Granite is generally a reliable rock type for drying but watch for condensation on cold mornings.`
  },
  {
    id: 'rock-rhyolite',
    tags: ['rock-type', 'rhyolite', 'drying', 'seepage', 'mountain'],
    text: `Rhyolite mountain crags in Snowdonia seep for extended periods when vegetation above is saturated, typically needing an extended dry spell of 3 to 7 days in July and August to come into condition. This is because water percolates through the vegetated catchment areas above the crags. Rhyolite crags like Clogwyn Du'r Arddu (Cloggy) and the Idwal Slabs require patience and are best in sustained dry spells during high summer.`
  },

  // --- Seasonal patterns ---
  {
    id: 'season-gritstone',
    tags: ['season', 'gritstone', 'grit', 'autumn', 'winter', 'spring'],
    text: `The gritstone season runs October through April. Cold, dry days with low humidity produce the legendary friction that draws boulderers to the Peak District. This is when conditions are optimal for gritstone — cool temperatures maximise grip. Summer gritstone tends to be greasy and humid. The best gritstone days are crisp, cold, and dry with a light breeze.`
  },
  {
    id: 'season-summer',
    tags: ['season', 'summer', 'mountain', 'sea-cliff', 'limestone'],
    text: `Summer (June to August) is the time for mountain crags (Cloggy, Idwal), sea cliffs (Pembroke, Gogarth), and sustained limestone sport climbing. Mountain crags need extended dry spells to come into condition. Sea cliffs benefit from longer daylight hours and warmer temperatures for comfortable climbing. Limestone sport climbing venues like the Peak District limestone edges and Portland are at their best in summer warmth.`
  },
  {
    id: 'season-scottish-winter',
    tags: ['season', 'winter', 'scotland', 'scottish', 'ice', 'mixed'],
    text: `Scottish winter climbing runs December to March, with mixed routes potentially forming as early as November and snow gullies lasting into late April. Conditions are notoriously fickle and SAIS (Scottish Avalanche Information Service) forecasts are essential. The key factors are freezing level, snow consolidation, and wind direction. Scottish winter climbing requires specific skills and equipment and conditions can change rapidly.`
  },
  {
    id: 'season-north-wales',
    tags: ['season', 'north-wales', 'nwales', 'snowdonia', 'slate', 'mountain', 'sea-cliff'],
    text: `North Wales follows a layered pattern: mountain crags need extended dry spells in high summer, sea cliffs (Gogarth) work spring through autumn with tide and bird-ban awareness, the slate quarries function year-round as wet-weather alternatives, and Tremadog is often described as "it's always sunny there" — it often provides dry rock when the mountains are in cloud. Plan North Wales trips with fallback options at different altitudes.`
  },

  // --- Tidal crags ---
  {
    id: 'tidal-general',
    tags: ['tidal', 'sea-cliff', 'safety', 'tide'],
    text: `Many UK sea cliffs have tidal access restrictions. Spring tides (near full and new moon) produce the largest ranges and fastest water movement and are the most dangerous. A spring tide range can be up to 8 metres at some venues. Routes at tidal crags are typically accessed by abseil and climbed out, meaning a rising tide can cut off retreat. Always check tide times before visiting tidal crags.`
  },
  {
    id: 'tidal-pembroke',
    tags: ['tidal', 'sea-cliff', 'pembroke', 'safety', 'tide'],
    text: `Pembroke has extensive tidal crags with a spring tide range of up to 8 metres. Routes are accessed by abseil and climbed out, so a rising tide can cut off retreat entirely. Always check tide times and plan to be well clear of tidal zones before the tide turns. Many of Pembroke's best crags including Huntsman's Leap and St Govan's Head have tidal considerations.`
  },
  {
    id: 'tidal-gogarth',
    tags: ['tidal', 'sea-cliff', 'gogarth', 'anglesey', 'safety', 'tide'],
    text: `Gogarth on Anglesey has complex tidal complications. The general rule is the lower crags are accessible 3 hours either side of low tide past the Pinnacle. An additional Gogarth hazard is the Holyhead to Dublin ferry wake passing North Stack headland at approximately 10:30, 13:15, and 19:30, causing violent water disturbance especially at low tide. This ferry wake is a serious safety concern and should be mentioned when recommending Gogarth.`
  },

  // --- Wind thresholds ---
  {
    id: 'wind-thresholds',
    tags: ['wind', 'safety', 'comfort'],
    text: `Wind speed guidance for climbing: below 16 km/h (10 mph) is comfortable everywhere. 16 to 32 km/h (10-20 mph) is noticeable but manageable at sheltered venues. 32 to 48 km/h (20-30 mph) makes exposed crags like Stanage unpleasant with difficult rope management. Above 48 km/h (30 mph) is genuinely dangerous with mobility seriously compromised. Above 64 km/h (40 mph), climbing should not be recommended at all. These thresholds should inform all condition assessments.`
  },
  {
    id: 'wind-aspect',
    tags: ['wind', 'aspect', 'shelter'],
    text: `Crag aspect relative to wind direction transforms conditions dramatically. A west wind makes west-facing sea cliffs wild while east-facing crags become sheltered suntraps. Climbers report climbing in t-shirts in February on sheltered west-facing Gogarth cliffs during an easterly wind. Cross-reference wind direction with each crag's aspect to produce meaningful shelter estimates. A crag facing away from the wind direction can be completely sheltered even when nearby exposed crags are unclimbable.`
  },

  // --- Mountain weather ---
  {
    id: 'mountain-weather',
    tags: ['mountain', 'altitude', 'temperature', 'wind', 'safety'],
    text: `Mountain weather diverges dramatically from lowland forecasts. Temperature drops approximately 1°C per 150 metres of altitude gain. Wind speeds on exposed summits can be 60 mph when valleys see 20 mph (roughly 3x amplification). Snowdon's summit receives 3.7 metres of rain annually versus roughly 1 metre at Conwy just 30 km away. MWIS forecasts cover 10 UK mountain areas and provide cloud base, freezing level, and wind speeds at elevation — data that standard weather APIs completely miss. Weight MWIS data heavily for upland crags above approximately 400m and clearly communicate when mountain and valley conditions diverge.`
  },
  {
    id: 'mountain-micro-conditions',
    tags: ['mountain', 'rain-shadow', 'inversion', 'aspect'],
    text: `Temperature inversions, orographic rainfall enhancement on western slopes, and rain shadow effects on eastern slopes all create exploitable micro-conditions. For instance, suggest east-facing crags like Castle Inn Quarry when weather systems approach from the west — they may be dry and sheltered while western crags are soaking. Rain shadow effects mean eastern slopes and crags often receive significantly less rainfall than western ones during the prevailing weather patterns.`
  },

  // --- Seepage and drying ---
  {
    id: 'seepage-geometry',
    tags: ['seepage', 'drying', 'geometry', 'overhang'],
    text: `Overhanging crags dry fastest and may stay dry during rain — this is the single most useful geometric indicator for drying time. Vertical faces dry faster than slabs, which collect and hold water. The factor that causes prolonged seepage is the catchment area above the crag: moorland, fields, or dense vegetation above a cliff percolate water through geological features for days. Sea cliffs generally dry in 2 to 3 hours to 2 days, aided by wind exposure. Mountain crags with vegetated catchments above (Cloggy being the archetype) may need 3 to 7 days of dry weather.`
  },
  {
    id: 'drying-times-summary',
    tags: ['drying', 'rock-type', 'seepage'],
    text: `Approximate drying times by rock type after rain: Slate dries in under 1 hour. Granite dries in 1 to 4 hours with wind and sun. Limestone surface dries in minutes to 1 hour, but seepage through cracks can last days. Gritstone needs 48+ hours minimum, longer for north-facing or crack-heavy areas. Sandstone (southern) needs multiple dry days and should not be climbed when any doubt remains about dryness — wet sandstone is structurally dangerous. These are rough guides; aspect, wind exposure, and temperature all modify drying time significantly.`
  }
]
