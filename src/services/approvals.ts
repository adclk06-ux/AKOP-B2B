export type ApprovalSourceModule = 'REGTECH' | 'MKK_MUTABAKAT' | 'TAKASBANK' | 'TASK' | 'OBLIGATION' | 'EVIDENCE'

export type ApprovalRequestType =
  | 'Görev Onayı'
  | 'Düzeltme Onayı'
  | 'Kapanış Onayı'
  | 'Risk Değişikliği'
  | 'Yönetici Onayı'
  | 'Yükümlülük Onayı'
  | 'Kanıt Onayı'

export type ApprovalStatus =
  | 'Beklemede'
  | 'Onaylandı'
  | 'Reddedildi'
  | 'Revizyon İstendi'

export type ApprovalPriority = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'

import { findWorkflowForModule, calculateSLADeadline, getNextStage, type ApprovalStageHistory, isSLABreached } from './workflows'

export interface ApprovalRequest {
  id: string
  sourceModule: ApprovalSourceModule
  sourceId: string
  sourceTitle: string
  requestType: ApprovalRequestType
  requestedBy: string
  requestedByRole: string
  assignedApprover: string
  approverRole: string
  status: ApprovalStatus
  riskLevel: string
  priority: ApprovalPriority
  notes?: string
  createdAt: string
  updatedAt: string
  decidedAt?: string
  isDemo: boolean
  // Multi-level workflow fields
  workflowId?: string
  currentStage?: number
  totalStages?: number
  stageHistory: ApprovalStageHistory[]
  completedStages: number[]
  pendingRole?: string
  slaDeadline?: string
}

const STORAGE_KEY = 'akop_approval_requests_v1'

function loadRequests(): ApprovalRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ApprovalRequest[]
  } catch {
    return []
  }
}

