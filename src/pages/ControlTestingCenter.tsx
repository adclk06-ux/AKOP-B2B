import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FileWarning,
  Play,
  Search,
  ShieldCheck,
  Target,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  createTest,
  fetchControls,
  fetchFindings,
  fetchTests,
  getControlRiskBadgeClass,
  getControlStats,
  getControlTypeBadgeClass,
  getFindingSeverityBadgeClass,
  getFindingStats,
  getFindingStatusBadgeClass,
  getFindingsForControl,
  getScoreColor,
  getTestResultBadgeClass,
  getTestStats,
  getTestsForControl,
  updateTest,
  type ControlDefinition,
  type ControlRiskLevel,
  type ControlTest,
  type TestResult,
} from '@/services/controls'
import { createEvidenceDocument, fetchEvidenceDocuments, type EvidenceDocument } from '@/services/evidence'
import { addAuditLog } from '@/services/auditTrail'
import { useAuthStore } from '@/store/authStore'

type ResultFilter = 'all' | TestResult
type RiskFilter = 'all' | ControlRiskLevel

const resultLabels: Record<TestResult, string> = {
  Passed: 'Başarılı',
  Partial: 'Kısmi',
  Failed: 'Başarısız',
}

const resultOptions: { value: ResultFilter; label: string }[] = [
  { value: 'all', label: 'Tüm testler' },
  { value: 'Passed', label: 'Başarılı' },
  { value: 'Partial', label: 'Kısmi' },
  { value: 'Failed', label: 'Başarısız' },
]

const riskOptions: { value: RiskFilter; label: string }[] = [
  { value: 'all', label: 'Tüm riskler' },
  { value: 'Critical', label: 'Kritik' },
  { value: 'High', label: 'Yüksek' },
  { value: 'Medium', label: 'Orta' },
  { value: 'Low', label: 'Düşük' },
]

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('tr-TR')
}

function getLatestTest(controlId: string, tests: ControlTest[]) {
  return getTestsForControl(controlId, tests)[0]
}

function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

function getNextTestDate(control: ControlDefinition) {
  const daysByFrequency: Record<ControlDefinition['frequency'], number> = {
    Daily: 1,
    Weekly: 7,
    Monthly: 30,
    Quarterly: 90,
    SemiAnnual: 180,
    Annual: 365,
  }
  return addDays(daysByFrequency[control.frequency])
}

function getSampleSize(control: ControlDefinition) {
  if (control.riskLevel === 'Critical') return '25 işlem / kayıt'
  if (control.riskLevel === 'High') return '15 işlem / kayıt'
  if (control.riskLevel === 'Medium') return '10 işlem / kayıt'
  return '5 işlem / kayıt'
}

function getTestingMethod(control: ControlDefinition) {
  if (control.controlType === 'Preventive') return 'Tasarım etkinliği ve önleyici eşik kontrolü'
  if (control.controlType === 'Detective') return 'Örneklem inceleme ve sapma tespiti'
  return 'Düzeltici aksiyon ve kapanış kanıtı doğrulama'
}

