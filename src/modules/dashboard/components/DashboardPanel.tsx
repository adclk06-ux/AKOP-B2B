import { useEffect, useState } from 'react'
import type { DashboardMetric } from '../types/dashboard.types'
import { fetchDashboardMetrics } from '../services/dashboardService'

export default function DashboardPanel() {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardMetrics()
      .then(setMetrics)
      .catch(() => setMetrics([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4 text-sm text-slate-500">Yükleniyor...</div>

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metrics.map((m) => (
        <div key={m.id} className="rounded-lg border border-slate-200 p-4">
          <div className="text-xs text-slate-500">{m.label}</div>
          <div className="text-xl font-semibold text-slate-800">{m.value}</div>
          {m.change !== undefined && (
            <div className={`text-xs ${m.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'}`}>
              {m.change > 0 ? '+' : ''}{m.change}%
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
