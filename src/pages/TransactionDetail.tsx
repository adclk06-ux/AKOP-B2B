import { useParams, useNavigate } from 'react-router-dom'
import { useAuthStore, roleLabels } from '@/store/authStore'
import { useTransactionStore, statusLabels, statusColors, statusDotColors } from '@/store/transactionStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft, FileText, AlertTriangle, CheckCircle, XCircle, Send, Clock, Lightbulb } from 'lucide-react'
import { getTransactionSuggestions } from '@/services/silentAdvisor'
import { useState } from 'react'

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const transactions = useTransactionStore((s) => s.transactions)
  const addApproval = useTransactionStore((s) => s.addApproval)
  const updateTransaction = useTransactionStore((s) => s.updateTransaction)
  const addAuditLog = useTransactionStore((s) => s.addAuditLog)

  const [comment, setComment] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const tx = transactions.find((t) => t.id === id)
  if (!tx) return <div className="p-6">İşlem bulunamadı.</div>

  const isAdmin = user?.role === 'admin'
  const isCreator = user?.id === tx.createdBy
  const canApprove = isAdmin && !isCreator
  const canSend = isAdmin

  const handleApprove = () => {
    if (!user || !canApprove) return
    addApproval(tx.id, {
      id: `a-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'approved',
      comment,
      timestamp: new Date().toISOString(),
    })
    addAuditLog(tx.id, {
      userId: user.id,
      userName: user.name,
      action: 'Onay Verildi',
      details: comment || '-',
    })
    setComment('')
  }

  const handleReject = () => {
    if (!user || !canApprove) return
    addApproval(tx.id, {
      id: `a-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'rejected',
      comment,
      timestamp: new Date().toISOString(),
    })
    addAuditLog(tx.id, {
      userId: user.id,
      userName: user.name,
      action: 'Reddedildi',
      details: comment || '-',
    })
    setComment('')
  }

  const handleSendToMKK = () => {
    if (!user || !canSend) return
    updateTransaction(tx.id, { status: 'sent_to_mkk', mkkReference: `MKK-${Date.now().toString().slice(-6)}` })
    addAuditLog(tx.id, {
      userId: user.id,
      userName: user.name,
      action: "MKK'ya Gönderildi",
      details: tx.mkkReference || '-',
    })
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate('/transactions')} className="rounded-xl hover:bg-slate-50">
            <ArrowLeft size={18} className="text-slate-600" />
          </Button>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">{tx.title}</h2>
          <Badge className={`text-[10px] ${statusColors[tx.status]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusDotColors[tx.status]} mr-1`} />
            {statusLabels[tx.status]}
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-50/80 border border-slate-200/70 rounded-xl">
            <TabsTrigger value="overview" activeValue={activeTab} onValueChange={setActiveTab} className="rounded-lg text-xs">Genel</TabsTrigger>
            <TabsTrigger value="files" activeValue={activeTab} onValueChange={setActiveTab} className="rounded-lg text-xs">Dosyalar</TabsTrigger>
            <TabsTrigger value="validation" activeValue={activeTab} onValueChange={setActiveTab} className="rounded-lg text-xs">Validasyon</TabsTrigger>
            <TabsTrigger value="approvals" activeValue={activeTab} onValueChange={setActiveTab} className="rounded-lg text-xs">Onay Geçmişi</TabsTrigger>
            <TabsTrigger value="audit" activeValue={activeTab} onValueChange={setActiveTab} className="rounded-lg text-xs">Audit Log</TabsTrigger>
          </TabsList>

        <TabsContent value="overview" activeValue={activeTab}>
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">İşlem Bilgileri</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs">ID</span>
                  <span className="font-medium text-slate-700 text-xs">{tx.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs">Tür</span>
                  <span className="font-medium text-slate-700 text-xs">{tx.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs">Oluşturan</span>
                  <span className="font-medium text-slate-700 text-xs">{tx.createdByName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs">Oluşturulma Tarihi</span>
                  <span className="font-medium text-slate-700 text-xs">{new Date(tx.createdAt).toLocaleString('tr-TR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-xs">Son Güncelleme</span>
                  <span className="font-medium text-slate-700 text-xs">{new Date(tx.updatedAt).toLocaleString('tr-TR')}</span>
                </div>
                {tx.mkkReference && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-xs">MKK Referans</span>
                    <span className="font-medium text-slate-700 text-xs">{tx.mkkReference}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-400 text-xs block mb-1">Açıklama</span>
                  <p className="text-xs text-slate-700">{tx.description}</p>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-4">
              {tx.status === 'pending_approval' && canApprove && (
                <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Onay İşlemi</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      placeholder="Yorum yazın (isteğe bağlı)"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-xs"
                    />
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={handleReject} className="rounded-xl border-rose-200/70 text-rose-700 hover:bg-rose-50">
                        <XCircle size={16} className="mr-2" />
                        Reddet
                      </Button>
                      <Button onClick={handleApprove} className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle size={16} className="mr-2" />
                        Onayla
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {tx.status === 'approved' && canSend && (
                <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
                  <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">MKK'ya Gönder</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-slate-500">İşlem onaylandı. Şimdi MKK'ya iletebilirsiniz.</p>
                    <Button onClick={handleSendToMKK} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white">
                      <Send size={16} className="mr-2" />
                      MKK'ya Gönder
                    </Button>
                  </CardContent>
                </Card>
              )}

              {tx.status === 'validation_failed' && (
                <Alert className="bg-rose-50/60 border border-rose-200/60 rounded-2xl">
                  <AlertTriangle size={18} className="text-rose-600" />
                  <AlertTitle className="text-rose-700 text-sm">Validasyon Hatası</AlertTitle>
                  <AlertDescription className="text-rose-600 text-xs">
                    {tx.invalidRecordCount} kayıtta hata bulundu. Dosyayı düzelterek tekrar yükleyin.
                  </AlertDescription>
                </Alert>
              )}

              <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Clock size={16} className="text-slate-600" />
                    İşlem Akışı
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {['draft','pending_validation','pending_approval','approved','sent_to_mkk','completed'].map((s, i) => {
                      const isDone = ['draft','pending_validation','pending_approval','approved','sent_to_mkk','completed'].indexOf(tx.status) >= i
                      const isCurrent = tx.status === s
                      return (
                        <div key={s} className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${isDone ? 'bg-blue-600' : 'bg-slate-200'} ${isCurrent ? 'ring-2 ring-blue-400 ring-offset-2' : ''}`} />
                          <span className={`text-xs ${isDone ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                            {statusLabels[s as keyof typeof statusLabels]}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600"><Lightbulb size={16} /></div>
                <div>
                  <CardTitle className="text-sm font-semibold">AKOP Insight</CardTitle>
                  <p className="text-[11px] text-slate-400">İşlem önerileri ve operasyonel risk takibi</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {getTransactionSuggestions().slice(0, 2).map((s) => (
                <div key={s.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-shadow">
                  <div className="mt-0.5 shrink-0">
                    {s.severity === 'critical' && <AlertTriangle size={14} className="text-rose-600" />}
                    {s.severity === 'warning' && <AlertTriangle size={14} className="text-amber-600" />}
                    {s.severity === 'info' && <CheckCircle size={14} className="text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-slate-800">{s.title}</p>
                      <Badge className={`text-[10px] ${
                        s.severity === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-200/60' :
                        s.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                        'bg-blue-50 text-blue-700 border-blue-200/60'
                      }`}>
                        {s.severity === 'critical' ? 'Kritik' : s.severity === 'warning' ? 'Uyarı' : 'Bilgi'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">{s.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="files" activeValue={activeTab}>
          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Yüklenen Dosyalar</CardTitle></CardHeader>
            <CardContent>
              {tx.files.length === 0 ? (
                <p className="text-sm text-slate-400">Dosya bulunamadı.</p>
              ) : (
                <div className="space-y-2">
                  {tx.files.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-3 shadow-sm">
                      <div className="flex items-center gap-3">
                        <FileText size={20} className="text-slate-400" />
                        <div>
                          <p className="text-sm font-medium text-slate-700">{f.name}</p>
                          <p className="text-xs text-slate-400">{(f.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" activeValue={activeTab}>
          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Validasyon Sonucu</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200/70 bg-white p-4 flex items-center gap-3 shadow-sm">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle size={20} /></div>
                  <div>
                    <p className="text-xs text-slate-500">Geçerli Kayıt</p>
                    <p className="text-xl font-bold text-slate-900">{tx.validRecordCount}</p>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200/70 bg-white p-4 flex items-center gap-3 shadow-sm">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={20} /></div>
                  <div>
                    <p className="text-xs text-slate-500">Hatalı Kayıt</p>
                    <p className="text-xl font-bold text-slate-900">{tx.invalidRecordCount}</p>
                  </div>
                </div>
              </div>
              {tx.validationErrors.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                      <TableHead className="text-xs font-medium text-slate-500">Satır</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Alan</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Hata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tx.validationErrors.map((err, idx) => (
                      <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50/70">
                        <TableCell className="text-xs text-slate-700">{err.row}</TableCell>
                        <TableCell className="text-xs text-slate-700">{err.field}</TableCell>
                        <TableCell className="text-xs text-rose-600">{err.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-slate-400">Validasyon hatası bulunamadı.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approvals" activeValue={activeTab}>
          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Onay Geçmişi</CardTitle></CardHeader>
            <CardContent>
              {tx.approvals.length === 0 ? (
                <p className="text-sm text-slate-400">Henüz onay kaydı bulunmuyor.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                      <TableHead className="text-xs font-medium text-slate-500">Tarih</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Kullanıcı</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Rol</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">İşlem</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Yorum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tx.approvals.map((a) => (
                      <TableRow key={a.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                        <TableCell className="text-xs text-slate-500">{new Date(a.timestamp).toLocaleString('tr-TR')}</TableCell>
                        <TableCell className="text-xs text-slate-700">{a.userName}</TableCell>
                        <TableCell className="text-xs text-slate-700">{roleLabels[a.role]}</TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${a.action === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-rose-50 text-rose-700 border-rose-200/60'}`}>
                            {a.action === 'approved' ? 'Onaylandı' : 'Reddedildi'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700">{a.comment || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" activeValue={activeTab}>
          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Audit Log</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                    <TableHead className="text-xs font-medium text-slate-500">Tarih</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Kullanıcı</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">İşlem</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Detay</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...tx.auditLogs].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((log) => (
                    <TableRow key={log.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                      <TableCell className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString('tr-TR')}</TableCell>
                      <TableCell className="text-xs text-slate-700">{log.userName}</TableCell>
                      <TableCell className="text-xs font-medium text-slate-700">{log.action}</TableCell>
                      <TableCell className="text-xs text-slate-700">{log.details || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
