/**
 * AI orchestrator: tool-use loop that calls Cloudflare Workers AI
 * and iteratively resolves tool calls until a text response is produced.
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

  // Build the full message history
  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...userMessages.map(m => {
      if (m.role === 'tool') {
        return { role: 'tool', content: m.content, tool_call_id: m.tool_call_id }
      }
      return { role: m.role, content: m.content }
    })
  ]

  let fullResponse = ''

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let response: any

    try {
      response = await ai.run(MODEL, {
        messages,
        tools: toolDefinitions,
        stream: false
      })
    } catch (e: any) {
      const errMsg = `AI model error: ${e.message || String(e)}`
      callbacks.onError?.(errMsg)
      return errMsg
    }

    // Workers AI response format: { response?: string, tool_calls?: ToolCall[] }
    const toolCalls: ToolCall[] = response?.tool_calls || []
    const textResponse: string = response?.response || ''

    // If there are tool calls, execute them and loop
    if (toolCalls.length > 0) {
      // Add the assistant message with tool calls to history
      messages.push({
        role: 'assistant',
        content: textResponse || null,
        tool_calls: toolCalls
      })

      // Execute each tool call
      for (const tc of toolCalls) {
        const toolName = tc.function?.name || 'unknown'
        callbacks.onToolCall?.(toolName)

        let args: Record<string, any> = {}
        try {
          args = typeof tc.function?.arguments === 'string'
            ? JSON.parse(tc.function.arguments)
            : tc.function?.arguments || {}
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
          content: result,
          tool_call_id: tc.id
        })
      }

      // Continue the loop — the AI will see the tool results and decide what to do next
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
    get_crag_score: 'Scoring crag',
    get_region_info: 'Looking up region',
    get_mwis_forecast: 'Checking mountain weather'
  }
  return map[name] || `Running ${name}`
}
