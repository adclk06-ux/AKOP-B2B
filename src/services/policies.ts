export type PolicyDocumentType = 'Politika' | 'Prosedür' | 'Talimat' | 'Kontrol Dokümanı' | 'Yönetmelik'
export type PolicyStatus = 'Taslak' | 'İncelemede' | 'Onay Bekliyor' | 'Yayında' | 'Revizyon Gerekli' | 'Arşivlendi'
export type PolicyRiskLevel = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'

export interface PolicyVersion {
  version: string
  effectiveDate: string
  updatedAt: string
  changeLog: string
}

export interface PolicyDocument {
  id: string
  policyNumber: string
  title: string
  description: string
  summary?: string
  documentType: PolicyDocumentType
  owner: string
  department: string
  status: PolicyStatus
  riskLevel: PolicyRiskLevel
  version: string
  effectiveDate?: string
  reviewDate?: string
  nextReviewDate?: string
  reviewFrequency?: string
  publishedAt?: string
  authority?: string
  linkedRegulations: string[]
  linkedObligations: string[]
  linkedRisks: string[]
  linkedEvidence: string[]
  linkedCases: string[]
  linkedApprovals: string[]
  versionHistory: PolicyVersion[]
  approvers?: string[]
  createdBy?: string
  createdAt: string
  updatedAt: string
  approvedAt?: string
  isDemo: boolean
  notes?: string
}

const STORAGE_KEY = 'akop_policies_v1'

function load(): PolicyDocument[] {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) as PolicyDocument[] : [] } catch { return [] }
}
function save(items: PolicyDocument[]) { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) }
function genId() { return `POL-${Date.now()}-${Math.floor(Math.random() * 1000)}` }

const now = new Date().toISOString()
const today = new Date()
const in15 = new Date(today); in15.setDate(today.getDate() + 15); const in15s = in15.toISOString().split('T')[0]
const in30 = new Date(today); in30.setDate(today.getDate() + 30); const in30s = in30.toISOString().split('T')[0]
const in60 = new Date(today); in60.setDate(today.getDate() + 60); const in60s = in60.toISOString().split('T')[0]
const in90 = new Date(today); in90.setDate(today.getDate() + 90); const in90s = in90.toISOString().split('T')[0]

