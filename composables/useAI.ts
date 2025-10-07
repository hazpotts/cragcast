import { $fetch } from 'ofetch'

export type AISuggestInput = {
  prompt: string
  prefs?: {
    dates?: string[]
    where?: { lat: number; lon: number; name?: string } | null
    maxDriveMins?: number
  }
}

export type AISuggestResult = {
  html: string
}

export async function useAISuggest(payload: AISuggestInput): Promise<AISuggestResult> {
  return await $fetch<AISuggestResult>('/api/ai/suggest', {
    method: 'POST',
    body: payload
  })
}
