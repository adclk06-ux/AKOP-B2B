import { create } from 'zustand'
import type { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  users: User[]
  login: (email: string, password: string) => boolean
  logout: () => void
  addUser: (user: Omit<User, 'id'>) => void
  updateUser: (id: string, data: Partial<User>) => void
  deleteUser: (id: string) => void
}

const mockUsers: User[] = [
  { id: '1', name: 'Admin Kullanıcı', email: 'admin@akop.com', role: 'admin', active: true },
  { id: '2', name: 'Operasyon Kullanıcı', email: 'ops@akop.com', role: 'operation', active: true },
  { id: '3', name: 'Onay Yetkilisi', email: 'onay@akop.com', role: 'approver', active: true },
  { id: '4', name: 'Denetçi', email: 'denetci@akop.com', role: 'auditor', active: true },
  { id: '5', name: 'Yönetici / Onay Makamı', email: 'yonetici@akop.com', role: 'manager', active: true },
]

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  users: mockUsers,
  login: (email: string, _password: string) => {
    const found = mockUsers.find((u) => u.email === email && u.active)
    if (found) {
      set({ user: found })
      return true
    }
    return false
  },
  logout: () => set({ user: null }),
  addUser: (userData) =>
    set((state) => ({
      users: [...state.users, { ...userData, id: String(state.users.length + 1) }],
    })),
  updateUser: (id, data) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === id ? { ...u, ...data } : u)),
    })),
  deleteUser: (id) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    })),
}))

export const roleLabels: Record<UserRole, string> = {
  admin: 'Admin',
  operation: 'Operasyon',
  approver: 'Onay Yetkilisi',
  manager: 'Yönetici / Onay Makamı',
  auditor: 'Denetçi',
}

export const roleColors: Record<UserRole, string> = {
  admin: 'bg-slate-50 text-slate-700 border border-slate-200',
  operation: 'bg-blue-50 text-blue-700 border border-blue-200',
  approver: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  manager: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  auditor: 'bg-amber-50 text-amber-700 border border-amber-200',
}
