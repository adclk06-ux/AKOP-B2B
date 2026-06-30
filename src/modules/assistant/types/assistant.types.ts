export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  intent?: string
  sources?: string[]
}

export interface AssistantSession {
  id: string
  title: string
  messages: AssistantMessage[]
  createdAt: string
  updatedAt: string
}

export interface AssistantQueryPayload {
  message: string
  sessionId?: string
  context?: Record<string, unknown>
}
