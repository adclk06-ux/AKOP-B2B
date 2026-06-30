// server/stores/notificationStore.js
// In-memory store for AKOP regulatory notifications

import { sendSms } from '../integrations/sms/smsProvider.js'
import { sendRegulatoryEmail } from '../integrations/email/emailProvider.js'

// Demo user config: SMS alerts enabled, placeholder phone number
const DEMO_USER = {
  phoneNumber: '+905xxxxxxxxx',
  notificationPreferences: {
    smsRegtechAlerts: true,
  },
}

/** @type {Array<{
 *   id: string,
 *   authority: string,
 *   sourceType: string,
 *   sourceRecordId: string,
 *   title: string,
 *   message: string,
 *   url: string | null,
 *   impactLevel: "low" | "medium" | "high" | "critical",
 *   requiresComplianceReview: boolean,
 *   createdAt: string,
 *   readAt: string | null,
 *   channels: { inApp: boolean, sms: boolean }
 * }>} */
let notifications = []

// Track which source records already have a notification (prevent duplicates)
const seenSourceRecordIds = new Set()

export function createNotification(notification) {
  if (!notification.sourceRecordId) {
    throw new Error('sourceRecordId is required')
  }
  if (seenSourceRecordIds.has(notification.sourceRecordId)) {
    return null
  }

  const entry = {
    id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    authority: notification.authority || 'SPK',
    sourceType: notification.sourceType || 'unknown',
    sourceRecordId: notification.sourceRecordId,
    title: notification.title || '',
    message: notification.message || '',
    url: notification.url || null,
    impactLevel: notification.impactLevel || 'low',
    requiresComplianceReview: Boolean(notification.requiresComplianceReview),
    createdAt: notification.createdAt || new Date().toISOString(),
    readAt: null,
    channels: {
      inApp: true,
      sms: Boolean(notification.channels?.sms),
    },
  }

  notifications.unshift(entry)
  seenSourceRecordIds.add(notification.sourceRecordId)

  // Auto-send mock SMS if all conditions met
  if (
    entry.channels.sms &&
    (entry.impactLevel === 'high' || entry.impactLevel === 'critical') &&
    entry.requiresComplianceReview &&
    DEMO_USER.phoneNumber &&
    DEMO_USER.notificationPreferences.smsRegtechAlerts
  ) {
    const smsMessage = 'AKOP: Yeni yüksek etkili SPK bildirimi tespit edildi. Detaylar için AKOP panelini kontrol edin.'
    sendSms({
      to: DEMO_USER.phoneNumber,
      message: smsMessage,
      notificationId: entry.id,
    }).catch((err) => console.warn('[NotificationStore] Mock SMS failed:', err.message || err))
  }

  console.info(`[NotificationStore] Created notification: ${entry.id} | ${entry.title} | impact=${entry.impactLevel}`)

  if (entry.requiresComplianceReview || entry.impactLevel === 'high' || entry.impactLevel === 'critical') {
    sendRegulatoryEmail({ notification: entry })
      .then((result) => {
        if (result.success) console.info(`[NotificationStore] Email sent for notification ${entry.id}`)
        else if (!result.skipped) console.warn(`[NotificationStore] Email failed for notification ${entry.id}: ${result.error}`)
      })
      .catch((err) => console.warn('[NotificationStore] Email provider error:', err.message || err))
  }

  return entry
}

