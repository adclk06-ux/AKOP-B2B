import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useEffect, useState } from 'react'
import { Search, Zap } from 'lucide-react'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import { fetchNotifications, runRegulatoryLiveScan, type NotificationItem } from '@/services/notifications'
import { useThemePreference } from '@/hooks/useThemePreference'

const LIVE_SCAN_INTERVAL_MS = 60_000

export default function Layout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [newNotification, setNewNotification] = useState<NotificationItem | null>(null)
  useThemePreference()

  useEffect(() => {
    if (!user) return
    let cancelled = false
    let hideTimer: number | undefined

    async function scan() {
      try {
        const result = await runRegulatoryLiveScan()
        if (cancelled || result.created === 0) return
        const latest = await fetchNotifications({ unreadOnly: true, limit: 1 })
        if (cancelled) return
        const item = latest.notifications[0]
        if (item) {
          setNewNotification(item)
          window.dispatchEvent(new CustomEvent('akop:notifications-updated'))
          window.clearTimeout(hideTimer)
          hideTimer = window.setTimeout(() => setNewNotification(null), 8000)
        }
      } catch {
        // Live scan should never block the panel.
      }
    }

    scan()
    const interval = window.setInterval(scan, LIVE_SCAN_INTERVAL_MS)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.clearTimeout(hideTimer)
    }
  }, [user])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="akop-shell flex min-h-screen">
      <Sidebar
        isOpen={sidebarOpen}
        mobileOpen={mobileOpen}
        onLinkClick={() => setMobileOpen(false)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <main className={`flex-1 flex flex-col min-w-0 overflow-x-hidden transition-all duration-200 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'}`}>
        <header className="akop-topbar h-16 border-b px-4 lg:px-8 flex items-center justify-between select-none gap-3 backdrop-blur" style={{ borderColor: 'hsl(var(--akop-border))' }}>
          <div className="flex items-center gap-3">
            <h1 className="text-base font-bold tracking-tight" style={{ color: 'hsl(var(--akop-text))' }}>AKOP</h1>
            <div className="hidden sm:block w-px h-4" style={{ backgroundColor: 'hsl(var(--akop-border))' }} />
            <span className="hidden sm:inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider" style={{ backgroundColor: 'hsl(var(--akop-surface-elevated) / 0.82)', color: 'hsl(var(--akop-muted))', border: '1px solid hsl(var(--akop-border))' }}>
              PROD-V2
            </span>
          </div>
          <div className="akop-global-search hidden min-w-0 flex-1 items-center gap-2 md:flex max-w-xl mx-4">
            <Search size={15} className="shrink-0" />
            <input
              aria-label="Global arama"
              className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              placeholder="Global Search..."
            />
            <span className="rounded-md border px-1.5 py-0.5 text-[10px]" style={{ borderColor: 'hsl(var(--akop-border))', color: 'hsl(var(--akop-muted-soft))' }}>⌘K</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <NotificationBell />
            <button className="akop-topbar-action hidden items-center gap-2 lg:inline-flex" type="button">
              <Zap size={14} />
              <span>Quick Actions</span>
            </button>
            <div className="hidden sm:flex items-center gap-2.5 pl-1">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold border" style={{ backgroundColor: 'hsl(var(--akop-surface-elevated))', color: 'hsl(var(--akop-text))', borderColor: 'hsl(var(--akop-border))' }}>
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-semibold" style={{ color: 'hsl(var(--akop-text))' }}>{user?.name || 'Admin Kullanıcı'}</span>
                <span className="text-[10px] mt-0.5 capitalize" style={{ color: 'hsl(var(--akop-muted-soft))' }}>{user?.role}</span>
              </div>
            </div>
          </div>
        </header>
        {newNotification && (
          <div className="fixed right-4 top-20 z-50 w-[360px] max-w-[calc(100vw-2rem)] rounded-xl border bg-card shadow-xl" style={{ borderColor: 'hsl(var(--akop-accent) / 0.36)', background: 'linear-gradient(180deg, hsl(var(--akop-surface-elevated) / 0.98), hsl(var(--akop-surface) / 0.98))' }}>
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'hsl(var(--akop-accent))' }}>Yeni bildiriminiz var</p>
                  <p className="mt-1 text-sm font-semibold truncate" style={{ color: 'hsl(var(--akop-text))' }}>{newNotification.title}</p>
                  <p className="mt-1 text-xs" style={{ color: 'hsl(var(--akop-muted))' }}>{newNotification.message}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewNotification(null)}
                  className="rounded-lg px-2 py-1 text-xs font-semibold transition-colors hover:bg-secondary"
                  style={{ color: 'hsl(var(--akop-muted))' }}
                >
                  Kapat
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto overflow-x-hidden">{children}</div>
      </main>
    </div>
  )
}
