/** Types for the conversational AI orchestrator. */

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
}

/** Workers AI tool call shape: { name, arguments } */
export type ToolCall = {
  name: string
  arguments: Record<string, any> | string
}

/** Workers AI tool definition: { name, description, parameters } */
export type ToolDefinition = {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export type SSEEvent =
  | { event: 'token'; data: string }
  | { event: 'tool_call'; data: string }
  | { event: 'done'; data: string }
  | { event: 'error'; data: string }