function saveRequests(requests: ApprovalRequest[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

export function fetchApprovalRequests(): ApprovalRequest[] {
  return loadRequests()
}

export function createApprovalRequest(payload: Omit<ApprovalRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'isDemo' | 'stageHistory' | 'completedStages'>): ApprovalRequest {
  const requests = loadRequests()
  const now = new Date().toISOString()
  const wf = payload.workflowId ? undefined : findWorkflowForModule(payload.sourceModule)
  const workflowId = payload.workflowId || wf?.id
  const stages = wf?.stages || []
  const currentStage = workflowId ? (stages[0]?.order || 1) : undefined
  const totalStages = workflowId ? stages.length : undefined
  const pendingRole = workflowId ? stages[0]?.role : undefined
  const slaDeadline = workflowId && stages[0] ? calculateSLADeadline(stages[0]) : undefined

  const newRequest: ApprovalRequest = {
    ...payload,
    id: `apr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    status: 'Beklemede',
    createdAt: now,
    updatedAt: now,
    isDemo: false,
    stageHistory: [],
    completedStages: [],
    workflowId,
    currentStage,
    totalStages,
    pendingRole,
    slaDeadline,
  }
  requests.unshift(newRequest)
  saveRequests(requests)
  return newRequest
}

export function updateApprovalStatus(id: string, status: ApprovalStatus, notes?: string): ApprovalRequest | null {
  const requests = loadRequests()
  const idx = requests.findIndex((r) => r.id === id)
  if (idx === -1) return null
  const now = new Date().toISOString()
  requests[idx] = {
    ...requests[idx],
    status,
    updatedAt: now,
    decidedAt: status !== 'Beklemede' ? now : undefined,
    notes: notes ? `${requests[idx].notes || ''}\n[${now}] ${notes}`.trim() : requests[idx].notes,
  }
  saveRequests(requests)
  return requests[idx]
}

export function approveRequest(id: string, notes?: string) { return updateApprovalStatus(id, 'Onaylandı', notes) }
export function rejectRequest(id: string, notes?: string) { return updateApprovalStatus(id, 'Reddedildi', notes) }
export function requestRevision(id: string, notes?: string) { return updateApprovalStatus(id, 'Revizyon İstendi', notes) }

// Multi-level workflow stage engine
function saveAndReturn(req: ApprovalRequest): ApprovalRequest | null {
  const requests = loadRequests()
  const idx = requests.findIndex((r) => r.id === req.id)
  if (idx === -1) return null
  req.updatedAt = new Date().toISOString()
  requests[idx] = req
  saveRequests(requests)
  return req
}

export function approveStage(id: string, userName: string, role: string, notes?: string): ApprovalRequest | null {
  const requests = loadRequests()
  const req = requests.find((r) => r.id === id)
  if (!req || !req.workflowId || !req.currentStage || !req.totalStages) return approveRequest(id, notes)
  const wf = findWorkflowForModule(req.sourceModule)
  if (!wf) return approveRequest(id, notes)

  const now = new Date().toISOString()
  const stageEntry: ApprovalStageHistory = { role, user: userName, action: 'ONAYLANDI', notes, timestamp: now }
  req.stageHistory = [...req.stageHistory, stageEntry]
  req.completedStages = [...req.completedStages, req.currentStage]

  const nextStage = getNextStage(wf, req.currentStage)
  if (nextStage) {
    req.currentStage = nextStage.order
    req.pendingRole = nextStage.role
    req.slaDeadline = calculateSLADeadline(nextStage)
    req.assignedApprover = nextStage.role
    req.approverRole = nextStage.role
    return saveAndReturn(req)
  }

  // All stages completed
  req.status = 'Onaylandı'
  req.decidedAt = now
  req.pendingRole = undefined
  req.slaDeadline = undefined
  return saveAndReturn(req)
}

export function rejectStage(id: string, userName: string, role: string, notes?: string): ApprovalRequest | null {
  const requests = loadRequests()
  const req = requests.find((r) => r.id === id)
  if (!req || !req.workflowId) return rejectRequest(id, notes)

  const now = new Date().toISOString()
  const stageEntry: ApprovalStageHistory = { role, user: userName, action: 'REDDEDILDI', notes, timestamp: now }
  req.stageHistory = [...req.stageHistory, stageEntry]
  req.status = 'Reddedildi'
  req.decidedAt = now
  req.pendingRole = undefined
  req.slaDeadline = undefined
  return saveAndReturn(req)
}

export function requestRevisionStage(id: string, userName: string, role: string, notes?: string): ApprovalRequest | null {
  const requests = loadRequests()
  const req = requests.find((r) => r.id === id)
  if (!req || !req.workflowId) return requestRevision(id, notes)

  const now = new Date().toISOString()
  const stageEntry: ApprovalStageHistory = { role, user: userName, action: 'REVIZYON_ISTENDI', notes, timestamp: now }
  req.stageHistory = [...req.stageHistory, stageEntry]
  req.status = 'Revizyon İstendi'
  req.pendingRole = undefined
  req.slaDeadline = undefined
  return saveAndReturn(req)
}

export function getWorkflowProgress(req: ApprovalRequest): number {
  if (!req.totalStages || req.totalStages <= 0) return 0
  return Math.round(((req.currentStage || 1) - 1) / req.totalStages * 100)
}

export function getWorkflowSLABreachCount(requests: ApprovalRequest[]): number {
  return requests.filter((r) => {
    if (r.status !== 'Beklemede') return false
    if (!r.slaDeadline) return false
    return isSLABreached(r.slaDeadline)
  }).length
}

export function getApprovalStats(requests: ApprovalRequest[]) {
  const pending = requests.filter((r) => r.status === 'Beklemede').length
  const approved = requests.filter((r) => r.status === 'Onaylandı').length
  const rejected = requests.filter((r) => r.status === 'Reddedildi').length
  const revision = requests.filter((r) => r.status === 'Revizyon İstendi').length
  const critical = requests.filter((r) => r.priority === 'Kritik' && r.status === 'Beklemede').length
  const slaBreach = requests.filter((r) => {
    if (r.status !== 'Beklemede') return false
    const created = new Date(r.createdAt)
    const hoursPassed = (Date.now() - created.getTime()) / (1000 * 60 * 60)
    return hoursPassed > 24
  }).length
  return { pending, approved, rejected, revision, critical, slaBreach, total: requests.length }
}

export function getApprovalStatusBadgeClass(status: ApprovalStatus) {
  switch (status) {
    case 'Onaylandı': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'Reddedildi': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'Revizyon İstendi': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Beklemede': return 'bg-blue-50 text-blue-700 border-blue-200/60'
  }
}

export function getApprovalPriorityBadgeClass(priority: ApprovalPriority) {
  switch (priority) {
    case 'Kritik': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'Yüksek': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'Orta': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Düşük': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}

// Demo data
export function seedDemoApprovals(): ApprovalRequest[] {
  const existing = loadRequests()
  if (existing.length > 0) return existing
  const yesterday = new Date(Date.now() - 86400000).toISOString()
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString()

  const demos: ApprovalRequest[] = [
    {
      id: 'apr-001',
      sourceModule: 'MKK_MUTABAKAT',
      sourceId: 'mkk-001',
      sourceTitle: 'Pozisyon Mutabakatı - Müşteri A.Ş.',
      requestType: 'Kapanış Onayı',
      requestedBy: 'Ahmet Yılmaz',
      requestedByRole: 'Operasyon Uzmanı',
      assignedApprover: 'Yönetici',
      approverRole: 'Yönetici',
      status: 'Beklemede',
      riskLevel: 'Kritik',
      priority: 'Kritik',
      notes: 'MKK pozisyon farkı kapanış için onay bekleniyor.',
      workflowId: 'wf-mkk-close',
      currentStage: 1,
      totalStages: 3,
      pendingRole: 'Operasyon Uzmanı',
      slaDeadline: calculateSLADeadline({ order: 1, role: 'Operasyon Uzmanı', required: true, slaHours: 24 }),
      stageHistory: [],
      completedStages: [],
      createdAt: yesterday,
      updatedAt: yesterday,
      isDemo: true,
    },
    {
      id: 'apr-002',
      sourceModule: 'TAKASBANK',
      sourceId: 'tak-001',
      sourceTitle: 'Teminat Açığı - Aracı Kurum A.Ş.',
      requestType: 'Risk Değişikliği',
      requestedBy: 'Can Özdemir',
      requestedByRole: 'Operasyon Uzmanı',
      assignedApprover: 'Yönetici',
      approverRole: 'Yönetici',
      status: 'Beklemede',
      riskLevel: 'Kritik',
      priority: 'Kritik',
      notes: 'Teminat açığı düzeltme talebi.',
      workflowId: 'wf-takasbank-critical',
      currentStage: 2,
      totalStages: 4,
      pendingRole: 'Uyum Uzmanı',
      slaDeadline: calculateSLADeadline({ order: 2, role: 'Uyum Uzmanı', required: true, slaHours: 24 }),
      stageHistory: [{ role: 'Operasyon Uzmanı', user: 'Can Özdemir', action: 'ONAYLANDI', timestamp: twoDaysAgo }],
      completedStages: [1],
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      isDemo: true,
    },
    {
      id: 'apr-003',
      sourceModule: 'TASK',
      sourceId: 'task-001',
      sourceTitle: 'Uyum Görevi: SPK Düzenlemesi İnceleme',
      requestType: 'Görev Onayı',
      requestedBy: 'Selin Kaya',
      requestedByRole: 'Uyum Uzmanı',
      assignedApprover: 'Yönetici',
      approverRole: 'Yönetici',
      status: 'Onaylandı',
      riskLevel: 'Yüksek',
      priority: 'Yüksek',
      notes: 'Görev tamamlandı, yönetici onayı alındı.',
      workflowId: 'wf-task-approval',
      currentStage: 3,
      totalStages: 2,
      pendingRole: undefined,
      slaDeadline: undefined,
      stageHistory: [
        { role: 'Uyum Uzmanı', user: 'Selin Kaya', action: 'ONAYLANDI', timestamp: twoDaysAgo },
        { role: 'Yönetici', user: 'Yönetici', action: 'ONAYLANDI', timestamp: yesterday },
      ],
      completedStages: [1, 2],
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      decidedAt: yesterday,
      isDemo: true,
    },
    {
      id: 'apr-004',
      sourceModule: 'REGTECH',
      sourceId: 'spk-001',
      sourceTitle: 'SPK Bülten 2026/38 İnceleme',
      requestType: 'Yönetici Onayı',
      requestedBy: 'Mehmet Demir',
      requestedByRole: 'Uyum Uzmanı',
      assignedApprover: 'Yönetici',
      approverRole: 'Yönetici',
      status: 'Revizyon İstendi',
      riskLevel: 'Orta',
      priority: 'Orta',
      notes: 'Risk değerlendirmesi güncellenmeli.',
      workflowId: 'wf-regtech-approval',
      currentStage: 1,
      totalStages: 2,
      pendingRole: undefined,
      slaDeadline: undefined,
      stageHistory: [{ role: 'Yönetici', user: 'Yönetici', action: 'REVIZYON_ISTENDI', timestamp: yesterday }],
      completedStages: [],
      createdAt: twoDaysAgo,
      updatedAt: yesterday,
      decidedAt: yesterday,
      isDemo: true,
    },
    {
      id: 'apr-005',
      sourceModule: 'TAKASBANK',
      sourceId: 'tak-005',
      sourceTitle: 'Settlement Gecikmesi - Emeklilik Fonu E',
      requestType: 'Kapanış Onayı',
      requestedBy: 'Zeynep Şahin',
      requestedByRole: 'Operasyon Uzmanı',
      assignedApprover: 'Yönetici',
      approverRole: 'Yönetici',
      status: 'Beklemede',
      riskLevel: 'Kritik',
      priority: 'Yüksek',
      notes: 'T+2 settlement gecikmesi kapanış onayı.',
      workflowId: 'wf-takasbank-critical',
      currentStage: 1,
      totalStages: 4,
      pendingRole: 'Operasyon Uzmanı',
      slaDeadline: calculateSLADeadline({ order: 1, role: 'Operasyon Uzmanı', required: true, slaHours: 24 }),
      stageHistory: [],
      completedStages: [],
      createdAt: yesterday,
      updatedAt: yesterday,
      isDemo: true,
    },
  ]

  saveRequests(demos)
  return demos
}
