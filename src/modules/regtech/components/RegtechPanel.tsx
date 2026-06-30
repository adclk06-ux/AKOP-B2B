import { useEffect, useState } from 'react'
import type { SpkSource } from '../types/regtech.types'
import { fetchSpkSources } from '../services/regtechService'

export default function RegtechPanel() {
  const [sources, setSources] = useState<SpkSource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSpkSources()
      .then(setSources)
      .catch(() => setSources([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4 text-sm text-slate-500">Yükleniyor...</div>

  return (
    <div className="space-y-2">
      {sources.map((s) => (
        <div key={s.name} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
          <div className="text-sm font-medium">{s.name}</div>
          <div className={`text-xs ${s.status === 'ok' ? 'text-emerald-600' : 'text-amber-600'}`}>{s.status}</div>
        </div>
      ))}
      {sources.length === 0 && <div className="text-sm text-slate-400">Kaynak bulunamadı.</div>}
    </div>
  )
}
