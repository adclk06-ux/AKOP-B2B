import { useNavigate } from 'react-router-dom'
import { useTransactionStore, statusLabels, statusColors, statusDotColors } from '@/store/transactionStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Search, Eye, ListChecks } from 'lucide-react'
import { useState } from 'react'

export default function Transactions() {
  const navigate = useNavigate()
  const transactions = useTransactionStore((s) => s.transactions)
  const [filter, setFilter] = useState('')

  const filtered = transactions.filter(
    (t) =>
      t.title.toLowerCase().includes(filter.toLowerCase()) ||
      t.id.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">İşlemler</h2>
            <p className="text-sm text-slate-500">Operasyon işlemlerini görüntüle, filtrele ve yönet.</p>
          </div>
          <Button onClick={() => navigate('/transactions/new')} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm hover:shadow-md transition-all">
            <Plus size={16} className="mr-2" />
            Yeni İşlem
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="İşlem ara..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white"
          />
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                <TableHead className="text-xs font-medium text-slate-500">ID</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Başlık</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Tür</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Durum</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Oluşturan</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Tarih</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                  <TableCell className="text-xs font-medium text-slate-700">{t.id}</TableCell>
                  <TableCell className="text-xs text-slate-700">{t.title}</TableCell>
                  <TableCell className="text-xs text-slate-700">{t.type}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] ${statusColors[t.status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusDotColors[t.status]} mr-1`} />
                      {statusLabels[t.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-slate-700">{t.createdByName}</TableCell>
                  <TableCell className="text-xs text-slate-500">{new Date(t.createdAt).toLocaleDateString('tr-TR')}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/transactions/${t.id}`)} className="rounded-xl hover:bg-slate-50">
                      <Eye size={16} className="text-slate-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-10">
                    <div className="flex flex-col items-center gap-2">
                      <ListChecks size={24} className="text-slate-300" />
                      <p className="text-sm">İşlem bulunamadı.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
