import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useTransactionStore } from '@/store/transactionStore'
import { Badge } from '@/components/ui/badge'
import {
  ArrowRight,
  CalendarDays,
  Database,
  FileCheck2,
  FolderOpen,
  MoreVertical,
  Send,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
} from 'lucide-react'

type Tone = 'success' | 'danger' | 'warning' | 'info' | 'neutral'

const toneMap: Record<Tone, { text: string; bg: string; border: string; dot: string }> = {
  success: { text: 'text-emerald-600 dark:text-emerald-300', bg: 'bg-emerald-50 dark:bg-emerald-400/10', border: 'border-emerald-200/70 dark:border-emerald-400/30', dot: 'bg-emerald-500' },
  danger: { text: 'text-rose-600 dark:text-rose-300', bg: 'bg-rose-50 dark:bg-rose-400/10', border: 'border-rose-200/70 dark:border-rose-400/30', dot: 'bg-rose-500' },
  warning: { text: 'text-amber-600 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-400/10', border: 'border-amber-200/70 dark:border-amber-400/30', dot: 'bg-amber-500' },
  info: { text: 'text-sky-600 dark:text-cyan-300', bg: 'bg-sky-50 dark:bg-cyan-400/10', border: 'border-sky-200/70 dark:border-cyan-400/30', dot: 'bg-sky-500' },
  neutral: { text: 'text-slate-600 dark:text-slate-300', bg: 'bg-slate-50 dark:bg-slate-800/50', border: 'border-slate-200/70 dark:border-slate-700/70', dot: 'bg-slate-400' },
}

function Panel({ title, action = 'View all', children, className = '' }: { title: string; action?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`akop-command-card ${className}`}>
      <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
        <h3 className="akop-truncate text-sm font-bold text-slate-950 dark:text-slate-50">{title}</h3>
        <button className="shrink-0 text-[11px] font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-300" type="button">
          {action}
        </button>
      </div>
      {children}
    </section>
  )
}

function Sparkline({ tone = 'success' }: { tone?: Tone }) {
  const stroke = tone === 'danger' ? '#ff3b5c' : tone === 'warning' ? '#f59e0b' : '#21b98d'
  return (
    <svg viewBox="0 0 180 42" className="mt-4 h-10 w-full" aria-hidden="true">
      <path d="M2 32 C18 32 22 30 34 30 C48 30 48 18 62 20 C76 22 80 28 92 24 C106 19 113 15 124 21 C138 28 145 29 158 20 C168 14 174 15 178 11" fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M2 32 C18 32 22 30 34 30 C48 30 48 18 62 20 C76 22 80 28 92 24 C106 19 113 15 124 21 C138 28 145 29 158 20 C168 14 174 15 178 11 L178 42 L2 42 Z" fill={stroke} opacity="0.08" />
    </svg>
  )
}

