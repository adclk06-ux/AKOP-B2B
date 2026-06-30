// server/stores/regulatoryWatchStore.js
// Durable regulatory watch storage using Upstash Redis REST when configured.

const NOTIFICATIONS_KEY = 'akop:notifications'
const SEEN_KEY = 'akop:regulatory-watch:seen-source-records'
const ALERT_EMAILS_KEY = 'akop:alert-emails'
const MAX_NOTIFICATIONS = 1000

export function isDurableWatchEnabled() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

async function redis(command, ...args) {
  if (!isDurableWatchEnabled()) return null
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([command, ...args]),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error || `Redis HTTP ${response.status}`)
  return body.result
}

export async function hasDurableSourceRecord(sourceRecordId) {
  if (!sourceRecordId || !isDurableWatchEnabled()) return false
  const result = await redis('SISMEMBER', SEEN_KEY, String(sourceRecordId))
  return result === 1 || result === true
}

export async function markDurableSourceRecord(sourceRecordId) {
  if (!sourceRecordId || !isDurableWatchEnabled()) return
  await redis('SADD', SEEN_KEY, String(sourceRecordId))
}

export async function saveDurableNotification(notification) {
  if (!isDurableWatchEnabled()) return
  await redis('LPUSH', NOTIFICATIONS_KEY, JSON.stringify(notification))
  await redis('LTRIM', NOTIFICATIONS_KEY, 0, MAX_NOTIFICATIONS - 1)
  await markDurableSourceRecord(notification.sourceRecordId)
}

export async function getDurableNotifications({ unreadOnly = false, limit = 20 } = {}) {
  if (!isDurableWatchEnabled()) return null
  const rawItems = await redis('LRANGE', NOTIFICATIONS_KEY, 0, MAX_NOTIFICATIONS - 1)
  const parsed = (Array.isArray(rawItems) ? rawItems : [])
    .map((item) => {
      try { return JSON.parse(item) } catch { return null }
    })
    .filter(Boolean)
  const notifications = parsed
    .filter((item) => !unreadOnly || !item.readAt)
    .slice(0, Math.max(1, Number(limit) || 20))
  return {
    notifications,
    unreadCount: parsed.filter((item) => !item.readAt).length,
  }
}

async function rewriteNotifications(mutator) {
  if (!isDurableWatchEnabled()) return null
  const current = await getDurableNotifications({ limit: MAX_NOTIFICATIONS })
  const items = current?.notifications || []
  const next = mutator(items)
  await redis('DEL', NOTIFICATIONS_KEY)
  for (let i = next.length - 1; i >= 0; i--) {
    await redis('LPUSH', NOTIFICATIONS_KEY, JSON.stringify(next[i]))
  }
  await redis('LTRIM', NOTIFICATIONS_KEY, 0, MAX_NOTIFICATIONS - 1)
  return next
}

export async function markDurableNotificationRead(id) {
  const changed = await rewriteNotifications((items) => items.map((item) => (
    item.id === id ? { ...item, readAt: item.readAt || new Date().toISOString() } : item
  )))
  return Boolean(changed?.some((item) => item.id === id))
}

export async function markAllDurableNotificationsRead() {
  let count = 0
  await rewriteNotifications((items) => items.map((item) => {
    if (item.readAt) return item
    count++
    return { ...item, readAt: new Date().toISOString() }
  }))
  return count
}

export async function deleteDurableNotification(id) {
  let deleted = false
  await rewriteNotifications((items) => items.filter((item) => {
    if (item.id === id) {
      deleted = true
      return false
    }
    return true
  }))
  return deleted
}

export async function deleteAllDurableNotifications() {
  if (!isDurableWatchEnabled()) return 0
  const current = await getDurableNotifications({ limit: MAX_NOTIFICATIONS })
  await redis('DEL', NOTIFICATIONS_KEY)
  return current?.notifications?.length || 0
}

export async function addDurableAlertEmail(email) {
  if (!email || !isDurableWatchEnabled()) return false
  await redis('SADD', ALERT_EMAILS_KEY, String(email).trim().toLowerCase())
  return true
}

export async function removeDurableAlertEmail(email) {
  if (!email || !isDurableWatchEnabled()) return false
  await redis('SREM', ALERT_EMAILS_KEY, String(email).trim().toLowerCase())
  return true
}

export async function getDurableAlertEmails() {
  if (!isDurableWatchEnabled()) return []
  const items = await redis('SMEMBERS', ALERT_EMAILS_KEY)
  return Array.isArray(items) ? items : []
}
