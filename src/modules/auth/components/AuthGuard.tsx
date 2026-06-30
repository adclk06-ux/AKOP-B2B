import type { ReactNode } from 'react'
import type { UserRole } from '../types/auth.types'

interface AuthGuardProps {
  allowedRoles: UserRole[]
  children: ReactNode
  fallback?: ReactNode
}

export default function AuthGuard({ allowedRoles, children, fallback }: AuthGuardProps) {
  // Placeholder: real implementation would check authStore
  const userRole: UserRole = 'ADMIN'
  const isAllowed = allowedRoles.includes(userRole)

  if (!isAllowed) {
    return fallback ? <>{fallback}</> : <div className="p-4 text-sm text-rose-600">Erişim reddedildi.</div>
  }

  return <>{children}</>
}
