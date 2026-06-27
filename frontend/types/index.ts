export type SSEEventType =
  | "tool_used"
  | "token"
  | "citation"
  | "sql"
  | "done"
  | "error"

export interface SSEEvent {
  type: SSEEventType
  content?: string
  tool?: string
  source?: string
  query?: string
  message?: string
}

export type ToolName = "search_documents" | "query_orders"

export interface ThinkingStep {
  tool: ToolName
  label: string
  done: boolean
}

export interface Citation {
  source: string
}

export interface Message {
  role: "user" | "assistant"
  content: string
  thinkingSteps?: ThinkingStep[]
  citations?: Citation[]
  sqlQueries?: string[]
  isStreaming?: boolean
}

export interface ChatRequest {
  question: string
  messages: { role: string; content: string }[]
}