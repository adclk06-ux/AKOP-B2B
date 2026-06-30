import { useEffect, useState } from 'react'
import type { ReconciliationRun } from '../types/reconciliation.types'
import { fetchReconciliationRuns } from '../services/reconciliationService'

export default function ReconciliationPanel() {
  const [runs, setRuns] = useState<ReconciliationRun[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReconciliationRuns()
      .then(setRuns)
      .catch(() => setRuns([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4 text-sm text-slate-500">Yükleniyor...</div>

  return (
    <div className="space-y-2">
      {runs.map((r) => (
        <div key={r.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
          <div className="text-sm font-medium">{r.name}</div>
          <div className="text-xs text-slate-500">{r.status} — {r.matchedCount}/{r.totalCount}</div>
        </div>
      ))}
      {runs.length === 0 && <div className="text-sm text-slate-400">Mutabakat kaydı bulunamadı.</div>}
    </div>
  )
}