export const demoPolicies: PolicyDocument[] = [
  {
    id: 'pol-001',
    policyNumber: 'POL-SPK-001',
    title: 'SPK Uyum Politikası',
    description: 'Sermaye Piyasası Kurulu mevzuatına tam uyum politikası. Kurumsal yönetim, açıklama yükümlülükleri, iç kontrol ve risk yönetimi süreçlerini kapsar.',
    documentType: 'Politika',
    owner: 'Ahmet Kaya',
    department: 'Uyum Departmanı',
    status: 'Yayında',
    riskLevel: 'Yüksek',
    version: '2.1',
    effectiveDate: '2025-01-15',
    reviewDate: '2025-06-15',
    nextReviewDate: in60s,
    linkedRegulations: ['spk-g-01'],
    linkedObligations: ['obl-spk-001'],
    linkedRisks: ['risk-spk-001'],
    linkedEvidence: ['ev-spk-001'],
    linkedCases: [],
    linkedApprovals: ['apr-pol-001'],
    summary: 'SPK mevzuatına tam uyum politikası. Kurumsal yönetim ve iç kontrol süreçlerini kapsar.',
    reviewFrequency: '6 ay',
    publishedAt: '2025-01-15',
    authority: 'SPK',
    approvers: ['Ayşe Yılmaz', 'Murat Kaya'],
    createdBy: 'Ahmet Kaya',
    notes: 'Yıllık denetim öncesi gözden geçirilmesi önerilir.',
    versionHistory: [
      { version: '1.0', effectiveDate: '2024-01-01', updatedAt: '2024-01-01T10:00:00Z', changeLog: 'İlk sürüm' },
      { version: '2.0', effectiveDate: '2025-01-01', updatedAt: '2025-01-01T09:00:00Z', changeLog: 'SPK II-17.1 değişikliği' },
      { version: '2.1', effectiveDate: '2025-01-15', updatedAt: '2025-01-15T11:00:00Z', changeLog: 'Risk puanları güncellendi' },
    ],
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: now,
    approvedAt: '2025-01-15T12:00:00Z',
    isDemo: true,
  },
  {
    id: 'pol-002',
    policyNumber: 'POL-ICK-002',
    title: 'İç Kontrol Prosedürü',
    description: 'Kurum iç kontrol mekanizmaları, kontrol noktaları, test süreçleri ve raporlama döngüsü.',
    documentType: 'Prosedür',
    owner: 'Selin Demir',
    department: 'İç Denetim',
    status: 'Revizyon Gerekli',
    riskLevel: 'Kritik',
    version: '1.4',
    effectiveDate: '2024-08-01',
    reviewDate: '2025-02-01',
    nextReviewDate: in15s,
    linkedRegulations: ['spk-g-02'],
    linkedObligations: ['obl-ick-002'],
    linkedRisks: ['risk-ick-002'],
    linkedEvidence: ['ev-ick-002'],
    linkedCases: ['case-ick-001'],
    linkedApprovals: [],
    summary: 'Kurum iç kontrol mekanizmaları, kontrol noktaları ve test süreçleri.',
    reviewFrequency: '3 ay',
    publishedAt: '2024-08-01',
    authority: 'SPK',
    approvers: ['Can Demir'],
    createdBy: 'Selin Demir',
    notes: 'Revizyon gerekiyor: yeni kontrol noktaları eklenecek.',
    versionHistory: [
      { version: '1.0', effectiveDate: '2023-01-01', updatedAt: '2023-01-01T10:00:00Z', changeLog: 'İlk sürüm' },
      { version: '1.4', effectiveDate: '2024-08-01', updatedAt: '2024-08-01T09:00:00Z', changeLog: 'Kontrol noktaları genişletildi' },
    ],
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: now,
    isDemo: true,
  },
  {
    id: 'pol-003',
    policyNumber: 'POL-MKK-003',
    title: 'MKK Mutabakat Prosedürü',
    description: 'Merkezi Kayıt Kuruluşu veri mutabakat süreçleri, uyuşmazlık yönetimi ve raporlama.',
    documentType: 'Prosedür',
    owner: 'Mehmet Yılmaz',
    department: 'Operasyon',
    status: 'Onay Bekliyor',
    riskLevel: 'Yüksek',
    version: '1.2',
    effectiveDate: '2025-03-01',
    reviewDate: '2025-03-01',
    nextReviewDate: in90s,
    linkedRegulations: ['spk-g-03'],
    linkedObligations: ['obl-mkk-003'],
    linkedRisks: ['risk-mkk-003'],
    linkedEvidence: ['ev-mkk-003'],
    linkedCases: [],
    linkedApprovals: ['apr-pol-003'],
    summary: 'MKK veri mutabakat süreçleri ve uyuşmazlık yönetimi.',
    reviewFrequency: '6 ay',
    authority: 'MKK',
    approvers: ['Mehmet Yılmaz'],
    createdBy: 'Mehmet Yılmaz',
    versionHistory: [
      { version: '1.0', effectiveDate: '2024-06-01', updatedAt: '2024-06-01T10:00:00Z', changeLog: 'İlk sürüm' },
      { version: '1.1', effectiveDate: '2024-09-01', updatedAt: '2024-09-01T09:00:00Z', changeLog: 'Mutabakat adımları güncellendi' },
      { version: '1.2', effectiveDate: '2025-03-01', updatedAt: '2025-03-01T11:00:00Z', changeLog: 'Yeni MKK API entegrasyonu' },
    ],
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: now,
    isDemo: true,
  },
  {
    id: 'pol-004',
    policyNumber: 'POL-TBT-004',
    title: 'Takasbank Teminat İzleme Talimatı',
    description: 'Takasbank teminat yönetimi, çağrı takibi, marj hesaplama ve limit izleme talimatları.',
    documentType: 'Talimat',
    owner: 'Canan Özdemir',
    department: 'Risk Yönetimi',
    status: 'Yayında',
    riskLevel: 'Kritik',
    version: '3.0',
    effectiveDate: '2025-01-20',
    reviewDate: '2025-01-20',
    nextReviewDate: in30s,
    linkedRegulations: ['spk-g-04'],
    linkedObligations: ['obl-tbt-004'],
    linkedRisks: ['risk-tbt-004'],
    linkedEvidence: ['ev-tbt-004'],
    linkedCases: ['case-tbt-001'],
    linkedApprovals: ['apr-pol-004'],
    summary: 'Takasbank teminat yönetimi, çağrı takibi ve limit izleme talimatları.',
    reviewFrequency: '3 ay',
    publishedAt: '2025-01-20',
    authority: 'Takasbank',
    approvers: ['Canan Özdemir', 'Risk Komitesi'],
    createdBy: 'Canan Özdemir',
    versionHistory: [
      { version: '1.0', effectiveDate: '2022-01-01', updatedAt: '2022-01-01T10:00:00Z', changeLog: 'İlk sürüm' },
      { version: '2.0', effectiveDate: '2023-06-01', updatedAt: '2023-06-01T09:00:00Z', changeLog: 'Yeni marj modeli' },
      { version: '3.0', effectiveDate: '2025-01-20', updatedAt: '2025-01-20T09:00:00Z', changeLog: 'Teminat çağrısı revizyonu' },
    ],
    createdAt: '2022-01-01T10:00:00Z',
    updatedAt: now,
    approvedAt: '2025-01-20T10:00:00Z',
    isDemo: true,
  },
  {
    id: 'pol-005',
    policyNumber: 'POL-AML-005',
    title: 'MASAK KYC/AML Politikası',
    description: 'Müşteri tanıma, risk sınıflandırma, şüpheli işlem bildirimi ve AML süreçleri politikası.',
    documentType: 'Politika',
    owner: 'Burak Şahin',
    department: 'Uyum Departmanı',
    status: 'Yayında',
    riskLevel: 'Kritik',
    version: '2.3',
    effectiveDate: '2025-02-01',
    reviewDate: '2025-02-01',
    nextReviewDate: in60s,
    linkedRegulations: ['masak-reg-001'],
    linkedObligations: ['obl-aml-005'],
    linkedRisks: ['risk-aml-005'],
    linkedEvidence: ['ev-aml-005'],
    linkedCases: [],
    linkedApprovals: ['apr-pol-005'],
    summary: 'Müşteri tanıma, risk sınıflandırma ve şüpheli işlem bildirimi AML politikası.',
    reviewFrequency: '6 ay',
    publishedAt: '2025-02-01',
    authority: 'MASAK',
    approvers: ['Burak Şahin'],
    createdBy: 'Burak Şahin',
    versionHistory: [
      { version: '1.0', effectiveDate: '2023-01-01', updatedAt: '2023-01-01T10:00:00Z', changeLog: 'İlk sürüm' },
      { version: '2.0', effectiveDate: '2024-06-01', updatedAt: '2024-06-01T09:00:00Z', changeLog: 'MASAK 2024 düzenlemesi' },
      { version: '2.3', effectiveDate: '2025-02-01', updatedAt: '2025-02-01T11:00:00Z', changeLog: 'KYC eşiği değişikliği' },
    ],
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: now,
    approvedAt: '2025-02-01T12:00:00Z',
    isDemo: true,
  },
  {
    id: 'pol-006',
    policyNumber: 'POL-BDD-006',
    title: 'BDDK Operasyonel Risk Prosedürü',
    description: 'Bankacılık Düzenleme ve Denetleme Kurumu operasyonel risk raporlama ve değerlendirme süreçleri.',
    documentType: 'Prosedür',
    owner: 'Deniz Koç',
    department: 'Risk Yönetimi',
    status: 'İncelemede',
    riskLevel: 'Yüksek',
    version: '1.1',
    effectiveDate: '2025-04-01',
    reviewDate: '2025-04-01',
    nextReviewDate: in90s,
    linkedRegulations: ['bddk-reg-001'],
    linkedObligations: ['obl-bdd-006'],
    linkedRisks: ['risk-bdd-006'],
    linkedEvidence: ['ev-bdd-006'],
    linkedCases: [],
    linkedApprovals: [],
    summary: 'BDDK operasyonel risk raporlama ve değerlendirme süreçleri.',
    reviewFrequency: '6 ay',
    authority: 'BDDK',
    approvers: ['Deniz Koç'],
    createdBy: 'Deniz Koç',
    versionHistory: [
      { version: '1.0', effectiveDate: '2024-09-01', updatedAt: '2024-09-01T10:00:00Z', changeLog: 'İlk sürüm' },
      { version: '1.1', effectiveDate: '2025-04-01', updatedAt: '2025-04-01T09:00:00Z', changeLog: 'BDDK yeni kriterleri' },
    ],
    createdAt: '2024-09-01T10:00:00Z',
    updatedAt: now,
    isDemo: true,
  },
  {
    id: 'pol-007',
    policyNumber: 'POL-KNT-007',
    title: 'Kanıt Saklama Politikası',
    description: 'Uyum kanıtlarının toplanması, sınıflandırılması, saklama süreleri ve erişim prosedürleri.',
    documentType: 'Politika',
    owner: 'Esra Yıldız',
    department: 'Denetim',
    status: 'Yayında',
    riskLevel: 'Orta',
    version: '1.5',
    effectiveDate: '2024-11-01',
    reviewDate: '2024-11-01',
    nextReviewDate: in30s,
    linkedRegulations: ['spk-g-05'],
    linkedObligations: ['obl-knt-007'],
    linkedRisks: ['risk-knt-007'],
    linkedEvidence: ['ev-knt-007'],
    linkedCases: [],
    linkedApprovals: ['apr-pol-007'],
    summary: 'Uyum kanıtlarının toplanması, sınıflandırılması ve saklama süreleri.',
    reviewFrequency: '12 ay',
    publishedAt: '2024-11-01',
    authority: 'SPK',
    approvers: ['Esra Yıldız'],
    createdBy: 'Esra Yıldız',
    versionHistory: [
      { version: '1.0', effectiveDate: '2023-06-01', updatedAt: '2023-06-01T10:00:00Z', changeLog: 'İlk sürüm' },
      { version: '1.5', effectiveDate: '2024-11-01', updatedAt: '2024-11-01T09:00:00Z', changeLog: 'Saklama süreleri güncellendi' },
    ],
    createdAt: '2023-06-01T10:00:00Z',
    updatedAt: now,
    approvedAt: '2024-11-01T10:00:00Z',
    isDemo: true,
  },
  {
    id: 'pol-008',
    policyNumber: 'POL-YET-008',
    title: 'Yetki ve Erişim Yönetimi Politikası',
    description: 'Kullanıcı yetkilendirme, rol bazlı erişim kontrolü, MFA gereksinimleri ve erişim izleme politikası.',
    documentType: 'Politika',
    owner: 'Okan Tekin',
    department: 'IT Güvenlik',
    status: 'Taslak',
    riskLevel: 'Yüksek',
    version: '0.9',
    effectiveDate: undefined,
    reviewDate: undefined,
    nextReviewDate: in60s,
    linkedRegulations: ['spk-g-06'],
    linkedObligations: ['obl-yet-008'],
    linkedRisks: ['risk-yet-008'],
    linkedEvidence: [],
    linkedCases: [],
    linkedApprovals: [],
    summary: 'Kullanıcı yetkilendirme, rol bazlı erişim kontrolü ve MFA politikası.',
    reviewFrequency: '6 ay',
    authority: 'SPK',
    approvers: ['Okan Tekin'],
    createdBy: 'Okan Tekin',
    versionHistory: [
      { version: '0.9', effectiveDate: '', updatedAt: now, changeLog: 'Taslak sürüm' },
    ],
    createdAt: now,
    updatedAt: now,
    isDemo: true,
  },
  {
    id: 'pol-009',
    policyNumber: 'POL-VSN-009',
    title: 'Veri Sınıflandırma Prosedürü',
    description: 'Kurumsal veri sınıflandırma seviyeleri, koruma mekanizmaları ve paylaşım kuralları.',
    documentType: 'Prosedür',
    owner: 'Gizem Aydın',
    department: 'Veri Yönetimi',
    status: 'Onay Bekliyor',
    riskLevel: 'Orta',
    version: '1.0',
    effectiveDate: '2025-05-01',
    reviewDate: '2025-05-01',
    nextReviewDate: in90s,
    linkedRegulations: ['spk-g-07'],
    linkedObligations: ['obl-vsn-009'],
    linkedRisks: ['risk-vsn-009'],
    linkedEvidence: ['ev-vsn-009'],
    linkedCases: [],
    linkedApprovals: ['apr-pol-009'],
    versionHistory: [
      { version: '1.0', effectiveDate: '2025-05-01', updatedAt: '2025-05-01T09:00:00Z', changeLog: 'İlk sürüm' },
    ],
    createdAt: '2025-05-01T09:00:00Z',
    updatedAt: now,
    isDemo: true,
  },
  {
    id: 'pol-010',
    policyNumber: 'POL-DNZ-010',
    title: 'Denetim Hazırlık Kontrol Dokümanı',
    description: 'İç ve dış denetim hazırlık kontrol listesi, dokümantasyon hazırlık durumu ve onay süreçleri.',
    documentType: 'Kontrol Dokümanı',
    owner: 'Mert Can',
    department: 'Denetim',
    status: 'Yayında',
    riskLevel: 'Düşük',
    version: '2.0',
    effectiveDate: '2025-01-10',
    reviewDate: '2025-01-10',
    nextReviewDate: in30s,
    linkedRegulations: ['spk-g-08'],
    linkedObligations: ['obl-dnz-010'],
    linkedRisks: ['risk-dnz-010'],
    linkedEvidence: ['ev-dnz-010'],
    linkedCases: [],
    linkedApprovals: ['apr-pol-010'],
    versionHistory: [
      { version: '1.0', effectiveDate: '2023-03-01', updatedAt: '2023-03-01T10:00:00Z', changeLog: 'İlk sürüm' },
      { version: '2.0', effectiveDate: '2025-01-10', updatedAt: '2025-01-10T09:00:00Z', changeLog: 'Denetim kapsamı genişletildi' },
    ],
    createdAt: '2023-03-01T10:00:00Z',
    updatedAt: now,
    approvedAt: '2025-01-10T10:00:00Z',
    isDemo: true,
  },
]

