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
