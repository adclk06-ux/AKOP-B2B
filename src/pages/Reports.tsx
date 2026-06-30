import { useTransactionStore, statusLabels, statusColors } from '@/store/transactionStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { BarChart3, FileText, AlertTriangle, CheckCircle, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from 'react-router-dom'

export default function Reports() {
  const navigate = useNavigate()
  const transactions = useTransactionStore((s) => s.transactions)

  const counts = {
    total: transactions.length,
    pendingApproval: transactions.filter((t) => t.status === 'pending_approval').length,
    validationFailed: transactions.filter((t) => t.status === 'validation_failed').length,
    approved: transactions.filter((t) => t.status === 'approved').length,
    completed: transactions.filter((t) => t.status === 'completed').length,
    sent: transactions.filter((t) => t.status === 'sent_to_mkk').length,
  }

  const totalRecords = transactions.reduce((sum, t) => sum + t.validRecordCount + t.invalidRecordCount, 0)
  const totalErrors = transactions.reduce((sum, t) => sum + t.invalidRecordCount, 0)

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Raporlar</h2>
            <p className="text-sm text-slate-500">Operasyon raporları ve mutabakat özetleri.</p>
          </div>
          <Button onClick={() => navigate('/reconciliation')} variant="outline" size="sm" className="rounded-xl border-slate-200/70">
            Mutabakat Ekranına Git
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Toplam İşlem', value: counts.total, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
            { label: 'Toplam Kayıt', value: totalRecords, icon: BarChart3, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Toplam Hata', value: totalErrors, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'Tamamlanan', value: counts.completed, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-slate-500">{kpi.label}</CardTitle>
                <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color}`}><kpi.icon size={16} /></div>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-slate-900">{kpi.value}</div></CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600"><Shield size={18} /></div>
                <div>
                  <CardTitle className="text-sm font-semibold">Günlük MKK Mutabakat Raporu</CardTitle>
                  <p className="text-[11px] text-slate-400">Günlük operasyon mutabakat durumu</p>
                </div>
              </div>
              <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60">Tam Mutabakat</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Toplam Kayıt', value: totalRecords, color: 'text-slate-900' },
                { label: 'Eşleşen Kayıt', value: totalRecords - totalErrors, color: 'text-emerald-600' },
                { label: 'Uyumsuz Kayıt', value: totalErrors, color: totalErrors > 0 ? 'text-rose-600' : 'text-emerald-600' },
                { label: 'Mutabakat Durumu', value: totalErrors === 0 ? 'Tam Mutabakat' : 'Dikkat Gerekli', color: totalErrors === 0 ? 'text-emerald-700' : 'text-amber-700', small: true },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200/70 bg-white p-3 text-center shadow-sm">
                  <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                  <p className={`${item.small ? 'text-sm font-semibold' : 'text-xl font-bold'} ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">İşlem Özeti</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                  <TableHead className="text-xs font-medium text-slate-500">ID</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Başlık</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Durum</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Geçerli Kayıt</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Hatalı Kayıt</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">MKK Referans</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <TableCell className="text-xs font-medium text-slate-700">{t.id}</TableCell>
                    <TableCell className="text-xs text-slate-700">{t.title}</TableCell>
                    <TableCell><Badge className={`text-[10px] ${statusColors[t.status]}`}>{statusLabels[t.status]}</Badge></TableCell>
                    <TableCell className="text-xs text-slate-700">{t.validRecordCount}</TableCell>
                    <TableCell className={`text-xs font-medium ${t.invalidRecordCount > 0 ? 'text-rose-600' : 'text-slate-700'}`}>{t.invalidRecordCount}</TableCell>
                    <TableCell className="text-xs text-slate-500">{t.mkkReference || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
