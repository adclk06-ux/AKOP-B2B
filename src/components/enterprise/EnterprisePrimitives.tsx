import * as React from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

export type EnterpriseTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'ai'

const toneClasses: Record<EnterpriseTone, string> = {
  neutral: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-600/70 dark:bg-slate-800/55 dark:text-slate-200',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-400/12 dark:text-emerald-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/42 dark:bg-amber-400/12 dark:text-amber-300',
  danger: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-400/42 dark:bg-rose-400/12 dark:text-rose-300',
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-cyan-400/36 dark:bg-cyan-400/10 dark:text-cyan-300',
  ai: 'border-violet-200 bg-violet-50 text-violet-700 dark:border-cyan-400/32 dark:bg-blue-400/10 dark:text-cyan-200',
}

export function EnterpriseBoard({
  title,
  description,
  badge,
  actions,
  children,
  className,
}: {
  title: string
  description?: string
  badge?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn('akop-data-board', className)}>
      <header className="akop-board-header">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="akop-truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
            {badge && <Badge className="border-slate-200 bg-slate-50 text-[10px] text-slate-700 dark:border-slate-600/70 dark:bg-slate-800/60 dark:text-slate-200">{badge}</Badge>}
          </div>
          {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </header>
      <div className="akop-board-body">{children}</div>
    </section>
  )
}

export function StatusCard({
  label,
  value,
  helper,
  tone = 'neutral',
}: {
  label: string
  value: React.ReactNode
  helper?: string
  tone?: EnterpriseTone
}) {
  return (
    <div className="akop-status-card">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <p className="akop-truncate text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full border', toneClasses[tone])} />
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{value}</div>
      {helper && <p className="akop-wrap text-xs text-slate-500">{helper}</p>}
    </div>
  )
}

export function UniversalSearchBar({
  value,
  onChange,
  category,
  onCategoryChange,
  categories,
  placeholder = 'Regülasyon, case, görev, kanıt, risk, politika veya workflow ara...',
}: {
  value: string
  onChange: (value: string) => void
  category: string
  onCategoryChange: (value: string) => void
  categories: Array<{ value: string; label: string }>
  placeholder?: string
}) {
  return (
    <div className="akop-search-shell">
      <div className="relative min-w-0">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="h-10 rounded-lg border-0 bg-transparent pl-9 shadow-none focus-visible:ring-1 dark:placeholder:text-slate-500"
        />
      </div>
      <select
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        className="h-10 min-w-[11rem] rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none transition-colors focus:border-slate-400 dark:border-slate-600/70 dark:bg-slate-900/70 dark:text-slate-200"
      >
        {categories.map((item) => (
          <option key={item.value} value={item.value}>{item.label}</option>
        ))}
      </select>
    </div>
  )
}

export function TimelineList({
  items,
}: {
  items: Array<{ id: string; title: string; description?: string; time?: string; tone?: EnterpriseTone }>
}) {
  return (
    <div className="akop-timeline">
      {items.map((item) => (
        <div key={item.id} className="akop-timeline-item">
          <span className={cn('mt-1 h-3 w-3 rounded-full border', toneClasses[item.tone || 'neutral'])} />
          <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700/70 dark:bg-slate-900/48">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <p className="akop-wrap text-xs font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
              {item.time && <span className="shrink-0 text-[10px] text-slate-400">{item.time}</span>}
            </div>
            {item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

export function IntegrationCard({
  name,
  description,
  status,
  tone = 'neutral',
  meta,
}: {
  name: string
  description: string
  status: string
  tone?: EnterpriseTone
  meta?: string
}) {
  return (
    <article className="akop-integration-card">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="akop-truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</h4>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <Badge className={cn('shrink-0 text-[10px]', toneClasses[tone])}>{status}</Badge>
      </div>
      {meta && <p className="akop-wrap text-[11px] text-slate-400">{meta}</p>}
    </article>
  )
}

export function AIInfoBox({
  title,
  children,
  tone = 'ai',
}: {
  title: string
  children: React.ReactNode
  tone?: EnterpriseTone
}) {
  return (
    <section className="akop-ai-box">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <h4 className="akop-truncate text-xs font-semibold text-slate-900 dark:text-slate-100">{title}</h4>
        <Badge className={cn('text-[10px]', toneClasses[tone])}>AI</Badge>
      </div>
      <div className="akop-wrap text-xs text-slate-500">{children}</div>
    </section>
  )
}
