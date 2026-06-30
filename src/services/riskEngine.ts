export type RiskEntityType = 'regulation' | 'obligation' | 'task' | 'case' | 'approval' | 'reconciliation' | 'takasbank' | 'evidence'
export type RiskLevel = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'
export type RiskTrend = 'up' | 'down' | 'stable'

export interface RiskScore {
  id: string
  entityType: RiskEntityType
  entityId: string
  entityTitle: string
  score: number
  impactScore: number
  urgencyScore: number
  complianceScore: number
  probabilityScore: number
  recommendationScore: number
  calculatedAt: string
  previousScore?: number
  trend?: RiskTrend
  responsible?: string
}

export interface RiskScoreInput {
  entityType: RiskEntityType
  entityId: string
  entityTitle: string
  regulationRisk?: number
  obligationRisk?: number
  taskStatus?: string
  caseStatus?: string
  casePriority?: string
  caseRisk?: string
  approvalDelay?: number
  slaBreached?: boolean
  takasbankAlertType?: string
  takasbankRisk?: string
  reconciliationRisk?: string
  evidenceMissing?: boolean
  evidenceClassification?: string
  responsible?: string
}

const RISK_KEY = 'akop_risk_scores_v1'
const RISK_HISTORY_KEY = 'akop_risk_history_v1'

function load(): RiskScore[] {
  try { const raw = localStorage.getItem(RISK_KEY); return raw ? JSON.parse(raw) as RiskScore[] : seedDemoRiskScores() } catch { return seedDemoRiskScores() }
}
function save(items: RiskScore[]) { localStorage.setItem(RISK_KEY, JSON.stringify(items)) }

function loadHistory(): Record<string, number[]> {
  try { const raw = localStorage.getItem(RISK_HISTORY_KEY); return raw ? JSON.parse(raw) : {} } catch { return {} }
}
function saveHistory(history: Record<string, number[]>) { localStorage.setItem(RISK_HISTORY_KEY, JSON.stringify(history)) }

