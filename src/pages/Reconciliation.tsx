import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Upload, FileSpreadsheet, AlertTriangle, CheckCircle, BarChart3,
  Download, Shield, Database, ArrowLeft, RefreshCw, FileText,
  Lightbulb,
} from 'lucide-react'
import { getReconciliationSuggestions } from '@/services/silentAdvisor'
import {
  parseFile, normalizeColumns, validateColumns, runReconciliation,
  buildIssues, enrichIssuesWithRisk, exportToExcel, detectReconciliationFileType,
  type ReconciliationResults, type IssueRow,
} from '@/lib/reconciliation'

export default function Reconciliation() {
  const navigate = useNavigate()
  const [fileSistem, setFileSistem] = useState<File | null>(null)
  const [fileKarsi, setFileKarsi] = useState<File | null>(null)
  const [dfSistem, setDfSistem] = useState<Record<string, any>[] | null>(null)
  const [dfKarsi, setDfKarsi] = useState<Record<string, any>[] | null>(null)
  const [results, setResults] = useState<ReconciliationResults | null>(null)
  const [issues, setIssues] = useState<IssueRow[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const [fileTypeSistem, setFileTypeSistem] = useState<'system' | 'counterparty' | 'unknown' | null>(null)
  const [fileTypeKarsi, setFileTypeKarsi] = useState<'system' | 'counterparty' | 'unknown' | null>(null)
  const [validationErrorSistem, setValidationErrorSistem] = useState<string | null>(null)
  const [validationErrorKarsi, setValidationErrorKarsi] = useState<string | null>(null)

  const handleFileSistem = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFileSistem(file)
    setValidationErrorSistem(null)
    setFileTypeSistem(null)
    setDfSistem(null)
    setError(null)
    if (!file) return

    // Cross-file check
    if (fileKarsi && file.name === fileKarsi.name) {
      setValidationErrorSistem('Aynı dosya iki alana yüklenemez.')
      return
    }

    try {
      const rawData = await parseFile(file)
      const headers = Object.keys(rawData[0] || {})
      const detected = detectReconciliationFileType(headers)
      setFileTypeSistem(detected)

      if (detected === 'counterparty') {
        setValidationErrorSistem('Bu dosya karşı taraf dosyası gibi görünüyor. Lütfen Karşı Taraf alanına yükleyin.')
        return
      }
      if (detected === 'unknown') {
        setValidationErrorSistem('Dosya kolon yapısı tanınamadı. Beklenen sistem dosyası kolonları: internalAccountNo, müşteri no, internal balance vb.')
        return
      }

      const data = normalizeColumns(rawData)
      validateColumns(data, 'Sistem Raporu')
      setDfSistem(data)
    } catch (err: any) {
      setValidationErrorSistem(err.message)
    }
  }, [fileKarsi])

  const handleFileKarsi = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFileKarsi(file)
    setValidationErrorKarsi(null)
    setFileTypeKarsi(null)
    setDfKarsi(null)
    setError(null)
    if (!file) return

    // Cross-file check
    if (fileSistem && file.name === fileSistem.name) {
      setValidationErrorKarsi('Aynı dosya iki alana yüklenemez.')
      return
    }

    try {
      const rawData = await parseFile(file)
      const headers = Object.keys(rawData[0] || {})
      const detected = detectReconciliationFileType(headers)
      setFileTypeKarsi(detected)

      if (detected === 'system') {
        setValidationErrorKarsi('Bu dosya sistem dosyası gibi görünüyor. Lütfen Sistem Dosyası alanına yükleyin.')
        return
      }
      if (detected === 'unknown') {
        setValidationErrorKarsi('Dosya kolon yapısı tanınamadı. Beklenen karşı taraf dosyası kolonları: mkkAccountNo, mkk hesap no, mkk bakiye vb.')
        return
      }

      const data = normalizeColumns(rawData)
      validateColumns(data, 'Karşı Taraf Raporu')
      setDfKarsi(data)
    } catch (err: any) {
      setValidationErrorKarsi(err.message)
    }
  }, [fileSistem])

  const handleRun = useCallback(async () => {
    if (!dfSistem || !dfKarsi) {
      setError('Her iki dosyayı da yükleyin.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = runReconciliation(dfSistem, dfKarsi, null, true)
      const built = buildIssues(res)
      const enriched = enrichIssuesWithRisk(built)
      setResults(res)
      setIssues(enriched)
      setActiveTab('overview')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [dfSistem, dfKarsi])

  const handleDownloadExcel = useCallback(async () => {
    if (!results || !dfSistem || !dfKarsi) return
    const blob = await exportToExcel(results, dfSistem, dfKarsi, issues)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mutabakat_raporu_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }, [results, dfSistem, dfKarsi, issues])

  const handleReset = useCallback(() => {
    setFileSistem(null)
    setFileKarsi(null)
    setDfSistem(null)
    setDfKarsi(null)
    setResults(null)
    setIssues([])
    setError(null)
    setActiveTab('overview')
    setFileTypeSistem(null)
    setFileTypeKarsi(null)
    setValidationErrorSistem(null)
    setValidationErrorKarsi(null)
  }, [])

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">MKK Mutabakatı</h2>
            <p className="text-sm text-slate-500">Sistem ve karşı taraf raporlarını karşılaştırın.</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/reports')} className="rounded-xl border-slate-200/70">
            <ArrowLeft size={16} className="mr-2" />
            Raporlara Dön
          </Button>
        </div>

        <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <Badge className="mb-2 bg-blue-100 text-blue-700 border-blue-200/60">Finans Operasyon Kontrol Sistemi</Badge>
            <h3 className="text-xl font-bold text-slate-900">Operasyon Mutabakat ve Hata Tespit Paneli</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Finans ve operasyon ekipleri için geliştirilen bu sistem, iki farklı kaynaktan gelen raporları karşılaştırarak eksik kayıtları, tutar farklarını, tarih uyumsuzluklarını ve istisnai işlemleri tespit eder.
            </p>
          </div>
          <div className="hidden md:flex flex-col gap-2 text-right text-xs text-slate-500">
            <div className="flex items-center gap-1 justify-end">
              <CheckCircle size={14} className="text-emerald-600" />
              <span>Sistem Durumu: Hazır</span>
            </div>
            <div>Gerçek Dosya Kontrolü</div>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600"><Upload size={14} /></div>
                Sistem Raporu Yükle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 transition-colors hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer">
                <FileSpreadsheet size={32} className="text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-700">{fileSistem ? fileSistem.name : 'CSV veya Excel dosyası seçin'}</span>
                <span className="text-xs text-slate-500 mt-1">.csv, .xlsx, .xls</span>
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileSistem} />
              </label>
              {validationErrorSistem && (
                <div className="mt-3 rounded-xl border border-amber-200/60 bg-amber-50 p-3 flex items-start gap-2 text-xs text-amber-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{validationErrorSistem}</span>
                </div>
              )}
              {dfSistem && fileTypeSistem === 'system' && !validationErrorSistem && (
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700"><CheckCircle size={14} /><span>Sistem dosyası doğrulandı — {dfSistem.length} kayıt</span></div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-800">
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 text-blue-600"><Upload size={14} /></div>
                Karşı Taraf Raporu Yükle
              </CardTitle>
            </CardHeader>
            <CardContent>
              <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 transition-colors hover:border-blue-300 hover:bg-blue-50/30 cursor-pointer">
                <FileSpreadsheet size={32} className="text-slate-400 mb-2" />
                <span className="text-sm font-medium text-slate-700">{fileKarsi ? fileKarsi.name : 'CSV veya Excel dosyası seçin'}</span>
                <span className="text-xs text-slate-500 mt-1">.csv, .xlsx, .xls</span>
                <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleFileKarsi} />
              </label>
              {validationErrorKarsi && (
                <div className="mt-3 rounded-xl border border-amber-200/60 bg-amber-50 p-3 flex items-start gap-2 text-xs text-amber-700">
                  <AlertTriangle size={14} className="mt-0.5 shrink-0" /><span>{validationErrorKarsi}</span>
                </div>
              )}
              {dfKarsi && fileTypeKarsi === 'counterparty' && !validationErrorKarsi && (
                <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700"><CheckCircle size={14} /><span>Karşı taraf dosyası doğrulandı — {dfKarsi.length} kayıt</span></div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleRun} disabled={loading || !dfSistem || !dfKarsi} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-sm hover:shadow-md transition-all">
            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Analiz Çalışıyor...' : 'Mutabakatı Başlat'}
          </Button>
          <Button variant="outline" onClick={handleReset} className="rounded-xl border-slate-200/70">Sıfırla</Button>
        </div>

      {results && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">Kontrol Sonucu — Özet</h3>
            <Button onClick={handleDownloadExcel} variant="outline" size="sm" className="rounded-xl border-slate-200/70">
              <Download size={14} className="mr-2" />
              Excel Raporunu İndir
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Sistem Kayıt', value: results.total_sistem, icon: Database, color: 'text-slate-600', bg: 'bg-slate-50' },
              { label: 'Karşı Taraf Kayıt', value: results.total_karsi, icon: Database, color: 'text-slate-600', bg: 'bg-slate-50' },
              { label: 'Eşleşen', value: results.matched, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Toplam Uyarı', value: results.total_errors, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
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

          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Sadece Sistemde', value: results.only_sistem.length, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
              { label: 'Sadece Karşı Tarafta', value: results.only_karsi.length, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
              { label: 'Tutar Uyumsuzluğu', value: results.amount_diff.length, icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Mükerrer Kayıt', value: results.dup_sistem.length + results.dup_karsi.length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
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

          {issues.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Fark Analizi — Mutabakat Sonuçları</h3>
                <div className="text-sm text-muted-foreground">
                  Kritik: {issues.filter((i) => i['Önem'] === 'Kritik').length} | Uyarı: {issues.filter((i) => i['Önem'] === 'Uyarı').length} | Bilgi: {issues.filter((i) => i['Önem'] === 'Bilgi').length}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                {[
                  { label: 'Yüksek Riskli', value: issues.filter((i) => i['Risk Seviyesi'] === 'Yüksek Risk').length, icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50' },
                  { label: 'Orta Riskli', value: issues.filter((i) => i['Risk Seviyesi'] === 'Orta Risk').length, icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
                  { label: 'Düşük Riskli', value: issues.filter((i) => i['Risk Seviyesi'] === 'Düşük Risk').length, icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Ortalama Risk Skoru', value: issues.length ? Math.round(issues.reduce((s, i) => s + (i['Risk Skoru'] || 0), 0) / issues.length) : 0, icon: BarChart3, color: 'text-slate-600', bg: 'bg-slate-50' },
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
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Uyumsuzluk Özeti</CardTitle></CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                          <TableHead className="text-xs font-medium text-slate-500">Önem</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">Kategori</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">Referans No</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">Müşteri No</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">Sistem Değeri</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">Karşı Taraf Değeri</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">Açıklama</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">Risk</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {issues.map((issue, idx) => (
                          <TableRow key={idx} className="border-b border-slate-100 hover:bg-slate-50/70">
                            <TableCell>
                              <Badge className={`text-[10px] ${
                                issue['Önem'] === 'Kritik' ? 'bg-rose-50 text-rose-700 border-rose-200/60' :
                                issue['Önem'] === 'Uyarı' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                                'bg-blue-50 text-blue-700 border-blue-200/60'
                              }`}>{issue['Önem']}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-700">{issue['Kategori']}</TableCell>
                            <TableCell className="text-xs font-medium text-slate-700">{issue['Referans No']}</TableCell>
                            <TableCell className="text-xs text-slate-700">{issue['Müşteri No']}</TableCell>
                            <TableCell className="text-xs text-slate-700 max-w-[120px] truncate" title={issue['Sistem Değeri']}>{issue['Sistem Değeri']}</TableCell>
                            <TableCell className="text-xs text-slate-700 max-w-[120px] truncate" title={issue['Karşı Taraf Değeri']}>{issue['Karşı Taraf Değeri']}</TableCell>
                            <TableCell className="text-xs text-slate-700 max-w-[200px] truncate" title={issue['Açıklama']}>{issue['Açıklama']}</TableCell>
                            <TableCell>
                              <Badge className={`text-[10px] ${
                                issue['Risk Seviyesi'] === 'Yüksek Risk' ? 'bg-rose-50 text-rose-700 border-rose-200/60' :
                                issue['Risk Seviyesi'] === 'Orta Risk' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                                'bg-blue-50 text-blue-700 border-blue-200/60'
                              }`}>{issue['Risk Seviyesi']}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {results.total_errors === 0 && (
            <Alert className="bg-emerald-50/60 border border-emerald-200/60 rounded-2xl">
              <CheckCircle size={16} className="text-emerald-600" />
              <AlertDescription className="text-emerald-700 text-sm">Mutabakat tamamlandı. Hiçbir uyumsuzluk tespit edilmedi.</AlertDescription>
            </Alert>
          )}

          {results.total_errors > 0 && (
            <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600"><Lightbulb size={16} /></div>
                  <div>
                    <CardTitle className="text-sm font-semibold">AKOP Insight</CardTitle>
                    <p className="text-[11px] text-slate-400">Mutabakat sonuçlarına göre otomatik öneriler</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {getReconciliationSuggestions().map((s) => (
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
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="overview" activeValue={activeTab} onValueChange={setActiveTab}>Genel Bakış</TabsTrigger>
              <TabsTrigger value="only-sistem" activeValue={activeTab} onValueChange={setActiveTab}>Sadece Sistemde ({results.only_sistem.length})</TabsTrigger>
              <TabsTrigger value="only-karsi" activeValue={activeTab} onValueChange={setActiveTab}>Sadece Karşı Tarafta ({results.only_karsi.length})</TabsTrigger>
              <TabsTrigger value="amount" activeValue={activeTab} onValueChange={setActiveTab}>Tutar Uyumsuzlukları ({results.amount_diff.length})</TabsTrigger>
              <TabsTrigger value="date" activeValue={activeTab} onValueChange={setActiveTab}>Tarih Uyumsuzlukları ({results.date_diff.length})</TabsTrigger>
              <TabsTrigger value="musteri" activeValue={activeTab} onValueChange={setActiveTab}>Müşteri No Farkı ({results.musteri_diff.length})</TabsTrigger>
              <TabsTrigger value="islem" activeValue={activeTab} onValueChange={setActiveTab}>İşlem Tipi Farkı ({results.islem_diff.length})</TabsTrigger>
              <TabsTrigger value="optional" activeValue={activeTab} onValueChange={setActiveTab}>Opsiyonel Alan Farkları ({results.optional_diffs.length})</TabsTrigger>
              <TabsTrigger value="dup" activeValue={activeTab} onValueChange={setActiveTab}>Mükerrer Kayıtlar ({results.dup_sistem.length + results.dup_karsi.length})</TabsTrigger>
              <TabsTrigger value="risk" activeValue={activeTab} onValueChange={setActiveTab}>Risk Önceliklendirme ({issues.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" activeValue={activeTab}>
              <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Mutabakat Durumu Özeti</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: 'Toplam Kayıt', value: results.total_sistem + results.total_karsi, color: 'text-slate-900' },
                      { label: 'Eşleşen Kayıt', value: results.matched, color: 'text-emerald-600' },
                      { label: 'Uyumsuz Kayıt', value: results.total_errors, color: results.total_errors > 0 ? 'text-rose-600' : 'text-emerald-600' },
                      { label: 'Mutabakat Durumu', value: results.total_errors === 0 ? 'Tam Mutabakat' : 'Dikkat Gerekli', color: results.total_errors === 0 ? 'text-emerald-700' : 'text-amber-700', small: true },
                    ].map((item) => (
                      <div key={item.label} className="rounded-2xl border border-slate-200/70 bg-white p-3 text-center shadow-sm">
                        <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                        <p className={`${item.small ? 'text-sm font-semibold' : 'text-xl font-bold'} ${item.color}`}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="only-sistem" activeValue={activeTab}>
              <DataTable title="Sadece Sistemde Olan Kayıtlar" data={results.only_sistem} />
            </TabsContent>
            <TabsContent value="only-karsi" activeValue={activeTab}>
              <DataTable title="Sadece Karşı Tarafta Olan Kayıtlar" data={results.only_karsi} />
            </TabsContent>
            <TabsContent value="amount" activeValue={activeTab}>
              <DataTable title="Tutar Uyumsuzlukları" data={results.amount_diff} />
            </TabsContent>
            <TabsContent value="date" activeValue={activeTab}>
              <DataTable title="Tarih Uyumsuzlukları" data={results.date_diff} />
            </TabsContent>
            <TabsContent value="musteri" activeValue={activeTab}>
              <DataTable title="Müşteri No Farkları" data={results.musteri_diff} />
            </TabsContent>
            <TabsContent value="islem" activeValue={activeTab}>
              <DataTable title="İşlem Tipi Farkları" data={results.islem_diff} />
            </TabsContent>
            <TabsContent value="optional" activeValue={activeTab}>
              <DataTable title="Opsiyonel Alan Farkları" data={results.optional_diffs} />
            </TabsContent>
            <TabsContent value="dup" activeValue={activeTab}>
              <DataTable title="Mükerrer Kayıtlar" data={[...results.dup_sistem, ...results.dup_karsi]} />
            </TabsContent>
            <TabsContent value="risk" activeValue={activeTab}>
              <DataTable title="Risk Önceliklendirme" data={issues.map((i) => ({
                referans_no: i['Referans No'],
                kategori: i['Kategori'],
                onem: i['Önem'],
                risk_skoru: i['Risk Skoru'],
                risk_seviyesi: i['Risk Seviyesi'],
                onerilen_aksiyon: i['Önerilen Aksiyon'],
              }))} />
            </TabsContent>
          </Tabs>
        </div>
      )}
      </div>
    </div>
  )
}

function DataTable({ title, data }: { title: string; data: Record<string, any>[] }) {
  if (!data.length) {
    return (
      <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-slate-400">Bu kategoride kayıt bulunmamaktadır.</p>
        </CardContent>
      </Card>
    )
  }
  const cols = Object.keys(data[0])
  return (
    <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{title} ({data.length})</CardTitle></CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                {cols.map((c) => (
                  <TableHead key={c} className="text-xs font-medium text-slate-500">{c}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, i) => (
                <TableRow key={i} className="border-b border-slate-100 hover:bg-slate-50/70">
                  {cols.map((c) => (
                    <TableCell key={c} className="text-xs text-slate-700">{String(row[c] ?? '')}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
