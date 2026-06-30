export type UserRole = 'ADMIN' | 'OPERATION' | 'COMPLIANCE' | 'RISK' | 'VIEWER'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  permissions: string[]
  createdAt: string
  lastLoginAt?: string
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresAt: string
}

export interface LoginPayload {
  email: string
  password: string
}
