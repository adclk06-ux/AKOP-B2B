export type ControlType = 'Preventive' | 'Detective' | 'Corrective'
export type ControlFrequency = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'SemiAnnual' | 'Annual'
export type ControlRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'

export interface ControlDefinition {
  id: string
  controlNumber: string
  title: string
  description: string
  controlType: ControlType
  frequency: ControlFrequency
  owner: string
  department: string
  riskLevel: ControlRiskLevel
  linkedPolicyIds: string[]
  linkedObligationIds: string[]
  linkedRegulationIds: string[]
  linkedRiskIds: string[]
  active: boolean
  createdAt: string
  updatedAt: string
}

export type TestResult = 'Passed' | 'Failed' | 'Partial'

export interface ControlTest {
  id: string
  controlId: string
  controlTitle: string
  tester: string
  testDate: string
  result: TestResult
  score: number
  findingsCount: number
  notes: string
  evidenceIds: string[]
  createdAt: string
}

export type FindingSeverity = 'Low' | 'Medium' | 'High' | 'Critical'
export type FindingStatus = 'Open' | 'In Progress' | 'Mitigated' | 'Closed'

export interface Finding {
  id: string
  findingNumber: string
  title: string
  description: string
  severity: FindingSeverity
  status: FindingStatus
  linkedControlId: string
  linkedTestId: string
  linkedCaseId?: string
  linkedTaskId?: string
  owner: string
  dueDate?: string
  createdAt: string
}

const STORAGE_KEY_CONTROLS = 'akop_controls_v1'
const STORAGE_KEY_TESTS = 'akop_control_tests_v1'
const STORAGE_KEY_FINDINGS = 'akop_findings_v1'

function loadControls(): ControlDefinition[] {
  try { const raw = localStorage.getItem(STORAGE_KEY_CONTROLS); return raw ? JSON.parse(raw) as ControlDefinition[] : [] } catch { return [] }
}
function saveControls(items: ControlDefinition[]) { localStorage.setItem(STORAGE_KEY_CONTROLS, JSON.stringify(items)) }

function loadTests(): ControlTest[] {
  try { const raw = localStorage.getItem(STORAGE_KEY_TESTS); return raw ? JSON.parse(raw) as ControlTest[] : [] } catch { return [] }
}
function saveTests(items: ControlTest[]) { localStorage.setItem(STORAGE_KEY_TESTS, JSON.stringify(items)) }

function loadFindings(): Finding[] {
  try { const raw = localStorage.getItem(STORAGE_KEY_FINDINGS); return raw ? JSON.parse(raw) as Finding[] : [] } catch { return [] }
}
function saveFindings(items: Finding[]) { localStorage.setItem(STORAGE_KEY_FINDINGS, JSON.stringify(items)) }

