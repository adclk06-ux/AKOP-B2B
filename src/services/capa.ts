import { fetchFindings, type FindingSeverity } from '@/services/controls'

export type CapaStatus = 'Open' | 'Root Cause' | 'Corrective Action' | 'Preventive Action' | 'Verification' | 'Closed'
export type CapaPriority = 'Low' | 'Medium' | 'High' | 'Critical'

export interface CapaAction {
  id: string
  capaNumber: string
  title: string
  sourceFindingId: string
  sourceFindingTitle: string
  rootCause: string
  correctiveAction: string
  preventiveAction: string
  owner: string
  dueDate: string
  status: CapaStatus
  priority: CapaPriority
  verificationNote?: string
  evidenceIds: string[]
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'akop_capa_actions_v1'

function severityToPriority(severity: FindingSeverity): CapaPriority {
  if (severity === 'Critical') return 'Critical'
  if (severity === 'High') return 'High'
  if (severity === 'Medium') return 'Medium'
  return 'Low'
}

function addDays(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

function load(): CapaAction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as CapaAction[]
    const seeded = seedDemoCapaActions()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
    return seeded
  } catch {
    return seedDemoCapaActions()
  }
}

function save(items: CapaAction[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function seedDemoCapaActions(): CapaAction[] {
  const now = new Date().toISOString()
  return fetchFindings().slice(0, 8).map((finding, index) => ({
    id: `CAPA-${String(index + 1).padStart(3, '0')}`,
    capaNumber: `CAPA-${String(index + 1).padStart(3, '0')}`,
    title: `CAPA: ${finding.title}`,
    sourceFindingId: finding.id,
    sourceFindingTitle: finding.title,
    rootCause: finding.severity === 'Critical'
      ? 'Kontrol tasarımı ve sahiplik matrisi yetersiz.'
      : 'Süreç dokümantasyonu ve periyodik takip adımları eksik.',
    correctiveAction: 'Tespit edilen uygunsuzluğun kapatılması için sorumlu ekip tarafından aksiyon alınacak.',
    preventiveAction: 'Tekrarı önlemek için kontrol prosedürü, kontrol frekansı ve kanıt zorunluluğu güncellenecek.',
    owner: finding.owner,
    dueDate: finding.dueDate ?? addDays(finding.severity === 'Critical' ? 7 : 21),
    status: index % 4 === 0 ? 'Open' : index % 4 === 1 ? 'Root Cause' : index % 4 === 2 ? 'Corrective Action' : 'Verification',
    priority: severityToPriority(finding.severity),
    verificationNote: index % 4 === 3 ? 'Kapanış kanıtı ve tekrar etmeme kontrolü bekleniyor.' : undefined,
    evidenceIds: [],
    createdAt: now,
    updatedAt: now,
  }))
}

export function fetchCapaActions(): CapaAction[] {
  return load()
}

export function updateCapaAction(id: string, updates: Partial<CapaAction>): CapaAction | null {
  const items = load()
  const idx = items.findIndex((item) => item.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() }
  save(items)
  return items[idx]
}

export function advanceCapaAction(id: string): CapaAction | null {
  const order: CapaStatus[] = ['Open', 'Root Cause', 'Corrective Action', 'Preventive Action', 'Verification', 'Closed']
  const items = load()
  const item = items.find((current) => current.id === id)
  if (!item) return null
  const currentIndex = order.indexOf(item.status)
  const nextStatus = order[Math.min(order.length - 1, currentIndex + 1)]
  return updateCapaAction(id, { status: nextStatus })
}

export function getCapaStats(items: CapaAction[]) {
  const today = new Date().toISOString().split('T')[0]
  return {
    total: items.length,
    open: items.filter((item) => item.status !== 'Closed').length,
    closed: items.filter((item) => item.status === 'Closed').length,
    critical: items.filter((item) => item.priority === 'Critical').length,
    overdue: items.filter((item) => item.status !== 'Closed' && item.dueDate < today).length,
    verification: items.filter((item) => item.status === 'Verification').length,
  }
}

export function getCapaStatusBadgeClass(status: CapaStatus) {
  switch (status) {
    case 'Open': return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'Root Cause': return 'bg-violet-50 text-violet-700 border-violet-200/60'
    case 'Corrective Action': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Preventive Action': return 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
    case 'Verification': return 'bg-cyan-50 text-cyan-700 border-cyan-200/60'
    case 'Closed': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}

export function getCapaPriorityBadgeClass(priority: CapaPriority) {
  switch (priority) {
    case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'High': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Low': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}
