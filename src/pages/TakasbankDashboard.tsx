import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  Banknote,
  FileStack,
  ShieldCheck,
  Lightbulb,
} from 'lucide-react'

interface SettlementRecord {
  id: string
  market: string
  settlementDate: string
  accountNo: string
  isin: string
  instrument: string
  obligationType: 'cash' | 'security'
  expectedAmount: number
  actualAmount: number
  difference: number
  status: 'matched' | 'mismatch' | 'pending'
  recommendedAction: string
}

const MOCK_RECORDS: SettlementRecord[] = [
  {
    id: 'TKS-001',
    market: 'Borsa İstanbul',
    settlementDate: '2026-06-17',
    accountNo: '12345678',
    isin: 'TREUFBDK0012',
    instrument: 'AKBNK',
    obligationType: 'cash',
    expectedAmount: 1250000.0,
    actualAmount: 1200000.0,
    difference: 50000.0,
    status: 'mismatch',
    recommendedAction: 'Nakit farkı 50.000 TL, mutabakat ekibi ile görüşülmesi gerekmektedir.',
  },
  {
    id: 'TKS-002',
    market: 'Borsa İstanbul',
    settlementDate: '2026-06-17',
    accountNo: '87654321',
    isin: 'TREUFBDK0023',
    instrument: 'GARAN',
    obligationType: 'security',
    expectedAmount: 5000.0,
    actualAmount: 5000.0,
    difference: 0.0,
    status: 'matched',
    recommendedAction: 'Mutabakat sağlandı, ek işlem gerekmez.',
  },
  {
    id: 'TKS-003',
    market: 'Borsa İstanbul',
    settlementDate: '2026-06-17',
    accountNo: '11223344',
    isin: 'TREUFBDK0034',
    instrument: 'ISCTR',
    obligationType: 'security',
    expectedAmount: 8500.0,
    actualAmount: 8000.0,
    difference: 500.0,
    status: 'mismatch',
    recommendedAction: 'Menkul kıymet farkı 500 adet, eksik transfer kontrol edilmeli.',
  },
  {
    id: 'TKS-004',
    market: 'Borsa İstanbul',
    settlementDate: '2026-06-17',
    accountNo: '55667788',
    isin: 'TREUFBDK0045',
    instrument: 'KCHOL',
    obligationType: 'cash',
    expectedAmount: 3400000.0,
    actualAmount: 0.0,
    difference: 3400000.0,
    status: 'pending',
    recommendedAction: 'Takas henüz gerçekleşmemiş, gün sonuna kadar izlenmeli.',
  },
  {
    id: 'TKS-005',
    market: 'Borsa İstanbul',
    settlementDate: '2026-06-16',
    accountNo: '99887766',
    isin: 'TREUFBDK0056',
    instrument: 'THYAO',
    obligationType: 'cash',
    expectedAmount: 890000.0,
    actualAmount: 890000.0,
    difference: 0.0,
    status: 'matched',
    recommendedAction: 'Mutabakat sağlandı, ek işlem gerekmez.',
  },
  {
    id: 'TKS-006',
    market: 'Borsa İstanbul',
    settlementDate: '2026-06-16',
    accountNo: '44332211',
    isin: 'TREUFBDK0067',
    instrument: 'SASA',
    obligationType: 'security',
    expectedAmount: 12000.0,
    actualAmount: 11500.0,
    difference: 500.0,
    status: 'mismatch',
    recommendedAction: 'MKK kaydı ile Takasbank verisi arasında fark var, raporlanmalı.',
  },
]

