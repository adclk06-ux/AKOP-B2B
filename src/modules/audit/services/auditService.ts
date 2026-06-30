import type { AuditLogEntry, AuditLogFilter } from '../types/audit.types'

export async function fetchAuditLogs(filter?: AuditLogFilter): Promise<AuditLogEntry[]> {
  const params = new URLSearchParams(filter as Record<string, string>)
  const res = await fetch(`/api/audit/logs?${params.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