export function fetchPolicies(): PolicyDocument[] {
  const stored = load()
  if (stored.length === 0) {
    save(demoPolicies)
    return demoPolicies
  }
  return stored
}

export function fetchPolicyById(id: string): PolicyDocument | undefined {
  return load().find((p) => p.id === id)
}

export function createPolicy(doc: Omit<PolicyDocument, 'id' | 'createdAt' | 'updatedAt' | 'versionHistory'>): PolicyDocument {
  const items = load()
  const newDoc: PolicyDocument = {
    ...doc,
    id: genId(),
    createdAt: now,
    updatedAt: now,
    versionHistory: [{ version: '1.0', effectiveDate: doc.effectiveDate || now, updatedAt: now, changeLog: 'İlk sürüm' }],
  }
  save([newDoc, ...items])
  return newDoc
}

export function updatePolicy(id: string, updates: Partial<PolicyDocument>): PolicyDocument | null {
  const items = load()
  const idx = items.findIndex((p) => p.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates, updatedAt: now }
  save(items)
  return items[idx]
}

export function archivePolicy(id: string): PolicyDocument | null {
  return updatePolicy(id, { status: 'Arşivlendi', updatedAt: now })
}

export function submitPolicyForApproval(id: string): PolicyDocument | null {
  return updatePolicy(id, { status: 'Onay Bekliyor', updatedAt: now })
}

