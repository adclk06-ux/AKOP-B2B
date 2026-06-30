export type CaseSourceModule = 'REGTECH' | 'MKK_MUTABAKAT' | 'TAKASBANK' | 'TASK' | 'APPROVAL' | 'MANUAL' | 'OBLIGATION' | 'CONTROL'

export type CaseStatus = 'Açık' | 'İncelemede' | 'Aksiyon Bekliyor' | 'Onay Bekliyor' | 'Tamamlandı' | 'Arşivlendi'

export type CasePriority = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'

export type CaseRisk = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'

export interface Case {
  id: string
  caseNumber: string
  title: string
  description: string
  sourceModule: CaseSourceModule
  sourceId?: string
  status: CaseStatus
  priority: CasePriority
  riskLevel: CaseRisk
  assignedTo: string
  owner: string
  tags: string[]
  relatedTasks: string[]
  relatedApprovals: string[]
  relatedDocuments: string[]
  createdAt: string
  updatedAt: string
  closedAt?: string
  isDemo: boolean
}

const STORAGE_KEY = 'akop_cases_v1'

let nextCaseNumber = 1

function loadCases(): Case[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const cases = JSON.parse(raw) as Case[]
    const maxNum = cases.reduce((max, c) => {
      const num = parseInt(c.caseNumber.replace('CASE-', ''))
      return num > max ? num : max
    }, 0)
    nextCaseNumber = maxNum + 1
    return cases
  } catch {
    return []
  }
}

function saveCases(cases: Case[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cases))
}

function generateCaseNumber(): string {
  const num = nextCaseNumber
  nextCaseNumber++
  return `CASE-${String(num).padStart(4, '0')}`
}

export function fetchCases(): Case[] {
  return loadCases()
}

export function fetchCaseById(id: string): Case | undefined {
  return loadCases().find((c) => c.id === id)
}

