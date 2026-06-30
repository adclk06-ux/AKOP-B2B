export interface SecuritySession {
  id: string
  userId: string
  userName: string
  role: string
  device: string
  ip: string
  location: string
  lastActivity: string
  status: 'Aktif' | 'Pasif' | 'Kilitli'
}

export interface LoginRecord {
  id: string
  userId: string
  userName: string
  timestamp: string
  ip: string
  device: string
  status: 'Başarılı' | 'Başarısız'
  failureReason?: string
}

export interface MFAStatus {
  userId: string
  userName: string
  role: string
  mfaEnabled: boolean
  method?: 'TOTP' | 'SMS' | 'Email'
  lastVerified?: string
  mfaRequired: boolean
}

export interface ApiKey {
  id: string
  name: string
  maskedKey: string
  scope: string
  createdAt: string
  lastUsed?: string
  status: 'Aktif' | 'Pasif' | 'İptal'
}

export interface SecurityPolicy {
  id: string
  name: string
  category: 'RBAC' | 'MFA' | 'Session' | 'Audit' | 'Approval' | 'Data'
  status: 'Aktif' | 'Pasif' | 'İncelemede'
  description: string
  lastUpdated: string
}

const SESSIONS_KEY = 'akop_security_sessions_v1'
const LOGIN_KEY = 'akop_security_login_v1'
const MFA_KEY = 'akop_security_mfa_v1'
const APIKEY_KEY = 'akop_security_apikeys_v1'
const POLICY_KEY = 'akop_security_policies_v1'

function load<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T[]
  } catch {
    return fallback
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data))
}

export function fetchSecuritySessions(): SecuritySession[] {
  return load(SESSIONS_KEY, seedMockSessions())
}

export function fetchLoginRecords(): LoginRecord[] {
  return load(LOGIN_KEY, seedMockLogins())
}

export function fetchMFAStatuses(): MFAStatus[] {
  return load(MFA_KEY, seedMockMFA())
}

export function fetchApiKeys(): ApiKey[] {
  return load(APIKEY_KEY, seedMockApiKeys())
}

export function fetchSecurityPolicies(): SecurityPolicy[] {
  return load(POLICY_KEY, seedMockPolicies())
}

export function terminateSession(sessionId: string): boolean {
  const sessions = fetchSecuritySessions()
  const idx = sessions.findIndex((s) => s.id === sessionId)
  if (idx === -1) return false
  sessions[idx] = { ...sessions[idx], status: 'Pasif' }
  save(SESSIONS_KEY, sessions)
  return true
}

export function requireMFA(userId: string): MFAStatus | null {
  const items = fetchMFAStatuses()
  const idx = items.findIndex((m) => m.userId === userId)
  if (idx === -1) return null
  items[idx] = { ...items[idx], mfaRequired: true }
  save(MFA_KEY, items)
  return items[idx]
}

export function resetMFA(userId: string): MFAStatus | null {
  const items = fetchMFAStatuses()
  const idx = items.findIndex((m) => m.userId === userId)
  if (idx === -1) return null
  items[idx] = { ...items[idx], mfaEnabled: false, mfaRequired: false, method: undefined, lastVerified: undefined }
  save(MFA_KEY, items)
  return items[idx]
}

export function rotateApiKey(keyId: string): ApiKey | null {
  const keys = fetchApiKeys()
  const idx = keys.findIndex((k) => k.id === keyId)
  if (idx === -1) return null
  const now = new Date().toISOString()
  keys[idx] = { ...keys[idx], createdAt: now, maskedKey: generateMaskedKey() }
  save(APIKEY_KEY, keys)
  return keys[idx]
}

export function revokeApiKey(keyId: string): ApiKey | null {
  const keys = fetchApiKeys()
  const idx = keys.findIndex((k) => k.id === keyId)
  if (idx === -1) return null
  keys[idx] = { ...keys[idx], status: 'İptal' }
  save(APIKEY_KEY, keys)
  return keys[idx]
}

function generateMaskedKey(): string {
  return `akop_live_${'•'.repeat(16)}`
}