export function markPolicyPublished(id: string): PolicyDocument | null {
  const items = load()
  const idx = items.findIndex((p) => p.id === id)
  if (idx === -1) return null
  const p = items[idx]
  const newVersion = p.versionHistory.length > 0 ? p.versionHistory[p.versionHistory.length - 1].version : p.version
  const history = [...p.versionHistory, { version: newVersion, effectiveDate: p.effectiveDate || now, updatedAt: now, changeLog: 'Yayınlandı' }]
  items[idx] = { ...p, status: 'Yayında', version: newVersion, approvedAt: now, updatedAt: now, versionHistory: history }
  save(items)
  return items[idx]
}

export function startPolicyRevision(id: string, changeLog: string): PolicyDocument | null {
  const items = load()
  const idx = items.findIndex((p) => p.id === id)
  if (idx === -1) return null
  const p = items[idx]
  const parts = p.version.split('.').map(Number)
  parts[parts.length - 1] += 1
  const newVersion = parts.join('.')
  const history = [...p.versionHistory, { version: newVersion, effectiveDate: p.effectiveDate || now, updatedAt: now, changeLog }]
  items[idx] = { ...p, status: 'Revizyon Gerekli', version: newVersion, updatedAt: now, versionHistory: history }
  save(items)
  return items[idx]
}

