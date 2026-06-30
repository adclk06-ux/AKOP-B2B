// server/security/rbacMiddleware.js
// Role-based access control middleware

export const ROLES = {
  ADMIN: ['read', 'write', 'delete', 'admin'],
  OPERATION: ['read', 'write'],
  COMPLIANCE: ['read', 'write', 'compliance'],
  RISK: ['read', 'risk'],
  VIEWER: ['read'],
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.headers['x-user-role'] || 'VIEWER'
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' })
    }
    next()
  }
}

export function requirePermission(permission) {
  return (req, res, next) => {
    const userRole = req.headers['x-user-role'] || 'VIEWER'
    const perms = ROLES[userRole] || []
    if (!perms.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden: insufficient permission' })
    }
    next()
  }
}
