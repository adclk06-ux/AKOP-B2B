import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import type { UserRole } from '@/types'

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function RoleGuard({ allowedRoles, children, fallback }: RoleGuardProps) {
  const user = useAuthStore((s) => s.user)

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const hasAccess = allowedRoles.includes(user.role)

  if (!hasAccess) {
    if (fallback) return <>{fallback}</>
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold text-muted-foreground">Erişim Engellendi</h1>
        <p className="text-sm text-muted-foreground">Bu sayfaya erişim yetkiniz yok.</p>
        <a href="/" className="text-sm text-primary hover:underline">Dashboard'a dön</a>
      </div>
    )
  }

  return <>{children}</>
}