export function createNotificationFromRegulatoryRecord(record) {
  if (!record || !record.id) {
    console.warn('[NotificationStore] Cannot create notification: missing record.id')
    return null
  }

  const sourceRecordId = String(record.id)
  if (seenSourceRecordIds.has(sourceRecordId)) {
    return null
  }

  const sourceType = record.sourceType || 'unknown'

  // Build title based on sourceType
  let title = ''
  if (sourceType === 'bulletin') {
    const number = record.number || 'Bilinmeyen'
    title = `Yeni SPK Bülteni: ${number}`
  } else if (sourceType === 'press-release') {
    const headline = record.title || 'Basın Duyurusu'
    title = `Yeni SPK Basın Duyurusu: ${headline}`
  } else if (sourceType === 'legislation') {
    const headline = record.title || 'Mevzuat Kaydı'
    title = `Yeni SPK Mevzuat Kaydı: ${headline}`
  } else {
    title = `Yeni SPK Kaydı: ${record.title || 'Bilinmeyen'}`
  }

  // Message
  const message = 'SPK tarafından yeni bir düzenleyici kaynak yayımlandı. Uyum ekibi tarafından incelenmesi önerilir.'

  // Determine impactLevel
  let impactLevel = record.impactLevel || 'low'
  if (!record.impactLevel) {
    if (sourceType === 'legislation') impactLevel = 'high'
    else if (sourceType === 'bulletin') impactLevel = 'medium'
    else if (sourceType === 'press-release') impactLevel = 'medium'
    else impactLevel = 'low'
  }

  // Determine requiresComplianceReview
  let requiresComplianceReview = false
  if (sourceType === 'legislation') {
    requiresComplianceReview = true
  } else if (sourceType === 'bulletin') {
    requiresComplianceReview = true
  } else if (sourceType === 'press-release') {
    const t = (record.title || '').toLowerCase()
    const keywords = ['dolandırıcılık', 'uyarı', 'tedbir', 'yaptırım']
    requiresComplianceReview = keywords.some((kw) => t.includes(kw))
  }

  const notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    authority: 'SPK',
    sourceType,
    sourceRecordId,
    title,
    message,
    url: record.url || null,
    impactLevel,
    requiresComplianceReview,
    createdAt: new Date().toISOString(),
    channels: {
      inApp: true,
      sms: impactLevel === 'high' || impactLevel === 'critical',
    },
  }

  return createNotification(notification)
}

export function getNotifications({ unreadOnly = false, limit = 20 } = {}) {
  let results = [...notifications]
  if (unreadOnly) {
    results = results.filter((n) => !n.readAt)
  }
  results = results.slice(0, Math.max(1, Number(limit) || 20))
  const unreadCount = notifications.filter((n) => !n.readAt).length
  return { notifications: results, unreadCount }
}

export function getUnreadCount() {
  return notifications.filter((n) => !n.readAt).length
}

export function markNotificationRead(id) {
  const notif = notifications.find((n) => n.id === id)
  if (!notif) return false
  if (!notif.readAt) {
    notif.readAt = new Date().toISOString()
    console.info(`[NotificationStore] Marked read: ${id}`)
  }
  return true
}

export function markAllNotificationsRead() {
  let changed = 0
  for (const n of notifications) {
    if (!n.readAt) {
      n.readAt = new Date().toISOString()
      changed++
    }
  }
  console.info(`[NotificationStore] Marked all read (${changed} notifications)`)
  return changed
}

export function deleteNotification(id) {
  const idx = notifications.findIndex((n) => n.id === id)
  if (idx === -1) return false
  const removed = notifications.splice(idx, 1)[0]
  seenSourceRecordIds.delete(removed.sourceRecordId)
  console.info(`[NotificationStore] Deleted notification: ${id}`)
  return true
}

export function deleteAllNotifications() {
  const count = notifications.length
  notifications = []
  seenSourceRecordIds.clear()
  console.info(`[NotificationStore] Deleted all notifications (${count})`)
  return count
}

export function hasNotificationForSourceRecord(sourceRecordId) {
  return seenSourceRecordIds.has(String(sourceRecordId))
}

export function getNotificationStoreStats() {
  return {
    total: notifications.length,
    unread: getUnreadCount(),
    seenSourceRecordIds: seenSourceRecordIds.size,
  }
}

export function resetNotificationStore() {
  notifications = []
  seenSourceRecordIds.clear()
}
