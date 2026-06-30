import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { useAssistantContext } from '@/hooks/useAssistantContext'
import { generateAssistantResponse } from '@/services/assistantResponse'
import type { AssistantMessage } from '@/types/assistant'
import { Send, Bot, User, Loader2, Sparkles, FileWarning, ClipboardCheck, BookOpen, Trash2 } from 'lucide-react'

const quickQuestions = [
  { label: 'Platformu nasıl kullanırım?', icon: Sparkles },
  { label: 'Validasyon hatası nedir?', icon: FileWarning },
  { label: 'Onay akışı nasıl işler?', icon: ClipboardCheck },
  { label: 'Dört Göz İlkesi nedir?', icon: BookOpen },
  { label: 'SPK arşivi nedir?', icon: Sparkles },
  { label: 'Takasbank izleme nedir?', icon: Sparkles },
  { label: 'MKK mutabakatı nasıl yapılır?', icon: ClipboardCheck },
  { label: 'Roller ve yetkiler nelerdir?', icon: Sparkles },
]

export default function Assistant() {
  const user = useAuthStore((s) => s.user)
  const context = useAssistantContext()
  const [messages, setMessages] = useState<AssistantMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Merhaba ${user?.name || ''},\n\nAKOP Copilot'a hoş geldiniz. SPK, MKK, Takasbank ve operasyon süreçleri için yapay zeka destekli yardımcınızım.\n\nSorunuzu yazın veya hızlı sorulardan birini seçin.`,
      timestamp: new Date().toISOString(),
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const send = (text: string) => {
    if (!text.trim()) return
    const userMsg: AssistantMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    setTimeout(async () => {
      const response = await generateAssistantResponse(text, context, messages)
      const assistantMsg: AssistantMessage = {
        id: `a-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        source: response.source,
        contextLabel: response.contextLabel,
        ragDebug: response.ragDebug,
      }
      if (import.meta.env.DEV) {
        if (response.ragDebug) {
          // eslint-disable-next-line no-console
          console.debug('[Assistant RAG Debug]', response.ragDebug)
        }
        if (response.ragContext) {
          // eslint-disable-next-line no-console
          console.debug('[Assistant RAG Context]', response.ragContext)
        }
      }
      setMessages((prev) => [...prev, assistantMsg])
      setLoading(false)
    }, 600)
  }

  const clearChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Merhaba ${user?.name || ''},\n\nAKOP Copilot'a hoş geldiniz. SPK, MKK, Takasbank ve operasyon süreçleri için yapay zeka destekli yardımcınızım.\n\nSorunuzu yazın veya hızlı sorulardan birini seçin.`,
        timestamp: new Date().toISOString(),
      },
    ])
  }

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full flex flex-col h-[calc(100vh-4rem)]">
      <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-semibold text-sm border border-blue-100/50">
              AC
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800 tracking-tight">AKOP Copilot</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                SPK, MKK, Takasbank ve operasyon süreçleri için yapay zeka destekli yardımcı
              </p>
            </div>
          </div>
          <button
            onClick={clearChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-600 hover:bg-slate-50 hover:shadow-sm transition-all active:scale-[0.98]"
            title="Sohbeti temizle"
          >
            <Trash2 size={14} />
            Temizle
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#f8fafc]/40">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-500 flex-shrink-0">
                  <Bot size={14} />
                </div>
              )}
              <div className={`${msg.role === 'user' ? 'bg-blue-600 text-white rounded-l-lg rounded-br-lg p-3 text-sm shadow-sm shadow-blue-600/10' : 'bg-white border border-slate-200 rounded-r-lg rounded-bl-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3'} text-sm whitespace-pre-wrap leading-relaxed`}>
                <div className={msg.role === 'assistant' ? 'text-sm text-slate-700 leading-relaxed' : ''}>
                  {msg.content}
                </div>
                {msg.role === 'assistant' && (msg.source || msg.contextLabel) && (
                  <div className="border-t border-slate-100 pt-3 mt-2 text-xs text-slate-500 space-y-0.5">
                    {msg.source && (
                      <div>Kaynak: {msg.source}</div>
                    )}
                    {msg.contextLabel && (
                      <div>Bağlam: {msg.contextLabel}</div>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-xs text-blue-600 flex-shrink-0">
                  <User size={14} />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 max-w-[85%] items-center">
              <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-xs text-slate-500 flex-shrink-0">
                <Bot size={14} />
              </div>
              <div className="bg-white border border-slate-200 rounded-r-lg rounded-bl-lg p-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  Yanıt hazırlanıyor...
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-white space-y-3">
          <div className="flex flex-wrap gap-2 pb-1">
            {quickQuestions.map((q) => (
              <button
                key={q.label}
                onClick={() => send(q.label)}
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/70 rounded-xl text-xs font-medium text-slate-600 transition-all hover:text-slate-900 hover:shadow-sm active:scale-95"
              >
                {q.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2 relative items-center">
            <input
              placeholder="Sorunuzu yazın..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send(input)}
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm placeholder-slate-400 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all pr-12"
            />
            <button
              onClick={() => send(input)}
              disabled={loading || !input.trim()}
              className="absolute right-2 p-1.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