export function getSecurityStats(sessions: SecuritySession[], logins: LoginRecord[], mfa: MFAStatus[], keys: ApiKey[]) {
  return {
    activeSessions: sessions.filter((s) => s.status === 'Aktif').length,
    failedLogins: logins.filter((l) => l.status === 'Başarısız').length,
    mfaActiveUsers: mfa.filter((m) => m.mfaEnabled).length,
    mfaRequiredUsers: mfa.filter((m) => m.mfaRequired).length,
    permissionChanges: 0,
    criticalEvents: logins.filter((l) => l.status === 'Başarısız').length + sessions.filter((s) => s.status === 'Kilitli').length,
    apiKeys: keys.filter((k) => k.status === 'Aktif').length,
    totalUsers: mfa.length,
  }
}

export function getPolicyStatusBadgeClass(status: SecurityPolicy['status']) {
  switch (status) {
    case 'Aktif': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'Pasif': return 'bg-slate-50 text-slate-500 border-slate-200/60'
    case 'İncelemede': return 'bg-amber-50 text-amber-700 border-amber-200/60'
  }
}

function seedMockSessions(): SecuritySession[] {
  const now = new Date().toISOString()
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const data: SecuritySession[] = [
    { id: 'sess-001', userId: 'u-001', userName: 'Ahmet Yılmaz', role: 'Uyum Uzmanı', device: 'Chrome / macOS', ip: '192.168.1.45', location: 'İstanbul, TR', lastActivity: now, status: 'Aktif' },
    { id: 'sess-002', userId: 'u-002', userName: 'Can Özdemir', role: 'Operasyon Uzmanı', device: 'Firefox / Windows', ip: '10.0.0.12', location: 'Ankara, TR', lastActivity: now, status: 'Aktif' },
    { id: 'sess-003', userId: 'u-003', userName: 'Selin Kaya', role: 'Uyum Uzmanı', device: 'Safari / iOS', ip: '172.16.0.8', location: 'İzmir, TR', lastActivity: yesterday, status: 'Aktif' },
    { id: 'sess-004', userId: 'u-004', userName: 'Mehmet Demir', role: 'Yönetici', device: 'Chrome / Windows', ip: '192.168.5.22', location: 'İstanbul, TR', lastActivity: yesterday, status: 'Pasif' },
    { id: 'sess-005', userId: 'u-005', userName: 'Zeynep Şahin', role: 'Operasyon Uzmanı', device: 'Edge / Windows', ip: '10.1.2.3', location: 'Bursa, TR', lastActivity: yesterday, status: 'Kilitli' },
  ]
  save(SESSIONS_KEY, data)
  return data
}

function seedMockLogins(): LoginRecord[] {
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString()
  const data: LoginRecord[] = [
    { id: 'login-001', userId: 'u-001', userName: 'Ahmet Yılmaz', timestamp: yesterday, ip: '192.168.1.45', device: 'Chrome / macOS', status: 'Başarılı' },
    { id: 'login-002', userId: 'u-002', userName: 'Can Özdemir', timestamp: twoDaysAgo, ip: '10.0.0.12', device: 'Firefox / Windows', status: 'Başarılı' },
    { id: 'login-003', userId: 'u-001', userName: 'Ahmet Yılmaz', timestamp: yesterday, ip: '192.168.1.99', device: 'Chrome / macOS', status: 'Başarısız', failureReason: 'Yanlış şifre' },
    { id: 'login-004', userId: 'u-005', userName: 'Zeynep Şahin', timestamp: yesterday, ip: '10.1.2.3', device: 'Edge / Windows', status: 'Başarısız', failureReason: 'Hesap kilitli' },
    { id: 'login-005', userId: 'u-003', userName: 'Selin Kaya', timestamp: twoDaysAgo, ip: '172.16.0.8', device: 'Safari / iOS', status: 'Başarılı' },
    { id: 'login-006', userId: 'u-004', userName: 'Mehmet Demir', timestamp: yesterday, ip: '192.168.5.22', device: 'Chrome / Windows', status: 'Başarısız', failureReason: 'Yanlış şifre' },
  ]
  save(LOGIN_KEY, data)
  return data
}

