import type { User, AuthTokens, LoginPayload } from '../types/auth.types'

export async function login(payload: LoginPayload): Promise<{ user: User; tokens: AuthTokens }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function logout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' })
}

export async function fetchCurrentUser(): Promise<User> {
  const res = await fetch('/api/auth/me')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
