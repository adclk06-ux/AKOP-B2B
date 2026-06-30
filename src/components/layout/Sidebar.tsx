import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useTransactionStore } from '@/store/transactionStore'
import {
  LayoutDashboard,
  ClipboardCheck,
  Users,
  LogOut,
  Bot,
  FileSpreadsheet,
  ShieldAlert,
  Landmark,
  Diamond,
  ShieldCheck,
  BarChart3,
  Wrench,
  AlertTriangle,
  Building2,
  SearchCheck,
  CalendarDays,
  ScanSearch,
  GraduationCap,
  BadgeAlert,
  Settings,
  ChevronDown,
  Activity,
  Lock,
  Leaf,
  Search,
  Plug,
  Layers3,
  CreditCard,
  Palette,
  PanelTop,
  Cable,
  Store,
  ChartSpline,
  BrainCircuit,
  Workflow,
  Rocket,
} from 'lucide-react'

const linkGroups = [
  {
    title: 'Ana Alanlar',
    links: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'operation'] },
      { to: '/regtech', label: 'RegTech Uyum & Risk', icon: ShieldAlert, roles: ['admin', 'operation'] },
    ],
  },
  {
    title: 'Operasyon',
    links: [
      { to: '/reconciliation', label: 'MKK Mutabakat', icon: FileSpreadsheet, roles: ['admin', 'operation'] },
      { to: '/takasbank', label: 'Takasbank İzleme', icon: Landmark, roles: ['admin', 'operation'] },
      { to: '/control-testing', label: 'Kontrol Testleri', icon: ShieldCheck, roles: ['admin', 'operation'] },
      { to: '/kri-kpi', label: 'KRI & KPI', icon: BarChart3, roles: ['admin', 'operation'] },
      { to: '/capa', label: 'CAPA Center', icon: Wrench, roles: ['admin', 'operation'] },
      { to: '/incidents', label: 'Incident', icon: AlertTriangle, roles: ['admin', 'operation'] },
      { to: '/vendor-risk', label: 'Vendor Risk', icon: Building2, roles: ['admin', 'operation'] },
      { to: '/business-continuity', label: 'Business Continuity', icon: Activity, roles: ['admin', 'operation'] },
    ],
  },
  {
    title: 'Yönetişim',
    links: [
      { to: '/internal-audit', label: 'İç Denetim', icon: SearchCheck, roles: ['admin', 'operation'] },
      { to: '/compliance-calendar', label: 'Uyum Takvimi', icon: CalendarDays, roles: ['admin', 'operation'] },
      { to: '/horizon-scanning', label: 'Horizon Scan', icon: ScanSearch, roles: ['admin', 'operation'] },
      { to: '/training-awareness', label: 'Eğitim', icon: GraduationCap, roles: ['admin', 'operation'] },
      { to: '/aml-masak', label: 'AML & MASAK', icon: BadgeAlert, roles: ['admin', 'operation'] },
      { to: '/data-privacy', label: 'Data Privacy', icon: Lock, roles: ['admin', 'operation'] },
      { to: '/esg-sustainability', label: 'ESG', icon: Leaf, roles: ['admin', 'operation'] },
    ],
  },
  {
    title: 'AI ve Sistem',
    links: [
      { to: '/assistant', label: 'AKOP Copilot', icon: Bot, roles: ['admin', 'operation'] },
      { to: '/enterprise-search', label: 'Enterprise Search', icon: Search, roles: ['admin', 'operation'] },
      { to: '/ai-compliance-officer', label: 'AI Compliance Officer', icon: ShieldAlert, roles: ['admin', 'operation'] },
      { to: '/real-integrations', label: 'Real Integrations', icon: Plug, roles: ['admin', 'operation'] },
      { to: '/advanced-analytics', label: 'Advanced Analytics', icon: ChartSpline, roles: ['admin', 'operation'] },
      { to: '/ai-agent', label: 'AI Agent Layer', icon: BrainCircuit, roles: ['admin', 'operation'] },
      { to: '/autonomous-actions', label: 'Autonomous Actions', icon: Workflow, roles: ['admin', 'operation'] },
    ],
  },
  {
    title: 'SaaS & Platform',
    links: [
      { to: '/multi-tenant', label: 'Multi-Tenant SaaS', icon: Layers3, roles: ['admin', 'operation'] },
      { to: '/billing', label: 'Billing', icon: CreditCard, roles: ['admin', 'operation'] },
      { to: '/white-label', label: 'White Label', icon: Palette, roles: ['admin', 'operation'] },
      { to: '/customer-portal', label: 'Customer Portal', icon: PanelTop, roles: ['admin', 'operation'] },
      { to: '/api-gateway', label: 'API Gateway', icon: Cable, roles: ['admin', 'operation'] },
      { to: '/integration-marketplace', label: 'Marketplace', icon: Store, roles: ['admin', 'operation'] },
      { to: '/platform-one', label: 'Enterprise 1.0', icon: Rocket, roles: ['admin', 'operation'] },
      { to: '/approvals', label: 'Onaylar', icon: ClipboardCheck, roles: ['admin', 'operation'] },
      { to: '/users', label: 'Kullanıcılar', icon: Users, roles: ['admin', 'operation'] },
      { to: '/settings', label: 'Ayarlar', icon: Settings, roles: ['admin', 'operation'] },
    ],
  },
]