function seedMockMFA(): MFAStatus[] {
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const data: MFAStatus[] = [
    { userId: 'u-001', userName: 'Ahmet Yılmaz', role: 'Uyum Uzmanı', mfaEnabled: true, method: 'TOTP', lastVerified: yesterday, mfaRequired: true },
    { userId: 'u-002', userName: 'Can Özdemir', role: 'Operasyon Uzmanı', mfaEnabled: false, mfaRequired: false },
    { userId: 'u-003', userName: 'Selin Kaya', role: 'Uyum Uzmanı', mfaEnabled: true, method: 'SMS', lastVerified: yesterday, mfaRequired: true },
    { userId: 'u-004', userName: 'Mehmet Demir', role: 'Yönetici', mfaEnabled: true, method: 'Email', lastVerified: yesterday, mfaRequired: true },
    { userId: 'u-005', userName: 'Zeynep Şahin', role: 'Operasyon Uzmanı', mfaEnabled: false, mfaRequired: false },
    { userId: 'u-006', userName: 'Admin Kullanıcı', role: 'Admin', mfaEnabled: true, method: 'TOTP', lastVerified: yesterday, mfaRequired: true },
  ]
  save(MFA_KEY, data)
  return data
}

function seedMockApiKeys(): ApiKey[] {
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const lastWeek = new Date(Date.now() - 7 * 86400000).toISOString()
  const data: ApiKey[] = [
    { id: 'api-001', name: 'SPK Sync API', maskedKey: generateMaskedKey(), scope: 'REGTECH_READ', createdAt: lastWeek, lastUsed: yesterday, status: 'Aktif' },
    { id: 'api-002', name: 'MKK Reconciliation API', maskedKey: generateMaskedKey(), scope: 'MKK_WRITE', createdAt: lastWeek, lastUsed: yesterday, status: 'Aktif' },
    { id: 'api-003', name: 'Takasbank Alert API', maskedKey: generateMaskedKey(), scope: 'TAKASBANK_READ', createdAt: yesterday, lastUsed: yesterday, status: 'Aktif' },
    { id: 'api-004', name: 'Audit Export API', maskedKey: generateMaskedKey(), scope: 'AUDIT_READ', createdAt: lastWeek, status: 'Pasif' },
  ]
  save(APIKEY_KEY, data)
  return data
}

function seedMockPolicies(): SecurityPolicy[] {
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString()
  const data: SecurityPolicy[] = [
    { id: 'pol-001', name: 'RBAC Politikası', category: 'RBAC', status: 'Aktif', description: 'Rol tabanlı erişim kontrolü. Her kullanıcı sadece atanmış yetkilere sahip olabilir.', lastUpdated: lastMonth },
    { id: 'pol-002', name: 'MFA Politikası', category: 'MFA', status: 'Aktif', description: 'Admin ve Denetçi rolleri için MFA zorunlu. Uyum Uzmanları tercihe bağlı.', lastUpdated: yesterday },
    { id: 'pol-003', name: 'Oturum Zaman Aşımı', category: 'Session', status: 'Aktif', description: '30 dakika hareketsizlik sonrası otomatik oturum kapatma.', lastUpdated: lastMonth },
    { id: 'pol-004', name: 'Audit Retention', category: 'Audit', status: 'Aktif', description: 'Denetim kayıtları 7 yıl süreyle saklanır. Kriptografik imza ile korunur.', lastUpdated: lastMonth },
    { id: 'pol-005', name: 'Çok Aşamalı Onay Politikası', category: 'Approval', status: 'Aktif', description: 'Kritik işlemler en az 2 aşamalı onay gerektirir.', lastUpdated: yesterday },
    { id: 'pol-006', name: 'Veri Dışa Aktarım Politikası', category: 'Data', status: 'İncelemede', description: 'KVKK uyumlu veri anonimleştirme ve şifreleme kuralları.', lastUpdated: yesterday },
  ]
  save(POLICY_KEY, data)
  return data
}
