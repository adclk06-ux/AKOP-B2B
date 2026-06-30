import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, ClipboardList, Search, ShieldCheck, Wrench } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { addAuditLog } from '@/services/auditTrail'
import {
  advanceCapaAction,
  fetchCapaActions,
  getCapaPriorityBadgeClass,
  getCapaStats,
  getCapaStatusBadgeClass,
  type CapaAction,
  type CapaPriority,
  type CapaStatus,
} from '@/services/capa'
import { createTask } from '@/services/tasks'
import { useAuthStore } from '@/store/authStore'

type StatusFilter = 'all' | CapaStatus
type PriorityFilter = 'all' | CapaPriority

const statusLabels: Record<CapaStatus, string> = {
  Open: 'Açık',
  'Root Cause': 'Kök Neden',
  'Corrective Action': 'Düzeltici Aksiyon',
  'Preventive Action': 'Önleyici Aksiyon',
  Verification: 'Doğrulama',
  Closed: 'Kapandı',
}

const priorityLabels: Record<CapaPriority, string> = {
  Low: 'Düşük',
  Medium: 'Orta',
  High: 'Yüksek',
  Critical: 'Kritik',
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('tr-TR')
}

function isOverdue(item: CapaAction) {
  return item.status !== 'Closed' && item.dueDate < new Date().toISOString().split('T')[0]
}

function mapPriorityToTaskRisk(priority: CapaPriority) {
  if (priority === 'Critical') return 'Kritik'
  if (priority === 'High') return 'Yüksek'
  if (priority === 'Medium') return 'Orta'
  return 'Düşük'
}

