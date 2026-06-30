export interface AuditLogEntry {
  id: string
  userId: string
  action: string
  module: string
  entityType?: string
  entityId?: string
  ipAddress?: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface AuditLogFilter {
  userId?: string
  module?: string
  action?: string
  dateFrom?: string
  dateTo?: string
}
