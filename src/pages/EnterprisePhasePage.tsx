import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, Search, ShieldAlert } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  getEnterprisePhaseModule,
  getEnterpriseRiskBadgeClass,
  getEnterpriseStatusBadgeClass,
  type EnterprisePhaseKey,
} from '@/services/enterprisePhases'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('tr-TR')
}

export default function EnterprisePhasePage({ phaseKey }: { phaseKey: EnterprisePhaseKey }) {
  const module = getEnterprisePhaseModule(phaseKey)
  const [search, setSearch] = useState('')
  const filteredRecords = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('tr-TR')
    if (!normalized) return module.records
    return module.records.filter((record) => (
      record.id.toLocaleLowerCase('tr-TR').includes(normalized)
      || record.title.toLocaleLowerCase('tr-TR').includes(normalized)
      || record.owner.toLocaleLowerCase('tr-TR').includes(normalized)
      || record.status.toLocaleLowerCase('tr-TR').includes(normalized)
    ))
  }, [module.records, search])

  const criticalRecords = module.records.filter((record) => record.risk === 'Kritik' || record.risk === 'Yüksek')
  const criticalMetrics = module.metrics.filter((metric) => metric.status === 'Critical')

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-slate-900 text-white border-slate-900">{module.phase}</Badge>
              <Badge className="bg-blue-50 text-blue-700 border-blue-200/70">{module.badge}</Badge>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">{module.title}</h2>
              <p className="text-sm text-slate-500">{module.subtitle}</p>
            </div>
          </div>
          <Card className="bg-slate-900 text-white border-slate-800 rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <p className="text-[11px] uppercase tracking-wide text-blue-200 font-semibold">Kontrol Özeti</p>
              <p className="mt-1 text-sm text-slate-200">
                {criticalRecords.length} yüksek/kritik kayıt, {criticalMetrics.length} kritik gösterge izleniyor.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {module.metrics.map((metric) => (
            <Card key={metric.label} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500">{metric.label}</CardTitle>
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${
                  metric.status === 'Normal' ? 'bg-emerald-50 text-emerald-700' : metric.status === 'Watch' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                }`}>
                  {metric.status === 'Normal' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">{metric.value}</div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">{metric.helper}</p>
                  <Badge className={`text-[10px] ${getEnterpriseStatusBadgeClass(metric.status)}`}>{metric.status}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,420px)] lg:items-center">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Kayıt, sahip veya durum ara..." className="pl-9 rounded-xl border-slate-200/80" />
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {module.workflow.map((step, index) => (
                  <span key={step} className="inline-flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700">{step}</span>
                    {index < module.workflow.length - 1 && <ArrowRight size={13} />}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Kayıt Matrisi</CardTitle>
                <Badge className="bg-slate-50 text-slate-700 border-slate-200/70">{filteredRecords.length} kayıt</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Kayıt</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Sahip</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Risk</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Durum</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Termin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                      <TableCell>
                        <p className="text-xs font-semibold text-slate-800">{record.id} · {record.title}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{record.description}</p>
                      </TableCell>
                      <TableCell className="text-xs text-slate-700">{record.owner}</TableCell>
                      <TableCell><Badge className={`text-[10px] ${getEnterpriseRiskBadgeClass(record.risk)}`}>{record.risk}</Badge></TableCell>
                      <TableCell><Badge className="text-[10px] bg-slate-50 text-slate-700 border-slate-200/60">{record.status}</Badge></TableCell>
                      <TableCell className="text-xs font-semibold text-slate-700">{formatDate(record.dueDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Öncelikli Takip</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {criticalRecords.map((record) => (
                  <div key={record.id} className="rounded-xl border border-rose-100 bg-rose-50/40 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{record.title}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{record.owner} · {formatDate(record.dueDate)}</p>
                      </div>
                      <Badge className={`text-[10px] ${getEnterpriseRiskBadgeClass(record.risk)}`}>{record.risk}</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white border-slate-800 rounded-2xl shadow-sm overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={18} className="mt-0.5 text-blue-200" />
                  <div>
                    <p className="text-sm font-semibold">Modül Kontrolü</p>
                    <p className="mt-1 text-xs text-slate-300">
                      Bu faz; metrik, kayıt, risk, sahiplik ve workflow görünürlüğüyle kurumsal GRC akışına bağlandı.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
