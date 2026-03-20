/**
 * AI orchestrator: tool-use loop that calls Cloudflare Workers AI
 * and iteratively resolves tool calls until a text response is produced.
 *
 * Workers AI tool calling format:
 * - Tools: { name, description, parameters }
 * - Response: { response?: string, tool_calls?: [{ name, arguments }] }
 * - Tool results sent back as: { role: 'tool', content: JSON.stringify(result) }
 * - Assistant tool selection sent as: { role: 'assistant', content: JSON.stringify(tool_calls) }
 */

import type { ChatMessage, ToolCall } from './types'
import { buildSystemPrompt } from './system-prompt'
import { toolDefinitions, executeTool } from './tools'

const MODEL = '@cf/meta/llama-3.3-70b-instruct-fp8-fast'
const MAX_TOOL_ROUNDS = 5

type OrchestratorCallbacks = {
  onToken?: (token: string) => void
  onToolCall?: (name: string) => void
  onDone?: () => void
  onError?: (error: string) => void
}

/**
 * Run the AI orchestrator with tool-use loop.
 * Streams the final text response via callbacks.
 */
export async function runOrchestrator(
  ai: any,
  event: any,
  userMessages: ChatMessage[],
  callbacks: OrchestratorCallbacks
): Promise<string> {
  const systemPrompt = buildSystemPrompt()

  // Build the full message history — all content must be strings
  const messages: Array<{ role: string; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...userMessages.map(m => ({
      role: m.role,
      content: m.content || ''
    }))
  ]

  let fullResponse = ''

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let response: any

    try {
      response = await ai.run(MODEL, {
        messages,
        tools: toolDefinitions
      })
    } catch (e: any) {
      const errMsg = `AI model error: ${e.message || String(e)}`
      callbacks.onError?.(errMsg)
      return errMsg
    }

    // Workers AI response: { response?: string, tool_calls?: [{ name, arguments }] }
    const toolCalls: ToolCall[] = response?.tool_calls || []
    const textResponse: string = response?.response || ''

    // If there are tool calls, execute them and loop
    if (toolCalls.length > 0) {
      // Add the assistant's tool selection as a message
      messages.push({
        role: 'assistant',
        content: JSON.stringify(toolCalls)
      })

      // Execute each tool call and add results
      for (const tc of toolCalls) {
        const toolName = tc.name || 'unknown'
        callbacks.onToolCall?.(toolName)

        let args: Record<string, any> = {}
        try {
          args = typeof tc.arguments === 'string'
            ? JSON.parse(tc.arguments)
            : tc.arguments || {}
        } catch {
          args = {}
        }

        let result: string
        try {
          result = await executeTool(toolName, args, { event })
        } catch (e: any) {
          result = JSON.stringify({ error: `Tool execution failed: ${e.message}` })
        }

        messages.push({
          role: 'tool',
          content: result
        })
      }

      // Continue the loop — the AI will see the tool results
      continue
    }

    // No tool calls — we have a final text response
    if (textResponse) {
      fullResponse = textResponse
      callbacks.onToken?.(textResponse)
    }

    break
  }

  callbacks.onDone?.()
  return fullResponse
}

/**
 * Friendly tool name for UI display.
 */
export function friendlyToolName(name: string): string {
  const map: Record<string, string> = {
    get_weather_forecast: 'Checking weather',
    search_crags: 'Searching crags',
    rank_regions: 'Ranking regions',
    lookup_crag: 'Looking up crag',
    get_crag_score: 'Scoring crag',
    get_region_info: 'Looking up region',
    get_mwis_forecast: 'Checking mountain weather'
  }
  return map[name] || `Running ${name}`
}
