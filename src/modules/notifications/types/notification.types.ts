export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  module: string
  isRead: boolean
  actionUrl?: string
  createdAt: string
}

export interface NotificationPreferences {
  email: boolean
  push: boolean
  inApp: boolean
  modules: string[]
}
