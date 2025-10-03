const R = 6371; // km

export function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const sinDLat = Math.sin(dLat / 2)
  const sinDLon = Math.sin(dLon / 2)
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
  return R * c
}

export function driveMinutesApprox(km: number) {
  const avgKmh = 65
  const mins = (km / avgKmh) * 60
  return Math.max(10, Math.round(mins))
}

function toRad(d: number) {
  return (d * Math.PI) / 180
}
