/** Types for the conversational AI orchestrator. */

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  tool_call_id?: string
}

export type ToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export type ToolDefinition = {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
}

export type SSEEvent =
  | { event: 'token'; data: string }
  | { event: 'tool_call'; data: string }
  | { event: 'done'; data: string }
  | { event: 'error'; data: string }
