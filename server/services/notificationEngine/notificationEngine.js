// server/services/notificationEngine/notificationEngine.js
// Business logic for notifications

const notifications = []

export async function createNotification(notification) {
  const item = {
    id: `notif-${Date.now()}`,
    ...notification,
    isRead: false,
    createdAt: new Date().toISOString(),
  }
  notifications.push(item)
  return item
}

export async function listNotifications(userId) {
  return notifications
    .filter((n) => !userId || n.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function markAsRead(id) {
  const n = notifications.find((x) => x.id === id)
  if (n) n.isRead = true
  return n
}