export function getPolicyStats(policies: PolicyDocument[]) {
  const nowTime = new Date().getTime()
  const thirtyDays = 30 * 24 * 60 * 60 * 1000
  return {
    total: policies.length,
    published: policies.filter((p) => p.status === 'Yayında').length,
    pendingApproval: policies.filter((p) => p.status === 'Onay Bekliyor').length,
    needsRevision: policies.filter((p) => p.status === 'Revizyon Gerekli').length,
    critical: policies.filter((p) => p.riskLevel === 'Kritik').length,
    upcomingReview: policies.filter((p) => {
      if (!p.nextReviewDate) return false
      const d = new Date(p.nextReviewDate).getTime()
      return !isNaN(d) && d >= nowTime && d <= nowTime + thirtyDays
    }).length,
  }
}

export function getPolicyStatusBadgeClass(status: PolicyStatus) {
  switch (status) {
    case 'Taslak': return 'bg-slate-100 text-slate-700 border-slate-200'
    case 'İncelemede': return 'bg-sky-100 text-sky-700 border-sky-200'
    case 'Onay Bekliyor': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'Yayında': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    case 'Revizyon Gerekli': return 'bg-rose-100 text-rose-700 border-rose-200'
    case 'Arşivlendi': return 'bg-slate-100 text-slate-500 border-slate-200 opacity-60'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function getPolicyTypeBadgeClass(type: PolicyDocumentType) {
  switch (type) {
    case 'Politika': return 'bg-violet-100 text-violet-700 border-violet-200'
    case 'Prosedür': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'Talimat': return 'bg-indigo-100 text-indigo-700 border-indigo-200'
    case 'Kontrol Dokümanı': return 'bg-teal-100 text-teal-700 border-teal-200'
    case 'Yönetmelik': return 'bg-slate-100 text-slate-700 border-slate-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}

export function getPolicyRiskBadgeClass(level: PolicyRiskLevel) {
  switch (level) {
    case 'Kritik': return 'bg-rose-100 text-rose-700 border-rose-200'
    case 'Yüksek': return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'Orta': return 'bg-amber-100 text-amber-700 border-amber-200'
    case 'Düşük': return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    default: return 'bg-slate-100 text-slate-700 border-slate-200'
  }
}
