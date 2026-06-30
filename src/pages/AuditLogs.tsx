import { useTransactionStore } from '@/store/transactionStore'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Search, FileSearch } from 'lucide-react'

export default function AuditLogs() {
  const transactions = useTransactionStore((s) => s.transactions)
  const [filter, setFilter] = useState('')

  const allLogs = transactions.flatMap((t) =>
    t.auditLogs.map((log) => ({ ...log, transactionId: t.id, transactionTitle: t.title }))
  )

  const sorted = [...allLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const filtered = sorted.filter(
    (l) =>
      l.userName.toLowerCase().includes(filter.toLowerCase()) ||
      l.action.toLowerCase().includes(filter.toLowerCase()) ||
      l.transactionId.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Audit Log</h2>
          <p className="text-sm text-slate-500">Sistemde gerçekleşen tüm aksiyon ve değişiklik kayıtları.</p>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <Input
            placeholder="Kullanıcı, işlem veya aksiyon ara..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 bg-white"
          />
        </div>

        <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                  <TableHead className="text-xs font-medium text-slate-500">Tarih</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">İşlem ID</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">İşlem</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Kullanıcı</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Aksiyon</TableHead>
                  <TableHead className="text-xs font-medium text-slate-500">Detay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                    <TableCell className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString('tr-TR')}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">{log.transactionId}</TableCell>
                    <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">{log.transactionTitle}</TableCell>
                    <TableCell className="text-xs text-slate-700">{log.userName}</TableCell>
                    <TableCell className="text-xs font-medium text-slate-700">{log.action}</TableCell>
                    <TableCell className="text-xs text-slate-700">{log.details || '-'}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-slate-400 py-10">
                      <div className="flex flex-col items-center gap-2">
                        <FileSearch size={24} className="text-slate-300" />
                        <p className="text-sm">Kayıt bulunamadı.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
