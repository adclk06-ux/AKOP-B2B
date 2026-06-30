export type ReconciliationType = 'Pozisyon' | 'Nakit' | 'Saklama' | 'İşlem' | 'T+1/T+2'

export type ReconciliationStatus =
  | 'Açık'
  | 'İncelemede'
  | 'Düzeltme Bekliyor'
  | 'Onay Bekliyor'
  | 'Kapandı'

export type ReconciliationRisk = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'

export interface ReconciliationRecord {
  id: string
  type: ReconciliationType
  status: ReconciliationStatus
  risk: ReconciliationRisk
  customer?: string
  account?: string
  isin?: string
  securityName?: string
  mkkValue: number | string
  institutionValue: number | string
  difference: number
  currency: string
  responsible: string
  createdAt: string
  slaDate?: string
  notes?: string
  relatedRegulationId?: string
  isDemo: true
}

const today = new Date().toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]

export const demoReconciliations: ReconciliationRecord[] = [
  {
    id: 'mkk-001',
    type: 'Pozisyon',
    status: 'Açık',
    risk: 'Kritik',
    customer: 'Müşteri A.Ş.',
    account: 'TR-12345678',
    isin: 'TRAAAAAA1234',
    securityName: 'ABC Holding',
    mkkValue: 15000,
    institutionValue: 14800,
    difference: 200,
    currency: 'TRY',
    responsible: 'Ahmet Yılmaz',
    createdAt: today,
    slaDate: today,
    notes: 'ISIN bazlı pozisyon farkı. Kurum içi kayıtlarda 200 adet eksik görünüyor.',
    isDemo: true,
  },
  {
    id: 'mkk-002',
    type: 'Nakit',
    status: 'İncelemede',
    risk: 'Yüksek',
    customer: 'Bireysel Müşteri 42',
    account: 'TR-87654321',
    mkkValue: 2450000,
    institutionValue: 2449500,
    difference: 500,
    currency: 'TRY',
    responsible: 'Selin Kaya',
    createdAt: yesterday,
    slaDate: today,
    notes: 'Nakit bakiye farkı. Valör T+1 işlemi sonrası oluşmuş olabilir.',
    isDemo: true,
  },
  {
    id: 'mkk-003',
    type: 'Saklama',
    status: 'Düzeltme Bekliyor',
    risk: 'Orta',
    customer: 'Yatırım Fonu X',
    account: 'TR-11223344',
    isin: 'TRBBBBBB5678',
    securityName: 'XYZ GMYO',
    mkkValue: 8500,
    institutionValue: 8500,
    difference: 0,
    currency: 'ADET',
    responsible: 'Mehmet Demir',
    createdAt: twoDaysAgo,
    slaDate: yesterday,
    notes: 'Saklama adedi eşleşiyor ancak kıymet fiyatı farklı. Fiyat güncellemesi bekleniyor.',
    isDemo: true,
  },
  {
    id: 'mkk-004',
    type: 'İşlem',
    status: 'Onay Bekliyor',
    risk: 'Düşük',
    customer: 'Kurumsal B',
    account: 'TR-99887766',
    isin: 'TRCCCCCC9012',
    securityName: 'DEF Bank',
    mkkValue: 120,
    institutionValue: 120,
    difference: 0,
    currency: 'LOT',
    responsible: 'Zeynep Şahin',
    createdAt: today,
    notes: 'İşlem kayıtları eşleşiyor. Takas sonrası kontrol onayı bekleniyor.',
    isDemo: true,
  },
  {
    id: 'mkk-005',
    type: 'T+1/T+2',
    status: 'Açık',
    risk: 'Kritik',
    customer: 'Portföy Yönetimi C',
    account: 'TR-55443322',
    isin: 'TRDDDDDD3456',
    securityName: 'GHI Enerji',
    mkkValue: 0,
    institutionValue: 5000,
    difference: 5000,
    currency: 'TRY',
    responsible: 'Can Özdemir',
    createdAt: twoDaysAgo,
    slaDate: yesterday,
    notes: 'T+2 settlement gecikmesi. MKK tarafında settlement tamamlanmamış görünüyor.',
    isDemo: true,
  },
  {
    id: 'mkk-006',
    type: 'Pozisyon',
    status: 'Kapandı',
    risk: 'Düşük',
    customer: 'Müşteri D.Ş.',
    account: 'TR-66778899',
    isin: 'TREEEEEE7890',
    securityName: 'JKL Telekom',
    mkkValue: 3000,
    institutionValue: 3000,
    difference: 0,
    currency: 'ADET',
    responsible: 'Ahmet Yılmaz',
    createdAt: twoDaysAgo,
    notes: 'Müşteri hesap eşleşme hatası düzeltildi. Pozisyonlar eşleşti.',
    isDemo: true,
  },
  {
    id: 'mkk-007',
    type: 'Nakit',
    status: 'Açık',
    risk: 'Orta',
    customer: 'Yabancı Yatırımcı E',
    account: 'TR-22334455',
    mkkValue: 150000,
    institutionValue: 149500,
    difference: 500,
    currency: 'USD',
    responsible: 'Selin Kaya',
    createdAt: today,
    slaDate: today,
    notes: 'Döviz nakit farkı. Kur farkından kaynaklanıyor olabilir.',
    isDemo: true,
  },
  {
    id: 'mkk-008',
    type: 'Saklama',
    status: 'İncelemede',
    risk: 'Yüksek',
    customer: 'Emeklilik Fonu F',
    account: 'TR-33445566',
    isin: 'TRFFFFFF1111',
    securityName: 'KLM Sağlık',
    mkkValue: 25000,
    institutionValue: 24900,
    difference: 100,
    currency: 'ADET',
    responsible: 'Mehmet Demir',
    createdAt: yesterday,
    slaDate: today,
    notes: 'Saklama adedi farkı. Bölünme/birleşme işlemi sonrası oluşmuş olabilir.',
    isDemo: true,
  },
]

export function getReconciliationStats(records: ReconciliationRecord[]) {
  const total = records.length
  const successful = records.filter((r) => r.status === 'Kapandı').length
  const discrepancy = records.filter((r) => r.difference !== 0).length
  const critical = records.filter((r) => r.risk === 'Kritik').length
  const pendingReview = records.filter((r) => r.status === 'Açık' || r.status === 'İncelemede').length
  const slaBreach = records.filter((r) => {
    if (!r.slaDate || r.status === 'Kapandı') return false
    return new Date(r.slaDate) < new Date()
  }).length
  return { total, successful, discrepancy, critical, pendingReview, slaBreach }
}

export function getRiskBadgeClass(risk: ReconciliationRisk) {
  switch (risk) {
    case 'Kritik': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'Yüksek': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'Orta': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Düşük': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}

export function getStatusBadgeClass(status: ReconciliationStatus) {
  switch (status) {
    case 'Kapandı': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'Onay Bekliyor': return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'Düzeltme Bekliyor': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'İncelemede': return 'bg-violet-50 text-violet-700 border-violet-200/60'
    case 'Açık': return 'bg-rose-50 text-rose-700 border-rose-200/60'
  }
}
