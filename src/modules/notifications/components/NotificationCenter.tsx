import { useEffect, useState } from 'react'
import type { NotificationItem } from '../types/notification.types'
import { fetchNotifications, markNotificationRead } from '../services/notificationService'

export default function NotificationCenter() {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, isRead: true } : i)))
  }

  if (loading) return <div className="p-4 text-sm text-slate-500">Yükleniyor...</div>

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {items.map((n) => (
        <div
          key={n.id}
          className={`flex items-center justify-between rounded-md border p-3 ${n.isRead ? 'border-slate-200 opacity-70' : 'border-blue-200 bg-blue-50'}`}
        >
          <div>
            <div className="text-sm font-medium">{n.title}</div>
            <div className="text-xs text-slate-500">{n.message}</div>
          </div>
          {!n.isRead && (
            <button
              className="text-xs text-blue-600 hover:underline"
              onClick={() => handleMarkRead(n.id)}
            >
              Okundu
            </button>
          )}
        </div>
      ))}
      {items.length === 0 && <div className="text-sm text-slate-400">Bildirim bulunamadı.</div>}
    </div>
  )
}