export default function CapaCenter() {
  const user = useAuthStore((s) => s.user)
  const [items, setItems] = useState<CapaAction[]>(() => fetchCapaActions())
  const [selectedId, setSelectedId] = useState(() => fetchCapaActions()[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all')
  const selectedItem = items.find((item) => item.id === selectedId) ?? items[0]
  const stats = getCapaStats(items)

  const filteredItems = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('tr-TR')
    return items.filter((item) => {
      const matchesSearch = !normalized
        || item.title.toLocaleLowerCase('tr-TR').includes(normalized)
        || item.capaNumber.toLocaleLowerCase('tr-TR').includes(normalized)
        || item.owner.toLocaleLowerCase('tr-TR').includes(normalized)
        || item.sourceFindingTitle.toLocaleLowerCase('tr-TR').includes(normalized)
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [items, priorityFilter, search, statusFilter])

  function advanceSelected() {
    if (!selectedItem) return
    const updated = advanceCapaAction(selectedItem.id)
    if (!updated) return
    setItems((current) => current.map((item) => item.id === updated.id ? updated : item))
    addAuditLog({
      userId: user?.id ?? 'system',
      userName: user?.name ?? 'Sistem',
      role: user?.role ?? 'Sistem',
      action: `CAPA adımı ilerletildi: ${updated.capaNumber} - ${statusLabels[updated.status]}`,
      entityType: 'finding',
      entityId: updated.sourceFindingId,
      entityTitle: updated.title,
      severity: updated.priority === 'Critical' ? 'critical' : 'info',
    })
  }

  function createCapaTask() {
    if (!selectedItem) return
    const task = createTask({
      title: `CAPA Aksiyonu: ${selectedItem.title}`,
      authority: 'Kontrol',
      riskLevel: mapPriorityToTaskRisk(selectedItem.priority),
      assignedTo: selectedItem.owner,
      dueDate: selectedItem.dueDate,
      status: 'Açık',
      notes: `${selectedItem.correctiveAction}\n\nÖnleyici aksiyon: ${selectedItem.preventiveAction}`,
    })
    addAuditLog({
      userId: user?.id ?? 'system',
      userName: user?.name ?? 'Sistem',
      role: user?.role ?? 'Sistem',
      action: `CAPA görevine dönüştürüldü: ${selectedItem.capaNumber}`,
      entityType: 'task',
      entityId: task.id,
      entityTitle: task.title,
      severity: 'info',
    })
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge className="bg-amber-50 text-amber-700 border-amber-200/70">FAZ 26</Badge>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">CAPA Center</h2>
              <p className="text-sm text-slate-500">Bulgu, kök neden, düzeltici aksiyon, önleyici aksiyon ve kapanış yönetimi.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={advanceSelected} disabled={!selectedItem || selectedItem.status === 'Closed'} size="sm" className="rounded-xl bg-slate-900 hover:bg-slate-800">
              <ArrowRight size={16} />
              Sonraki Adım
            </Button>
            <Button onClick={createCapaTask} disabled={!selectedItem} size="sm" variant="outline" className="rounded-xl border-slate-200">
              <ClipboardList size={16} />
              Görev Oluştur
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          {[
            { label: 'Toplam CAPA', value: stats.total, helper: 'Kayıt', icon: Wrench, color: 'text-slate-700', bg: 'bg-slate-50' },
            { label: 'Açık', value: stats.open, helper: 'Devam ediyor', icon: AlertTriangle, color: 'text-blue-700', bg: 'bg-blue-50' },
            { label: 'Kritik', value: stats.critical, helper: 'Öncelikli', icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-50' },
            { label: 'Geciken', value: stats.overdue, helper: 'SLA riski', icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Doğrulama', value: stats.verification, helper: 'Kapanış öncesi', icon: ShieldCheck, color: 'text-cyan-700', bg: 'bg-cyan-50' },
            { label: 'Kapalı', value: stats.closed, helper: 'Tamamlandı', icon: CheckCircle2, color: 'text-emerald-700', bg: 'bg-emerald-50' },
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
            <div className="grid gap-3 xl:grid-cols-[1fr_190px_190px]">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="CAPA, bulgu veya sahip ara..." className="pl-9 rounded-xl border-slate-200/80" />
              </div>
              <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="rounded-xl border-slate-200/80">
                <option value="all">Tüm durumlar</option>
                {Object.keys(statusLabels).map((status) => <option key={status} value={status}>{statusLabels[status as CapaStatus]}</option>)}
              </Select>
              <Select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value as PriorityFilter)} className="rounded-xl border-slate-200/80">
                <option value="all">Tüm öncelikler</option>
                {Object.keys(priorityLabels).map((priority) => <option key={priority} value={priority}>{priorityLabels[priority as CapaPriority]}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_390px]">
          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">CAPA Matrisi</CardTitle>
                <Badge className="bg-slate-50 text-slate-700 border-slate-200/70">{filteredItems.length} kayıt</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">CAPA</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Kaynak Bulgu</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Öncelik</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Durum</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Termin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow
                      key={item.id}
                      onClick={() => setSelectedId(item.id)}
                      className={`border-b border-slate-100 cursor-pointer ${selectedItem?.id === item.id ? 'bg-amber-50/70 hover:bg-amber-50' : 'hover:bg-slate-50/70'}`}
                    >
                      <TableCell>
                        <p className="text-xs font-semibold text-slate-800">{item.capaNumber}</p>
                        <p className="mt-1 text-xs text-slate-600">{item.title}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{item.owner}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-slate-700">{item.sourceFindingTitle}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{item.sourceFindingId}</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${getCapaPriorityBadgeClass(item.priority)}`}>{priorityLabels[item.priority]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${getCapaStatusBadgeClass(item.status)}`}>{statusLabels[item.status]}</Badge>
                      </TableCell>
                      <TableCell>
                        <p className={`text-xs font-semibold ${isOverdue(item) ? 'text-rose-700' : 'text-slate-700'}`}>{formatDate(item.dueDate)}</p>
                        {isOverdue(item) && <p className="text-[11px] text-rose-600">Gecikti</p>}
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
                <CardTitle className="text-sm font-semibold">CAPA Akışı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedItem ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Seçili CAPA</p>
                      <h3 className="mt-1 text-base font-bold text-slate-900">{selectedItem.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge className={`text-[10px] ${getCapaPriorityBadgeClass(selectedItem.priority)}`}>{priorityLabels[selectedItem.priority]}</Badge>
                        <Badge className={`text-[10px] ${getCapaStatusBadgeClass(selectedItem.status)}`}>{statusLabels[selectedItem.status]}</Badge>
                      </div>
                    </div>
                    {[
                      { label: 'Bulgu', value: selectedItem.sourceFindingTitle },
                      { label: 'Kök neden', value: selectedItem.rootCause },
                      { label: 'Düzeltici aksiyon', value: selectedItem.correctiveAction },
                      { label: 'Önleyici aksiyon', value: selectedItem.preventiveAction },
                      { label: 'Kapanış', value: selectedItem.status === 'Closed' ? 'Kapandı' : selectedItem.verificationNote ?? 'Doğrulama bekleniyor' },
                    ].map((step, index, steps) => (
                      <div key={step.label} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-700 text-xs font-bold">{index + 1}</div>
                          {index < steps.length - 1 && <div className="h-8 w-px bg-slate-200" />}
                        </div>
                        <div className="pb-3 min-w-0">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{step.label}</p>
                          <p className="text-xs text-slate-700 break-words">{step.value}</p>
                        </div>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Detay için bir CAPA seçin.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
