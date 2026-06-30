export type AuditSeverity = 'info' | 'warning' | 'critical'
export type AuditEntityType = 'regulation' | 'task' | 'ai-analysis' | 'notification' | 'user' | 'system' | 'reconciliation' | 'takasbank' | 'security' | 'obligation' | 'evidence' | 'regintel' | 'notificationcenter' | 'datasource' | 'riskengine' | 'policy' | 'control' | 'finding' | 'test'

export interface AuditLog {
  id: string
  timestamp: string
  userId: string
  userName: string
  role: string
  action: string
  entityType: AuditEntityType
  entityId?: string
  entityTitle?: string
  details?: string
  severity: AuditSeverity
}

const STORAGE_KEY = 'akop_audit_trail_v1'

function loadLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as AuditLog[]
  } catch {
    return []
  }
}

function saveLogs(logs: AuditLog[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

export function addAuditLog(params: Omit<AuditLog, 'id' | 'timestamp'>) {
  const logs = loadLogs()
  const newLog: AuditLog = {
    ...params,
    id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
  }
  logs.unshift(newLog)
  // Keep max 2000 entries
  if (logs.length > 2000) logs.length = 2000
  saveLogs(logs)
}

export function getAuditLogs(): AuditLog[] {
  return loadLogs()
}

export function clearAuditLogs() {
  localStorage.removeItem(STORAGE_KEY)
}

export function getAuditStats(logs: AuditLog[]) {
  const now = new Date()
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  return {
    total: logs.length,
    last24h: logs.filter((l) => new Date(l.timestamp) >= dayAgo).length,
    critical: logs.filter((l) => l.severity === 'critical').length,
    userOps: logs.filter((l) => l.entityType === 'user' || l.entityType === 'task').length,
    systemOps: logs.filter((l) => l.entityType === 'system').length,
  }
}

export function getSeverityBadgeClass(severity: AuditSeverity) {
  switch (severity) {
    case 'critical': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'info': return 'bg-blue-50 text-blue-700 border-blue-200/60'
  }
}

export function getEntityBadgeClass(entityType: AuditEntityType) {
  switch (entityType) {
    case 'regulation': return 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
    case 'task': return 'bg-violet-50 text-violet-700 border-violet-200/60'
    case 'ai-analysis': return 'bg-cyan-50 text-cyan-700 border-cyan-200/60'
    case 'notification': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'user': return 'bg-slate-50 text-slate-700 border-slate-200/60'
    case 'system': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'reconciliation': return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'takasbank': return 'bg-teal-50 text-teal-700 border-teal-200/60'
    case 'security': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'obligation': return 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
    case 'evidence': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'regintel': return 'bg-violet-50 text-violet-700 border-violet-200/60'
    case 'notificationcenter': return 'bg-pink-50 text-pink-700 border-pink-200/60'
    case 'datasource': return 'bg-teal-50 text-teal-700 border-teal-200/60'
    case 'riskengine': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'policy': return 'bg-sky-50 text-sky-700 border-sky-200/60'
    case 'control': return 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
    case 'finding': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'test': return 'bg-violet-50 text-violet-700 border-violet-200/60'
    default: return 'bg-slate-50 text-slate-700 border-slate-200/60'
  }
}
