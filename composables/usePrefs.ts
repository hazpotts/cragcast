import { useLocalStorage } from '@vueuse/core'
import type { WhenPreset } from '~/utils/dates'
export type ClimbType = 'any'|'trad'|'sport'|'boulder'

export const usePrefs = () => {
  const where = useLocalStorage('climb.prefs.where', { lat: 51.5074, lon: -0.1278, name: 'London' })
  const maxDriveMins = useLocalStorage('climb.prefs.maxDriveMins', 120)
  const when = useLocalStorage<WhenPreset>('climb.prefs.when', 'next-weekend')
  const type = useLocalStorage<ClimbType>('climb.prefs.type', 'any')
  return { where, maxDriveMins, when, type }
}
