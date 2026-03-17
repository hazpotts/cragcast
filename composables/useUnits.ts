import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

export type TempUnit = 'C' | 'F'
export type WindUnit = 'mph' | 'kmh' | 'knots'
export type RainUnit = 'mm' | 'in'
export type DistanceUnit = 'mins' | 'miles' | 'km'

export function useUnits() {
  const tempUnit = useLocalStorage<TempUnit>('unit-temp', 'C')
  const windUnit = useLocalStorage<WindUnit>('unit-wind', 'mph')
  const rainUnit = useLocalStorage<RainUnit>('unit-rain', 'mm')
  const distanceUnit = useLocalStorage<DistanceUnit>('unit-distance', 'mins')

  function convertTemp(celsius: number): number {
    if (tempUnit.value === 'F') return Math.round((celsius * 9 / 5 + 32) * 10) / 10
    return celsius
  }

  function convertWind(mph: number): number {
    if (windUnit.value === 'kmh') return Math.round(mph * 1.60934 * 10) / 10
    if (windUnit.value === 'knots') return Math.round(mph * 0.868976 * 10) / 10
    return mph
  }

  function convertRain(mm: number): number {
    if (rainUnit.value === 'in') return Math.round(mm * 0.0393701 * 100) / 100
    return mm
  }

  function convertDistance(mins: number): number | string {
    if (distanceUnit.value === 'miles') {
      const miles = Math.round(mins * 65 / 60 * 0.621371)
      return miles
    }
    if (distanceUnit.value === 'km') {
      const km = Math.round(mins * 65 / 60)
      return km
    }
    return mins
  }

  const tempLabel = computed(() => tempUnit.value === 'F' ? '°F' : '°C')
  const windLabel = computed(() => {
    if (windUnit.value === 'kmh') return 'km/h'
    if (windUnit.value === 'knots') return 'kn'
    return 'mph'
  })
  const rainLabel = computed(() => rainUnit.value === 'in' ? 'in' : 'mm')
  const distanceLabel = computed(() => {
    if (distanceUnit.value === 'miles') return 'miles'
    if (distanceUnit.value === 'km') return 'km'
    return 'mins'
  })

  return {
    tempUnit, windUnit, rainUnit, distanceUnit,
    convertTemp, convertWind, convertRain, convertDistance,
    tempLabel, windLabel, rainLabel, distanceLabel
  }
}
