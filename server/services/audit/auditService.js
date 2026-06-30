// server/services/audit/auditService.js
// Business logic for audit logging

const auditLogs = []

export async function createAuditLog(entry) {
  const log = {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    ...entry,
    createdAt: new Date().toISOString(),
  }
  auditLogs.push(log)
  return log
}

export async function listAuditLogs(filter = {}) {
  let results = [...auditLogs]
  if (filter.userId) results = results.filter((l) => l.userId === filter.userId)
  if (filter.module) results = results.filter((l) => l.module === filter.module)
  if (filter.action) results = results.filter((l) => l.action === filter.action)
  return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}
