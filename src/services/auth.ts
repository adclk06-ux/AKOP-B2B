export type UserRole = 'Admin' | 'Uyum Uzmanı' | 'Operasyon Uzmanı' | 'Yönetici' | 'Denetçi'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  status: 'Aktif' | 'Pasif'
  lastLogin: string
}

const SESSION_KEY = 'akop_auth_session_v1'
const USERS_KEY = 'akop_users_v1'

export const ROLE_PERMISSIONS: Record<UserRole, { tabs: string[]; canCreateTask: boolean; canDeleteTask: boolean; canUpdateAnyTask: boolean; canManageUsers: boolean; readOnly: boolean; canViewAudit: boolean }> = {
  'Admin': {
    tabs: ['overview', 'spk', 'bddk', 'masak', 'global', 'notifications', 'datahub', 'riskcenter', 'policies', 'controls', 'tasks', 'ai', 'document', 'timeline', 'copilot', 'reconciliation', 'takasbank', 'approval', 'casecenter', 'obligations', 'security', 'evidence', 'regintel', 'riskradar', 'users', 'audit'],
    canCreateTask: true,
    canDeleteTask: true,
    canUpdateAnyTask: true,
    canManageUsers: true,
    readOnly: false,
    canViewAudit: true,
  },
  'Uyum Uzmanı': {
    tabs: ['overview', 'spk', 'bddk', 'masak', 'global', 'notifications', 'datahub', 'riskcenter', 'policies', 'controls', 'tasks', 'ai', 'document', 'timeline', 'copilot', 'reconciliation', 'takasbank', 'approval', 'casecenter', 'obligations', 'evidence', 'regintel', 'riskradar'],
    canCreateTask: true,
    canDeleteTask: false,
    canUpdateAnyTask: true,
    canManageUsers: false,
    readOnly: false,
    canViewAudit: false,
  },
  'Operasyon Uzmanı': {
    tabs: ['overview', 'tasks', 'document', 'timeline', 'copilot', 'reconciliation', 'takasbank', 'approval', 'casecenter', 'obligations', 'evidence', 'controls'],
    canCreateTask: false,
    canDeleteTask: false,
    canUpdateAnyTask: false,
    canManageUsers: false,
    readOnly: false,
    canViewAudit: false,
  },
  'Yönetici': {
    tabs: ['overview', 'spk', 'bddk', 'masak', 'global', 'notifications', 'datahub', 'riskcenter', 'policies', 'controls', 'tasks', 'document', 'timeline', 'copilot', 'reconciliation', 'takasbank', 'approval', 'casecenter', 'obligations', 'security', 'evidence', 'regintel', 'riskradar', 'audit'],
    canCreateTask: false,
    canDeleteTask: false,
    canUpdateAnyTask: false,
    canManageUsers: false,
    readOnly: true,
    canViewAudit: true,
  },
  'Denetçi': {
    tabs: ['overview', 'spk', 'bddk', 'masak', 'global', 'notifications', 'datahub', 'riskcenter', 'policies', 'controls', 'tasks', 'ai', 'document', 'timeline', 'copilot', 'reconciliation', 'takasbank', 'approval', 'casecenter', 'obligations', 'security', 'evidence', 'regintel', 'riskradar', 'audit'],
    canCreateTask: false,
    canDeleteTask: false,
    canUpdateAnyTask: false,
    canManageUsers: false,
    readOnly: true,
    canViewAudit: true,
  },
}

export function getCurrentUser(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

export function setCurrentUser(user: User | null) {
  if (user) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user))
  } else {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function loginUser(email: string, _password: string): User | null {
  const users = getUsers()
  const found = users.find((u) => u.email === email && u.status === 'Aktif')
  if (!found) return null
  // Şimdilik şifre kontrolü yok — mock
  const updated = { ...found, lastLogin: new Date().toISOString() }
  updateUser(updated)
  setCurrentUser(updated)
  return updated
}

export function logoutUser() {
  setCurrentUser(null)
}

function loadUsers(): User[] {
  try {
    const raw = localStorage.getItem(USERS_KEY)
    if (!raw) return getDefaultUsers()
    return JSON.parse(raw) as User[]
  } catch {
    return getDefaultUsers()
  }
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

function getDefaultUsers(): User[] {
  return [
    { id: 'u1', name: 'Sistem Yöneticisi', email: 'admin@akop.com.tr', role: 'Admin', department: 'IT', status: 'Aktif', lastLogin: new Date().toISOString() },
    { id: 'u2', name: 'Ayşe Uyum', email: 'uyum@akop.com.tr', role: 'Uyum Uzmanı', department: 'Uyum', status: 'Aktif', lastLogin: new Date().toISOString() },
    { id: 'u3', name: 'Mehmet Operasyon', email: 'operasyon@akop.com.tr', role: 'Operasyon Uzmanı', department: 'Operasyon', status: 'Aktif', lastLogin: new Date().toISOString() },
    { id: 'u4', name: 'Ahmet Yönetici', email: 'yonetici@akop.com.tr', role: 'Yönetici', department: 'Yönetim', status: 'Aktif', lastLogin: new Date().toISOString() },
    { id: 'u5', name: 'Fatma Denetçi', email: 'denetci@akop.com.tr', role: 'Denetçi', department: 'İç Denetim', status: 'Aktif', lastLogin: new Date().toISOString() },
  ]
}

export function getUsers(): User[] {
  return loadUsers()
}

export function updateUser(user: User): boolean {
  const users = loadUsers()
  const idx = users.findIndex((u) => u.id === user.id)
  if (idx === -1) return false
  users[idx] = user
  saveUsers(users)
  return true
}

export function getUserPermissions(user: User | null) {
  if (!user) return ROLE_PERMISSIONS['Denetçi']
  return ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS['Denetçi']
}

export function canUpdateTask(task: { assignedTo?: string }, user: User | null): boolean {
  if (!user) return false
  const perms = getUserPermissions(user)
  if (perms.canUpdateAnyTask) return true
  if (user.role === 'Operasyon Uzmanı' && task.assignedTo === user.name) return true
  return false
}

export function getRoleBadgeClass(role: UserRole) {
  switch (role) {
    case 'Admin': return 'bg-slate-900 text-white border-slate-900'
    case 'Uyum Uzmanı': return 'bg-violet-50 text-violet-700 border-violet-200/60'
    case 'Operasyon Uzmanı': return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'Yönetici': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Denetçi': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}