function KpiCard({ label, value, helper, tone, icon: Icon }: { label: string; value: string | number; helper: string; tone: Tone; icon: React.ElementType }) {
  const toneClass = toneMap[tone]
  return (
    <article className="akop-command-card group relative min-h-[132px]">
      <div className="flex items-start justify-between gap-3">
        <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${toneClass.bg} ${toneClass.border} ${toneClass.text}`}>
          <Icon size={19} />
        </div>
        <button className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" type="button" aria-label="Kart menüsü">
          <MoreVertical size={15} />
        </button>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="akop-truncate text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</p>
          <p className={`mt-1 text-2xl font-black tracking-tight ${toneClass.text}`}>{value}</p>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{helper}</p>
        </div>
      </div>
      <Sparkline tone={tone} />
    </article>
  )
}

function Donut({ value, label, tone = 'success' }: { value: number; label: string; tone?: Tone }) {
  const color = tone === 'danger' ? '#ff3b5c' : tone === 'warning' ? '#f59e0b' : tone === 'info' ? '#38bdf8' : '#21e6a1'
  const circumference = 2 * Math.PI * 42
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24 shrink-0">
        <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
          <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="10" fill="none" className="text-slate-100 dark:text-slate-800/80" />
          <circle cx="50" cy="50" r="42" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference - (value / 100) * circumference} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-black text-slate-950 dark:text-slate-50">{value}%</span>
          <span className="text-[9px] text-slate-500 dark:text-slate-400">{label}</span>
        </div>
      </div>
    </div>
  )
}

function Heatmap() {
  const colors = [
    ['bg-emerald-400/80', 'bg-lime-300/80', 'bg-amber-300/90', 'bg-orange-400/90', 'bg-rose-500/90'],
    ['bg-emerald-300/80', 'bg-lime-300/80', 'bg-amber-300/90', 'bg-orange-400/90', 'bg-rose-500/90'],
    ['bg-teal-300/80', 'bg-lime-300/80', 'bg-yellow-300/90', 'bg-amber-400/90', 'bg-orange-500/90'],
    ['bg-teal-400/80', 'bg-emerald-300/80', 'bg-lime-300/80', 'bg-yellow-300/90', 'bg-amber-400/90'],
  ]
  return (
    <div className="grid gap-2">
      <div className="grid grid-cols-[4.5rem_1fr] gap-3">
        <div className="grid grid-rows-4 gap-1 text-right text-[10px] text-slate-500 dark:text-slate-400">
          {['Çok Yüksek', 'Yüksek', 'Orta', 'Düşük'].map((item) => <span key={item}>{item}</span>)}
        </div>
        <div className="grid grid-rows-4 gap-1 overflow-hidden rounded-xl border border-slate-200/70 dark:border-slate-700/70">
          {colors.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-5 gap-1">
              {row.map((color, colIndex) => (
                <div key={`${rowIndex}-${colIndex}`} className={`relative h-12 ${color}`}>
                  {rowIndex === 0 && colIndex === 4 && <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">23</span>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="ml-[5.25rem] grid grid-cols-5 text-center text-[10px] text-slate-500 dark:text-slate-400">
        {['Çok Düşük', 'Düşük', 'Orta', 'Yüksek', 'Çok Yüksek'].map((item) => <span key={item}>{item}</span>)}
      </div>
    </div>
  )
}

function ImpactMatrix() {
  const points = [
    { x: 16, y: 78, tone: 'success', size: 12 },
    { x: 28, y: 66, tone: 'success', size: 15 },
    { x: 45, y: 48, tone: 'warning', size: 17 },
    { x: 64, y: 36, tone: 'warning', size: 24 },
    { x: 82, y: 19, tone: 'danger', size: 25 },
  ] as const
  return (
    <div className="relative h-56 overflow-hidden rounded-xl border border-slate-200/70 bg-white dark:border-slate-700/70 dark:bg-slate-950/16">
      <div className="absolute inset-6 grid grid-cols-4 grid-rows-4 border-l border-b border-slate-200/70 dark:border-slate-700/70">
        {Array.from({ length: 16 }).map((_, i) => <div key={i} className="border-r border-t border-slate-100 dark:border-slate-800/80" />)}
      </div>
      <span className="absolute left-4 top-4 text-[10px] text-slate-500">Impact</span>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-slate-500">Likelihood</span>
      {points.map((p, index) => (
        <span
          key={index}
          className={`absolute rounded-full shadow-lg ${toneMap[p.tone].dot}`}
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, boxShadow: '0 0 0 5px rgba(255,255,255,0.16)' }}
        />
      ))}
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const transactions = useTransactionStore((s) => s.transactions)

  const counts = useMemo(() => ({
    total: transactions.length || 3,
    pendingApproval: transactions.filter((t) => t.status === 'pending_approval').length || 15,
    validationFailed: transactions.filter((t) => t.status === 'validation_failed').length || 7,
    completed: transactions.filter((t) => t.status === 'completed').length || 34,
  }), [transactions])

  const latestSpk = [
    ['VII-128.1 Pay Tebliği Değişikliği', 'Yeni', '20.05'],
    ['Kurumsal Yönetim Tebliği Güncellemesi', '', '19.05'],
    ['Finansal Raporlama Tebliği Değişikliği', '', '18.05'],
  ]
  const latestBddk = [
    ['Aylık Raporlama Rehberi Güncellendi', '20.05.2025'],
    ['Kredi İşlemleri Yönetmeliği Değişikliği', '19.05.2025'],
    ['Risk Yönetimi Rehberi Güncellemesi', '18.05.2025'],
  ]

  return (
    <div className="akop-command-page min-h-screen">
      <div className="mx-auto max-w-[1800px] space-y-4 px-4 py-4 lg:px-6 lg:py-5">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-slate-600 dark:text-slate-300">Günaydın, {user?.name || 'Admin Kullanıcı'}</p>
            <div className="mt-1 flex min-w-0 flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">AKOP Command Center</h2>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 akop-live-dot" /> Real-time
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Gerçek zamanlı mevzuat zekası, uyum yönetimi ve operasyonel risk gözetimi.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="akop-command-button" type="button">20 May 2025, Tuesday</button>
            <button className="akop-command-button" type="button">Customize</button>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard label="Compliance Score" value="87.4" helper="↑ 5.6% vs last month" tone="success" icon={ShieldCheck} />
          <KpiCard label="Open Obligations" value="128" helper="↑ 12 vs last month" tone="info" icon={FileCheck2} />
          <KpiCard label="Critical Risks" value="23" helper="↑ 3 vs last month" tone="danger" icon={ShieldAlert} />
          <KpiCard label="Pending Approvals" value={counts.pendingApproval} helper="↓ 4 vs last month" tone="success" icon={UserCheck} />
          <KpiCard label="Active Cases" value={counts.completed} helper="↑ 6 vs last month" tone="info" icon={FolderOpen} />
          <KpiCard label="Data Health" value="98.6%" helper="↑ 2.1% vs last month" tone="success" icon={Database} />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.15fr_1.15fr_1fr]">
          <Panel title="Compliance Risk Heatmap" action="⋮"><Heatmap /></Panel>
          <Panel title="Operational Impact Matrix" action="↗"><ImpactMatrix /></Panel>
          <Panel title="Critical Notifications">
            <div className="space-y-3">
              {[
                ['SPK', 'Yeni Tebliğ Yayınlandı', 'VII-128.1 Pay Tebliği’nde değişiklik yapıldı.', '10:15', 'danger'],
                ['BDDK', 'Raporlama Hatırlatması', 'Aylık RAPOR-2025-05 gönderimi yaklaşıyor.', '09:40', 'warning'],
                ['MASAK', 'Uyarı', 'Şüpheli işlem bildirimi için son tarih 21.05.2025', '08:30', 'warning'],
              ].map(([source, title, desc, time, tone]) => (
                <button key={title} className="flex w-full items-start gap-3 rounded-xl border border-slate-100 p-3 text-left transition hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-blue-400/8" type="button">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${toneMap[tone as Tone].dot}`} />
                  <span className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{source}</span>
                    <span className="ml-3 text-xs font-semibold text-slate-800 dark:text-slate-200">{title}</span>
                    <span className="mt-1 block text-[11px] text-slate-500 dark:text-slate-400">{desc}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">{time}</span>
                </button>
              ))}
              <button onClick={() => navigate('/notification-settings')} className="flex w-full items-center justify-center gap-2 pt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300" type="button">Tüm bildirimleri gör <ArrowRight size={14} /></button>
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          <Panel title="Regulatory Intelligence Timeline">
            <div className="space-y-4">
              {[
                ['10:15', 'SPK', 'VII-128.1 Pay Tebliği’nde Değişiklik Yayınlandı', 'success'],
                ['09:40', 'BDDK', 'Aylık Raporlama Rehberi Güncellendi', 'info'],
                ['08:30', 'MASAK', 'Şüpheli İşlem Bildirim Rehberi', 'warning'],
              ].map(([time, source, text, tone]) => (
                <div key={text} className="grid grid-cols-[3rem_1rem_1fr] gap-2 text-xs">
                  <span className="text-slate-500">{time}</span>
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${toneMap[tone as Tone].dot}`} />
                  <span><b className="text-slate-950 dark:text-slate-100">{source}</b><span className="block text-slate-500 dark:text-slate-400">{text}</span></span>
                </div>
              ))}
            </div>
          </Panel>
          <Panel title="Latest SPK Updates">
            <div className="space-y-2">
              {latestSpk.map(([title, badge, date]) => <UpdateRow key={title} title={title} meta={date} badge={badge} />)}
            </div>
          </Panel>
          <Panel title="Latest BDDK Updates">
            <div className="space-y-2">
              {latestBddk.map(([title, date]) => <UpdateRow key={title} title={title} meta={date} />)}
            </div>
          </Panel>
          <Panel title="Upcoming Obligations">
            <div className="space-y-3">
              {[
                ['21', 'MAY', 'Aylık SPK Raporu Gönderimi', '3 gün kaldı', 'Critical'],
                ['25', 'MAY', 'BDDK 5411 Aylık Rapor', '6 gün kaldı', 'High'],
                ['31', 'MAY', 'MASAK Şüpheli İşlem Bildirimi', '12 gün kaldı', 'Medium'],
              ].map(([day, month, title, desc, risk]) => <ObligationRow key={title} day={day} month={month} title={title} desc={desc} risk={risk} />)}
            </div>
          </Panel>
        </section>

        <section className="grid gap-4 xl:grid-cols-5">
          <MiniMetric title="MKK Reconciliation Status" value={92} label="Mutabakat Oranı" rows={[['Eşleşen', '12.485', 'success'], ['Farklı', '1.023', 'danger'], ['Bekleyen', '342', 'neutral']]} />
          <MiniMetric title="Takasbank Monitoring" value={99} label="Başarı Oranı" rows={[['Başarılı', '848.657', 'success'], ['Başarısız', '2.341', 'danger'], ['Bekleyen', '5.233', 'neutral']]} />
          <Panel title="Overdue Tasks" action="Tüm Görevleri Gör">
            <p className="text-4xl font-black text-rose-500">24 <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Geciken Görev</span></p>
            <ListStats rows={[['Yüksek Öncelik', '9', 'danger'], ['Orta Öncelik', '11', 'warning'], ['Düşük Öncelik', '4', 'neutral']]} />
          </Panel>
          <Panel title="Upcoming Obligations" action="Takvimi Gör">
            <p className="text-4xl font-black text-sky-500">15 <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Yaklaşan Yükümlülük</span></p>
            <ListStats rows={[['Bu Hafta', '5', 'success'], ['Bu Ay', '10', 'info'], ['Gelecek Ay', '15', 'neutral']]} />
          </Panel>
          <MiniMetric title="Workflow Health" value={89} label="Sağlık Skoru" rows={[['Başarılı', '128', 'success'], ['Uyarı', '14', 'warning'], ['Hata', '3', 'danger']]} />
        </section>

        <section className="grid gap-4 xl:grid-cols-4">
          <Panel title="Evidence Coverage" action="Kanıtlar Vault’u">
            <div className="flex items-center justify-between gap-4">
              <Donut value={76} label="Kapsam Oranı" tone="info" />
              <ListStats rows={[['Tamamlanan', '1.248', 'success'], ['Eksik', '392', 'warning'], ['Süresi Geçen', '78', 'danger']]} />
            </div>
          </Panel>
          <Panel title="Policy Review Calendar" action="View all">
            <CalendarMini />
          </Panel>
          <Panel title="Audit Findings Summary" action="Tüm Bulguları Gör">
            <div className="flex items-center justify-between gap-4">
              <Donut value={56} label="Toplam Bulgu" tone="warning" />
              <ListStats rows={[['Kritik', '5', 'danger'], ['Yüksek', '8', 'warning'], ['Orta', '6', 'info'], ['Düşük', '4', 'neutral']]} />
            </div>
          </Panel>
          <section className="akop-command-card relative overflow-hidden">
            <div className="absolute right-0 top-0 h-40 w-48 rounded-full bg-emerald-400/10 blur-3xl" />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2"><span className="rounded-lg border border-emerald-300/40 bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-300">AI</span><h3 className="text-sm font-bold">AKOP Copilot</h3></div>
              <Badge>BETA</Badge>
            </div>
            <p className="relative mt-4 text-xs text-slate-600 dark:text-slate-300">Bugün size nasıl yardımcı olabilirim?</p>
            <div className="relative mt-3 grid grid-cols-2 gap-2">
              {['Regülasyonları Açıkla', 'Risk Analizi Yap', 'Yükümlülük Oluştur', 'Rapor Oluştur'].map((item) => <button key={item} className="rounded-lg border border-slate-200 px-2 py-2 text-[11px] font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-blue-400/8" type="button">{item}</button>)}
            </div>
            <div className="relative mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-950/40">
              <input className="min-w-0 flex-1 bg-transparent text-xs outline-none" placeholder="Bir şey sorun..." />
              <Send size={16} className="text-emerald-500" />
            </div>
          </section>
        </section>
      </div>
    </div>
  )
}

function UpdateRow({ title, meta, badge }: { title: string; meta: string; badge?: string }) {
  return (
    <button className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-blue-400/8" type="button">
      <span className="min-w-0 text-xs font-semibold text-slate-700 dark:text-slate-200">{title}</span>
      <span className="flex shrink-0 items-center gap-2 text-[11px] text-slate-500">{badge && <Badge className="text-[10px]">{badge}</Badge>}{meta}</span>
    </button>
  )
}

function ObligationRow({ day, month, title, desc, risk }: { day: string; month: string; title: string; desc: string; risk: string }) {
  const tone = risk === 'Critical' ? 'danger' : risk === 'High' ? 'warning' : 'success'
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
      <div className="rounded-lg bg-slate-100 px-3 py-2 text-center dark:bg-slate-800/80"><p className="text-lg font-black">{day}</p><p className="text-[9px] text-slate-500">{month}</p></div>
      <div className="min-w-0 flex-1"><p className="akop-truncate text-xs font-bold text-slate-900 dark:text-slate-100">{title}</p><p className="text-[11px] text-slate-500">{desc}</p></div>
      <Badge className={`${toneMap[tone].bg} ${toneMap[tone].border} ${toneMap[tone].text}`}>{risk}</Badge>
    </div>
  )
}

function MiniMetric({ title, value, label, rows }: { title: string; value: number; label: string; rows: Array<[string, string, Tone]> }) {
  return (
    <Panel title={title} action="Detayları Gör">
      <div className="flex items-center justify-between gap-4">
        <Donut value={value} label={label} />
        <ListStats rows={rows} />
      </div>
    </Panel>
  )
}

function ListStats({ rows }: { rows: Array<[string, string, Tone]> }) {
  return (
    <div className="min-w-[9rem] flex-1 space-y-2">
      {rows.map(([label, value, tone]) => (
        <div key={label} className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-2 text-slate-600 dark:text-slate-300"><span className={`h-2 w-2 rounded-full ${toneMap[tone].dot}`} />{label}</span>
          <b className="text-slate-950 dark:text-slate-100">{value}</b>
        </div>
      ))}
    </div>
  )
}

function CalendarMini() {
  const days = Array.from({ length: 31 }, (_, i) => i + 1)
  return (
    <div>
      <div className="mb-3 flex items-center justify-center gap-3 text-xs font-bold"><CalendarDays size={14} /> May 2025</div>
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-slate-500">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => <span key={d}>{d}</span>)}
        {days.map((d) => <span key={d} className={`rounded-full py-1 ${d === 20 ? 'bg-emerald-500 text-white' : d === 28 ? 'bg-rose-500 text-white' : d === 15 ? 'bg-amber-500 text-white' : 'text-slate-600 dark:text-slate-300'}`}>{d}</span>)}
      </div>
    </div>
  )
}
