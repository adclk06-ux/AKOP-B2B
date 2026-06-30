export interface RegulatoryRiskResult {
  level: 'low' | 'medium' | 'high' | 'critical'
  label: 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'
  reason: string
  affectedAreas: string[]
}

const HIGH_RISK_KEYWORDS = [
  'sermaye', 'yaptırım', 'iptal', 'kapatma', 'zorunlu',
  'tedbir', 'men etme', 'para cezası', 'idari para',
]

const MEDIUM_RISK_KEYWORDS = [
  'kredi kartı', 'limit', 'kredi', 'risk', 'teminat',
  'karşılık', 'provisioning', 'nakit', 'döviz',
  'faiz', 'oran', 'oran', 'oran',
]

const AREA_KEYWORDS: Record<string, string[]> = {
  'Kredi Operasyonları': ['kredi', 'kredi kartı', 'limit', 'teminat', 'karşılık', 'provisioning', 'nakit'],
  'Sermaye / Risk Yönetimi': ['sermaye', 'risk', 'yeterlilik', 'sermaye yeterliliği', 'tier 1', 'tier 2', 'pd'],
  'Lisans / Yetkilendirme': ['lisans', 'yetki', 'faaliyet izni', 'kapatma', 'iptal', 'men etme'],
  'Bankacılık Operasyonları': ['döviz', 'faiz', 'oran', 'vade', 'mevduat', 'transfer', 'swift'],
  'Genel Uyum': ['tebliğ', 'karar', 'yönetmelik', 'genelge', 'duyuru'],
}

export function calculateRegulatoryRisk(record: {
  title?: string
  summary?: string
  category?: string
  sourceType?: string
}): RegulatoryRiskResult {
  const text = `${record.title || ''} ${record.summary || ''}`.toLowerCase()

  let level: RegulatoryRiskResult['level'] = 'low'
  let reason = 'Standart düzenleyici kayıt. Rutin uyum takibi yeterli.'
  let affectedAreas: string[] = ['Genel Uyum']

  const hasHigh = HIGH_RISK_KEYWORDS.some((kw) => text.includes(kw))
  const hasMedium = MEDIUM_RISK_KEYWORDS.some((kw) => text.includes(kw))

  if (hasHigh) {
    level = 'high'
    reason = 'Yüksek etki anahtar kelimeleri içeriyor (sermaye, yaptırım, iptal, tedbir). Derhal uyum incelemesi önerilir.'
  } else if (hasMedium) {
    level = 'medium'
    reason = 'Orta etki anahtar kelimeleri içeriyor (kredi, limit, risk, teminat). Operasyonel etki değerlendirmesi önerilir.'
  }

  // Detect affected areas
  for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      if (!affectedAreas.includes(area)) affectedAreas.push(area)
    }
  }

  // SPK-specific: If it's a board decision (kurul kararı) default to at least medium
  if (
    (record.sourceType === 'bddk-decision' ||
      record.category?.toLowerCase().includes('karar') ||
      record.title?.toLowerCase().includes('kurul kararı')) &&
    level === 'low'
  ) {
    level = 'medium'
    reason = 'Kurul kararı niteliğinde. Resmi düzenleyici karar olduğundan uyum etki değerlendirmesi önerilir.'
  }

  const labelMap: Record<RegulatoryRiskResult['level'], RegulatoryRiskResult['label']> = {
    low: 'Düşük',
    medium: 'Orta',
    high: 'Yüksek',
    critical: 'Kritik',
  }

  return { level, label: labelMap[level], reason, affectedAreas }
}

export function getRiskBadgeClass(level: RegulatoryRiskResult['level']) {
  switch (level) {
    case 'critical':
      return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'high':
      return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'medium':
      return 'bg-amber-50 text-amber-700 border-amber-200/60'
    default:
      return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}
