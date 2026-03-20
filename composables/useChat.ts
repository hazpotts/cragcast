/**
 * Chat composable – manages conversation state and SSE connection
 * to the /api/chat endpoint.
 */

import { ref } from 'vue'

export type ChatMsg = {
  id: string
  role: 'user' | 'assistant'
  content: string
  toolCalls?: string[]  // friendly names of tools being called
  streaming?: boolean
}

export function useChat() {
  const messages = ref<ChatMsg[]>([])
  const isStreaming = ref(false)
  const error = ref<string | null>(null)

  function addMessage(role: 'user' | 'assistant', content: string): ChatMsg {
    const msg: ChatMsg = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role,
      content
    }
    messages.value.push(msg)
    return msg
  }

  async function sendMessage(text: string) {
    if (!text.trim() || isStreaming.value) return
    error.value = null

    // Add user message
    addMessage('user', text.trim())

    // Build message history for the API (just role + content)
    const apiMessages = messages.value.map(m => ({
      role: m.role,
      content: m.content
    }))

    // Add placeholder assistant message
    const assistantMsg = addMessage('assistant', '')
    assistantMsg.streaming = true
    assistantMsg.toolCalls = []
    isStreaming.value = true

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages })
      })

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText)
        throw new Error(errText || `HTTP ${res.status}`)
      }

      const reader = res.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // keep incomplete last line

        let eventType = ''
        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim()
          } else if (line.startsWith('data: ')) {
            const rawData = line.slice(6)
            let data: string
            try {
              data = JSON.parse(rawData)
            } catch {
              data = rawData
            }

            const idx = messages.value.findIndex(m => m.id === assistantMsg.id)
            if (idx === -1) break

            if (eventType === 'token') {
              messages.value[idx].content = data
            } else if (eventType === 'tool_call') {
              if (!messages.value[idx].toolCalls) messages.value[idx].toolCalls = []
              messages.value[idx].toolCalls!.push(data)
            } else if (eventType === 'done') {
              messages.value[idx].streaming = false
            } else if (eventType === 'error') {
              messages.value[idx].content = data || 'Something went wrong. Please try again.'
              messages.value[idx].streaming = false
              error.value = data
            }
          }
        }
      }

      // Ensure streaming is marked complete
      const finalIdx = messages.value.findIndex(m => m.id === assistantMsg.id)
      if (finalIdx !== -1) {
        messages.value[finalIdx].streaming = false
      }
    } catch (e: any) {
      const finalIdx = messages.value.findIndex(m => m.id === assistantMsg.id)
      if (finalIdx !== -1) {
        messages.value[finalIdx].content = e.message || 'Connection failed. Please try again.'
        messages.value[finalIdx].streaming = false
      }
      error.value = e.message
    } finally {
      isStreaming.value = false
    }
  }

  function clearMessages() {
    messages.value = []
    error.value = null
  }

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearMessages
  }
}
