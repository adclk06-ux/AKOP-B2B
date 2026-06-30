import { useEffect, useState } from 'react'
import type { AuditLogEntry } from '../types/audit.types'
import { fetchAuditLogs } from '../services/auditService'

export default function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAuditLogs()
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4 text-sm text-slate-500">Yükleniyor...</div>

  return (
    <div className="space-y-2">
      {logs.map((l) => (
        <div key={l.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
          <div className="text-sm font-medium">{l.action}</div>
          <div className="text-xs text-slate-500">{l.module} — {l.createdAt}</div>
        </div>
      ))}
      {logs.length === 0 && <div className="text-sm text-slate-400">Denetim kaydı bulunamadı.</div>}
    </div>
  )
}
