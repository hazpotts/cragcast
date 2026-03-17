export type Aspect = 'N' | 'NE' | 'E' | 'SE' | 'S' | 'SW' | 'W' | 'NW'

export type Crag = {
  id: string
  name: string
  regionId: string
  lat: number
  lon: number
  aspect: Aspect | null
  rock: string[]
  types: { trad?: number; sport?: number; boulder?: number }
  routeCount: number
  tags: string[]
}

export const crags: Crag[] = [
  // --- Peak District: North (peak-n) ---
  { id: 'stanage', name: 'Stanage Edge', regionId: 'peak-n', lat: 53.349, lon: -1.632, aspect: 'W', rock: ['grit'], types: { trad: 0.6, boulder: 0.4 }, routeCount: 1200, tags: ['exposed', 'moorland'] },
  { id: 'burbage-n', name: 'Burbage North', regionId: 'peak-n', lat: 53.332, lon: -1.618, aspect: 'W', rock: ['grit'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 300, tags: ['exposed', 'moorland'] },
  { id: 'burbage-s', name: 'Burbage South', regionId: 'peak-n', lat: 53.322, lon: -1.615, aspect: 'W', rock: ['grit'], types: { trad: 0.4, boulder: 0.6 }, routeCount: 250, tags: ['exposed'] },
  { id: 'higgar-tor', name: 'Higgar Tor', regionId: 'peak-n', lat: 53.326, lon: -1.626, aspect: 'S', rock: ['grit'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 80, tags: ['exposed'] },
  { id: 'carl-wark', name: 'Carl Wark', regionId: 'peak-n', lat: 53.325, lon: -1.621, aspect: 'S', rock: ['grit'], types: { boulder: 1.0 }, routeCount: 40, tags: ['exposed'] },
  { id: 'bamford', name: 'Bamford Edge', regionId: 'peak-n', lat: 53.361, lon: -1.681, aspect: 'E', rock: ['grit'], types: { trad: 0.7, boulder: 0.3 }, routeCount: 120, tags: ['exposed', 'quick-dry'] },
  { id: 'millstone', name: 'Millstone Edge', regionId: 'peak-n', lat: 53.312, lon: -1.600, aspect: 'W', rock: ['grit'], types: { trad: 0.8, sport: 0.1, boulder: 0.1 }, routeCount: 200, tags: ['sheltered'] },
  { id: 'lawrencefield', name: 'Lawrencefield', regionId: 'peak-n', lat: 53.305, lon: -1.597, aspect: 'W', rock: ['grit'], types: { trad: 0.7, boulder: 0.3 }, routeCount: 100, tags: ['sheltered'] },

  // --- Peak District: Central (peak-c) ---
  { id: 'froggatt', name: 'Froggatt Edge', regionId: 'peak-c', lat: 53.283, lon: -1.608, aspect: 'W', rock: ['grit'], types: { trad: 0.7, boulder: 0.3 }, routeCount: 300, tags: ['exposed'] },
  { id: 'curbar', name: 'Curbar Edge', regionId: 'peak-c', lat: 53.276, lon: -1.610, aspect: 'W', rock: ['grit'], types: { trad: 0.7, boulder: 0.3 }, routeCount: 250, tags: ['exposed'] },
  { id: 'baslow', name: 'Baslow Edge', regionId: 'peak-c', lat: 53.268, lon: -1.614, aspect: 'W', rock: ['grit'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 150, tags: ['exposed'] },
  { id: 'gardoms', name: 'Gardoms Edge', regionId: 'peak-c', lat: 53.261, lon: -1.610, aspect: 'W', rock: ['grit'], types: { trad: 0.4, boulder: 0.6 }, routeCount: 150, tags: ['exposed'] },
  { id: 'birchen', name: 'Birchen Edge', regionId: 'peak-c', lat: 53.262, lon: -1.589, aspect: 'E', rock: ['grit'], types: { trad: 0.7, boulder: 0.3 }, routeCount: 80, tags: ['sheltered'] },
  { id: 'chatsworth', name: 'Chatsworth Edge', regionId: 'peak-c', lat: 53.264, lon: -1.620, aspect: 'W', rock: ['grit'], types: { trad: 0.6, boulder: 0.4 }, routeCount: 80, tags: [] },
  { id: 'stoney-middleton', name: 'Stoney Middleton', regionId: 'peak-c', lat: 53.268, lon: -1.681, aspect: 'S', rock: ['limestone'], types: { sport: 0.6, trad: 0.4 }, routeCount: 350, tags: ['sheltered', 'quick-dry'] },
  { id: 'horseshoe-quarry', name: 'Horseshoe Quarry', regionId: 'peak-c', lat: 53.270, lon: -1.682, aspect: 'S', rock: ['limestone'], types: { sport: 0.9, trad: 0.1 }, routeCount: 100, tags: ['sheltered', 'quick-dry'] },

  // --- Peak District: South West (peak-sw) ---
  { id: 'roaches', name: 'The Roaches', regionId: 'peak-sw', lat: 53.147, lon: -1.999, aspect: 'W', rock: ['grit'], types: { trad: 0.6, boulder: 0.4 }, routeCount: 500, tags: ['exposed', 'moorland'] },
  { id: 'hen-cloud', name: 'Hen Cloud', regionId: 'peak-sw', lat: 53.140, lon: -2.000, aspect: 'W', rock: ['grit'], types: { trad: 0.9, boulder: 0.1 }, routeCount: 100, tags: ['exposed'] },
  { id: 'windgather', name: 'Windgather Rocks', regionId: 'peak-sw', lat: 53.291, lon: -1.965, aspect: 'W', rock: ['grit'], types: { trad: 0.8, boulder: 0.2 }, routeCount: 60, tags: ['exposed', 'wind-exposed'] },
  { id: 'baldstones', name: 'Baldstones', regionId: 'peak-sw', lat: 53.150, lon: -2.010, aspect: 'E', rock: ['grit'], types: { boulder: 1.0 }, routeCount: 30, tags: ['moorland'] },

  // --- Peak District: South East (peak-se) ---
  { id: 'cratcliffe', name: 'Cratcliffe Tor', regionId: 'peak-se', lat: 53.141, lon: -1.665, aspect: 'S', rock: ['grit'], types: { trad: 0.8, boulder: 0.2 }, routeCount: 60, tags: ['sheltered'] },
  { id: 'robin-hoods-stride', name: 'Robin Hoods Stride', regionId: 'peak-se', lat: 53.143, lon: -1.657, aspect: null, rock: ['grit'], types: { trad: 0.6, boulder: 0.4 }, routeCount: 40, tags: [] },
  { id: 'harborough-rocks', name: 'Harborough Rocks', regionId: 'peak-se', lat: 53.084, lon: -1.641, aspect: 'S', rock: ['limestone'], types: { sport: 0.5, trad: 0.3, boulder: 0.2 }, routeCount: 60, tags: ['quick-dry'] },

  // --- Chew Valley (chew) ---
  { id: 'wimberry', name: 'Wimberry Rocks', regionId: 'chew', lat: 53.526, lon: -1.988, aspect: 'S', rock: ['grit'], types: { trad: 0.7, boulder: 0.3 }, routeCount: 100, tags: ['exposed', 'moorland'] },
  { id: 'ravenstones', name: 'Ravenstones', regionId: 'chew', lat: 53.530, lon: -1.990, aspect: 'S', rock: ['grit'], types: { trad: 0.8, boulder: 0.2 }, routeCount: 80, tags: ['exposed', 'moorland'] },
  { id: 'dovestones', name: 'Dovestones Edge', regionId: 'chew', lat: 53.534, lon: -1.985, aspect: 'S', rock: ['grit'], types: { trad: 0.6, boulder: 0.4 }, routeCount: 70, tags: ['exposed'] },

  // --- Lancashire Quarries (lancs-quarries) ---
  { id: 'wilton-1', name: 'Wilton 1', regionId: 'lancs-quarries', lat: 53.598, lon: -2.487, aspect: 'S', rock: ['quarried grit'], types: { sport: 0.7, trad: 0.3 }, routeCount: 100, tags: ['sheltered', 'quick-dry'] },
  { id: 'wilton-3', name: 'Wilton 3', regionId: 'lancs-quarries', lat: 53.597, lon: -2.489, aspect: 'E', rock: ['quarried grit'], types: { sport: 0.8, trad: 0.2 }, routeCount: 80, tags: ['sheltered', 'quick-dry'] },
  { id: 'brownstones', name: 'Brownstones Quarry', regionId: 'lancs-quarries', lat: 53.703, lon: -2.460, aspect: 'S', rock: ['quarried grit'], types: { sport: 0.9, trad: 0.1 }, routeCount: 120, tags: ['sheltered', 'quick-dry'] },
  { id: 'deeply-vale', name: 'Deeply Vale', regionId: 'lancs-quarries', lat: 53.636, lon: -2.170, aspect: 'N', rock: ['quarried grit'], types: { sport: 0.6, trad: 0.4 }, routeCount: 50, tags: ['sheltered'] },

  // --- North Wales: Snowdonia North (nwales-n) ---
  { id: 'tremadog', name: 'Tremadog', regionId: 'nwales-n', lat: 52.958, lon: -4.113, aspect: 'S', rock: ['rhyolite'], types: { trad: 0.8, sport: 0.2 }, routeCount: 300, tags: ['sheltered', 'quick-dry'] },
  { id: 'cloggy', name: 'Clogwyn Du\'r Arddu', regionId: 'nwales-n', lat: 53.065, lon: -4.076, aspect: 'NE', rock: ['rhyolite'], types: { trad: 1.0 }, routeCount: 80, tags: ['mountain', 'exposed'] },
  { id: 'llanberis-pass', name: 'Llanberis Pass', regionId: 'nwales-n', lat: 53.086, lon: -4.052, aspect: 'N', rock: ['rhyolite'], types: { trad: 0.9, sport: 0.1 }, routeCount: 400, tags: ['mountain'] },
  { id: 'idwal-slabs', name: 'Idwal Slabs', regionId: 'nwales-n', lat: 53.119, lon: -3.997, aspect: 'N', rock: ['rhyolite'], types: { trad: 1.0 }, routeCount: 50, tags: ['mountain'] },
  { id: 'dinorwig', name: 'Vivian Quarry (Dinorwig)', regionId: 'nwales-n', lat: 53.126, lon: -4.119, aspect: 'SE', rock: ['slate'], types: { trad: 0.5, sport: 0.5 }, routeCount: 150, tags: ['sheltered'] },

  // --- North Wales: Snowdonia South (nwales-s) ---
  { id: 'cader-idris', name: 'Cader Idris (Cyfrwy)', regionId: 'nwales-s', lat: 52.700, lon: -3.910, aspect: 'N', rock: ['rhyolite'], types: { trad: 1.0 }, routeCount: 40, tags: ['mountain', 'exposed'] },
  { id: 'craig-cau', name: 'Craig Cau', regionId: 'nwales-s', lat: 52.694, lon: -3.890, aspect: 'NE', rock: ['rhyolite'], types: { trad: 1.0 }, routeCount: 30, tags: ['mountain'] },
  { id: 'barmouth-slabs', name: 'Barmouth Slabs', regionId: 'nwales-s', lat: 52.746, lon: -4.045, aspect: 'S', rock: ['rhyolite'], types: { trad: 0.7, sport: 0.3 }, routeCount: 40, tags: ['quick-dry'] },

  // --- North Wales: Coast (nwales-coast) ---
  { id: 'gogarth-main', name: 'Gogarth Main Cliff', regionId: 'nwales-coast', lat: 53.297, lon: -4.688, aspect: 'W', rock: ['limestone'], types: { trad: 1.0 }, routeCount: 200, tags: ['sea-cliff', 'exposed'] },
  { id: 'gogarth-south', name: 'Gogarth South Stack', regionId: 'nwales-coast', lat: 53.293, lon: -4.699, aspect: 'SW', rock: ['limestone'], types: { trad: 1.0 }, routeCount: 150, tags: ['sea-cliff', 'exposed'] },
  { id: 'great-orme', name: 'Great Orme', regionId: 'nwales-coast', lat: 53.330, lon: -3.850, aspect: 'N', rock: ['limestone'], types: { sport: 0.6, trad: 0.4 }, routeCount: 350, tags: ['sea-cliff', 'quick-dry'] },

  // --- North Wales: Clwyd (nwales-clwyd) ---
  { id: 'trevor-rocks', name: 'Trevor Rocks', regionId: 'nwales-clwyd', lat: 52.983, lon: -3.157, aspect: 'S', rock: ['limestone'], types: { sport: 0.7, trad: 0.3 }, routeCount: 80, tags: ['quick-dry'] },
  { id: 'world-end', name: 'Worlds End', regionId: 'nwales-clwyd', lat: 53.000, lon: -3.196, aspect: 'S', rock: ['limestone'], types: { sport: 0.6, trad: 0.4 }, routeCount: 60, tags: ['quick-dry'] },

  // --- Lake District: North (lakes-n) ---
  { id: 'shepherds', name: 'Shepherds Crag', regionId: 'lakes-n', lat: 54.569, lon: -3.147, aspect: 'S', rock: ['rhyolite'], types: { trad: 0.9, boulder: 0.1 }, routeCount: 120, tags: ['sheltered'] },
  { id: 'castle-rock', name: 'Castle Rock of Triermain', regionId: 'lakes-n', lat: 54.565, lon: -3.137, aspect: 'S', rock: ['rhyolite'], types: { trad: 1.0 }, routeCount: 40, tags: [] },
  { id: 'goat-crag', name: 'Goat Crag (Borrowdale)', regionId: 'lakes-n', lat: 54.555, lon: -3.160, aspect: 'SW', rock: ['rhyolite'], types: { trad: 1.0 }, routeCount: 30, tags: [] },

  // --- Lake District: Central (lakes-c) ---
  { id: 'scafell-crag', name: 'Scafell Crag', regionId: 'lakes-c', lat: 54.449, lon: -3.209, aspect: 'N', rock: ['rhyolite'], types: { trad: 1.0 }, routeCount: 60, tags: ['mountain', 'exposed'] },
  { id: 'great-gable', name: 'Great Gable (Napes)', regionId: 'lakes-c', lat: 54.472, lon: -3.215, aspect: 'S', rock: ['rhyolite'], types: { trad: 1.0 }, routeCount: 40, tags: ['mountain'] },
  { id: 'gimmer', name: 'Gimmer Crag', regionId: 'lakes-c', lat: 54.455, lon: -3.115, aspect: 'SE', rock: ['rhyolite'], types: { trad: 1.0 }, routeCount: 50, tags: ['mountain'] },
  { id: 'pavey-ark', name: 'Pavey Ark', regionId: 'lakes-c', lat: 54.449, lon: -3.095, aspect: 'E', rock: ['rhyolite'], types: { trad: 1.0 }, routeCount: 40, tags: ['mountain'] },
  { id: 'raven-crag-langdale', name: 'Raven Crag (Langdale)', regionId: 'lakes-c', lat: 54.443, lon: -3.075, aspect: 'S', rock: ['rhyolite'], types: { trad: 1.0 }, routeCount: 35, tags: [] },

  // --- Lake District: South (lakes-s) ---
  { id: 'scout-crag', name: 'Scout Crag', regionId: 'lakes-s', lat: 54.405, lon: -3.042, aspect: 'S', rock: ['rhyolite'], types: { trad: 0.8, boulder: 0.2 }, routeCount: 50, tags: ['sheltered'] },
  { id: 'chapel-head', name: 'Chapel Head Scar', regionId: 'lakes-s', lat: 54.275, lon: -2.777, aspect: 'S', rock: ['limestone'], types: { sport: 0.7, trad: 0.3 }, routeCount: 60, tags: ['sheltered', 'quick-dry'] },

  // --- Yorkshire: Dales West (york-dales-w) ---
  { id: 'malham', name: 'Malham Cove', regionId: 'york-dales-w', lat: 54.072, lon: -2.163, aspect: 'S', rock: ['limestone'], types: { sport: 0.7, trad: 0.3 }, routeCount: 150, tags: ['exposed'] },
  { id: 'gordale', name: 'Gordale Scar', regionId: 'york-dales-w', lat: 54.077, lon: -2.139, aspect: 'NW', rock: ['limestone'], types: { trad: 0.9, sport: 0.1 }, routeCount: 50, tags: ['sheltered'] },
  { id: 'kilnsey', name: 'Kilnsey Crag', regionId: 'york-dales-w', lat: 54.087, lon: -2.012, aspect: 'S', rock: ['limestone'], types: { sport: 0.8, trad: 0.2 }, routeCount: 80, tags: ['sheltered', 'quick-dry'] },
  { id: 'attermire', name: 'Attermire Scar', regionId: 'york-dales-w', lat: 54.085, lon: -2.275, aspect: 'SE', rock: ['limestone'], types: { trad: 0.6, sport: 0.4 }, routeCount: 40, tags: [] },

  // --- Yorkshire: Dales East (york-dales-e) ---
  { id: 'almscliff', name: 'Almscliff Crag', regionId: 'york-dales-e', lat: 53.934, lon: -1.667, aspect: null, rock: ['grit'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 120, tags: ['exposed'] },
  { id: 'caley', name: 'Caley Crags', regionId: 'york-dales-e', lat: 53.903, lon: -1.683, aspect: 'S', rock: ['grit'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 80, tags: [] },
  { id: 'ilkley', name: 'Ilkley (Cow & Calf)', regionId: 'york-dales-e', lat: 53.924, lon: -1.817, aspect: 'S', rock: ['grit'], types: { trad: 0.3, boulder: 0.7 }, routeCount: 200, tags: ['exposed'] },
  { id: 'brimham', name: 'Brimham Rocks', regionId: 'york-dales-e', lat: 54.087, lon: -1.671, aspect: null, rock: ['grit'], types: { trad: 0.4, boulder: 0.6 }, routeCount: 150, tags: ['exposed'] },

  // --- Yorkshire: Dales South (york-dales-s) ---
  { id: 'crookrise', name: 'Crookrise', regionId: 'york-dales-s', lat: 53.938, lon: -1.948, aspect: 'S', rock: ['grit'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 50, tags: [] },
  { id: 'earl-crag', name: 'Earl Crag', regionId: 'york-dales-s', lat: 53.897, lon: -1.943, aspect: 'S', rock: ['grit'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 40, tags: [] },

  // --- Northumberland ---
  { id: 'bowden-doors', name: 'Bowden Doors', regionId: 'northumberland', lat: 55.569, lon: -1.821, aspect: 'S', rock: ['sandstone'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 100, tags: ['quick-dry'] },
  { id: 'kyloe-in', name: 'Kyloe in the Wood', regionId: 'northumberland', lat: 55.650, lon: -1.871, aspect: 'S', rock: ['sandstone'], types: { trad: 0.4, boulder: 0.6 }, routeCount: 80, tags: ['sheltered'] },
  { id: 'back-bowden', name: 'Back Bowden', regionId: 'northumberland', lat: 55.567, lon: -1.823, aspect: 'N', rock: ['sandstone'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 60, tags: [] },
  { id: 'crag-lough', name: 'Crag Lough', regionId: 'northumberland', lat: 55.020, lon: -2.361, aspect: 'S', rock: ['sandstone'], types: { trad: 0.7, boulder: 0.3 }, routeCount: 80, tags: ['exposed'] },

  // --- Pembroke ---
  { id: 'stennis-head', name: 'Stennis Head', regionId: 'pembroke', lat: 51.627, lon: -5.029, aspect: 'S', rock: ['limestone'], types: { trad: 0.8, sport: 0.2 }, routeCount: 80, tags: ['sea-cliff'] },
  { id: 'st-govans', name: 'St Govans', regionId: 'pembroke', lat: 51.593, lon: -4.941, aspect: 'S', rock: ['limestone'], types: { sport: 0.5, trad: 0.5 }, routeCount: 200, tags: ['sea-cliff', 'quick-dry'] },
  { id: 'mother-carey', name: 'Mother Careys Kitchen', regionId: 'pembroke', lat: 51.626, lon: -5.041, aspect: 'W', rock: ['limestone'], types: { trad: 1.0 }, routeCount: 40, tags: ['sea-cliff'] },
  { id: 'mewsford', name: 'Mewsford Point', regionId: 'pembroke', lat: 51.594, lon: -4.938, aspect: 'S', rock: ['limestone'], types: { trad: 0.7, sport: 0.3 }, routeCount: 60, tags: ['sea-cliff'] },

  // --- Gower ---
  { id: 'rhossili', name: 'Rhossili', regionId: 'gower', lat: 51.569, lon: -4.292, aspect: 'W', rock: ['limestone'], types: { trad: 0.8, sport: 0.2 }, routeCount: 50, tags: ['sea-cliff', 'exposed'] },
  { id: 'fall-bay', name: 'Fall Bay', regionId: 'gower', lat: 51.555, lon: -4.282, aspect: 'S', rock: ['limestone'], types: { trad: 0.6, sport: 0.4 }, routeCount: 40, tags: ['sea-cliff'] },
  { id: 'three-cliffs', name: 'Three Cliffs Bay', regionId: 'gower', lat: 51.568, lon: -4.100, aspect: 'S', rock: ['limestone'], types: { trad: 0.7, sport: 0.3 }, routeCount: 60, tags: ['sea-cliff'] },

  // --- Wye Valley ---
  { id: 'wintours-leap', name: 'Wintours Leap', regionId: 'wye', lat: 51.707, lon: -2.676, aspect: 'W', rock: ['limestone'], types: { trad: 0.6, sport: 0.4 }, routeCount: 100, tags: ['sheltered'] },
  { id: 'symonds-yat', name: 'Symonds Yat', regionId: 'wye', lat: 51.838, lon: -2.637, aspect: 'W', rock: ['limestone'], types: { sport: 0.6, trad: 0.4 }, routeCount: 80, tags: ['sheltered'] },
  { id: 'ban-y-gor', name: 'Ban y Gor', regionId: 'wye', lat: 51.710, lon: -2.680, aspect: 'E', rock: ['limestone'], types: { sport: 0.7, trad: 0.3 }, routeCount: 50, tags: ['sheltered'] },

  // --- Scotland: NW Highlands ---
  { id: 'diabaig', name: 'Diabaig Pillar', regionId: 'scotland-nw', lat: 57.588, lon: -5.631, aspect: 'SW', rock: ['sandstone'], types: { trad: 1.0 }, routeCount: 30, tags: ['mountain'] },
  { id: 'sheigra', name: 'Sheigra', regionId: 'scotland-nw', lat: 58.452, lon: -5.149, aspect: 'W', rock: ['gneiss'], types: { trad: 0.6, boulder: 0.4 }, routeCount: 60, tags: ['sea-cliff'] },
  { id: 'reiff', name: 'Reiff', regionId: 'scotland-nw', lat: 58.083, lon: -5.373, aspect: 'W', rock: ['sandstone'], types: { trad: 0.7, sport: 0.3 }, routeCount: 100, tags: ['sea-cliff'] },

  // --- Scotland: Central Highlands ---
  { id: 'ben-nevis', name: 'Ben Nevis (north face)', regionId: 'scotland-c', lat: 56.799, lon: -5.002, aspect: 'N', rock: ['granite'], types: { trad: 1.0 }, routeCount: 80, tags: ['mountain', 'exposed'] },
  { id: 'glen-nevis', name: 'Glen Nevis (Polldubh)', regionId: 'scotland-c', lat: 56.780, lon: -5.090, aspect: 'S', rock: ['granite'], types: { trad: 0.8, boulder: 0.2 }, routeCount: 100, tags: ['sheltered'] },
  { id: 'binnein-shuas', name: 'Binnein Shuas', regionId: 'scotland-c', lat: 56.775, lon: -4.585, aspect: 'S', rock: ['granite'], types: { sport: 0.8, trad: 0.2 }, routeCount: 60, tags: ['sheltered', 'quick-dry'] },

  // --- Scotland: Cairngorms ---
  { id: 'creag-dubh', name: 'Creag Dubh', regionId: 'scotland-cairngorms', lat: 57.075, lon: -4.092, aspect: 'S', rock: ['granite'], types: { trad: 0.5, sport: 0.5 }, routeCount: 100, tags: ['sheltered', 'quick-dry'] },
  { id: 'huntlys-cave', name: 'Huntlys Cave', regionId: 'scotland-cairngorms', lat: 57.078, lon: -4.089, aspect: 'SW', rock: ['granite'], types: { sport: 0.7, trad: 0.3 }, routeCount: 50, tags: ['sheltered'] },

  // --- Scotland: Skye ---
  { id: 'sron-na-ciche', name: 'Sron na Ciche', regionId: 'scotland-skye', lat: 57.195, lon: -6.217, aspect: 'S', rock: ['gabbro'], types: { trad: 1.0 }, routeCount: 80, tags: ['mountain'] },
  { id: 'neist-point', name: 'Neist Point', regionId: 'scotland-skye', lat: 57.423, lon: -6.787, aspect: 'W', rock: ['gabbro'], types: { trad: 1.0 }, routeCount: 40, tags: ['sea-cliff', 'exposed'] },
  { id: 'kilt-rock', name: 'Kilt Rock', regionId: 'scotland-skye', lat: 57.626, lon: -6.175, aspect: 'E', rock: ['gabbro'], types: { trad: 1.0 }, routeCount: 30, tags: ['sea-cliff'] },

  // --- Scotland: Aberdeenshire ---
  { id: 'pass-of-ballater', name: 'Pass of Ballater', regionId: 'scotland-aberdeen', lat: 57.047, lon: -2.976, aspect: 'S', rock: ['granite'], types: { trad: 0.5, sport: 0.5 }, routeCount: 80, tags: ['sheltered', 'quick-dry'] },
  { id: 'clashfarquhar', name: 'Clashfarquhar', regionId: 'scotland-aberdeen', lat: 56.933, lon: -2.300, aspect: 'E', rock: ['granite'], types: { trad: 0.4, sport: 0.6 }, routeCount: 60, tags: ['sea-cliff'] },

  // --- Scotland: Central Belt ---
  { id: 'dunsapie', name: 'Dunsapie Crag', regionId: 'scotland-centralbelt', lat: 55.948, lon: -3.156, aspect: 'S', rock: ['dolerite'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 40, tags: [] },
  { id: 'salisbury-crags', name: 'Salisbury Crags', regionId: 'scotland-centralbelt', lat: 55.944, lon: -3.167, aspect: 'W', rock: ['dolerite'], types: { trad: 0.7, boulder: 0.3 }, routeCount: 60, tags: ['exposed'] },
  { id: 'ratho', name: 'Ratho Quarry', regionId: 'scotland-centralbelt', lat: 55.918, lon: -3.368, aspect: 'S', rock: ['dolerite'], types: { sport: 0.8, trad: 0.2 }, routeCount: 40, tags: ['sheltered', 'quick-dry'] },

  // --- South West England: Cheddar ---
  { id: 'cheddar-gorge', name: 'Cheddar Gorge', regionId: 'avon-cheddar', lat: 51.283, lon: -2.760, aspect: 'N', rock: ['limestone'], types: { sport: 0.6, trad: 0.4 }, routeCount: 250, tags: ['sheltered'] },
  { id: 'brean-down', name: 'Brean Down', regionId: 'avon-cheddar', lat: 51.319, lon: -3.001, aspect: 'S', rock: ['limestone'], types: { trad: 0.6, sport: 0.4 }, routeCount: 40, tags: ['sea-cliff', 'quick-dry'] },

  // --- Dartmoor ---
  { id: 'haytor', name: 'Haytor', regionId: 'dartmoor', lat: 50.585, lon: -3.758, aspect: null, rock: ['granite'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 100, tags: ['exposed'] },
  { id: 'hound-tor', name: 'Hound Tor', regionId: 'dartmoor', lat: 50.596, lon: -3.747, aspect: 'S', rock: ['granite'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 60, tags: ['exposed'] },
  { id: 'sheeps-tor', name: 'Sheeps Tor', regionId: 'dartmoor', lat: 50.480, lon: -3.995, aspect: 'W', rock: ['granite'], types: { trad: 0.8, boulder: 0.2 }, routeCount: 40, tags: [] },
  { id: 'dewerstone', name: 'The Dewerstone', regionId: 'dartmoor', lat: 50.440, lon: -4.062, aspect: 'SW', rock: ['granite'], types: { trad: 0.9, sport: 0.1 }, routeCount: 80, tags: ['sheltered'] },

  // --- West Cornwall ---
  { id: 'bosigran', name: 'Bosigran', regionId: 'west-cornwall', lat: 50.184, lon: -5.610, aspect: 'W', rock: ['granite'], types: { trad: 1.0 }, routeCount: 100, tags: ['sea-cliff', 'exposed'] },
  { id: 'sennen', name: 'Sennen', regionId: 'west-cornwall', lat: 50.073, lon: -5.696, aspect: 'W', rock: ['granite'], types: { trad: 0.8, sport: 0.2 }, routeCount: 80, tags: ['sea-cliff'] },
  { id: 'chair-ladder', name: 'Chair Ladder', regionId: 'west-cornwall', lat: 50.049, lon: -5.672, aspect: 'S', rock: ['granite'], types: { trad: 1.0 }, routeCount: 60, tags: ['sea-cliff'] },

  // --- North Devon & Cornwall ---
  { id: 'baggy-point', name: 'Baggy Point', regionId: 'north-devon-cornwall', lat: 51.137, lon: -4.236, aspect: 'NW', rock: ['culm'], types: { trad: 1.0 }, routeCount: 40, tags: ['sea-cliff', 'exposed'] },
  { id: 'compass-point', name: 'Compass Point', regionId: 'north-devon-cornwall', lat: 50.826, lon: -4.566, aspect: 'W', rock: ['culm'], types: { trad: 1.0 }, routeCount: 30, tags: ['sea-cliff'] },
  { id: 'tintagel', name: 'Tintagel', regionId: 'north-devon-cornwall', lat: 50.667, lon: -4.759, aspect: 'W', rock: ['slate'], types: { trad: 1.0 }, routeCount: 50, tags: ['sea-cliff', 'exposed'] },

  // --- Portland ---
  { id: 'portland-bill', name: 'Portland Bill', regionId: 'dorset-portland', lat: 50.518, lon: -2.454, aspect: 'S', rock: ['limestone'], types: { sport: 0.7, trad: 0.3 }, routeCount: 200, tags: ['sea-cliff', 'quick-dry'] },
  { id: 'portland-cove', name: 'The Cove', regionId: 'dorset-portland', lat: 50.542, lon: -2.441, aspect: 'E', rock: ['limestone'], types: { sport: 0.8, trad: 0.2 }, routeCount: 150, tags: ['sheltered', 'quick-dry'] },
  { id: 'blacknor', name: 'Blacknor', regionId: 'dorset-portland', lat: 50.538, lon: -2.464, aspect: 'W', rock: ['limestone'], types: { sport: 0.6, trad: 0.4 }, routeCount: 100, tags: ['exposed'] },

  // --- Swanage ---
  { id: 'dancing-ledge', name: 'Dancing Ledge', regionId: 'dorset-swanage', lat: 50.594, lon: -1.992, aspect: 'S', rock: ['limestone'], types: { trad: 0.7, sport: 0.3 }, routeCount: 80, tags: ['sea-cliff'] },
  { id: 'durlston', name: 'Durlston Head', regionId: 'dorset-swanage', lat: 50.596, lon: -1.950, aspect: 'E', rock: ['limestone'], types: { trad: 0.6, sport: 0.4 }, routeCount: 60, tags: ['sea-cliff'] },
  { id: 'boulder-ruckle', name: 'Boulder Ruckle', regionId: 'dorset-swanage', lat: 50.598, lon: -1.980, aspect: 'S', rock: ['limestone'], types: { trad: 1.0 }, routeCount: 200, tags: ['sea-cliff', 'exposed'] },

  // --- Southern Sandstone ---
  { id: 'harrisons', name: 'Harrisons Rocks', regionId: 'southern-sandstone', lat: 51.103, lon: 0.109, aspect: 'N', rock: ['sandstone'], types: { trad: 0.6, boulder: 0.4 }, routeCount: 300, tags: ['sheltered', 'fragile'] },
  { id: 'bowles', name: 'Bowles Rocks', regionId: 'southern-sandstone', lat: 51.107, lon: 0.114, aspect: 'N', rock: ['sandstone'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 100, tags: ['sheltered', 'fragile'] },
  { id: 'high-rocks', name: 'High Rocks', regionId: 'southern-sandstone', lat: 51.095, lon: 0.178, aspect: 'W', rock: ['sandstone'], types: { trad: 0.6, boulder: 0.4 }, routeCount: 80, tags: ['sheltered', 'fragile'] },

  // --- North York Moors ---
  { id: 'whitby-crags', name: 'Whitby Crags (Highcliff Nab)', regionId: 'york-moors', lat: 54.448, lon: -0.827, aspect: 'S', rock: ['sandstone'], types: { trad: 0.5, boulder: 0.5 }, routeCount: 50, tags: [] },
  { id: 'peak-scar', name: 'Peak Scar', regionId: 'york-moors', lat: 54.363, lon: -1.034, aspect: 'W', rock: ['sandstone'], types: { trad: 0.4, sport: 0.3, boulder: 0.3 }, routeCount: 30, tags: [] },
]