export default function TakasbankDashboard() {
  const [records] = useState<SettlementRecord[]>(MOCK_RECORDS)

  const matchedCount = records.filter((r) => r.status === 'matched').length
  const mismatchCount = records.filter((r) => r.status === 'mismatch').length
  const pendingCount = records.filter((r) => r.status === 'pending').length
  const cashMismatch = records.filter((r) => r.status === 'mismatch' && r.obligationType === 'cash').length
  const securityMismatch = records.filter((r) => r.status === 'mismatch' && r.obligationType === 'security').length
  const collateralWarning = 1

  const statusBadge = (status: SettlementRecord['status']) => {
    switch (status) {
      case 'matched':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200/60 text-[10px]">Eşleşti</Badge>
      case 'mismatch':
        return <Badge className="bg-rose-100 text-rose-700 border-rose-200/60 text-[10px]">Fark Var</Badge>
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200/60 text-[10px]">Beklemede</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Takasbank İzleme</h2>
              <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200/60">Mock Entegrasyon</Badge>
            </div>
            <p className="text-sm text-slate-500">Takas ve MKK mutabakat kayıtlarını izleyin.</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {[
            { label: 'Bugünkü Takas Durumu', value: 'İzleniyor', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Açık Nakit Yükümlülük', value: cashMismatch, icon: Banknote, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Açık Menkul Kıymet Yükümlülük', value: securityMismatch, icon: FileStack, color: 'text-indigo-600', bg: 'bg-indigo-50' },
            { label: 'Teminat Uyarısı', value: collateralWarning, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
            { label: 'MKK/Takasbank Mutabakat Farkı', value: mismatchCount, icon: ArrowRightLeft, color: 'text-slate-600', bg: 'bg-slate-50' },
          ].map((kpi) => (
            <Card key={kpi.label} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color}`}><kpi.icon size={16} /></div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-medium">{kpi.label}</p>
                    <p className="text-sm font-bold text-slate-800">{kpi.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Status Summary */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200/60">
            <CheckCircle2 size={10} className="mr-1 text-emerald-600" /> Eşleşen: {matchedCount}
          </Badge>
          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200/60">
            <AlertTriangle size={10} className="mr-1 text-rose-600" /> Farklı: {mismatchCount}
          </Badge>
          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200/60">
            <Clock size={10} className="mr-1 text-amber-600" /> Bekleyen: {pendingCount}
          </Badge>
        </div>

        {/* AKOP Insight */}
        <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600"><Lightbulb size={16} /></div>
              <div>
                <CardTitle className="text-sm font-semibold">AKOP Insight</CardTitle>
                <p className="text-[11px] text-slate-400">Takas ve mutabakat için otomatik öneriler</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Takas farkı bulunan kayıtlar kapanmadan gün sonu mutabakatı tamamlanmamalı. Nakit farkları öncelikli olarak çözümlenmeli; menkul kıymet farkları ise MKK ve Takasbank kayıtları karşılaştırılarak netleştirilmelidir.
            </p>
          </CardContent>
        </Card>

        {/* Settlement Table */}
        <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 text-slate-600"><ShieldCheck size={16} /></div>
              Takas Kayıtları
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                    <TableHead className="text-[10px] font-medium text-slate-500">Kayıt No</TableHead>
                    <TableHead className="text-[10px] font-medium text-slate-500">Piyasa</TableHead>
                    <TableHead className="text-[10px] font-medium text-slate-500">Takas Tarihi</TableHead>
                    <TableHead className="text-[10px] font-medium text-slate-500">Hesap</TableHead>
                    <TableHead className="text-[10px] font-medium text-slate-500">ISIN</TableHead>
                    <TableHead className="text-[10px] font-medium text-slate-500">Senet</TableHead>
                    <TableHead className="text-[10px] font-medium text-slate-500">Tür</TableHead>
                    <TableHead className="text-[10px] font-medium text-slate-500 text-right">Beklenen</TableHead>
                    <TableHead className="text-[10px] font-medium text-slate-500 text-right">Gerçekleşen</TableHead>
                    <TableHead className="text-[10px] font-medium text-slate-500 text-right">Fark</TableHead>
                    <TableHead className="text-[10px] font-medium text-slate-500">Durum</TableHead>
                    <TableHead className="text-[10px] font-medium text-slate-500">Önerilen Aksiyon</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map((r) => (
                    <TableRow key={r.id} className={`border-b border-slate-100 hover:bg-slate-50/70 ${r.status === 'mismatch' ? 'bg-rose-50/40' : r.status === 'pending' ? 'bg-amber-50/30' : ''}`}>
                      <TableCell className="text-[11px] font-medium text-slate-700 whitespace-nowrap">{r.id}</TableCell>
                      <TableCell className="text-[11px] text-slate-600 whitespace-nowrap">{r.market}</TableCell>
                      <TableCell className="text-[11px] text-slate-600 whitespace-nowrap">{r.settlementDate}</TableCell>
                      <TableCell className="text-[11px] text-slate-600 whitespace-nowrap">{r.accountNo}</TableCell>
                      <TableCell className="text-[11px] text-slate-600 whitespace-nowrap">{r.isin}</TableCell>
                      <TableCell className="text-[11px] text-slate-600 whitespace-nowrap">{r.instrument}</TableCell>
                      <TableCell className="text-[11px] text-slate-600 whitespace-nowrap">{r.obligationType === 'cash' ? 'Nakit' : 'Menkul Kıymet'}</TableCell>
                      <TableCell className="text-[11px] text-slate-700 text-right whitespace-nowrap">{r.expectedAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-[11px] text-slate-700 text-right whitespace-nowrap">{r.actualAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className={`text-[11px] text-right font-medium whitespace-nowrap ${r.difference !== 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{r.difference.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell className="whitespace-nowrap">{statusBadge(r.status)}</TableCell>
                      <TableCell className="text-[11px] text-slate-600 max-w-[200px] whitespace-normal">{r.recommendedAction}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
