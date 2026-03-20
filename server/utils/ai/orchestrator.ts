/**
 * AI orchestrator: tool-use loop that calls Cloudflare Workers AI
 * and iteratively resolves tool calls until a text response is produced.
 *
 * Workers AI + Llama can struggle with the standard role:'tool' message
 * format, so we synthesise tool results into a user-style message that
 * the model understands reliably.
 */

import type { ChatMessage, ToolCall } from './types'
import { buildSystemPrompt } from './system-prompt'
import { toolDefinitions, executeTool } from './tools'
import { retrieveKnowledge } from './rag'

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
  const calledTools = new Set<string>() // track tool+args combos to detect loops

  // Retrieve relevant climbing knowledge via RAG (runs in parallel with first LLM call)
  const lastUserMsg = userMessages.filter(m => m.role === 'user').pop()?.content || ''
  let knowledgeContext = ''
  const knowledgePromise = retrieveKnowledge(event, lastUserMsg)
    .then(ctx => { knowledgeContext = ctx })
    .catch(e => console.warn('[orchestrator] RAG retrieval failed:', e.message))

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    // On the final round, don't offer tools — force a text response
    const isLastRound = round === MAX_TOOL_ROUNDS - 1

    console.log(`[orchestrator] round=${round}/${MAX_TOOL_ROUNDS} isLastRound=${isLastRound}`)

    let response: any

    try {
      response = await ai.run(MODEL, {
        messages,
        temperature: 0,
        ...(isLastRound ? {} : { tools: toolDefinitions })
      })
    } catch (e: any) {
      const errMsg = `AI model error: ${e.message || String(e)}`
      console.error(`[orchestrator] model error:`, e.message || String(e))
      callbacks.onError?.(errMsg)
      return errMsg
    }

    // Workers AI response: { response?: string, tool_calls?: [{ name, arguments }] }
    const toolCalls: ToolCall[] = response?.tool_calls || []
    const textResponse: string = response?.response || ''

    console.log(`[orchestrator] round=${round} tool_calls=${toolCalls.length} hasText=${!!textResponse}`)
    if (toolCalls.length > 0) {
      console.log(`[orchestrator] tool calls:`, JSON.stringify(toolCalls.map(tc => ({ name: tc.name, args: tc.arguments }))))
    }

    // If there are tool calls, execute them and loop
    if (toolCalls.length > 0 && !isLastRound) {
      // Collect all tool results for this round
      const toolResults: Array<{ name: string; result: string }> = []

      for (const tc of toolCalls) {
        const toolName = tc.name || 'unknown'

        let args: Record<string, any> = {}
        try {
          args = typeof tc.arguments === 'string'
            ? JSON.parse(tc.arguments)
            : tc.arguments || {}
        } catch {
          console.warn(`[orchestrator] failed to parse args for ${toolName}:`, tc.arguments)
          args = {}
        }

        // Detect duplicate tool calls (same tool + same args)
        const callKey = `${toolName}:${JSON.stringify(args)}`
        if (calledTools.has(callKey)) {
          console.log(`[orchestrator] skipping duplicate call: ${callKey}`)
          // Already called this exact tool — skip and force response
          continue
        }
        calledTools.add(callKey)

        callbacks.onToolCall?.(toolName)

        let result: string
        try {
          result = await executeTool(toolName, args, { event })
        } catch (e: any) {
          console.error(`[orchestrator] tool ${toolName} threw:`, e.message)
          result = JSON.stringify({ error: `Tool execution failed: ${e.message}` })
        }

        console.log(`[orchestrator] ${toolName} result (${result.length} chars):`, result.slice(0, 300))
        toolResults.push({ name: toolName, result })
      }

      // If all tool calls were duplicates, break and force a response
      if (toolResults.length === 0) {
        messages.push({
          role: 'user',
          content: '[System: You already have the data you need from your previous tool calls. Please answer the user\'s question now based on that data.]'
        })
        // Run one more time without tools to force text
        try {
          response = await ai.run(MODEL, { messages, temperature: 0 })
          const forced = response?.response || ''
          if (forced) {
            fullResponse = forced
            callbacks.onToken?.(forced)
          }
        } catch { /* fall through */ }
        break
      }

      // Synthesise tool results as a user-style message that Llama understands.
      // This is more reliable than role:'tool' which Llama often ignores.
      const resultSummary = toolResults.map(tr =>
        `[Tool result from ${tr.name}]:\n${tr.result}`
      ).join('\n\n')

      // On the first round of tool results, inject RAG knowledge context
      let ragSection = ''
      if (round === 0 && !knowledgeContext) {
        // Ensure RAG retrieval has completed
        await knowledgePromise
      }
      if (knowledgeContext) {
        ragSection = `\n\n${knowledgeContext}`
        knowledgeContext = '' // only inject once
      }

      messages.push({
        role: 'user',
        content: `[System: Here are the results from the tools you called. First verify the data makes sense, then use it to answer the user's question with practical climbing advice. Do NOT call the same tools again — you already have the data you need.]\n\n${resultSummary}${ragSection}`
      })

      continue
    }

    // No tool calls — we have a final text response
    if (textResponse) {
      // If this is the first round and we have RAG knowledge that wasn't injected
      // (because no tools were called), re-run with knowledge context for a better answer
      if (round === 0 && !knowledgeContext) {
        await knowledgePromise
      }
      if (round === 0 && knowledgeContext) {
        // Inject knowledge and let the model refine its answer
        messages.push({ role: 'assistant', content: textResponse })
        messages.push({
          role: 'user',
          content: `[System: Here is additional climbing knowledge that may be relevant to your answer. If it improves your advice, incorporate it — otherwise keep your response as-is.]\n\n${knowledgeContext}`
        })
        knowledgeContext = ''
        try {
          const refined = await ai.run(MODEL, { messages, temperature: 0 })
          const refinedText = refined?.response || textResponse
          fullResponse = refinedText
          callbacks.onToken?.(refinedText)
        } catch {
          // Fall back to the original response
          fullResponse = textResponse
          callbacks.onToken?.(textResponse)
        }
      } else {
        fullResponse = textResponse
        callbacks.onToken?.(textResponse)
      }
    }

    break
  }

  // If we exhausted rounds with no response, make one final attempt without tools
  if (!fullResponse) {
    try {
      messages.push({
        role: 'user',
        content: '[System: Please respond to the user now based on any data you have gathered. If you could not find the information, say so.]'
      })
      const fallback = await ai.run(MODEL, { messages, temperature: 0 })
      const text = fallback?.response || ''
      if (text) {
        fullResponse = text
        callbacks.onToken?.(text)
      } else {
        const errMsg = 'Sorry, I wasn\'t able to get a response. Please try again.'
        callbacks.onError?.(errMsg)
        return errMsg
      }
    } catch (e: any) {
      const errMsg = 'Sorry, something went wrong. Please try again.'
      callbacks.onError?.(errMsg)
      return errMsg
    }
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
