// server/security/auditMiddleware.js
// Audit logging middleware

import { createAuditLog } from '../services/audit/auditService.js'

export function auditMiddleware(action, module) {
  return async (req, res, next) => {
    const start = Date.now()
    const originalJson = res.json.bind(res)

    res.json = (body) => {
      const duration = Date.now() - start
      try {
        createAuditLog({
          userId: req.headers['x-user-id'] || 'anonymous',
          action,
          module,
          entityType: req.params?.id ? 'entity' : undefined,
          entityId: req.params?.id,
          ipAddress: req.ip || req.socket?.remoteAddress,
          metadata: { method: req.method, path: req.path, statusCode: res.statusCode, durationMs: duration },
        })
      } catch {
        // non-blocking
      }
      return originalJson(body)
    }

    next()
  }
}