export function createCase(payload: Omit<Case, 'id' | 'caseNumber' | 'createdAt' | 'updatedAt' | 'isDemo'>): Case {
  const cases = loadCases()
  const now = new Date().toISOString()
  const newCase: Case = {
    ...payload,
    id: `case-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    caseNumber: generateCaseNumber(),
    createdAt: now,
    updatedAt: now,
    isDemo: false,
  }
  cases.unshift(newCase)
  saveCases(cases)
  return newCase
}

export function updateCase(id: string, updates: Partial<Case>): Case | null {
  const cases = loadCases()
  const idx = cases.findIndex((c) => c.id === id)
  if (idx === -1) return null
  cases[idx] = { ...cases[idx], ...updates, updatedAt: new Date().toISOString() }
  saveCases(cases)
  return cases[idx]
}

export function closeCase(id: string): Case | null {
  return updateCase(id, { status: 'Tamamlandı', closedAt: new Date().toISOString() })
}

export function archiveCase(id: string): Case | null {
  return updateCase(id, { status: 'Arşivlendi', closedAt: new Date().toISOString() })
}

export function getCaseStats(cases: Case[]) {
  const total = cases.length
  const open = cases.filter((c) => c.status === 'Açık' || c.status === 'İncelemede' || c.status === 'Aksiyon Bekliyor' || c.status === 'Onay Bekliyor').length
  const critical = cases.filter((c) => c.riskLevel === 'Kritik' && c.status !== 'Tamamlandı' && c.status !== 'Arşivlendi').length
  const pendingApproval = cases.filter((c) => c.status === 'Onay Bekliyor').length
  const closedThisMonth = cases.filter((c) => {
    if (!c.closedAt) return false
    const closed = new Date(c.closedAt)
    const now = new Date()
    return closed.getMonth() === now.getMonth() && closed.getFullYear() === now.getFullYear()
  }).length
  const slaRisk = cases.filter((c) => {
    if (c.status === 'Tamamlandı' || c.status === 'Arşivlendi') return false
    const created = new Date(c.createdAt)
    const daysPassed = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
    return daysPassed > 7 && c.priority === 'Kritik'
  }).length
  const todayOpened = cases.filter((c) => {
    const created = new Date(c.createdAt)
    const today = new Date()
    return created.toDateString() === today.toDateString()
  }).length
  const todayClosed = cases.filter((c) => {
    if (!c.closedAt) return false
    const closed = new Date(c.closedAt)
    const today = new Date()
    return closed.toDateString() === today.toDateString()
  }).length
  return { total, open, critical, pendingApproval, closedThisMonth, slaRisk, todayOpened, todayClosed }
}

export function getCaseStatusBadgeClass(status: CaseStatus) {
  switch (status) {
    case 'Tamamlandı': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'Arşivlendi': return 'bg-slate-50 text-slate-600 border-slate-200/60'
    case 'Onay Bekliyor': return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'Aksiyon Bekliyor': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'İncelemede': return 'bg-violet-50 text-violet-700 border-violet-200/60'
    case 'Açık': return 'bg-rose-50 text-rose-700 border-rose-200/60'
  }
}

export function getCasePriorityBadgeClass(priority: CasePriority) {
  switch (priority) {
    case 'Kritik': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'Yüksek': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'Orta': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Düşük': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}

export function getCaseRiskBadgeClass(risk: CaseRisk) {
  switch (risk) {
    case 'Kritik': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'Yüksek': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'Orta': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Düşük': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}

// Demo data
export function seedDemoCases(): Case[] {
  const existing = loadCases()
  if (existing.length > 0) return existing
  const today = new Date().toISOString()
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString()

  const demos: Case[] = [
    {
      id: 'case-001',
      caseNumber: 'CASE-0001',
      title: 'SPK Uyum Vakası',
      description: 'SPK tarafından yayınlanan yeni düzenleme kapsamında uyum süreci başlatıldı.',
      sourceModule: 'REGTECH',
      sourceId: 'spk-001',
      status: 'İncelemede',
      priority: 'Yüksek',
      riskLevel: 'Yüksek',
      assignedTo: 'Ahmet Yılmaz',
      owner: 'Selin Kaya',
      tags: ['SPK', 'Uyum', 'Düzenleme'],
      relatedTasks: [],
      relatedApprovals: [],
      relatedDocuments: [],
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      isDemo: true,
    },
    {
      id: 'case-002',
      caseNumber: 'CASE-0002',
      title: 'BDDK Risk Vakası',
      description: 'BDDK kredi kartı limitleriyle ilgili yeni kararın operasyonel etkisi.',
      sourceModule: 'REGTECH',
      sourceId: 'bddk-001',
      status: 'Açık',
      priority: 'Kritik',
      riskLevel: 'Kritik',
      assignedTo: 'Mehmet Demir',
      owner: 'Can Özdemir',
      tags: ['BDDK', 'Risk', 'Operasyon'],
      relatedTasks: [],
      relatedApprovals: [],
      relatedDocuments: [],
      createdAt: yesterday,
      updatedAt: today,
      isDemo: true,
    },
    {
      id: 'case-003',
      caseNumber: 'CASE-0003',
      title: 'MKK Mutabakat Farkı',
      description: 'Pozisyon mutabakatında MKK ile kurum değerleri arasında fark tespit edildi.',
      sourceModule: 'MKK_MUTABAKAT',
      sourceId: 'mkk-001',
      status: 'Aksiyon Bekliyor',
      priority: 'Kritik',
      riskLevel: 'Kritik',
      assignedTo: 'Ahmet Yılmaz',
      owner: 'Ahmet Yılmaz',
      tags: ['MKK', 'Mutabakat', 'Pozisyon'],
      relatedTasks: [],
      relatedApprovals: ['apr-001'],
      relatedDocuments: [],
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      isDemo: true,
    },
    {
      id: 'case-004',
      caseNumber: 'CASE-0004',
      title: 'Takasbank Margin Çağrısı',
      description: 'Portföy Yönetimi B için margin çağrısı oluştu, teminat tamamlanması gerekiyor.',
      sourceModule: 'TAKASBANK',
      sourceId: 'tak-002',
      status: 'Onay Bekliyor',
      priority: 'Yüksek',
      riskLevel: 'Yüksek',
      assignedTo: 'Can Özdemir',
      owner: 'Zeynep Şahin',
      tags: ['Takasbank', 'Margin', 'Teminat'],
      relatedTasks: [],
      relatedApprovals: ['apr-002'],
      relatedDocuments: [],
      createdAt: yesterday,
      updatedAt: today,
      isDemo: true,
    },
    {
      id: 'case-005',
      caseNumber: 'CASE-0005',
      title: 'Kritik Onay Süreci',
      description: 'Settlement gecikmesi nedeniyle kritik onay süreci başlatıldı.',
      sourceModule: 'APPROVAL',
      sourceId: 'apr-005',
      status: 'Onay Bekliyor',
      priority: 'Kritik',
      riskLevel: 'Kritik',
      assignedTo: 'Yönetici',
      owner: 'Selin Kaya',
      tags: ['Onay', 'Settlement', 'Kritik'],
      relatedTasks: [],
      relatedApprovals: ['apr-005'],
      relatedDocuments: [],
      createdAt: today,
      updatedAt: today,
      isDemo: true,
    },
  ]

  saveCases(demos)
  return demos
}
