import { useState } from 'react'
import type { AssistantMessage, AssistantQueryPayload } from '../types/assistant.types'
import { sendAssistantQuery } from '../services/assistantService'

export default function AssistantChat() {
  const [messages, setMessages] = useState<AssistantMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return
    const payload: AssistantQueryPayload = { message: input.trim() }
    setInput('')
    setLoading(true)
    try {
      const reply = await sendAssistantQuery(payload)
      setMessages((prev) => [...prev, reply])
    } catch {
      // noop
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-96 border border-slate-200 rounded-lg">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`text-sm ${m.role === 'user' ? 'text-right text-blue-700' : 'text-left text-slate-700'}`}>
            {m.content}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 p-2 border-t border-slate-200">
        <input
          className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Sorunuzu yazın..."
        />
        <button
          className="rounded-md bg-blue-600 px-3 py-2 text-sm text-white"
          onClick={handleSend}
          disabled={loading}
        >
          {loading ? '...' : 'Gönder'}
        </button>
      </div>
    </div>
  )
}
