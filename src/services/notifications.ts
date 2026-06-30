// src/services/notifications.ts
const BASE = '/api'

export interface NotificationItem {
  id: string
  authority: string
  sourceType: string
  sourceRecordId: string
  title: string
  message: string
  url: string | null
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  requiresComplianceReview: boolean
  createdAt: string
  readAt: string | null
  channels: { inApp: boolean; sms: boolean }
}

export interface NotificationsResponse {
  notifications: NotificationItem[]
  unreadCount: number
}

export interface UnreadCountResponse {
  unreadCount: number
}

export interface LiveScanResult {
  authority: string
  checkedAt: string
  status: 'checked' | 'no-live-adapter'
  latestRecordId: string | null
  latestTitle: string | null
  notificationCreated: boolean
  notificationId: string | null
}

export interface LiveScanResponse {
  checkedAt: string
  created: number
  unreadCount: number
  results: LiveScanResult[]
}

export interface AlertEmailsResponse {
  durableEnabled: boolean
  emails: string[]
  userEmails: string[]
}

export async function fetchNotifications(options?: { unreadOnly?: boolean; limit?: number }): Promise<NotificationsResponse> {
  const params = new URLSearchParams()
  if (options?.unreadOnly) params.set('unreadOnly', 'true')
  if (options?.limit) params.set('limit', String(options.limit))
  const query = params.toString() ? `?${params.toString()}` : ''

  const res = await fetch(`${BASE}/notifications${query}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Bildirimler alınamadı.')
  }
  return res.json()
}

export async function fetchUnreadCount(): Promise<UnreadCountResponse> {
  const res = await fetch(`${BASE}/notifications/unread-count`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Okunmamış sayı alınamadı.')
  }
  return res.json()
}

export async function runRegulatoryLiveScan(): Promise<LiveScanResponse> {
  const res = await fetch(`${BASE}/regulatory/live-scan`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Canlı kurum taraması çalıştırılamadı.')
  }
  return res.json()
}

export async function fetchAlertEmails(): Promise<AlertEmailsResponse> {
  const res = await fetch(`${BASE}/alert-emails`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Mail ayarları alınamadı.')
  }
  return res.json()
}

export async function saveAlertEmail(email: string): Promise<AlertEmailsResponse> {
  const res = await fetch(`${BASE}/alert-emails`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Mail adresi kaydedilemedi.')
  }
  return res.json()
}

export async function deleteAlertEmail(email: string): Promise<AlertEmailsResponse> {
  const res = await fetch(`${BASE}/alert-emails/${encodeURIComponent(email)}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Mail adresi silinemedi.')
  }
  return res.json()
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`${BASE}/notifications/${id}/read`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Bildirim okundu işaretlenemedi.')
  }
}

export async function markAllNotificationsRead(): Promise<void> {
  const res = await fetch(`${BASE}/notifications/read-all`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Bildirimler okundu işaretlenemedi.')
  }
}

export async function deleteNotification(id: string): Promise<void> {
  const res = await fetch(`${BASE}/notifications/${id}`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Bildirim silinemedi.')
  }
}

export async function deleteAllNotifications(): Promise<void> {
  const res = await fetch(`${BASE}/notifications/delete-all`, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Bildirimler silinemedi.')
  }
}