export function seedDemoRiskScores(): RiskScore[] {
  const now = new Date().toISOString()
  const scores: RiskScore[] = [
    { id: 'RSK-REG-001', entityType: 'regulation', entityId: 'REG-001', entityTitle: 'SPK Tebliğ XI-37', score: 82, impactScore: 85, urgencyScore: 78, complianceScore: 72, probabilityScore: 88, recommendationScore: 80, calculatedAt: now, previousScore: 75, trend: 'up', responsible: 'Ayşe Demir' },
    { id: 'RSK-OBL-001', entityType: 'obligation', entityId: 'OBL-001', entityTitle: 'Müşteri Kimlik Doğrulama', score: 91, impactScore: 95, urgencyScore: 92, complianceScore: 85, probabilityScore: 90, recommendationScore: 94, calculatedAt: now, previousScore: 88, trend: 'up', responsible: 'Mehmet Kaya' },
    { id: 'RSK-TASK-001', entityType: 'task', entityId: 'TASK-001', entityTitle: 'Yıllık Uyum Raporu', score: 68, impactScore: 70, urgencyScore: 75, complianceScore: 65, probabilityScore: 60, recommendationScore: 70, calculatedAt: now, previousScore: 65, trend: 'up', responsible: 'Fatma Şahin' },
    { id: 'RSK-CASE-001', entityType: 'case', entityId: 'CASE-001', entityTitle: 'İç Soruşturma #2026-14', score: 76, impactScore: 80, urgencyScore: 78, complianceScore: 72, probabilityScore: 75, recommendationScore: 75, calculatedAt: now, previousScore: 70, trend: 'up', responsible: 'Ahmet Yılmaz' },
    { id: 'RSK-APP-001', entityType: 'approval', entityId: 'APP-001', entityTitle: 'Yüksek Riskli Müşteri Onayı', score: 73, impactScore: 75, urgencyScore: 80, complianceScore: 70, probabilityScore: 68, recommendationScore: 72, calculatedAt: now, previousScore: 73, trend: 'stable', responsible: 'Zeynep Koç' },
    { id: 'RSK-REC-001', entityType: 'reconciliation', entityId: 'REC-001', entityTitle: 'MKK Mutabakat Farkı #456', score: 85, impactScore: 88, urgencyScore: 82, complianceScore: 80, probabilityScore: 85, recommendationScore: 84, calculatedAt: now, previousScore: 78, trend: 'up', responsible: 'Can Özdemir' },
    { id: 'RSK-TAK-001', entityType: 'takasbank', entityId: 'TAK-001', entityTitle: 'Teminat Açığı Uyarısı', score: 94, impactScore: 96, urgencyScore: 95, complianceScore: 92, probabilityScore: 94, recommendationScore: 93, calculatedAt: now, previousScore: 90, trend: 'up', responsible: 'Elif Yıldız' },
    { id: 'RSK-EVI-001', entityType: 'evidence', entityId: 'EVI-001', entityTitle: 'Eksik Kanıt: Risk Politikası', score: 55, impactScore: 60, urgencyScore: 58, complianceScore: 50, probabilityScore: 52, recommendationScore: 55, calculatedAt: now, previousScore: 50, trend: 'up', responsible: 'Burak Aydın' },
    { id: 'RSK-REG-002', entityType: 'regulation', entityId: 'REG-002', entityTitle: 'BDDK Düzenleme 2026/12', score: 45, impactScore: 50, urgencyScore: 40, complianceScore: 55, probabilityScore: 42, recommendationScore: 48, calculatedAt: now, previousScore: 48, trend: 'down', responsible: 'Ayşe Demir' },
    { id: 'RSK-OBL-002', entityType: 'obligation', entityId: 'OBL-002', entityTitle: 'Sermaye Yeterliliği Raporu', score: 62, impactScore: 65, urgencyScore: 60, complianceScore: 58, probabilityScore: 65, recommendationScore: 62, calculatedAt: now, previousScore: 60, trend: 'up', responsible: 'Mehmet Kaya' },
    { id: 'RSK-TASK-002', entityType: 'task', entityId: 'TASK-002', entityTitle: 'İç Denetim Kontrol Listesi', score: 38, impactScore: 40, urgencyScore: 35, complianceScore: 42, probabilityScore: 38, recommendationScore: 36, calculatedAt: now, previousScore: 38, trend: 'stable', responsible: 'Fatma Şahin' },
    { id: 'RSK-CASE-002', entityType: 'case', entityId: 'CASE-002', entityTitle: 'Şüpheli İşlem Bildirimi', score: 58, impactScore: 60, urgencyScore: 62, complianceScore: 55, probabilityScore: 58, recommendationScore: 55, calculatedAt: now, previousScore: 55, trend: 'up', responsible: 'Ahmet Yılmaz' },
    { id: 'RSK-APP-002', entityType: 'approval', entityId: 'APP-002', entityTitle: 'Yeni Ürün Onayı', score: 42, impactScore: 45, urgencyScore: 40, complianceScore: 48, probabilityScore: 40, recommendationScore: 42, calculatedAt: now, previousScore: 44, trend: 'down', responsible: 'Zeynep Koç' },
    { id: 'RSK-REC-002', entityType: 'reconciliation', entityId: 'REC-002', entityTitle: 'Takasbank Reconciliation', score: 33, impactScore: 35, urgencyScore: 32, complianceScore: 38, probabilityScore: 30, recommendationScore: 32, calculatedAt: now, previousScore: 33, trend: 'stable', responsible: 'Can Özdemir' },
    { id: 'RSK-TAK-002', entityType: 'takasbank', entityId: 'TAK-002', entityTitle: 'Limit Aşımı Uyarısı', score: 67, impactScore: 70, urgencyScore: 68, complianceScore: 65, probabilityScore: 66, recommendationScore: 66, calculatedAt: now, previousScore: 65, trend: 'up', responsible: 'Elif Yıldız' },
    { id: 'RSK-EVI-002', entityType: 'evidence', entityId: 'EVI-002', entityTitle: 'KVKK Uyum Dokümanı', score: 28, impactScore: 30, urgencyScore: 25, complianceScore: 35, probabilityScore: 28, recommendationScore: 25, calculatedAt: now, previousScore: 30, trend: 'down', responsible: 'Burak Aydın' },
    { id: 'RSK-REG-003', entityType: 'regulation', entityId: 'REG-003', entityTitle: 'MASAK Uyarı Duyurusu', score: 71, impactScore: 75, urgencyScore: 72, complianceScore: 68, probabilityScore: 70, recommendationScore: 70, calculatedAt: now, previousScore: 65, trend: 'up', responsible: 'Ayşe Demir' },
    { id: 'RSK-OBL-003', entityType: 'obligation', entityId: 'OBL-003', entityTitle: 'Bilgi Güvenliği Yönetimi', score: 48, impactScore: 50, urgencyScore: 45, complianceScore: 52, probabilityScore: 48, recommendationScore: 45, calculatedAt: now, previousScore: 48, trend: 'stable', responsible: 'Mehmet Kaya' },
    { id: 'RSK-TASK-003', entityType: 'task', entityId: 'TASK-003', entityTitle: 'Müşteri Şikayeti Takibi', score: 52, impactScore: 55, urgencyScore: 50, complianceScore: 50, probabilityScore: 55, recommendationScore: 52, calculatedAt: now, previousScore: 50, trend: 'up', responsible: 'Fatma Şahin' },
    { id: 'RSK-CASE-003', entityType: 'case', entityId: 'CASE-003', entityTitle: 'Denetim Bulgusu #2026-08', score: 88, impactScore: 90, urgencyScore: 88, complianceScore: 85, probabilityScore: 88, recommendationScore: 88, calculatedAt: now, previousScore: 82, trend: 'up', responsible: 'Ahmet Yılmaz' },
  ]
  localStorage.setItem(RISK_KEY, JSON.stringify(scores))
  // Seed history
  const history: Record<string, number[]> = {}
  scores.forEach((s) => {
    history[s.id] = [s.previousScore || s.score - 5, s.score]
  })
  saveHistory(history)
  return scores
}

