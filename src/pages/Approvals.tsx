import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useTransactionStore, statusLabels, statusColors } from '@/store/transactionStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Eye, Clock, CheckCircle, XCircle, ClipboardCheck } from 'lucide-react'

export default function Approvals() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const transactions = useTransactionStore((s) => s.transactions)
  const updateTransaction = useTransactionStore((s) => s.updateTransaction)
  const addAuditLog = useTransactionStore((s) => s.addAuditLog)
  const addHistoryLog = useTransactionStore((s) => s.addHistoryLog)

  const isManager = user?.role === 'manager'
  const isAdmin = user?.role === 'admin'
  const canBulkApprove = isManager || isAdmin

  const pending = transactions.filter((t) => t.status === 'pending_approval')

  const handleQuickApprove = (txId: string, txTitle: string) => {
    if (!user) return
    updateTransaction(txId, { status: 'approved' })
    addAuditLog(txId, {
      userId: user.id,
      userName: user.name,
      action: 'Hızlı Onay',
      details: txTitle,
    })
    addHistoryLog(txId, {
      actor: user.name,
      action: 'Hızlı Onay',
      description: `${txTitle} hızlı onaylandı`,
      status: 'approved',
    })
  }

  const handleQuickReject = (txId: string, txTitle: string) => {
    if (!user) return
    updateTransaction(txId, { status: 'rejected' })
    addAuditLog(txId, {
      userId: user.id,
      userName: user.name,
      action: 'Hızlı Red',
      details: txTitle,
    })
    addHistoryLog(txId, {
      actor: user.name,
      action: 'Hızlı Red',
      description: `${txTitle} reddedildi`,
      status: 'rejected',
    })
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Onaylar</h2>
          <p className="text-sm text-slate-500">Bekleyen işlemleri inceleyin, onaylayın veya reddedin.</p>
        </div>

        {isManager && (
          <div className="rounded-2xl border border-rose-200/70 bg-rose-50/60 p-4">
            <p className="text-sm text-rose-700 font-medium">
              Yönetici / Onay Makamı rolündesiniz. Onay işlemlerinde "MKK'ya Gönder ve Onayla" yetkisine sahipsiniz.
            </p>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200/70 bg-white/90 shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                <TableHead className="text-xs font-medium text-slate-500">ID</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Başlık</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Tür</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Oluşturan</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Deadline</TableHead>
                <TableHead className="text-xs font-medium text-slate-500">Durum</TableHead>
                <TableHead className="text-xs font-medium text-slate-500 text-right">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pending.map((t) => {
                const isCritical = t.deadline && new Date(t.deadline).getTime() - Date.now() < 60 * 60 * 1000
                return (
                  <TableRow key={t.id} className={`border-b border-slate-100 hover:bg-slate-50/70 ${isCritical ? 'bg-rose-50/30' : ''}`}>
                    <TableCell className="text-xs font-medium text-slate-700">{t.id}</TableCell>
                    <TableCell className="text-xs text-slate-700">{t.title}</TableCell>
                    <TableCell className="text-xs text-slate-700">{t.type}</TableCell>
                    <TableCell className="text-xs text-slate-700">{t.createdByName}</TableCell>
                    <TableCell>
                      {t.deadline ? (
                        <span className={`inline-flex items-center gap-1 text-xs ${isCritical ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                          <Clock size={12} />
                          {new Date(t.deadline).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`text-[10px] ${statusColors[t.status]}`}>{statusLabels[t.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {canBulkApprove && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              onClick={() => handleQuickApprove(t.id, t.title)}
                              title="Hızlı Onay"
                            >
                              <CheckCircle size={16} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                              onClick={() => handleQuickReject(t.id, t.title)}
                              title="Hızlı Red"
                            >
                              <XCircle size={16} />
                            </Button>
                          </>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/transactions/${t.id}`)} className="rounded-xl hover:bg-slate-50">
                          <Eye size={16} className="text-slate-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
              {pending.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-400 py-10">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardCheck size={24} className="text-slate-300" />
                      <p className="text-sm">Onay bekleyen işlem bulunamadı.</p>
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
