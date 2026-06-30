import type { NotificationItem, NotificationPreferences } from '../types/notification.types'

export async function fetchNotifications(): Promise<NotificationItem[]> {
  const res = await fetch('/api/notifications')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function markNotificationRead(id: string): Promise<void> {
  const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

export async function updateNotificationPreferences(prefs: NotificationPreferences): Promise<void> {
  const res = await fetch('/api/notifications/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prefs),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