export function calculateRiskScore(input: RiskScoreInput): RiskScore {
  const now = new Date().toISOString()
  const id = `RSK-${input.entityType.toUpperCase().slice(0, 3)}-${input.entityId}`

  // Base scores from 0-100
  let impactScore = 50
  let urgencyScore = 50
  let complianceScore = 50
  let probabilityScore = 50
  let recommendationScore = 50

  // Regulation risk
  if (input.regulationRisk !== undefined) {
    impactScore = Math.max(impactScore, input.regulationRisk * 0.9)
    probabilityScore = Math.max(probabilityScore, input.regulationRisk * 0.8)
  }

  // Obligation risk
  if (input.obligationRisk !== undefined) {
    complianceScore = Math.max(complianceScore, input.obligationRisk * 0.9)
    urgencyScore = Math.max(urgencyScore, input.obligationRisk * 0.85)
  }

  // Task status
  if (input.taskStatus) {
    const statusMap: Record<string, number> = { 'Açık': 60, 'Devam Ediyor': 50, 'Beklemede': 55, 'Tamamlandı': 20, 'Gecikmiş': 85, 'İptal Edildi': 30 }
    urgencyScore = Math.max(urgencyScore, statusMap[input.taskStatus] || 50)
    if (input.taskStatus === 'Gecikmiş') complianceScore = Math.max(complianceScore, 80)
  }

  // Case status/priority/risk
  if (input.caseStatus) {
    const statusMap: Record<string, number> = { 'Açık': 70, 'İncelemede': 65, 'Çözülüyor': 55, 'Kapandı': 20, 'Arşivlendi': 15 }
    impactScore = Math.max(impactScore, statusMap[input.caseStatus] || 50)
  }
  if (input.casePriority) {
    const priorityMap: Record<string, number> = { 'Düşük': 30, 'Orta': 55, 'Yüksek': 80, 'Kritik': 95 }
    urgencyScore = Math.max(urgencyScore, priorityMap[input.casePriority] || 50)
  }
  if (input.caseRisk) {
    const riskMap: Record<string, number> = { 'Düşük': 30, 'Orta': 55, 'Yüksek': 80, 'Kritik': 95 }
    impactScore = Math.max(impactScore, riskMap[input.caseRisk] || 50)
    probabilityScore = Math.max(probabilityScore, riskMap[input.caseRisk] || 50)
  }

  // Approval delay
  if (input.approvalDelay !== undefined) {
    const delayScore = Math.min(100, input.approvalDelay * 3)
    urgencyScore = Math.max(urgencyScore, delayScore)
    if (input.approvalDelay > 5) complianceScore = Math.max(complianceScore, 75)
  }

  // SLA breached
  if (input.slaBreached) {
    urgencyScore = Math.max(urgencyScore, 90)
    complianceScore = Math.max(complianceScore, 85)
    recommendationScore = Math.max(recommendationScore, 90)
  }

  // Takasbank alert
  if (input.takasbankAlertType) {
    const alertMap: Record<string, number> = { 'Teminat Açığı': 95, 'Margin Çağrısı': 90, 'Limit Aşımı': 85, 'Takas Başarısızlığı': 92, 'Settlement Gecikmesi': 88, 'Nakit Blokaj': 80 }
    impactScore = Math.max(impactScore, alertMap[input.takasbankAlertType] || 60)
    urgencyScore = Math.max(urgencyScore, alertMap[input.takasbankAlertType] || 60)
  }
  if (input.takasbankRisk) {
    const riskMap: Record<string, number> = { 'Düşük': 30, 'Orta': 60, 'Yüksek': 85, 'Kritik': 95 }
    probabilityScore = Math.max(probabilityScore, riskMap[input.takasbankRisk] || 50)
  }

  // Reconciliation risk
  if (input.reconciliationRisk) {
    const riskMap: Record<string, number> = { 'Düşük': 30, 'Orta': 60, 'Yüksek': 85, 'Kritik': 95 }
    complianceScore = Math.max(complianceScore, riskMap[input.reconciliationRisk] || 50)
    impactScore = Math.max(impactScore, riskMap[input.reconciliationRisk] || 50)
  }

  // Evidence missing
  if (input.evidenceMissing) {
    complianceScore = Math.max(complianceScore, 70)
    recommendationScore = Math.max(recommendationScore, 80)
  }
  if (input.evidenceClassification) {
    const classMap: Record<string, number> = { 'Doküman': 40, 'Rapor': 50, 'Kanıt': 60, 'Delil': 75, 'Sertifika': 55, 'Log': 45, 'Mail': 35, 'Ekran Görüntüsü': 50, 'Sözleşme': 65, 'Yönetmelik': 70 }
    impactScore = Math.max(impactScore, classMap[input.evidenceClassification] || 50)
  }

  // Calculate total score (weighted)
  const score = Math.round(
    (impactScore * 0.25) +
    (urgencyScore * 0.25) +
    (complianceScore * 0.20) +
    (probabilityScore * 0.15) +
    (recommendationScore * 0.15)
  )

  const clamped = Math.min(100, Math.max(0, score))

  return {
    id,
    entityType: input.entityType,
    entityId: input.entityId,
    entityTitle: input.entityTitle,
    score: clamped,
    impactScore: Math.round(impactScore),
    urgencyScore: Math.round(urgencyScore),
    complianceScore: Math.round(complianceScore),
    probabilityScore: Math.round(probabilityScore),
    recommendationScore: Math.round(recommendationScore),
    calculatedAt: now,
    responsible: input.responsible,
  }
}

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) return 'Düşük'
  if (score <= 50) return 'Orta'
  if (score <= 75) return 'Yüksek'
  return 'Kritik'
}

