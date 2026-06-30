import { useMemo, useState } from 'react'
import { Activity, AlertTriangle, BarChart3, CheckCircle2, Gauge, Search, TrendingDown, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  fetchKriKpiIndicators,
  getIndicatorCategoryBadgeClass,
  getIndicatorStats,
  getIndicatorStatusBadgeClass,
  type IndicatorCategory,
  type IndicatorStatus,
  type KriKpiIndicator,
} from '@/services/kriKpi'

type CategoryFilter = 'all' | IndicatorCategory
type StatusFilter = 'all' | IndicatorStatus

const statusLabels: Record<IndicatorStatus, string> = {
  Good: 'İyi',
  Watch: 'İzlemede',
  Breach: 'İhlal',
}

const categoryLabels: Record<IndicatorCategory, string> = {
  Compliance: 'Uyum',
  Operation: 'Operasyon',
  Risk: 'Risk',
}

function trendNode(indicator: KriKpiIndicator) {
  if (indicator.trend === 'up') return <span className="inline-flex items-center gap-1 text-rose-600"><TrendingUp size={14} /> Artıyor</span>
  if (indicator.trend === 'down') return <span className="inline-flex items-center gap-1 text-emerald-600"><TrendingDown size={14} /> Azalıyor</span>
  return <span className="inline-flex items-center gap-1 text-slate-500"><Activity size={14} /> Sabit</span>
}

export default function KriKpiCenter() {
  const [indicators] = useState<KriKpiIndicator[]>(() => fetchKriKpiIndicators())
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const stats = getIndicatorStats(indicators)

  const filteredIndicators = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('tr-TR')
    return indicators.filter((indicator) => {
      const matchesSearch = !normalized
        || indicator.name.toLocaleLowerCase('tr-TR').includes(normalized)
        || indicator.owner.toLocaleLowerCase('tr-TR').includes(normalized)
        || indicator.id.toLocaleLowerCase('tr-TR').includes(normalized)
      const matchesCategory = categoryFilter === 'all' || indicator.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || indicator.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [categoryFilter, indicators, search, statusFilter])

  const breachIndicators = indicators.filter((indicator) => indicator.status === 'Breach')
  const averageAchievement = indicators.length > 0
    ? Math.round(indicators.reduce((sum, indicator) => {
      const ratio = indicator.unit === 'adet' && indicator.status !== 'Good'
        ? Math.max(0, 100 - Math.round((indicator.value / Math.max(indicator.target, 1)) * 100))
        : Math.min(120, Math.round((indicator.value / Math.max(indicator.target, 1)) * 100))
      return sum + ratio
    }, 0) / indicators.length)
    : 0

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge className="bg-blue-50 text-blue-700 border-blue-200/70">FAZ 25</Badge>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">KRI & KPI Management</h2>
              <p className="text-sm text-slate-500">Uyum, operasyon ve risk göstergelerini hedeflerle birlikte izleyin.</p>
            </div>
          </div>
          <Card className="bg-slate-900 text-white border-slate-800 rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-blue-200 font-semibold">Yönetici Özeti</p>
              <p className="mt-1 text-sm text-slate-200">
                {stats.breach} gösterge ihlal seviyesinde, {stats.watch} gösterge izleme bandında.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {[
            { label: 'Toplam Gösterge', value: stats.total, helper: 'KRI + KPI', icon: Gauge, color: 'text-slate-700', bg: 'bg-slate-50' },
            { label: 'İyi', value: stats.good, helper: 'Hedefte', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'İzlemede', value: stats.watch, helper: 'Yakın takip', icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'İhlal', value: stats.breach, helper: 'Aksiyon gerekli', icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-50' },
            { label: 'Hedef Başarımı', value: `%${averageAchievement}`, helper: `${stats.risingRisk} artan risk`, icon: BarChart3, color: 'text-blue-700', bg: 'bg-blue-50' },
          ].map((item) => (
            <Card key={item.label} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500">{item.label}</CardTitle>
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${item.bg} ${item.color}`}>
                  <item.icon size={16} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{item.value}</div>
                <p className="mt-1 text-xs text-slate-500">{item.helper}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="grid gap-3 xl:grid-cols-[1fr_180px_180px]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Gösterge, sahip veya ID ara..." className="pl-9 rounded-xl border-slate-200/80" />
              </div>
              <Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)} className="rounded-xl border-slate-200/80">
                <option value="all">Tüm kategoriler</option>
                <option value="Compliance">Uyum</option>
                <option value="Operation">Operasyon</option>
                <option value="Risk">Risk</option>
              </Select>
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-xl border-slate-200/80">
                <option value="all">Tüm durumlar</option>
                <option value="Good">İyi</option>
                <option value="Watch">İzlemede</option>
                <option value="Breach">İhlal</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Gösterge Matrisi</CardTitle>
                <Badge className="bg-slate-50 text-slate-700 border-slate-200/70">{filteredIndicators.length} kayıt</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Gösterge</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Kategori</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Değer / Hedef</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Trend</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIndicators.map((indicator) => (
                    <TableRow key={indicator.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                      <TableCell>
                        <p className="text-xs font-semibold text-slate-800">{indicator.name}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{indicator.id} · {indicator.owner}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{indicator.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${getIndicatorCategoryBadgeClass(indicator.category)}`}>{categoryLabels[indicator.category]}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-bold text-slate-900">{indicator.value}{indicator.unit === '%' ? '%' : ` ${indicator.unit}`}</p>
                        <p className="text-[11px] text-slate-500">Hedef: {indicator.target}{indicator.unit === '%' ? '%' : ` ${indicator.unit}`}</p>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{trendNode(indicator)}</TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${getIndicatorStatusBadgeClass(indicator.status)}`}>{statusLabels[indicator.status]}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">İhlal Listesi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {breachIndicators.map((indicator) => (
                  <div key={indicator.id} className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{indicator.name}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{indicator.owner}</p>
                      </div>
                      <Badge className={`text-[10px] ${getIndicatorCategoryBadgeClass(indicator.category)}`}>{categoryLabels[indicator.category]}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-rose-700">Değer {indicator.value}{indicator.unit}; hedef {indicator.target}{indicator.unit}.</p>
                  </div>
                ))}
                {breachIndicators.length === 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 text-center">
                    <CheckCircle2 size={18} className="mx-auto text-emerald-700" />
                    <p className="mt-2 text-xs text-emerald-800">İhlal seviyesinde gösterge yok.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