export default function Sidebar({
  isOpen,
  mobileOpen,
  onLinkClick,
  onToggle,
}: {
  isOpen: boolean
  mobileOpen: boolean
  onLinkClick: () => void
  onToggle: () => void
}) {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const transactions = useTransactionStore((s) => s.transactions)

  const pendingCount = transactions.filter((t) => t.status === 'pending_approval').length
  const isAdmin = user?.role === 'admin'
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => ({
    'Ana Alanlar': true,
    Operasyon: true,
    Yönetişim: true,
    'AI ve Sistem': true,
    'SaaS & Platform': true,
  }))

  const filteredGroups = linkGroups.map((g) => ({
    ...g,
    links: g.links.filter((l) => l.roles.includes(user?.role ?? '')),
  })).filter((g) => g.links.length > 0)

  function toggleGroup(title: string) {
    setOpenGroups((current) => ({ ...current, [title]: !current[title] }))
  }

  function renderLink(link: (typeof linkGroups)[number]['links'][number], compact = false, closeOnClick = false) {
    return (
      <NavLink
        key={link.to}
        to={link.to}
        onClick={closeOnClick ? onLinkClick : undefined}
        className={({ isActive }) =>
          `akop-sidebar-link relative flex items-center rounded-lg font-medium text-sm transition-all duration-200 ${
            compact ? 'px-0 py-2 justify-center' : 'px-3 py-2 justify-between'
          } ${isActive ? 'akop-sidebar-link-active' : ''}`
        }
      >
        <span className="flex min-w-0 items-center gap-3">
          <link.icon size={18} className="shrink-0" />
          <span className={`akop-truncate whitespace-nowrap transition-opacity duration-200 ${compact ? 'hidden opacity-0' : 'opacity-100'}`}>
            {link.label}
          </span>
        </span>
        {link.to === '/approvals' && isAdmin && pendingCount > 0 && (
          <span className={`bg-rose-500 text-white text-[10px] font-bold rounded-full text-center shadow-sm shadow-rose-500/20 transition-all duration-200 ${
            compact ? 'w-2 h-2 absolute top-1 right-1' : 'px-1.5 py-0.5 min-w-[18px]'
          }`}>
            {compact ? '' : pendingCount}
          </span>
        )}
      </NavLink>
    )
  }

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-30 lg:hidden" onClick={onLinkClick} />
      )}

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex fixed inset-y-0 left-0 z-40 bg-card/95 border-r select-none flex-col h-screen transition-all duration-200 dark:bg-[#08111F]/98 ${
          isOpen ? 'w-64' : 'w-16 overflow-hidden'
        }`}
        style={{ borderColor: 'hsl(var(--akop-border))' }}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-4 border-b gap-2 shrink-0" style={{ borderColor: 'hsl(var(--akop-border))' }}>
            <button
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg shrink-0 cursor-pointer transition-all duration-200 hover:scale-[1.02]"
              style={{ backgroundColor: 'hsl(var(--akop-accent) / 0.12)', color: 'hsl(var(--akop-accent))', border: '1px solid hsl(var(--akop-accent) / 0.24)' }}
              onClick={onToggle}
              aria-label="Menüyü aç/kapat"
            >
              <Diamond size={16} strokeWidth={1.8} />
            </button>
            <span className={`font-bold text-sm tracking-wider uppercase whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`} style={{ color: 'hsl(var(--akop-text))' }}>
              AKOP
            </span>
          </div>
          <nav className={`flex-1 p-2 space-y-2 ${isOpen ? 'overflow-y-auto' : 'overflow-hidden'}`} aria-label="Ana menü">
            {filteredGroups.map((group) => (
              <section key={group.title} className="space-y-1">
                {isOpen ? (
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className="akop-sidebar-group-trigger flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors"
                    style={{ color: 'hsl(var(--akop-muted-soft))' }}
                    aria-expanded={openGroups[group.title] ?? true}
                  >
                    <span className="akop-truncate">{group.title}</span>
                    <ChevronDown size={13} className={`shrink-0 transition-transform duration-200 ${(openGroups[group.title] ?? true) ? 'rotate-0' : '-rotate-90'}`} />
                  </button>
                ) : (
                  <div className="h-px bg-border/70 my-2" />
                )}
                <div className={`flex flex-col gap-1 overflow-hidden transition-all duration-200 ${!isOpen || (openGroups[group.title] ?? true) ? 'max-h-[720px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {group.links.map((link) => renderLink(link, !isOpen))}
                </div>
              </section>
            ))}
          </nav>
          <div className="p-2 border-t shrink-0" style={{ borderColor: 'hsl(var(--akop-border))' }}>
            <button
              onClick={logout}
              className={`akop-sidebar-link flex w-full items-center rounded-lg text-sm font-medium transition-all duration-200 ${
                isOpen ? 'px-3 py-2.5 gap-3' : 'px-0 py-2.5 justify-center'
              }`}
              title="Çıkış Yap"
            >
              <LogOut size={18} />
              <span className={`whitespace-nowrap transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                Çıkış Yap
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar drawer */}
      <aside
        className={`lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-card/95 border-r select-none flex flex-col h-screen justify-between transform transition-transform duration-200 dark:bg-[#08111F]/98 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ borderColor: 'hsl(var(--akop-border))' }}
      >
        <div className="flex flex-col h-full">
          <div className="h-16 flex items-center px-6 border-b gap-2" style={{ borderColor: 'hsl(var(--akop-border))' }}>
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg" style={{ backgroundColor: 'hsl(var(--akop-accent) / 0.12)', color: 'hsl(var(--akop-accent))', border: '1px solid hsl(var(--akop-accent) / 0.24)' }}>
              <Diamond size={16} strokeWidth={1.8} />
            </div>
            <span className="font-bold text-sm tracking-wider uppercase" style={{ color: 'hsl(var(--akop-text))' }}>
              AKOP
            </span>
          </div>
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto" aria-label="Mobil ana menü">
            {filteredGroups.map((group) => (
              <section key={group.title} className="space-y-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.title)}
                  className="akop-sidebar-group-trigger flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors"
                  style={{ color: 'hsl(var(--akop-muted-soft))' }}
                  aria-expanded={openGroups[group.title] ?? true}
                >
                  <span>{group.title}</span>
                  <ChevronDown size={13} className={`transition-transform duration-200 ${(openGroups[group.title] ?? true) ? 'rotate-0' : '-rotate-90'}`} />
                </button>
                <div className={`flex flex-col gap-1 overflow-hidden transition-all duration-200 ${(openGroups[group.title] ?? true) ? 'max-h-[720px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  {group.links.map((link) => renderLink(link, false, true))}
                </div>
              </section>
            ))}
          </nav>
          <div className="p-4 border-t" style={{ borderColor: 'hsl(var(--akop-border))' }}>
            <button
              onClick={logout}
              className="akop-sidebar-link flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200"
            >
              <LogOut size={18} />
              Çıkış Yap
            </button>
          </div>
        </div>
      </aside>

    </>
  )
}
