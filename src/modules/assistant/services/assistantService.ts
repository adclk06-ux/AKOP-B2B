import type { AssistantMessage, AssistantQueryPayload } from '../types/assistant.types'

export async function sendAssistantQuery(payload: AssistantQueryPayload): Promise<AssistantMessage> {
  const res = await fetch('/api/assistant/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchAssistantHistory(sessionId: string): Promise<AssistantMessage[]> {
  const res = await fetch(`/api/assistant/sessions/${sessionId}/history`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
