export type IntelligenceSeverity = 'low' | 'medium' | 'high' | 'critical'
export type RuleStatus = 'active' | 'draft' | 'paused'
export type RuleAction = 'notify' | 'create_case' | 'raise_risk' | 'require_approval'

export interface AdverseMediaSignal {
  id: string
  entityName: string
  entityType: 'Şirket' | 'Yatırımcı' | 'Tedarikçi'
  source: string
  headline: string
  detectedAt: string
  aiSummary: string
  riskKeywords: string[]
  confidence: number
  severity: IntelligenceSeverity
  suggestedAction: string
}

export interface WorkflowRule {
  id: string
  name: string
  description: string
  condition: string
  action: RuleAction
  status: RuleStatus
  owner: string
  lastTriggeredAt?: string
  hitsLast30Days: number
}

export interface LiveTransactionSignal {
  id: string
  stream: string
  entityName: string
  amount: number
  currency: 'TRY' | 'USD' | 'EUR'
  scenario: string
  status: 'Normal' | 'İncelemede' | 'Bloke'
  riskScore: number
  detectedAt: string
  auditStatus: 'Yazıldı' | 'Bekliyor'
}

export interface RiskMatrixEntity {
  id: string
  entityName: string
  entityType: 'Müşteri' | 'İşlem' | 'Tedarikçi' | 'Yükümlülük'
  countryRisk: number
  transactionRisk: number
  behaviorRisk: number
  regulatoryRisk: number
  delayRisk: number
  score: number
  trend: 'up' | 'down' | 'stable'
  owner: string
}

export const adverseMediaSignals: AdverseMediaSignal[] = [
  {
    id: 'AMS-001',
    entityName: 'NordBridge Capital Ltd.',
    entityType: 'Yatırımcı',
    source: 'Global News Watch',
    headline: 'NordBridge Capital adı yaptırım soruşturması haberinde geçti',
    detectedAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    aiSummary: 'LLM taraması haberin yaptırım ve offshore fon ilişkisi içerdiğini, doğrudan mahkumiyet değil inceleme aşaması olduğunu işaretledi.',
    riskKeywords: ['yaptırım', 'offshore', 'inceleme'],
    confidence: 87,
    severity: 'high',
    suggestedAction: 'Onboarding dosyasını enhanced due diligence seviyesine çek.',
  },
  {
    id: 'AMS-002',
    entityName: 'Mavi Liman Enerji A.Ş.',
    entityType: 'Şirket',
    source: 'Yerel Basın + SPK Bülten',
    headline: 'Şirket yöneticileri hakkında piyasa bozucu işlem iddiası',
    detectedAt: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
    aiSummary: 'Adverse media skoru yüksek. Haber tonu iddia seviyesinde, SPK bültenlerinde ilişkili işlem incelemesi aranmalı.',
    riskKeywords: ['piyasa bozucu işlem', 'idari yaptırım', 'yönetici'],
    confidence: 79,
    severity: 'high',
    suggestedAction: 'İlişkili taraf işlemlerini case olarak aç ve işlem limitlerini gözden geçir.',
  },
  {
    id: 'AMS-003',
    entityName: 'DataCloud SaaS GmbH',
    entityType: 'Tedarikçi',
    source: 'EU Regulatory Feed',
    headline: 'AB veri saklama düzenlemesinde yeni operasyonel gereklilik',
    detectedAt: new Date(Date.now() - 76 * 60 * 1000).toISOString(),
    aiSummary: 'Yeni AB metni vendor data residency yükümlülüğünü etkileyebilir. KVKK ve dış kaynak yönetimi politikasıyla eşleştirildi.',
    riskKeywords: ['data residency', 'outsourcing', 'privacy'],
    confidence: 72,
    severity: 'medium',
    suggestedAction: 'Vendor sözleşmesine veri lokasyonu kontrol maddesi ekle.',
  },
]