export default function ControlTestingCenter() {
  const user = useAuthStore((s) => s.user)
  const [controls] = useState<ControlDefinition[]>(() => fetchControls())
  const [tests, setTests] = useState<ControlTest[]>(() => fetchTests())
  const [findings] = useState(() => fetchFindings())
  const [evidenceDocs, setEvidenceDocs] = useState<EvidenceDocument[]>(() => fetchEvidenceDocuments())
  const [selectedControlId, setSelectedControlId] = useState<string>(() => fetchControls()[0]?.id ?? '')
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState<RiskFilter>('all')
  const [resultFilter, setResultFilter] = useState<ResultFilter>('all')

  const selectedControl = controls.find((control) => control.id === selectedControlId) ?? controls[0]
  const controlStats = getControlStats(controls)
  const testStats = getTestStats(tests)
  const findingStats = getFindingStats(findings)

  const filteredControls = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('tr-TR')
    return controls.filter((control) => {
      const latestTest = getLatestTest(control.id, tests)
      const matchesSearch = !normalized
        || control.title.toLocaleLowerCase('tr-TR').includes(normalized)
        || control.controlNumber.toLocaleLowerCase('tr-TR').includes(normalized)
        || control.owner.toLocaleLowerCase('tr-TR').includes(normalized)
        || control.linkedObligationIds.some((id) => id.toLocaleLowerCase('tr-TR').includes(normalized))
      const matchesRisk = riskFilter === 'all' || control.riskLevel === riskFilter
      const matchesResult = resultFilter === 'all' || latestTest?.result === resultFilter
      return matchesSearch && matchesRisk && matchesResult
    })
  }, [controls, riskFilter, resultFilter, search, tests])

  const selectedTests = selectedControl ? getTestsForControl(selectedControl.id, tests) : []
  const selectedFindings = selectedControl ? getFindingsForControl(selectedControl.id, findings) : []
  const selectedLatestTest = selectedTests[0]
  const selectedEvidence = selectedLatestTest
    ? evidenceDocs.filter((doc) => selectedLatestTest.evidenceIds.includes(doc.id) || (doc.linkedEntityType === 'test' && doc.linkedEntityId === selectedLatestTest.id))
    : []
  const selectedOpenFindings = selectedFindings.filter((finding) => finding.status === 'Open' || finding.status === 'In Progress')
  const selectedNextTestDate = selectedControl ? getNextTestDate(selectedControl) : ''
  const readinessSteps = selectedControl ? [
    {
      label: 'Yükümlülük bağı',
      done: selectedControl.linkedObligationIds.length > 0,
      detail: selectedControl.linkedObligationIds.join(', ') || 'Bağlı yükümlülük yok',
    },
    {
      label: 'Kontrol tanımı',
      done: selectedControl.active,
      detail: selectedControl.active ? `${selectedControl.controlNumber} aktif` : `${selectedControl.controlNumber} arşivli`,
    },
    {
      label: 'Test kaydı',
      done: selectedTests.length > 0,
      detail: selectedLatestTest ? `${formatDate(selectedLatestTest.testDate)} tarihinde test edildi` : 'Henüz test kaydı yok',
    },
    {
      label: 'Sonuç skoru',
      done: Boolean(selectedLatestTest && selectedLatestTest.score >= 70),
      detail: selectedLatestTest ? `%${selectedLatestTest.score} - ${resultLabels[selectedLatestTest.result]}` : 'Sonuç bekleniyor',
    },
    {
      label: 'Kanıt',
      done: selectedEvidence.length > 0,
      detail: selectedEvidence.length > 0 ? `${selectedEvidence.length} kanıt bağlı` : 'Kanıt bekliyor',
    },
  ] : []
  const readinessScore = readinessSteps.length > 0
    ? Math.round((readinessSteps.filter((step) => step.done).length / readinessSteps.length) * 100)
    : 0
  const readinessLabel = readinessScore >= 90 ? 'Hazır' : readinessScore >= 60 ? 'Takip Gerekli' : 'Eksik'
  const readinessClass = readinessScore >= 90
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    : readinessScore >= 60
      ? 'bg-amber-50 text-amber-700 border-amber-200/60'
      : 'bg-rose-50 text-rose-700 border-rose-200/60'

  function runControlTest(result: TestResult) {
    if (!selectedControl) return
    const scoreMap: Record<TestResult, number> = { Passed: 96, Partial: 72, Failed: 48 }
    const findingCountMap: Record<TestResult, number> = { Passed: 0, Partial: 1, Failed: 2 }
    const newTest = createTest({
      controlId: selectedControl.id,
      controlTitle: selectedControl.title,
      tester: user?.name ?? 'Sistem',
      testDate: new Date().toISOString().split('T')[0],
      result,
      score: scoreMap[result],
      findingsCount: findingCountMap[result],
      notes: result === 'Passed'
        ? 'Kontrol örnekleminde uygunsuzluk tespit edilmedi.'
        : result === 'Partial'
          ? 'Kontrol kısmen etkin, takip aksiyonu önerilir.'
          : 'Kontrol etkinliği yetersiz, bulgu ve aksiyon takibi gerekli.',
      evidenceIds: [],
    })
    setTests((current) => [newTest, ...current])
    addAuditLog({
      userId: user?.id ?? 'system',
      userName: user?.name ?? 'Sistem',
      role: user?.role ?? 'Sistem',
      action: `Kontrol testi kaydedildi: ${selectedControl.title} - ${resultLabels[result]}`,
      entityType: 'test',
      entityId: newTest.id,
      entityTitle: selectedControl.title,
      severity: result === 'Failed' ? 'warning' : 'info',
    })
  }

  function attachEvidenceToLatestTest() {
    if (!selectedControl || !selectedLatestTest) return
    const newEvidence = createEvidenceDocument({
      title: `${selectedControl.controlNumber} Test Kanıtı`,
      description: `${selectedControl.title} kontrol testi için otomatik oluşturulan demo kanıt kaydı.`,
      fileName: `${selectedControl.controlNumber}_${selectedLatestTest.id}_evidence.pdf`,
      fileType: 'PDF',
      fileSize: '420 KB',
      classification: selectedControl.riskLevel === 'Critical' ? 'Restricted' : 'Confidential',
      linkedEntityType: 'test',
      linkedEntityId: selectedLatestTest.id,
      linkedEntityTitle: `${selectedControl.title} - ${formatDate(selectedLatestTest.testDate)} testi`,
      uploadedBy: user?.name ?? 'Sistem',
      status: 'Aktif',
    })
    const updatedTest = updateTest(selectedLatestTest.id, {
      evidenceIds: Array.from(new Set([...selectedLatestTest.evidenceIds, newEvidence.id])),
    })
    if (updatedTest) {
      setTests((current) => current.map((test) => test.id === updatedTest.id ? updatedTest : test))
    }
    setEvidenceDocs((current) => [newEvidence, ...current])
    addAuditLog({
      userId: user?.id ?? 'system',
      userName: user?.name ?? 'Sistem',
      role: user?.role ?? 'Sistem',
      action: `Kontrol testine kanıt bağlandı: ${selectedControl.title}`,
      entityType: 'evidence',
      entityId: newEvidence.id,
      entityTitle: newEvidence.title,
      severity: 'info',
    })
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-5 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
          <div className="space-y-2">
            <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200/70">FAZ 24</Badge>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900">Control Testing Center</h2>
              <p className="text-sm text-slate-500">
                Yükümlülüklerden kontrollere, test sonuçlarına ve kanıta uzanan etkinlik takibi.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => runControlTest('Passed')} size="sm" className="rounded-xl bg-emerald-700 hover:bg-emerald-800">
              <CheckCircle2 size={16} />
              Başarılı Test
            </Button>
            <Button onClick={() => runControlTest('Partial')} size="sm" variant="outline" className="rounded-xl border-amber-200 text-amber-700 hover:bg-amber-50">
              <AlertTriangle size={16} />
              Kısmi Test
            </Button>
            <Button onClick={() => runControlTest('Failed')} size="sm" variant="outline" className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50">
              <XCircle size={16} />
              Başarısız Test
            </Button>
            <Button onClick={attachEvidenceToLatestTest} disabled={!selectedLatestTest} size="sm" variant="outline" className="rounded-xl border-slate-200">
              <FileCheck2 size={16} />
              Kanıt Bağla
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Aktif Kontrol', value: controlStats.active, helper: `${controlStats.total} toplam kontrol`, icon: ShieldCheck, color: 'text-indigo-700', bg: 'bg-indigo-50' },
            { label: 'Test Etkinliği', value: `%${testStats.avgScore}`, helper: `${testStats.total} test kaydı`, icon: ClipboardCheck, color: 'text-emerald-700', bg: 'bg-emerald-50' },
            { label: 'Başarısız / Kısmi', value: testStats.failed + testStats.partial, helper: `${testStats.failed} başarısız, ${testStats.partial} kısmi`, icon: AlertTriangle, color: 'text-amber-700', bg: 'bg-amber-50' },
            { label: 'Açık Bulgu', value: findingStats.open + findingStats.inProgress, helper: `${findingStats.critical + findingStats.high} kritik/yüksek`, icon: FileCheck2, color: 'text-rose-700', bg: 'bg-rose-50' },
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
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Kontrol, yükümlülük veya sahip ara..."
                  className="pl-9 rounded-xl border-slate-200/80"
                />
              </div>
              <Select value={riskFilter} onChange={(event) => setRiskFilter(event.target.value as RiskFilter)} className="rounded-xl border-slate-200/80">
                {riskOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
              <Select value={resultFilter} onChange={(event) => setResultFilter(event.target.value as ResultFilter)} className="rounded-xl border-slate-200/80">
                {resultOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </Select>
            </div>
          </CardContent>
        </Card>

        {selectedControl && (
          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-5">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_220px] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={readinessClass}>{readinessLabel}</Badge>
                    <Badge className={`text-[10px] ${getControlRiskBadgeClass(selectedControl.riskLevel)}`}>{selectedControl.riskLevel}</Badge>
                    <Badge className={`text-[10px] ${getControlTypeBadgeClass(selectedControl.controlType)}`}>{selectedControl.controlType}</Badge>
                  </div>
                  <h3 className="mt-2 text-sm font-bold text-slate-900 truncate">{selectedControl.controlNumber} · {selectedControl.title}</h3>
                  <p className="mt-1 text-xs text-slate-500">{selectedControl.description}</p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Target size={15} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Hazırlık Skoru</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: `${readinessScore}%` }} />
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-800">%{readinessScore}</p>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-slate-50/70 p-3">
                  <div className="flex items-center gap-2 text-slate-500">
                    <CalendarDays size={15} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Sonraki Test</span>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-800">{formatDate(selectedNextTestDate)}</p>
                  <p className="mt-1 text-[11px] text-slate-500">{selectedControl.frequency} periyot</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Kontrol Test Matrisi</CardTitle>
                <Badge className="bg-slate-50 text-slate-700 border-slate-200/70">{filteredControls.length} kayıt</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Kontrol</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Yükümlülük</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Risk</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Periyot</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Son Test</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Kanıt</TableHead>
                    <TableHead className="text-[10px] font-semibold text-slate-600 uppercase text-right">Skor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredControls.map((control) => {
                    const latestTest = getLatestTest(control.id, tests)
                    const isSelected = selectedControl?.id === control.id
                    const rowEvidenceCount = latestTest
                      ? evidenceDocs.filter((doc) => latestTest.evidenceIds.includes(doc.id) || (doc.linkedEntityType === 'test' && doc.linkedEntityId === latestTest.id)).length
                      : 0
                    return (
                      <TableRow
                        key={control.id}
                        onClick={() => setSelectedControlId(control.id)}
                        className={`border-b border-slate-100 cursor-pointer ${isSelected ? 'bg-indigo-50/70 hover:bg-indigo-50' : 'hover:bg-slate-50/70'}`}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-semibold text-slate-800">{control.controlNumber}</span>
                              <Badge className={`text-[10px] ${getControlTypeBadgeClass(control.controlType)}`}>{control.controlType}</Badge>
                            </div>
                            <p className="text-xs text-slate-600">{control.title}</p>
                            <p className="text-[11px] text-slate-400">{control.owner} · {control.department}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {control.linkedObligationIds.length > 0 ? control.linkedObligationIds.map((id) => (
                              <Badge key={id} className="text-[10px] bg-blue-50 text-blue-700 border-blue-200/60">{id}</Badge>
                            )) : <span className="text-xs text-slate-400">Bağ yok</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`text-[10px] ${getControlRiskBadgeClass(control.riskLevel)}`}>{control.riskLevel}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-slate-600">{control.frequency}</span>
                        </TableCell>
                        <TableCell>
                          {latestTest ? (
                            <div className="space-y-1">
                              <Badge className={`text-[10px] ${getTestResultBadgeClass(latestTest.result)}`}>{resultLabels[latestTest.result]}</Badge>
                              <p className="text-[11px] text-slate-400">{formatDate(latestTest.testDate)}</p>
                            </div>
                          ) : (
                            <Badge className="text-[10px] bg-slate-50 text-slate-600 border-slate-200/60">Test yok</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {rowEvidenceCount > 0 ? (
                            <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200/60">{rowEvidenceCount} kanıt</Badge>
                          ) : (
                            <Badge className="text-[10px] bg-rose-50 text-rose-700 border-rose-200/60">Eksik</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`text-sm font-bold ${latestTest ? getScoreColor(latestTest.score) : 'text-slate-400'}`}>
                            {latestTest ? `%${latestTest.score}` : '-'}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredControls.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-xs text-slate-500 py-10">Filtrelere uygun kontrol bulunamadı.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Test Akışı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedControl ? (
                  <>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Seçili Kontrol</p>
                      <h3 className="mt-1 text-base font-bold text-slate-900">{selectedControl.title}</h3>
                      <p className="mt-1 text-xs text-slate-500">{selectedControl.description}</p>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: 'Yükümlülük', value: selectedControl.linkedObligationIds.join(', ') || 'Bağlı yükümlülük yok' },
                        { label: 'Kontrol', value: selectedControl.controlNumber },
                        { label: 'Test', value: selectedLatestTest ? `${formatDate(selectedLatestTest.testDate)} · ${resultLabels[selectedLatestTest.result]}` : 'Henüz test yok' },
                        { label: 'Sonuç', value: selectedLatestTest ? `%${selectedLatestTest.score} etkinlik skoru` : 'Beklemede' },
                        { label: 'Kanıt', value: selectedEvidence.length ? selectedEvidence.map((doc) => doc.id).join(', ') : 'Kanıt bekliyor' },
                      ].map((step, index, items) => (
                        <div key={step.label} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">{index + 1}</div>
                            {index < items.length - 1 && <div className="h-8 w-px bg-slate-200" />}
                          </div>
                          <div className="pb-3 min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{step.label}</p>
                            <p className="text-xs text-slate-700 break-words">{step.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Detay için bir kontrol seçin.</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Kontrol Checklist</CardTitle>
                  <Badge className={readinessClass}>%{readinessScore}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {readinessSteps.map((step) => (
                  <div key={step.label} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                    <div className={`mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full ${step.done ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {step.done ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800">{step.label}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500 break-words">{step.detail}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {selectedControl && (
              <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold">Test Prosedürü</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { label: 'Test yöntemi', value: getTestingMethod(selectedControl) },
                    { label: 'Örneklem', value: getSampleSize(selectedControl) },
                    { label: 'Beklenen kanıt', value: selectedControl.controlType === 'Corrective' ? 'Aksiyon kapanış formu ve onay izi' : 'Kontrol çıktısı, sistem ekran görüntüsü veya mutabakat raporu' },
                    { label: 'Aksiyon durumu', value: selectedOpenFindings.length > 0 ? `${selectedOpenFindings.length} açık bulgu takipte` : 'Açık bulgu yok' },
                  ].map((item) => (
                    <div key={item.label} className="rounded-xl bg-slate-50/80 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{item.label}</p>
                      <p className="mt-1 text-xs font-medium text-slate-800">{item.value}</p>
                    </div>
                  ))}
                  {selectedEvidence.length === 0 && selectedLatestTest && (
                    <div className="flex items-start gap-2 rounded-xl border border-amber-200/70 bg-amber-50 p-3">
                      <FileWarning size={15} className="mt-0.5 text-amber-700" />
                      <p className="text-xs text-amber-800">Son test sonucu var ancak kanıt bağlı değil. Testin denetlenebilir olması için kanıt ekleyin.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Son Testler ve Bulgular</CardTitle>
                  <Badge className="bg-slate-50 text-slate-700 border-slate-200/70">{selectedTests.length} test</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedTests.slice(0, 4).map((test) => (
                  <div key={test.id} className="rounded-xl border border-slate-100 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-800">{formatDate(test.testDate)} · {test.tester}</p>
                        <p className="mt-1 text-[11px] text-slate-500">{test.notes || 'Not girilmemiş.'}</p>
                      </div>
                      <div className="text-right">
                        <Badge className={`text-[10px] ${getTestResultBadgeClass(test.result)}`}>{resultLabels[test.result]}</Badge>
                        <p className={`mt-1 text-xs font-bold ${getScoreColor(test.score)}`}>%{test.score}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedTests.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
                    <Play size={18} className="mx-auto text-slate-400" />
                    <p className="mt-2 text-xs text-slate-500">Bu kontrol için henüz test kaydı yok.</p>
                  </div>
                )}
                {selectedFindings.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {selectedFindings.slice(0, 3).map((finding) => (
                      <div key={finding.id} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50/80 p-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{finding.title}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{finding.owner} · {finding.dueDate ? formatDate(finding.dueDate) : 'Tarih yok'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <Badge className={`text-[10px] ${getFindingSeverityBadgeClass(finding.severity)}`}>{finding.severity}</Badge>
                          <Badge className={`text-[10px] ${getFindingStatusBadgeClass(finding.status)}`}>{finding.status}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {selectedEvidence.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {selectedEvidence.slice(0, 3).map((doc) => (
                      <div key={doc.id} className="flex items-start justify-between gap-3 rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
                        <div>
                          <p className="text-xs font-semibold text-slate-800">{doc.title}</p>
                          <p className="mt-1 text-[11px] text-slate-500">{doc.fileName} · v{doc.version} · {doc.hash.slice(0, 10)}</p>
                        </div>
                        <Badge className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200/60">{doc.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="bg-slate-900 text-white border-slate-800 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200">FAZ 24 kapsamı</p>
                <p className="mt-1 text-sm text-slate-200">
                  Bu merkez, yükümlülükten kontrole, kontrolden teste, testten sonuca ve kanıta kadar izlenebilirlik sağlar.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span>Yükümlülük</span>
                <ArrowRight size={14} />
                <span>Kontrol</span>
                <ArrowRight size={14} />
                <span>Test</span>
                <ArrowRight size={14} />
                <span>Kanıt</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
