export type OperationArea =
  | 'MKK Mutabakat'
  | 'Takasbank İşlemleri'
  | 'Müşteri Onboarding'
  | 'KYC / AML'
  | 'Emir ve İşlem Gözetimi'
  | 'Raporlama'
  | 'Risk Yönetimi'
  | 'Sermaye Yeterliliği'
  | 'Veri Gizliliği / KVKK'
  | 'İç Kontrol'

export interface OperationalImpact {
  areas: OperationArea[]
  primary: OperationArea | null
}

const AREA_KEYWORDS: Record<OperationArea, string[]> = {
  'MKK Mutabakat': ['mkk', 'merkezi kayıt', 'mutabakat', 'pay sahipliği', 'takas'],
  'Takasbank İşlemleri': ['takasbank', 'takas', 'menkul kıymet', 'ödeme', 'netleştirme'],
  'Müşteri Onboarding': ['müşteri', 'hesap açma', 'tüzel kişi', 'bireysel', 'profil', 'onboarding'],
  'KYC / AML': ['aml', 'kyc', 'şüpheli işlem', 'uyum', 'müşteri tanıma', 'maa', 'supt'],
  'Emir ve İşlem Gözetimi': ['emir', 'işlem gözetimi', 'piyasa gözetimi', 'manipülasyon', 'insider'],
  'Raporlama': ['rapor', 'bildirim', 'finansal tablo', 'mali tablo', 'yıllık rapor', 'açıklama'],
  'Risk Yönetimi': ['risk', 'kredi riski', 'piyasa riski', 'operasyonel risk', 'likidite', 'karşı taraf'],
  'Sermaye Yeterliliği': ['sermaye', 'yeterlilik', 'tier 1', 'tier 2', 'core capital', 'asgari sermaye'],
  'Veri Gizliliği / KVKK': ['kvkk', 'gdpr', 'veri gizliliği', 'kişisel veri', 'mahremiyet', 'veri güvenliği'],
  'İç Kontrol': ['iç kontrol', 'denetim', 'yönetim kurulu', 'komite', 'risk komitesi', 'yönetmelik'],
}

export function calculateOperationalImpact(record: {
  title?: string
  summary?: string
  authority?: string
  sourceType?: string
  category?: string
}): OperationalImpact {
  const text = `${record.title || ''} ${record.summary || ''}`.toLowerCase()
  const areas: OperationArea[] = []

  // Keyword-based detection
  for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
    if (keywords.some((kw) => text.includes(kw))) {
      if (!areas.includes(area as OperationArea)) areas.push(area as OperationArea)
    }
  }

  // Authority-based defaults
  const authority = (record.authority || '').toUpperCase()
  const isSpk = authority === 'SPK' || !authority
  const isBddk = authority === 'BDDK'

  if (isSpk && (record.sourceType === 'bulletin' || record.sourceType === 'legislation' || record.category?.toLowerCase().includes('tebliğ'))) {
    if (!areas.includes('MKK Mutabakat')) areas.push('MKK Mutabakat')
    if (!areas.includes('Raporlama')) areas.push('Raporlama')
    if (!areas.includes('İç Kontrol')) areas.push('İç Kontrol')
  }

  if (isBddk) {
    if (text.includes('kredi') || text.includes('kart') || text.includes('limit')) {
      if (!areas.includes('Risk Yönetimi')) areas.push('Risk Yönetimi')
      if (!areas.includes('Müşteri Onboarding')) areas.push('Müşteri Onboarding')
    }
    if (text.includes('sermaye') || text.includes('risk') || text.includes('yeterlilik')) {
      if (!areas.includes('Sermaye Yeterliliği')) areas.push('Sermaye Yeterliliği')
      if (!areas.includes('Risk Yönetimi')) areas.push('Risk Yönetimi')
    }
    if (!areas.includes('İç Kontrol')) areas.push('İç Kontrol')
  }

  if (authority === 'MASAK') {
    if (!areas.includes('KYC / AML')) areas.push('KYC / AML')
    if (!areas.includes('Müşteri Onboarding')) areas.push('Müşteri Onboarding')
  }

  // KVKK / GDPR detection
  if (text.includes('kvkk') || text.includes('gdpr') || text.includes('kişisel veri') || text.includes('veri gizliliği')) {
    if (!areas.includes('Veri Gizliliği / KVKK')) areas.push('Veri Gizliliği / KVKK')
  }

  // Default fallback for any record with no detected areas
  if (areas.length === 0) {
    if (isSpk) areas.push('İç Kontrol')
    else if (isBddk) areas.push('Risk Yönetimi')
    else areas.push('İç Kontrol')
  }

  return { areas, primary: areas[0] || null }
}

export function getAreaImpactLevel(count: number): 'low' | 'medium' | 'high' {
  if (count >= 20) return 'high'
  if (count >= 5) return 'medium'
  return 'low'
}

export function getAreaImpactBadgeClass(level: 'low' | 'medium' | 'high') {
  switch (level) {
    case 'high': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    default: return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}

export function getAreaIcon(area: OperationArea): string {
  const map: Record<OperationArea, string> = {
    'MKK Mutabakat': 'Database',
    'Takasbank İşlemleri': 'Landmark',
    'Müşteri Onboarding': 'Users',
    'KYC / AML': 'ShieldAlert',
    'Emir ve İşlem Gözetimi': 'Eye',
    'Raporlama': 'FileText',
    'Risk Yönetimi': 'AlertTriangle',
    'Sermaye Yeterliliği': 'Scale',
    'Veri Gizliliği / KVKK': 'Lock',
    'İç Kontrol': 'ClipboardList',
  }
  return map[area] || 'Circle'
}