export function getRiskBadgeClass(score: number) {
  const level = getRiskLevel(score)
  switch (level) {
    case 'Düşük': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Orta': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Yüksek': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'Kritik': return 'bg-rose-100 text-rose-800 border-rose-200'
    default: return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function getRiskLevelBadgeClass(level: RiskLevel) {
  switch (level) {
    case 'Düşük': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Orta': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Yüksek': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'Kritik': return 'bg-rose-100 text-rose-800 border-rose-200'
    default: return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function getTrendIndicator(trend?: RiskTrend) {
  switch (trend) {
    case 'up': return { icon: '↑', color: 'text-rose-600', label: 'Artıyor' }
    case 'down': return { icon: '↓', color: 'text-emerald-600', label: 'Azalıyor' }
    case 'stable': return { icon: '→', color: 'text-slate-500', label: 'Sabit' }
    default: return { icon: '→', color: 'text-slate-500', label: 'Sabit' }
  }
}

export function fetchRiskScores(): RiskScore[] {
  return load()
}

export function updateRiskScore(id: string, updates: Partial<RiskScore>): RiskScore | null {
  const items = load()
  const idx = items.findIndex((s) => s.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates, calculatedAt: new Date().toISOString() }
  save(items)
  return items[idx]
}

export function getRiskScoreByEntity(entityType: RiskEntityType, entityId: string): RiskScore | undefined {
  return load().find((s) => s.entityType === entityType && s.entityId === entityId)
}

export function getRiskStats(scores: RiskScore[]) {
  const total = scores.length
  if (total === 0) return { total: 0, critical: 0, high: 0, medium: 0, low: 0, average: 0, increasing: 0, decreasing: 0, stable: 0 }
  const critical = scores.filter((s) => s.score > 75).length
  const high = scores.filter((s) => s.score > 50 && s.score <= 75).length
  const medium = scores.filter((s) => s.score > 25 && s.score <= 50).length
  const low = scores.filter((s) => s.score <= 25).length
  const average = Math.round(scores.reduce((sum, s) => sum + s.score, 0) / total)
  const increasing = scores.filter((s) => s.trend === 'up').length
  const decreasing = scores.filter((s) => s.trend === 'down').length
  const stable = scores.filter((s) => s.trend === 'stable').length
  return { total, critical, high, medium, low, average, increasing, decreasing, stable }
}

export function getTopRisks(scores: RiskScore[], limit = 20): RiskScore[] {
  return [...scores].sort((a, b) => b.score - a.score).slice(0, limit)
}

export function getRisksByAuthority(scores: RiskScore[], authority: string): RiskScore[] {
  return scores.filter((s) => {
    if (authority === 'SPK') return s.entityTitle.toLowerCase().includes('spk') || s.entityType === 'regulation'
    if (authority === 'BDDK') return s.entityTitle.toLowerCase().includes('bddk')
    if (authority === 'MASAK') return s.entityTitle.toLowerCase().includes('masak')
    if (authority === 'MKK') return s.entityType === 'reconciliation'
    if (authority === 'TAKASBANK') return s.entityType === 'takasbank'
    return false
  })
}

export function getRiskHistory(id: string): number[] {
  return loadHistory()[id] || []
}

export function recalculateAllRisks(): RiskScore[] {
  const existing = load()
  const updated = existing.map((s) => {
    const history = loadHistory()
    const hist = history[s.id] || []
    const newScore = Math.min(100, Math.max(0, s.score + (Math.random() > 0.5 ? 1 : -1) * Math.floor(Math.random() * 5)))
    const trend: RiskTrend = newScore > s.score ? 'up' : newScore < s.score ? 'down' : 'stable'
    hist.push(newScore)
    if (hist.length > 30) hist.shift()
    history[s.id] = hist
    saveHistory(history)
    return { ...s, previousScore: s.score, score: newScore, trend, calculatedAt: new Date().toISOString() }
  })
  save(updated)
  return updated
}
