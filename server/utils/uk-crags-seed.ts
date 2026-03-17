/**
 * Static seed data for UK crags.
 *
 * OpenBeta has no UK climbing data, so we maintain a curated list of
 * well-known crags with approximate coordinates and route type ratios.
 *
 * Type ratios (trad/sport/boulder) are approximate proportions (0–1).
 * Route counts are rough estimates from UKC/guidebook data.
 *
 * This can be replaced with an API source (e.g. theCrag, OSM Overpass)
 * in the future.
 */

import type { OpenBetaCrag } from './openbeta'

export const ukCragsSeed: OpenBetaCrag[] = [
  // --- Peak District ---
  { name: "Stanage Edge", cragPath: "UK > Peak District > Stanage", lat: 53.349, lon: -1.632, totalClimbs: 1200, trad: 0.85, sport: 0, boulder: 0.15 },
  { name: "Burbage South", cragPath: "UK > Peak District > Burbage", lat: 53.329, lon: -1.625, totalClimbs: 250, trad: 0.7, sport: 0, boulder: 0.3 },
  { name: "Burbage North", cragPath: "UK > Peak District > Burbage", lat: 53.336, lon: -1.624, totalClimbs: 180, trad: 0.6, sport: 0, boulder: 0.4 },
  { name: "Froggatt Edge", cragPath: "UK > Peak District > Froggatt", lat: 53.284, lon: -1.613, totalClimbs: 300, trad: 0.9, sport: 0, boulder: 0.1 },
  { name: "Curbar Edge", cragPath: "UK > Peak District > Curbar", lat: 53.276, lon: -1.612, totalClimbs: 250, trad: 0.85, sport: 0, boulder: 0.15 },
  { name: "Millstone Edge", cragPath: "UK > Peak District > Millstone", lat: 53.303, lon: -1.624, totalClimbs: 200, trad: 0.9, sport: 0, boulder: 0.1 },
  { name: "Higgar Tor", cragPath: "UK > Peak District > Higgar", lat: 53.337, lon: -1.637, totalClimbs: 80, trad: 0.5, sport: 0, boulder: 0.5 },
  { name: "Bamford Edge", cragPath: "UK > Peak District > Bamford", lat: 53.364, lon: -1.676, totalClimbs: 120, trad: 0.8, sport: 0, boulder: 0.2 },
  { name: "Rivelin", cragPath: "UK > Peak District > Rivelin", lat: 53.394, lon: -1.553, totalClimbs: 100, trad: 0.7, sport: 0, boulder: 0.3 },
  { name: "Horseshoe Quarry", cragPath: "UK > Peak District > Stoney", lat: 53.244, lon: -1.720, totalClimbs: 100, trad: 0.1, sport: 0.9, boulder: 0 },
  { name: "Stoney Middleton", cragPath: "UK > Peak District > Stoney", lat: 53.264, lon: -1.686, totalClimbs: 200, trad: 0.5, sport: 0.5, boulder: 0 },
  { name: "Water-cum-Jolly", cragPath: "UK > Peak District > Stoney", lat: 53.255, lon: -1.706, totalClimbs: 80, trad: 0.4, sport: 0.6, boulder: 0 },
  { name: "Raven Tor", cragPath: "UK > Peak District > Millers Dale", lat: 53.254, lon: -1.778, totalClimbs: 60, trad: 0.2, sport: 0.8, boulder: 0 },
  { name: "Chee Dale", cragPath: "UK > Peak District > Chee Dale", lat: 53.258, lon: -1.799, totalClimbs: 180, trad: 0.3, sport: 0.7, boulder: 0 },
  { name: "Cratcliffe Tor", cragPath: "UK > Peak District > Cratcliffe", lat: 53.160, lon: -1.677, totalClimbs: 50, trad: 0.8, sport: 0, boulder: 0.2 },
  { name: "Robin Hood's Stride", cragPath: "UK > Peak District > Cratcliffe", lat: 53.162, lon: -1.668, totalClimbs: 40, trad: 0.5, sport: 0, boulder: 0.5 },
  { name: "The Roaches", cragPath: "UK > Peak District > Roaches", lat: 53.152, lon: -2.007, totalClimbs: 350, trad: 0.85, sport: 0, boulder: 0.15 },
  { name: "Hen Cloud", cragPath: "UK > Peak District > Roaches", lat: 53.145, lon: -2.011, totalClimbs: 100, trad: 0.95, sport: 0, boulder: 0.05 },
  { name: "Wimberry", cragPath: "UK > Peak District > Chew Valley", lat: 53.527, lon: -1.991, totalClimbs: 80, trad: 0.9, sport: 0, boulder: 0.1 },
  { name: "Dovestones", cragPath: "UK > Peak District > Chew Valley", lat: 53.536, lon: -1.994, totalClimbs: 60, trad: 0.85, sport: 0, boulder: 0.15 },
  { name: "Windgather Rocks", cragPath: "UK > Peak District > Windgather", lat: 53.312, lon: -1.979, totalClimbs: 60, trad: 0.8, sport: 0, boulder: 0.2 },

  // --- Lancashire ---
  { name: "Wilton 1", cragPath: "UK > Lancashire > Wilton", lat: 53.611, lon: -2.446, totalClimbs: 120, trad: 0.4, sport: 0.5, boulder: 0.1 },
  { name: "Brownstones Quarry", cragPath: "UK > Lancashire > Brownstones", lat: 53.666, lon: -2.411, totalClimbs: 80, trad: 0.3, sport: 0.7, boulder: 0 },
  { name: "Trowbarrow", cragPath: "UK > Lancashire > Trowbarrow", lat: 54.143, lon: -2.756, totalClimbs: 80, trad: 0.4, sport: 0.6, boulder: 0 },

  // --- North Wales ---
  { name: "Tremadog", cragPath: "UK > North Wales > Tremadog", lat: 52.944, lon: -4.071, totalClimbs: 200, trad: 0.95, sport: 0, boulder: 0.05 },
  { name: "Clogwyn Du'r Arddu", cragPath: "UK > North Wales > Snowdon", lat: 53.076, lon: -4.079, totalClimbs: 120, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Dinas Cromlech", cragPath: "UK > North Wales > Llanberis Pass", lat: 53.100, lon: -4.068, totalClimbs: 60, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Clogwyn y Grochan", cragPath: "UK > North Wales > Llanberis Pass", lat: 53.103, lon: -4.064, totalClimbs: 50, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Llanberis Slate", cragPath: "UK > North Wales > Llanberis Slate", lat: 53.121, lon: -4.125, totalClimbs: 300, trad: 0.95, sport: 0.05, boulder: 0 },
  { name: "Gogarth Main Cliff", cragPath: "UK > North Wales > Gogarth", lat: 53.306, lon: -4.641, totalClimbs: 250, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Gogarth South Stack", cragPath: "UK > North Wales > Gogarth", lat: 53.304, lon: -4.699, totalClimbs: 100, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Great Orme", cragPath: "UK > North Wales > Ormes", lat: 53.327, lon: -3.859, totalClimbs: 120, trad: 0.5, sport: 0.5, boulder: 0 },
  { name: "Little Orme", cragPath: "UK > North Wales > Ormes", lat: 53.320, lon: -3.803, totalClimbs: 60, trad: 0.4, sport: 0.6, boulder: 0 },
  { name: "Craig y Forwen", cragPath: "UK > North Wales > Clwyd", lat: 53.074, lon: -3.171, totalClimbs: 60, trad: 0.3, sport: 0.7, boulder: 0 },
  { name: "World's End", cragPath: "UK > North Wales > Clwyd", lat: 53.000, lon: -3.230, totalClimbs: 40, trad: 0.6, sport: 0.4, boulder: 0 },
  { name: "Idwal Slabs", cragPath: "UK > North Wales > Ogwen", lat: 53.110, lon: -4.019, totalClimbs: 60, trad: 1.0, sport: 0, boulder: 0 },

  // --- Lake District ---
  { name: "Shepherd's Crag", cragPath: "UK > Lake District > Borrowdale", lat: 54.553, lon: -3.137, totalClimbs: 120, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Black Crag (Borrowdale)", cragPath: "UK > Lake District > Borrowdale", lat: 54.543, lon: -3.137, totalClimbs: 60, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Bowderstone Crag", cragPath: "UK > Lake District > Borrowdale", lat: 54.559, lon: -3.136, totalClimbs: 50, trad: 0.8, sport: 0, boulder: 0.2 },
  { name: "Raven Crag Walthwaite", cragPath: "UK > Lake District > Thirlmere", lat: 54.546, lon: -3.064, totalClimbs: 80, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Castle Rock of Triermain", cragPath: "UK > Lake District > Thirlmere", lat: 54.596, lon: -3.056, totalClimbs: 70, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Scafell Crag", cragPath: "UK > Lake District > Scafell", lat: 54.455, lon: -3.206, totalClimbs: 100, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Pillar Rock", cragPath: "UK > Lake District > Ennerdale", lat: 54.486, lon: -3.270, totalClimbs: 80, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Dow Crag", cragPath: "UK > Lake District > Coniston", lat: 54.376, lon: -3.134, totalClimbs: 100, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Pavey Ark", cragPath: "UK > Lake District > Langdale", lat: 54.458, lon: -3.099, totalClimbs: 70, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Gimmer Crag", cragPath: "UK > Lake District > Langdale", lat: 54.452, lon: -3.103, totalClimbs: 80, trad: 1.0, sport: 0, boulder: 0 },

  // --- Yorkshire ---
  { name: "Malham Cove", cragPath: "UK > Yorkshire > Malham", lat: 54.073, lon: -2.157, totalClimbs: 200, trad: 0.3, sport: 0.7, boulder: 0 },
  { name: "Gordale Scar", cragPath: "UK > Yorkshire > Malham", lat: 54.072, lon: -2.128, totalClimbs: 80, trad: 0.6, sport: 0.4, boulder: 0 },
  { name: "Kilnsey Crag", cragPath: "UK > Yorkshire > Wharfedale", lat: 54.073, lon: -2.013, totalClimbs: 60, trad: 0.3, sport: 0.7, boulder: 0 },
  { name: "Almscliff", cragPath: "UK > Yorkshire > Dales East", lat: 53.935, lon: -1.657, totalClimbs: 120, trad: 0.7, sport: 0, boulder: 0.3 },
  { name: "Brimham Rocks", cragPath: "UK > Yorkshire > Dales East", lat: 54.084, lon: -1.684, totalClimbs: 250, trad: 0.5, sport: 0, boulder: 0.5 },
  { name: "Caley Crag", cragPath: "UK > Yorkshire > Dales East", lat: 53.900, lon: -1.640, totalClimbs: 60, trad: 0.6, sport: 0, boulder: 0.4 },
  { name: "Ilkley (Cow & Calf)", cragPath: "UK > Yorkshire > Dales East", lat: 53.920, lon: -1.826, totalClimbs: 80, trad: 0.4, sport: 0, boulder: 0.6 },

  // --- Northumberland ---
  { name: "Kyloe in the Wood", cragPath: "UK > Northumberland > Kyloe", lat: 55.622, lon: -1.850, totalClimbs: 80, trad: 0.8, sport: 0, boulder: 0.2 },
  { name: "Bowden Doors", cragPath: "UK > Northumberland > Bowden", lat: 55.553, lon: -1.785, totalClimbs: 80, trad: 0.7, sport: 0, boulder: 0.3 },
  { name: "Back Bowden", cragPath: "UK > Northumberland > Bowden", lat: 55.554, lon: -1.786, totalClimbs: 50, trad: 0.5, sport: 0, boulder: 0.5 },
  { name: "Crag Lough", cragPath: "UK > Northumberland > Hadrian's Wall", lat: 55.002, lon: -2.376, totalClimbs: 60, trad: 0.8, sport: 0, boulder: 0.2 },
  { name: "Sandy Crag", cragPath: "UK > Northumberland > Simonside", lat: 55.305, lon: -2.024, totalClimbs: 50, trad: 0.8, sport: 0, boulder: 0.2 },

  // --- Pembroke ---
  { name: "Stennis Head", cragPath: "UK > Pembroke > Stennis", lat: 51.622, lon: -5.028, totalClimbs: 100, trad: 0.9, sport: 0.1, boulder: 0 },
  { name: "St Govans", cragPath: "UK > Pembroke > St Govans", lat: 51.596, lon: -4.923, totalClimbs: 150, trad: 0.85, sport: 0.15, boulder: 0 },
  { name: "Mowing Word", cragPath: "UK > Pembroke > Mowing Word", lat: 51.597, lon: -4.938, totalClimbs: 60, trad: 0.9, sport: 0.1, boulder: 0 },
  { name: "Mother Carey's Kitchen", cragPath: "UK > Pembroke > Stackpole", lat: 51.611, lon: -4.992, totalClimbs: 80, trad: 0.95, sport: 0.05, boulder: 0 },
  { name: "Huntsman's Leap", cragPath: "UK > Pembroke > Bosherston", lat: 51.608, lon: -5.003, totalClimbs: 40, trad: 1.0, sport: 0, boulder: 0 },

  // --- Gower ---
  { name: "Rhossili", cragPath: "UK > Gower > Rhossili", lat: 51.564, lon: -4.293, totalClimbs: 60, trad: 0.8, sport: 0.2, boulder: 0 },
  { name: "Three Cliffs Bay", cragPath: "UK > Gower > Three Cliffs", lat: 51.565, lon: -4.108, totalClimbs: 50, trad: 0.9, sport: 0.1, boulder: 0 },

  // --- Wye Valley ---
  { name: "Wintour's Leap", cragPath: "UK > Wye Valley > Wintours", lat: 51.672, lon: -2.666, totalClimbs: 100, trad: 0.5, sport: 0.5, boulder: 0 },
  { name: "Ban-y-Gor", cragPath: "UK > Wye Valley > Ban-y-Gor", lat: 51.678, lon: -2.669, totalClimbs: 60, trad: 0.4, sport: 0.6, boulder: 0 },

  // --- Scotland ---
  { name: "Glen Nevis (Polldubh)", cragPath: "UK > Scotland > Glen Nevis", lat: 56.811, lon: -5.041, totalClimbs: 200, trad: 0.9, sport: 0, boulder: 0.1 },
  { name: "Creag an Dubh Loch", cragPath: "UK > Scotland > Cairngorms", lat: 56.941, lon: -3.285, totalClimbs: 60, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Shelter Stone Crag", cragPath: "UK > Scotland > Cairngorms", lat: 57.068, lon: -3.626, totalClimbs: 40, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Creag Dubh (Newtonmore)", cragPath: "UK > Scotland > Central Highlands", lat: 57.015, lon: -4.096, totalClimbs: 100, trad: 0.8, sport: 0.2, boulder: 0 },
  { name: "Binnein Shuas", cragPath: "UK > Scotland > Central Highlands", lat: 56.880, lon: -4.538, totalClimbs: 60, trad: 0.9, sport: 0.1, boulder: 0 },
  { name: "Sron Ulladale", cragPath: "UK > Scotland > NW Highlands", lat: 57.945, lon: -6.730, totalClimbs: 40, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Diabaig", cragPath: "UK > Scotland > NW Highlands", lat: 57.589, lon: -5.690, totalClimbs: 60, trad: 0.7, sport: 0.3, boulder: 0 },
  { name: "Reiff", cragPath: "UK > Scotland > NW Highlands", lat: 58.065, lon: -5.348, totalClimbs: 100, trad: 0.8, sport: 0, boulder: 0.2 },
  { name: "Sron na Ciche (Cioch)", cragPath: "UK > Scotland > Skye", lat: 57.205, lon: -6.264, totalClimbs: 80, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Kilt Rock", cragPath: "UK > Scotland > Skye", lat: 57.619, lon: -6.170, totalClimbs: 40, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Longhaven", cragPath: "UK > Scotland > Aberdeenshire", lat: 57.378, lon: -1.873, totalClimbs: 80, trad: 0.7, sport: 0.3, boulder: 0 },
  { name: "Pass of Ballater", cragPath: "UK > Scotland > Aberdeenshire", lat: 57.047, lon: -2.989, totalClimbs: 60, trad: 0.5, sport: 0.5, boulder: 0 },
  { name: "Dumbarton Rock", cragPath: "UK > Scotland > Central Belt", lat: 55.937, lon: -4.568, totalClimbs: 60, trad: 0.5, sport: 0, boulder: 0.5 },
  { name: "Auchinstarry Quarry", cragPath: "UK > Scotland > Central Belt", lat: 55.957, lon: -4.066, totalClimbs: 60, trad: 0.2, sport: 0.8, boulder: 0 },

  // --- South West England ---
  { name: "Cheddar Gorge", cragPath: "UK > South West > Cheddar", lat: 51.283, lon: -2.760, totalClimbs: 200, trad: 0.7, sport: 0.3, boulder: 0 },
  { name: "Avon Gorge", cragPath: "UK > South West > Avon", lat: 51.457, lon: -2.627, totalClimbs: 150, trad: 0.8, sport: 0.2, boulder: 0 },
  { name: "Haytor", cragPath: "UK > South West > Dartmoor", lat: 50.577, lon: -3.757, totalClimbs: 100, trad: 0.6, sport: 0, boulder: 0.4 },
  { name: "Hound Tor", cragPath: "UK > South West > Dartmoor", lat: 50.592, lon: -3.758, totalClimbs: 60, trad: 0.5, sport: 0, boulder: 0.5 },
  { name: "Sheeps Tor", cragPath: "UK > South West > Dartmoor", lat: 50.481, lon: -4.003, totalClimbs: 40, trad: 0.9, sport: 0, boulder: 0.1 },
  { name: "Dewerstone", cragPath: "UK > South West > Dartmoor", lat: 50.465, lon: -4.060, totalClimbs: 80, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Bosigran", cragPath: "UK > South West > West Cornwall", lat: 50.171, lon: -5.628, totalClimbs: 100, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Chair Ladder", cragPath: "UK > South West > West Cornwall", lat: 50.049, lon: -5.659, totalClimbs: 80, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Sennen", cragPath: "UK > South West > West Cornwall", lat: 50.068, lon: -5.698, totalClimbs: 50, trad: 0.9, sport: 0, boulder: 0.1 },
  { name: "Baggy Point", cragPath: "UK > South West > North Devon", lat: 51.140, lon: -4.243, totalClimbs: 50, trad: 0.9, sport: 0.1, boulder: 0 },
  { name: "Compass Point", cragPath: "UK > South West > North Devon", lat: 50.829, lon: -4.561, totalClimbs: 40, trad: 0.8, sport: 0.2, boulder: 0 },

  // --- South Coast ---
  { name: "Portland (Blacknor)", cragPath: "UK > Dorset > Portland", lat: 50.547, lon: -2.459, totalClimbs: 100, trad: 0.2, sport: 0.8, boulder: 0 },
  { name: "Portland (Cheyne Weares)", cragPath: "UK > Dorset > Portland", lat: 50.540, lon: -2.443, totalClimbs: 200, trad: 0.1, sport: 0.9, boulder: 0 },
  { name: "Portland (Lighthouse Area)", cragPath: "UK > Dorset > Portland", lat: 50.515, lon: -2.455, totalClimbs: 80, trad: 0.3, sport: 0.7, boulder: 0 },
  { name: "Swanage (Dancing Ledge)", cragPath: "UK > Dorset > Swanage", lat: 50.602, lon: -1.973, totalClimbs: 80, trad: 0.8, sport: 0.2, boulder: 0 },
  { name: "Swanage (Boulder Ruckle)", cragPath: "UK > Dorset > Swanage", lat: 50.587, lon: -1.965, totalClimbs: 120, trad: 1.0, sport: 0, boulder: 0 },
  { name: "Swanage (Subluminal)", cragPath: "UK > Dorset > Swanage", lat: 50.594, lon: -1.962, totalClimbs: 60, trad: 0.4, sport: 0.6, boulder: 0 },

  // --- Southern Sandstone ---
  { name: "Harrison's Rocks", cragPath: "UK > Southern Sandstone > Harrisons", lat: 51.106, lon: 0.105, totalClimbs: 400, trad: 0.7, sport: 0, boulder: 0.3 },
  { name: "High Rocks", cragPath: "UK > Southern Sandstone > High Rocks", lat: 51.096, lon: 0.182, totalClimbs: 120, trad: 0.6, sport: 0, boulder: 0.4 },
  { name: "Bowles Rocks", cragPath: "UK > Southern Sandstone > Bowles", lat: 51.094, lon: 0.152, totalClimbs: 80, trad: 0.5, sport: 0, boulder: 0.5 },
  { name: "Eridge Green", cragPath: "UK > Southern Sandstone > Eridge", lat: 51.084, lon: 0.170, totalClimbs: 60, trad: 0.5, sport: 0, boulder: 0.5 },

  // --- North York Moors ---
  { name: "Scugdale", cragPath: "UK > North York Moors > Scugdale", lat: 54.427, lon: -1.208, totalClimbs: 60, trad: 0.6, sport: 0, boulder: 0.4 },
  { name: "Highcliff Nab", cragPath: "UK > North York Moors > Guisborough", lat: 54.499, lon: -1.040, totalClimbs: 40, trad: 0.7, sport: 0, boulder: 0.3 },
  { name: "Peak Scar", cragPath: "UK > North York Moors > Swainby", lat: 54.404, lon: -1.272, totalClimbs: 50, trad: 0.7, sport: 0, boulder: 0.3 },
]
