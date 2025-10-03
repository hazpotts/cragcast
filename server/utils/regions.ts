export type Region = {
  id: string
  name: string
  points: { lat: number; lon: number }[]
  rock: string[]
  tags?: string[]
  typeAffinity?: { trad?: number; sport?: number; boulder?: number }
}

export const regions: Region[] = [
  // --- Peak District ---
  {
    id: "peak-n",
    name: "Peak District — North",
    points: [{ lat: 53.45, lon: -1.88 }],
    rock: ["grit"],
    tags: ["moorland", "exposed"],
    typeAffinity: { trad: 0.9, boulder: 0.8 }
  },
  {
    id: "peak-c",
    name: "Peak District — Central",
    points: [{ lat: 53.34, lon: -1.63 }],
    rock: ["grit"],
    tags: ["quick-dry"],
    typeAffinity: { trad: 0.95, boulder: 0.8 }
  },
  {
    id: "peak-sw",
    name: "Peak District — South West",
    points: [{ lat: 53.17, lon: -2.03 }],
    rock: ["grit"],
    tags: ["quick-dry", "wind-exposed"],
    typeAffinity: { trad: 0.95, sport: 0.2, boulder: 0.8 }
  },
  {
    id: "peak-se",
    name: "Peak District — South East",
    points: [{ lat: 53.25, lon: -1.61 }],
    rock: ["grit"],
    tags: [],
    typeAffinity: { trad: 0.9, boulder: 0.7 }
  },

  // --- North Wales ---
  {
    id: "nwales-n",
    name: "North Wales — Snowdonia North",
    points: [{ lat: 53.12, lon: -4.05 }],
    rock: ["volcanic", "slate"],
    tags: ["mountain"],
    typeAffinity: { trad: 1.0 }
  },
  {
    id: "nwales-s",
    name: "North Wales — Snowdonia South",
    points: [{ lat: 52.95, lon: -3.94 }],
    rock: ["volcanic"],
    tags: ["mountain"],
    typeAffinity: { trad: 0.9 }
  },
  {
    id: "nwales-coast",
    name: "North Wales — Coastal (Gogarth & Ormes)",
    points: [{ lat: 53.31, lon: -4.63 }],
    rock: ["limestone"],
    tags: ["sea-cliff"],
    typeAffinity: { trad: 0.9, sport: 0.7 }
  },
  {
    id: "nwales-clwyd",
    name: "North Wales — Clwyd Limestone",
    points: [{ lat: 53.05, lon: -3.16 }],
    rock: ["limestone"],
    tags: [],
    typeAffinity: { trad: 0.6, sport: 0.8 }
  },

  // --- Lake District ---
  {
    id: "lakes-n",
    name: "Lake District — North",
    points: [{ lat: 54.62, lon: -3.13 }],
    rock: ["volcanic"],
    tags: ["mountain"],
    typeAffinity: { trad: 1.0 }
  },
  {
    id: "lakes-c",
    name: "Lake District — Central",
    points: [{ lat: 54.45, lon: -3.1 }],
    rock: ["volcanic"],
    tags: ["mountain"],
    typeAffinity: { trad: 1.0 }
  },
  {
    id: "lakes-s",
    name: "Lake District — South",
    points: [{ lat: 54.35, lon: -3.1 }],
    rock: ["volcanic"],
    tags: ["mountain"],
    typeAffinity: { trad: 0.9 }
  },

  // --- Yorkshire ---
  {
    id: "york-dales-w",
    name: "Yorkshire Dales — West",
    points: [{ lat: 54.07, lon: -2.16 }],
    rock: ["limestone"],
    typeAffinity: { trad: 0.7, sport: 0.95 }
  },
  {
    id: "york-dales-e",
    name: "Yorkshire Dales — East",
    points: [{ lat: 53.92, lon: -1.7 }],
    rock: ["grit"],
    typeAffinity: { trad: 0.9, boulder: 0.85 }
  },
  {
    id: "york-dales-s",
    name: "Yorkshire Dales — South",
    points: [{ lat: 53.92, lon: -1.82 }],
    rock: ["grit"],
    typeAffinity: { trad: 0.85, boulder: 0.85 }
  },
  {
    id: "york-moors",
    name: "North York Moors & Coast",
    points: [{ lat: 54.4, lon: -0.9 }],
    rock: ["sandstone"],
    typeAffinity: { trad: 0.8, boulder: 0.7 }
  },

  // --- Greater Manchester & Lancashire ---
  {
    id: "chew",
    name: "Chew Valley",
    points: [{ lat: 53.53, lon: -1.99 }],
    rock: ["grit"],
    typeAffinity: { trad: 0.9 }
  },
  {
    id: "lancs-quarries",
    name: "Lancashire Quarries",
    points: [{ lat: 53.65, lon: -2.55 }],
    rock: ["quarried grit"],
    typeAffinity: { trad: 0.7, sport: 0.5, boulder: 0.7 }
  },

  // --- South & West Wales ---
  {
    id: "pembroke",
    name: "Pembroke",
    points: [{ lat: 51.62, lon: -5.0 }],
    rock: ["limestone"],
    tags: ["sea-cliff"],
    typeAffinity: { trad: 1.0, sport: 0.4 }
  },
  {
    id: "gower",
    name: "Gower",
    points: [{ lat: 51.57, lon: -4.17 }],
    rock: ["limestone"],
    tags: ["sea-cliff"],
    typeAffinity: { trad: 0.8, sport: 0.8 }
  },
  {
    id: "wye",
    name: "Wye Valley",
    points: [{ lat: 51.83, lon: -2.63 }],
    rock: ["limestone"],
    typeAffinity: { trad: 0.85, sport: 0.7 }
  },

  // --- South-West England ---
  {
    id: "dorset-portland",
    name: "Dorset — Portland",
    points: [{ lat: 50.54, lon: -2.44 }],
    rock: ["limestone"],
    typeAffinity: { sport: 1.0 }
  },
  {
    id: "dorset-swanage",
    name: "Dorset — Swanage",
    points: [{ lat: 50.6, lon: -1.95 }],
    rock: ["limestone"],
    tags: ["sea-cliff"],
    typeAffinity: { trad: 0.9, sport: 0.6 }
  },
  {
    id: "avon-cheddar",
    name: "Avon & Cheddar",
    points: [{ lat: 51.28, lon: -2.76 }],
    rock: ["limestone"],
    typeAffinity: { trad: 0.9, sport: 0.7 }
  },
  {
    id: "dartmoor",
    name: "Dartmoor",
    points: [{ lat: 50.58, lon: -3.95 }],
    rock: ["granite"],
    typeAffinity: { trad: 0.9, boulder: 0.85 }
  },
  {
    id: "west-cornwall",
    name: "West Cornwall",
    points: [{ lat: 50.17, lon: -5.55 }],
    rock: ["granite"],
    tags: ["sea-cliff"],
    typeAffinity: { trad: 1.0 }
  },
  {
    id: "north-devon-cornwall",
    name: "North Devon & Cornwall",
    points: [{ lat: 51.21, lon: -4.63 }],
    rock: ["culm", "granite"],
    tags: ["sea-cliff"],
    typeAffinity: { trad: 0.95 }
  },

  // --- North of England ---
  {
    id: "northumberland",
    name: "Northumberland",
    points: [{ lat: 55.27, lon: -1.93 }],
    rock: ["sandstone"],
    typeAffinity: { trad: 0.9, boulder: 0.85 }
  },

  // --- Scotland ---
  {
    id: "scotland-nw",
    name: "Scotland — North West Highlands",
    points: [{ lat: 58.0, lon: -5.0 }],
    rock: ["gneiss", "sandstone"],
    tags: ["mountain"],
    typeAffinity: { trad: 1.0 }
  },
  {
    id: "scotland-c",
    name: "Scotland — Central Highlands",
    points: [{ lat: 56.8, lon: -4.9 }],
    rock: ["granite"],
    tags: ["mountain"],
    typeAffinity: { trad: 1.0 }
  },
  {
    id: "scotland-cairngorms",
    name: "Scotland — Cairngorms",
    points: [{ lat: 57.1, lon: -3.67 }],
    rock: ["granite"],
    tags: ["mountain"],
    typeAffinity: { trad: 1.0 }
  },
  {
    id: "scotland-skye",
    name: "Scotland — Skye & Hebrides",
    points: [{ lat: 57.3, lon: -6.2 }],
    rock: ["gabbro", "gneiss"],
    tags: ["sea-cliff", "mountain"],
    typeAffinity: { trad: 1.0 }
  },
  {
    id: "scotland-aberdeen",
    name: "Scotland — Aberdeenshire",
    points: [{ lat: 57.1, lon: -2.3 }],
    rock: ["granite"],
    tags: ["sea-cliff"],
    typeAffinity: { trad: 0.9 }
  },
  {
    id: "scotland-centralbelt",
    name: "Scotland — Central Belt Dolerite",
    points: [{ lat: 55.9, lon: -3.6 }],
    rock: ["dolerite"],
    typeAffinity: { trad: 0.8, sport: 0.6 }
  },

  // --- South-East England ---
  {
    id: "southern-sandstone",
    name: "Southern Sandstone",
    points: [{ lat: 51.1, lon: 0.15 }],
    rock: ["sandstone"],
    tags: ["fragile"],
    typeAffinity: { boulder: 0.9 }
  }
]