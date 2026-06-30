import { useState, useEffect, useRef, useCallback } from 'react'
import { Inbox, Check, ExternalLink, Loader2, Trash2 } from 'lucide-react'
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  deleteAllNotifications,
  type NotificationItem,
} from '@/services/notifications'

const POLL_INTERVAL_MS = 60_000

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [markingAll, setMarkingAll] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await fetchUnreadCount()
      setUnreadCount(data.unreadCount)
    } catch {
      // Silently fail on polling errors
    }
  }, [])

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchNotifications({ unreadOnly: false, limit: 20 })
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial unread count + polling
  useEffect(() => {
    refreshUnreadCount()
    const id = setInterval(refreshUnreadCount, POLL_INTERVAL_MS)
    window.addEventListener('akop:notifications-updated', refreshUnreadCount)
    return () => {
      clearInterval(id)
      window.removeEventListener('akop:notifications-updated', refreshUnreadCount)
    }
  }, [refreshUnreadCount])

  // Load list when dropdown opens
  useEffect(() => {
    if (open) loadNotifications()
  }, [open, loadNotifications])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // ignore
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setNotifications((prev) =>
        prev.map((n) => (n.readAt ? n : { ...n, readAt: new Date().toISOString() }))
      )
      setUnreadCount(0)
    } catch {
      // ignore
    } finally {
      setMarkingAll(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id)
      setNotifications((prev) => prev.filter((n) => n.id !== id))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch {
      // ignore
    }
  }

  const handleDeleteAll = async () => {
    setDeletingAll(true)
    try {
      await deleteAllNotifications()
      setNotifications([])
      setUnreadCount(0)
    } catch {
      // ignore
    } finally {
      setDeletingAll(false)
    }
  }

  const impactBadgeClass = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-rose-50 text-rose-700 border-rose-200/60'
      case 'high':
        return 'bg-orange-50 text-orange-700 border-orange-200/60'
      case 'medium':
        return 'bg-amber-50 text-amber-700 border-amber-200/60'
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200/60'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl px-2 py-1.5 transition-colors"
        aria-label="Mesajlar"
      >
        <Inbox size={18} />
        <span className="text-xs font-medium hidden sm:inline">Mesajlar</span>
        {unreadCount > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold border-2 border-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[380px] max-w-[92vw] rounded-2xl border border-slate-200/80 bg-white shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Mesaj Kutusu</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Okunmamış: {unreadCount}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {notifications.some((n) => !n.readAt) && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  disabled={markingAll}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
                >
                  {markingAll ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Tümünü Okundu İşaretle
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleDeleteAll}
                  disabled={deletingAll}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg px-2 py-1 transition-colors disabled:opacity-50"
                >
                  {deletingAll ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  Tümünü Sil
                </button>
              )}
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10 text-slate-400">
                <Loader2 size={20} className="animate-spin mr-2" />
                <span className="text-xs">Yükleniyor...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Inbox size={24} className="mb-2 opacity-40" />
                <span className="text-xs">Henüz mesaj yok.</span>
              </div>
            ) : (
              <ul className="divide-y divide-slate-50">
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`px-4 py-3 transition-colors hover:bg-slate-50/60 ${
                      !n.readAt ? 'bg-slate-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100/60 uppercase tracking-wide">
                            {n.authority}
                          </span>
                          <span
                            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border ${impactBadgeClass(
                              n.impactLevel
                            )}`}
                          >
                            {n.impactLevel === 'critical'
                              ? 'Kritik'
                              : n.impactLevel === 'high'
                              ? 'Yüksek'
                              : n.impactLevel === 'medium'
                              ? 'Orta'
                              : 'Düşük'}
                          </span>
                          {n.requiresComplianceReview && (
                            <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100/60">
                              Uyum
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-medium text-slate-800 leading-snug truncate" title={n.title}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(n.createdAt).toLocaleString('tr-TR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          <div className="flex items-center gap-1.5 ml-auto">
                            {n.url && (
                              <a
                                href={n.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleMarkRead(n.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                <ExternalLink size={11} />
                                İncele
                              </a>
                            )}
                            {!n.readAt && (
                              <button
                                type="button"
                                onClick={() => handleMarkRead(n.id)}
                                className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md px-1.5 py-0.5 transition-colors"
                              >
                                <Check size={11} />
                                Okundu
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(n.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium bg-red-50 text-red-600 border border-red-100 rounded-md px-1.5 py-0.5 hover:bg-red-100 transition-colors"
                            >
                              <Trash2 size={11} />
                              Sil
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