function genId(prefix: string) { return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}` }

const now = new Date().toISOString()
const today = new Date()
const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7)
const lastMonth = new Date(today); lastMonth.setDate(today.getDate() - 30)
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 7)
const nextMonth = new Date(today); nextMonth.setDate(today.getDate() + 30)

export const demoControls: ControlDefinition[] = [
  {
    id: 'ctrl-001', controlNumber: 'CTRL-001', title: 'Yetki Gözden Geçirme Kontrolü',
    description: 'Kullanıcı yetkilerinin periyodik olarak gözden geçirilmesi ve revize edilmesi.',
    controlType: 'Preventive', frequency: 'Quarterly', owner: 'Okan Tekin', department: 'IT Güvenlik',
    riskLevel: 'High', linkedPolicyIds: ['pol-008'], linkedObligationIds: ['obl-yet-008'], linkedRegulationIds: ['spk-g-06'], linkedRiskIds: ['risk-yet-008'],
    active: true, createdAt: '2024-01-15T10:00:00Z', updatedAt: now,
  },
  {
    id: 'ctrl-002', controlNumber: 'CTRL-002', title: 'MKK Mutabakat Kontrolü',
    description: 'Merkezi Kayıt Kuruluşu ile günlük pozisyon ve saklama mutabakatı kontrolü.',
    controlType: 'Detective', frequency: 'Daily', owner: 'Mehmet Yılmaz', department: 'Operasyon',
    riskLevel: 'Critical', linkedPolicyIds: ['pol-003'], linkedObligationIds: ['obl-mkk-003'], linkedRegulationIds: ['spk-g-03'], linkedRiskIds: ['risk-mkk-003'],
    active: true, createdAt: '2024-02-01T09:00:00Z', updatedAt: now,
  },
  {
    id: 'ctrl-003', controlNumber: 'CTRL-003', title: 'Takasbank Limit Kontrolü',
    description: 'Takasbank teminat limitlerinin günlük kontrolü ve aşım takibi.',
    controlType: 'Preventive', frequency: 'Daily', owner: 'Canan Özdemir', department: 'Risk Yönetimi',
    riskLevel: 'Critical', linkedPolicyIds: ['pol-004'], linkedObligationIds: ['obl-tbt-004'], linkedRegulationIds: ['spk-g-04'], linkedRiskIds: ['risk-tbt-004'],
    active: true, createdAt: '2024-03-10T11:00:00Z', updatedAt: now,
  },
  {
    id: 'ctrl-004', controlNumber: 'CTRL-004', title: 'MASAK KYC Kontrolü',
    description: 'Müşteri tanıma süreçlerinin periyodik doğrulanması ve eksiklik tespiti.',
    controlType: 'Detective', frequency: 'Monthly', owner: 'Burak Şahin', department: 'Uyum Departmanı',
    riskLevel: 'High', linkedPolicyIds: ['pol-005'], linkedObligationIds: ['obl-aml-005'], linkedRegulationIds: ['masak-reg-001'], linkedRiskIds: ['risk-aml-005'],
    active: true, createdAt: '2024-04-01T10:00:00Z', updatedAt: now,
  },
  {
    id: 'ctrl-005', controlNumber: 'CTRL-005', title: 'SPK Bildirim Kontrolü',
    description: 'Sermaye Piyasası Kurulu düzenli bildirimlerinin zamanında ve eksiksiz yapılmasının kontrolü.',
    controlType: 'Preventive', frequency: 'Weekly', owner: 'Ahmet Kaya', department: 'Uyum Departmanı',
    riskLevel: 'High', linkedPolicyIds: ['pol-001'], linkedObligationIds: ['obl-spk-001'], linkedRegulationIds: ['spk-g-01'], linkedRiskIds: ['risk-spk-001'],
    active: true, createdAt: '2024-05-15T09:00:00Z', updatedAt: now,
  },
  {
    id: 'ctrl-006', controlNumber: 'CTRL-006', title: 'Kanıt Saklama Kontrolü',
    description: 'Uyum kanıtlarının doğru sınıflandırılması, saklanması ve erişilebilirliğinin kontrolü.',
    controlType: 'Corrective', frequency: 'Quarterly', owner: 'Esra Yıldız', department: 'Denetim',
    riskLevel: 'Medium', linkedPolicyIds: ['pol-007'], linkedObligationIds: ['obl-knt-007'], linkedRegulationIds: ['spk-g-05'], linkedRiskIds: ['risk-knt-007'],
    active: true, createdAt: '2024-06-01T10:00:00Z', updatedAt: now,
  },
  {
    id: 'ctrl-007', controlNumber: 'CTRL-007', title: 'BDDK Operasyonel Risk Kontrolü',
    description: 'Operasyonel risk olaylarının tespiti, raporlanması ve aksiyon takibi.',
    controlType: 'Detective', frequency: 'Monthly', owner: 'Deniz Koç', department: 'Risk Yönetimi',
    riskLevel: 'High', linkedPolicyIds: ['pol-006'], linkedObligationIds: ['obl-bdd-006'], linkedRegulationIds: ['bddk-reg-001'], linkedRiskIds: ['risk-bdd-006'],
    active: true, createdAt: '2024-07-01T09:00:00Z', updatedAt: now,
  },
  {
    id: 'ctrl-008', controlNumber: 'CTRL-008', title: 'İç Kontrol Değerlendirme Kontrolü',
    description: 'İç kontrol mekanizmalarının etkinliğinin değerlendirilmesi ve zayıf noktaların tespiti.',
    controlType: 'Preventive', frequency: 'SemiAnnual', owner: 'Selin Demir', department: 'İç Denetim',
    riskLevel: 'Critical', linkedPolicyIds: ['pol-002'], linkedObligationIds: ['obl-ick-002'], linkedRegulationIds: ['spk-g-02'], linkedRiskIds: ['risk-ick-002'],
    active: true, createdAt: '2024-08-01T10:00:00Z', updatedAt: now,
  },
  {
    id: 'ctrl-009', controlNumber: 'CTRL-009', title: 'Veri Bütünlüğü Kontrolü',
    description: 'Kritik veri kaynaklarının bütünlük ve tutarlılık kontrolü.',
    controlType: 'Detective', frequency: 'Daily', owner: 'Mehmet Yılmaz', department: 'IT',
    riskLevel: 'Medium', linkedPolicyIds: [], linkedObligationIds: [], linkedRegulationIds: ['spk-g-01'], linkedRiskIds: [],
    active: true, createdAt: '2024-09-01T09:00:00Z', updatedAt: now,
  },
  {
    id: 'ctrl-010', controlNumber: 'CTRL-010', title: 'API Güvenlik Kontrolü',
    description: 'API entegrasyonlarının güvenlik testleri, rate limit ve yetki kontrolleri.',
    controlType: 'Preventive', frequency: 'Weekly', owner: 'Okan Tekin', department: 'IT Güvenlik',
    riskLevel: 'High', linkedPolicyIds: ['pol-008'], linkedObligationIds: [], linkedRegulationIds: ['spk-g-06'], linkedRiskIds: ['risk-yet-008'],
    active: true, createdAt: '2024-10-01T10:00:00Z', updatedAt: now,
  },
]

export const demoTests: ControlTest[] = [
  { id: 'test-001', controlId: 'ctrl-001', controlTitle: 'Yetki Gözden Geçirme Kontrolü', tester: 'Okan Tekin', testDate: lastWeek.toISOString().split('T')[0], result: 'Passed', score: 95, findingsCount: 0, notes: 'Tüm kullanıcı yetkileri güncel ve doğru.', evidenceIds: [], createdAt: lastWeek.toISOString() },
  { id: 'test-002', controlId: 'ctrl-002', controlTitle: 'MKK Mutabakat Kontrolü', tester: 'Mehmet Yılmaz', testDate: today.toISOString().split('T')[0], result: 'Failed', score: 45, findingsCount: 3, notes: '3 pozisyon uyuşmazlığı tespit edildi.', evidenceIds: [], createdAt: today.toISOString() },
  { id: 'test-003', controlId: 'ctrl-003', controlTitle: 'Takasbank Limit Kontrolü', tester: 'Canan Özdemir', testDate: today.toISOString().split('T')[0], result: 'Partial', score: 70, findingsCount: 1, notes: 'Bir üye limit aşımı yakın.', evidenceIds: [], createdAt: today.toISOString() },
  { id: 'test-004', controlId: 'ctrl-004', controlTitle: 'MASAK KYC Kontrolü', tester: 'Burak Şahin', testDate: lastMonth.toISOString().split('T')[0], result: 'Passed', score: 88, findingsCount: 0, notes: 'KYC dosyaları tam ve güncel.', evidenceIds: [], createdAt: lastMonth.toISOString() },
  { id: 'test-005', controlId: 'ctrl-005', controlTitle: 'SPK Bildirim Kontrolü', tester: 'Ahmet Kaya', testDate: lastWeek.toISOString().split('T')[0], result: 'Failed', score: 60, findingsCount: 2, notes: '2 bildirim gecikmiş.', evidenceIds: [], createdAt: lastWeek.toISOString() },
  { id: 'test-006', controlId: 'ctrl-006', controlTitle: 'Kanıt Saklama Kontrolü', tester: 'Esra Yıldız', testDate: lastMonth.toISOString().split('T')[0], result: 'Passed', score: 92, findingsCount: 0, notes: 'Kanıt kasası düzeni iyi.', evidenceIds: [], createdAt: lastMonth.toISOString() },
  { id: 'test-007', controlId: 'ctrl-007', controlTitle: 'BDDK Operasyonel Risk Kontrolü', tester: 'Deniz Koç', testDate: today.toISOString().split('T')[0], result: 'Failed', score: 50, findingsCount: 2, notes: 'Risk olay raporlamasında eksiklik.', evidenceIds: [], createdAt: today.toISOString() },
  { id: 'test-008', controlId: 'ctrl-008', controlTitle: 'İç Kontrol Değerlendirme Kontrolü', tester: 'Selin Demir', testDate: lastWeek.toISOString().split('T')[0], result: 'Partial', score: 75, findingsCount: 1, notes: 'Bazı kontrol noktaları yetersiz.', evidenceIds: [], createdAt: lastWeek.toISOString() },
  { id: 'test-009', controlId: 'ctrl-009', controlTitle: 'Veri Bütünlüğü Kontrolü', tester: 'Mehmet Yılmaz', testDate: today.toISOString().split('T')[0], result: 'Passed', score: 98, findingsCount: 0, notes: 'Veri bütünlüğü mükemmel.', evidenceIds: [], createdAt: today.toISOString() },
  { id: 'test-010', controlId: 'ctrl-010', controlTitle: 'API Güvenlik Kontrolü', tester: 'Okan Tekin', testDate: lastWeek.toISOString().split('T')[0], result: 'Failed', score: 55, findingsCount: 2, notes: '2 API endpointinde zafiyet.', evidenceIds: [], createdAt: lastWeek.toISOString() },
  { id: 'test-011', controlId: 'ctrl-001', controlTitle: 'Yetki Gözden Geçirme Kontrolü', tester: 'Okan Tekin', testDate: lastMonth.toISOString().split('T')[0], result: 'Partial', score: 78, findingsCount: 1, notes: 'Eski hesaplar temizlenmemiş.', evidenceIds: [], createdAt: lastMonth.toISOString() },
  { id: 'test-012', controlId: 'ctrl-002', controlTitle: 'MKK Mutabakat Kontrolü', tester: 'Mehmet Yılmaz', testDate: lastMonth.toISOString().split('T')[0], result: 'Passed', score: 91, findingsCount: 0, notes: 'Mutabakat başarılı.', evidenceIds: [], createdAt: lastMonth.toISOString() },
  { id: 'test-013', controlId: 'ctrl-003', controlTitle: 'Takasbank Limit Kontrolü', tester: 'Canan Özdemir', testDate: lastMonth.toISOString().split('T')[0], result: 'Passed', score: 85, findingsCount: 0, notes: 'Limitler normal aralıkta.', evidenceIds: [], createdAt: lastMonth.toISOString() },
  { id: 'test-014', controlId: 'ctrl-004', controlTitle: 'MASAK KYC Kontrolü', tester: 'Burak Şahin', testDate: today.toISOString().split('T')[0], result: 'Partial', score: 72, findingsCount: 1, notes: 'Bir müşteri dosyası eksik.', evidenceIds: [], createdAt: today.toISOString() },
  { id: 'test-015', controlId: 'ctrl-005', controlTitle: 'SPK Bildirim Kontrolü', tester: 'Ahmet Kaya', testDate: lastMonth.toISOString().split('T')[0], result: 'Passed', score: 94, findingsCount: 0, notes: 'Tüm bildirimler zamanında.', evidenceIds: [], createdAt: lastMonth.toISOString() },
]

export const demoFindings: Finding[] = [
  { id: 'fnd-001', findingNumber: 'FND-001', title: 'Eski kullanıcı hesapları devre dışı bırakılmamış', description: '15 adet eski çalışan hesabı sistemde hala aktif.', severity: 'High', status: 'Open', linkedControlId: 'ctrl-001', linkedTestId: 'test-011', owner: 'Okan Tekin', dueDate: nextWeek.toISOString().split('T')[0], createdAt: lastMonth.toISOString() },
  { id: 'fnd-002', findingNumber: 'FND-002', title: 'MKK pozisyon uyuşmazlığı', description: '3 pozisyon MKK ile uyuşmuyor, fark tutarı yüksek.', severity: 'Critical', status: 'In Progress', linkedControlId: 'ctrl-002', linkedTestId: 'test-002', owner: 'Mehmet Yılmaz', dueDate: nextWeek.toISOString().split('T')[0], createdAt: today.toISOString() },
  { id: 'fnd-003', findingNumber: 'FND-003', title: 'Takasbank limit aşımı yakını', description: 'Üye ABC-123 teminat limitinin %95ine ulaşmış.', severity: 'High', status: 'Open', linkedControlId: 'ctrl-003', linkedTestId: 'test-003', owner: 'Canan Özdemir', dueDate: nextWeek.toISOString().split('T')[0], createdAt: today.toISOString() },
  { id: 'fnd-004', findingNumber: 'FND-004', title: 'SPK bildirimi gecikmesi', description: 'Haftalık bildirim 2 gün gecikmiş.', severity: 'Medium', status: 'Open', linkedControlId: 'ctrl-005', linkedTestId: 'test-005', owner: 'Ahmet Kaya', dueDate: nextWeek.toISOString().split('T')[0], createdAt: lastWeek.toISOString() },
  { id: 'fnd-005', findingNumber: 'FND-005', title: 'Risk olay raporlaması eksik', description: '3 operasyonel risk olayı raporlanmamış.', severity: 'High', status: 'Open', linkedControlId: 'ctrl-007', linkedTestId: 'test-007', owner: 'Deniz Koç', dueDate: nextMonth.toISOString().split('T')[0], createdAt: today.toISOString() },
  { id: 'fnd-006', findingNumber: 'FND-006', title: 'İç kontrol noktası yetersiz', description: 'İki kontrol noktası yeterli örnekleme yapılmamış.', severity: 'Medium', status: 'In Progress', linkedControlId: 'ctrl-008', linkedTestId: 'test-008', owner: 'Selin Demir', dueDate: nextMonth.toISOString().split('T')[0], createdAt: lastWeek.toISOString() },
  { id: 'fnd-007', findingNumber: 'FND-007', title: 'API endpoint zafiyeti', description: '2 API endpointinde yetki kontrolü eksik.', severity: 'Critical', status: 'Open', linkedControlId: 'ctrl-010', linkedTestId: 'test-010', owner: 'Okan Tekin', dueDate: nextWeek.toISOString().split('T')[0], createdAt: lastWeek.toISOString() },
  { id: 'fnd-008', findingNumber: 'FND-008', title: 'KYC müşteri dosyası eksik', description: 'Bir müşterinin KYC dosyası eksik.', severity: 'Medium', status: 'Open', linkedControlId: 'ctrl-004', linkedTestId: 'test-014', owner: 'Burak Şahin', dueDate: nextWeek.toISOString().split('T')[0], createdAt: today.toISOString() },
  { id: 'fnd-009', findingNumber: 'FND-009', title: 'SPK bildirim format hatası', description: 'Bir bildirim yanlış formatta gönderilmiş.', severity: 'Low', status: 'Closed', linkedControlId: 'ctrl-005', linkedTestId: 'test-005', owner: 'Ahmet Kaya', dueDate: lastWeek.toISOString().split('T')[0], createdAt: lastWeek.toISOString() },
  { id: 'fnd-010', findingNumber: 'FND-010', title: 'Veri senkronizasyon gecikmesi', description: 'Bir veri kaynağı senkronizasyonunda 1 saat gecikme.', severity: 'Low', status: 'Mitigated', linkedControlId: 'ctrl-009', linkedTestId: 'test-009', owner: 'Mehmet Yılmaz', dueDate: lastWeek.toISOString().split('T')[0], createdAt: today.toISOString() },
]

export function fetchControls(): ControlDefinition[] {
  const stored = loadControls()
  if (stored.length === 0) {
    saveControls(demoControls)
    return demoControls
  }
  return stored
}

export function fetchTests(): ControlTest[] {
  const stored = loadTests()
  if (stored.length === 0) {
    saveTests(demoTests)
    return demoTests
  }
  return stored
}

export function fetchFindings(): Finding[] {
  const stored = loadFindings()
  if (stored.length === 0) {
    saveFindings(demoFindings)
    return demoFindings
  }
  return stored
}

export function createControl(data: Omit<ControlDefinition, 'id' | 'createdAt' | 'updatedAt'>): ControlDefinition {
  const item: ControlDefinition = { ...data, id: genId('ctrl'), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
  const all = loadControls()
  all.push(item)
  saveControls(all)
  return item
}

export function updateControl(id: string, updates: Partial<ControlDefinition>): ControlDefinition | null {
  const all = loadControls()
  const idx = all.findIndex((c) => c.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...updates, updatedAt: new Date().toISOString() }
  saveControls(all)
  return all[idx]
}

export function archiveControl(id: string): ControlDefinition | null {
  return updateControl(id, { active: false })
}

export function createTest(data: Omit<ControlTest, 'id' | 'createdAt'>): ControlTest {
  const item: ControlTest = { ...data, id: genId('test'), createdAt: new Date().toISOString() }
  const all = loadTests()
  all.push(item)
  saveTests(all)
  return item
}

export function updateTest(id: string, updates: Partial<ControlTest>): ControlTest | null {
  const all = loadTests()
  const idx = all.findIndex((t) => t.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...updates }
  saveTests(all)
  return all[idx]
}

export function createFinding(data: Omit<Finding, 'id' | 'createdAt'>): Finding {
  const item: Finding = { ...data, id: genId('fnd'), createdAt: new Date().toISOString() }
  const all = loadFindings()
  all.push(item)
  saveFindings(all)
  return item
}

export function updateFinding(id: string, updates: Partial<Finding>): Finding | null {
  const all = loadFindings()
  const idx = all.findIndex((f) => f.id === id)
  if (idx === -1) return null
  all[idx] = { ...all[idx], ...updates }
  saveFindings(all)
  return all[idx]
}

export function closeFinding(id: string): Finding | null {
  return updateFinding(id, { status: 'Closed' })
}

export function getControlStats(controls: ControlDefinition[]) {
  return {
    total: controls.length,
    active: controls.filter((c) => c.active).length,
    inactive: controls.filter((c) => !c.active).length,
    byType: {
      Preventive: controls.filter((c) => c.controlType === 'Preventive').length,
      Detective: controls.filter((c) => c.controlType === 'Detective').length,
      Corrective: controls.filter((c) => c.controlType === 'Corrective').length,
    },
    byRisk: {
      Low: controls.filter((c) => c.riskLevel === 'Low').length,
      Medium: controls.filter((c) => c.riskLevel === 'Medium').length,
      High: controls.filter((c) => c.riskLevel === 'High').length,
      Critical: controls.filter((c) => c.riskLevel === 'Critical').length,
    },
  }
}

export function getTestStats(tests: ControlTest[]) {
  const passed = tests.filter((t) => t.result === 'Passed').length
  const failed = tests.filter((t) => t.result === 'Failed').length
  const partial = tests.filter((t) => t.result === 'Partial').length
  const avgScore = tests.length > 0 ? Math.round(tests.reduce((s, t) => s + t.score, 0) / tests.length) : 0
  return { total: tests.length, passed, failed, partial, avgScore }
}

export function getFindingStats(findings: Finding[]) {
  const open = findings.filter((f) => f.status === 'Open').length
  const inProgress = findings.filter((f) => f.status === 'In Progress').length
  const mitigated = findings.filter((f) => f.status === 'Mitigated').length
  const closed = findings.filter((f) => f.status === 'Closed').length
  const critical = findings.filter((f) => f.severity === 'Critical').length
  const high = findings.filter((f) => f.severity === 'High').length
  const overdue = findings.filter((f) => f.status !== 'Closed' && f.status !== 'Mitigated' && f.dueDate && new Date(f.dueDate) < new Date()).length
  return { total: findings.length, open, inProgress, mitigated, closed, critical, high, overdue }
}

export function getTestsForControl(controlId: string, tests: ControlTest[]): ControlTest[] {
  return tests.filter((t) => t.controlId === controlId).sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
}

export function getFindingsForControl(controlId: string, findings: Finding[]): Finding[] {
  return findings.filter((f) => f.linkedControlId === controlId)
}

export function getFindingsForTest(testId: string, findings: Finding[]): Finding[] {
  return findings.filter((f) => f.linkedTestId === testId)
}

export function getControlRiskBadgeClass(risk: ControlRiskLevel) {
  switch (risk) {
    case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'High': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Low': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    default: return 'bg-slate-50 text-slate-700 border-slate-200/60'
  }
}

export function getControlTypeBadgeClass(type: ControlType) {
  switch (type) {
    case 'Preventive': return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'Detective': return 'bg-violet-50 text-violet-700 border-violet-200/60'
    case 'Corrective': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    default: return 'bg-slate-50 text-slate-700 border-slate-200/60'
  }
}

export function getTestResultBadgeClass(result: TestResult) {
  switch (result) {
    case 'Passed': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'Partial': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Failed': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    default: return 'bg-slate-50 text-slate-700 border-slate-200/60'
  }
}

export function getFindingSeverityBadgeClass(severity: FindingSeverity) {
  switch (severity) {
    case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'High': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Low': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    default: return 'bg-slate-50 text-slate-700 border-slate-200/60'
  }
}

export function getFindingStatusBadgeClass(status: FindingStatus) {
  switch (status) {
    case 'Open': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'In Progress': return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'Mitigated': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Closed': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    default: return 'bg-slate-50 text-slate-700 border-slate-200/60'
  }
}

export function getScoreColor(score: number) {
  if (score >= 90) return 'text-emerald-700'
  if (score >= 70) return 'text-amber-700'
  if (score >= 50) return 'text-orange-700'
  return 'text-rose-700'
}
