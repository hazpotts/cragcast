import { ref, type Ref } from 'vue'

export type CustomCrag = {
  id: string
  name: string
  lat: number
  lon: number
  rock: string[]
}

const STORAGE_KEY = 'custom-crags'

function generateId(): string {
  return 'custom-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)
}

let crags: Ref<CustomCrag[]> | null = null

function load(): CustomCrag[] {
  if (!process.client) return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
}

function save(list: CustomCrag[]) {
  if (!process.client) return
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)) } catch {}
}

export function useCustomCrags() {
  if (!crags) {
    crags = ref<CustomCrag[]>(load())
  }

  function add(crag: Omit<CustomCrag, 'id'>): CustomCrag {
    const item: CustomCrag = { id: generateId(), ...crag }
    crags!.value = [...crags!.value, item]
    save(crags!.value)
    return item
  }

  function remove(id: string) {
    crags!.value = crags!.value.filter(c => c.id !== id)
    save(crags!.value)
  }

  function reload() {
    crags!.value = load()
  }

  return { crags: crags as Ref<CustomCrag[]>, add, remove, reload }
}