export const workflowRules: WorkflowRule[] = [
  {
    id: 'RULE-001',
    name: 'Yabancı yatırımcı hacim + onboarding SLA',
    description: 'Yabancı yatırımcı işlem hacmi yüksek ve onboarding SLA aşımı varsa risk yükseltir.',
    condition: 'entity.country != TR AND volume_24h > 100000 USD AND onboarding_age > 12h',
    action: 'raise_risk',
    status: 'active',
    owner: 'Uyum',
    lastTriggeredAt: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    hitsLast30Days: 9,
  },
  {
    id: 'RULE-002',
    name: 'Kritik adverse media -> case',
    description: 'LLM adverse media skoru kritikse otomatik case açar.',
    condition: 'adverse_media.severity == critical OR confidence > 85',
    action: 'create_case',
    status: 'active',
    owner: 'Finansal Suçlar',
    lastTriggeredAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    hitsLast30Days: 4,
  },
  {
    id: 'RULE-003',
    name: 'Yeni mevzuat etki zinciri',
    description: 'RegIntel değişikliği operasyon veya politika etkiliyorsa onay akışına gönderir.',
    condition: 'regintel.impact in [Yüksek,Kritik] AND affected_policy_count > 0',
    action: 'require_approval',
    status: 'draft',
    owner: 'Yönetişim',
    hitsLast30Days: 0,
  },
]

export const liveTransactionSignals: LiveTransactionSignal[] = [
  {
    id: 'TXS-98241',
    stream: 'MKK Emir Akışı',
    entityName: 'NordBridge Capital Ltd.',
    amount: 124500,
    currency: 'USD',
    scenario: 'Yüksek hacim + yabancı yatırımcı + onboarding SLA',
    status: 'İncelemede',
    riskScore: 86,
    detectedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    auditStatus: 'Yazıldı',
  },
  {
    id: 'TXS-98242',
    stream: 'Takasbank Teminat',
    entityName: 'Aracı Kurum A.Ş.',
    amount: 3800000,
    currency: 'TRY',
    scenario: 'Teminat açığı trendi + margin call yaklaşımı',
    status: 'İncelemede',
    riskScore: 73,
    detectedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    auditStatus: 'Yazıldı',
  },
  {
    id: 'TXS-98243',
    stream: 'AML Senaryo Motoru',
    entityName: 'Mavi Liman Enerji A.Ş.',
    amount: 92000,
    currency: 'EUR',
    scenario: 'Adverse media ilişkili işlem paterni',
    status: 'Bloke',
    riskScore: 91,
    detectedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    auditStatus: 'Yazıldı',
  },
]

export const riskMatrixEntities: RiskMatrixEntity[] = [
  {
    id: 'RME-001',
    entityName: 'NordBridge Capital Ltd.',
    entityType: 'Müşteri',
    countryRisk: 18,
    transactionRisk: 23,
    behaviorRisk: 17,
    regulatoryRisk: 20,
    delayRisk: 8,
    score: 86,
    trend: 'up',
    owner: 'Uyum',
  },
  {
    id: 'RME-002',
    entityName: 'Mavi Liman Enerji A.Ş.',
    entityType: 'İşlem',
    countryRisk: 6,
    transactionRisk: 26,
    behaviorRisk: 24,
    regulatoryRisk: 23,
    delayRisk: 12,
    score: 91,
    trend: 'up',
    owner: 'Finansal Suçlar',
  },
  {
    id: 'RME-003',
    entityName: 'DataCloud SaaS GmbH',
    entityType: 'Tedarikçi',
    countryRisk: 9,
    transactionRisk: 8,
    behaviorRisk: 11,
    regulatoryRisk: 24,
    delayRisk: 6,
    score: 58,
    trend: 'stable',
    owner: 'Vendor Risk',
  },
  {
    id: 'RME-004',
    entityName: 'SPK Operasyonel Risk Yükümlülüğü',
    entityType: 'Yükümlülük',
    countryRisk: 0,
    transactionRisk: 9,
    behaviorRisk: 13,
    regulatoryRisk: 29,
    delayRisk: 18,
    score: 69,
    trend: 'down',
    owner: 'İç Kontrol',
  },
]

export function getIntelligenceStats() {
  const criticalSignals = adverseMediaSignals.filter((item) => item.severity === 'critical' || item.severity === 'high').length
  const activeRules = workflowRules.filter((rule) => rule.status === 'active').length
  const liveAlerts = liveTransactionSignals.filter((item) => item.status !== 'Normal').length
  const averageRisk = Math.round(riskMatrixEntities.reduce((sum, item) => sum + item.score, 0) / riskMatrixEntities.length)

  return {
    criticalSignals,
    activeRules,
    liveAlerts,
    averageRisk,
  }
}

export function getRiskTone(score: number) {
  if (score >= 85) return 'critical'
  if (score >= 70) return 'high'
  if (score >= 45) return 'medium'
  return 'low'
}

export function getRiskToneClass(score: number) {
  const tone = getRiskTone(score)
  switch (tone) {
    case 'critical': return 'bg-rose-50 text-rose-700 border-rose-200'
    case 'high': return 'bg-orange-50 text-orange-700 border-orange-200'
    case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200'
    default: return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  }
}

