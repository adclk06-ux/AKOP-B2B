export type TakasbankAlertType = 'Teminat Açığı' | 'Margin Çağrısı' | 'Limit Aşımı' | 'Takas Başarısızlığı' | 'Settlement Gecikmesi' | 'Nakit Blokaj'

export type TakasbankAlertStatus = 'Açık' | 'İncelemede' | 'Aksiyon Bekliyor' | 'Onay Bekliyor' | 'Kapandı'

export type TakasbankAlertRisk = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'

export interface TakasbankAlert {
  id: string
  type: TakasbankAlertType
  status: TakasbankAlertStatus
  risk: TakasbankAlertRisk
  account?: string
  member?: string
  isin?: string
  securityName?: string
  amount: number
  currency: string
  responsible: string
  createdAt: string
  slaDate?: string
  notes?: string
  possibleCause?: string
  recommendedAction?: string
  relatedReconciliationId?: string
  isDemo: true
}

const today = new Date().toISOString().split('T')[0]
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0]

export const demoTakasbankAlerts: TakasbankAlert[] = [
  {
    id: 'tak-001',
    type: 'Teminat Açığı',
    status: 'Açık',
    risk: 'Kritik',
    account: 'TR-99887766',
    member: 'Aracı Kurum A.Ş.',
    amount: 4500000,
    currency: 'TRY',
    responsible: 'Can Özdemir',
    createdAt: today,
    slaDate: today,
    notes: 'Teminat açığı oluştu. Müşteri tarafından ek teminat yatırılması bekleniyor.',
    possibleCause: 'Piyasa hareketliliği sonrası teminat değeri düştü.',
    recommendedAction: 'Müşteriye margin call gönder, ek teminat talep et.',
    isDemo: true,
  },
  {
    id: 'tak-002',
    type: 'Margin Çağrısı',
    status: 'Aksiyon Bekliyor',
    risk: 'Yüksek',
    account: 'TR-22334455',
    member: 'Portföy Yönetimi B',
    amount: 1200000,
    currency: 'TRY',
    responsible: 'Ahmet Yılmaz',
    createdAt: yesterday,
    slaDate: today,
    notes: 'Margin çağrısı gönderildi. Müşteri yanıt vermedi.',
    possibleCause: 'Kaldıraçlı pozisyonlar marjinal düzeyde.',
    recommendedAction: 'Müşteri ile iletişime geç, pozisyon kapatma riskini bildir.',
    isDemo: true,
  },
  {
    id: 'tak-003',
    type: 'Limit Aşımı',
    status: 'İncelemede',
    risk: 'Orta',
    account: 'TR-66778899',
    member: 'Yatırım Fonu C',
    amount: 92000000,
    currency: 'TRY',
    responsible: 'Selin Kaya',
    createdAt: twoDaysAgo,
    slaDate: yesterday,
    notes: 'Limit kullanım oranı %92. Risk limit yaklaşımı.',
    possibleCause: 'Artan işlem hacmi nedeniyle limit yaklaşımı.',
    recommendedAction: 'Limit artırımı talebi değerlendir veya işlem kısıtlaması uygula.',
    isDemo: true,
  },
  {
    id: 'tak-004',
    type: 'Takas Başarısızlığı',
    status: 'Onay Bekliyor',
    risk: 'Yüksek',
    account: 'TR-44556677',
    member: 'Kurumsal D',
    isin: 'TRAAAAAA1234',
    securityName: 'ABC Holding',
    amount: 5000,
    currency: 'ADET',
    responsible: 'Mehmet Demir',
    createdAt: today,
    slaDate: today,
    notes: 'Takas işlemi başarısız. Kıymet transferinde teknik hata.',
    possibleCause: 'MKK ve Takasbank arasındaki iletişim kesintisi.',
    recommendedAction: 'Takasbank ile iletişime geç, işlemi manuel olarak kontrol et.',
    relatedReconciliationId: 'mkk-001',
    isDemo: true,
  },
  {
    id: 'tak-005',
    type: 'Settlement Gecikmesi',
    status: 'Açık',
    risk: 'Kritik',
    account: 'TR-11223344',
    member: 'Emeklilik Fonu E',
    isin: 'TRDDDDDD3456',
    securityName: 'GHI Enerji',
    amount: 3500000,
    currency: 'TRY',
    responsible: 'Zeynep Şahin',
    createdAt: twoDaysAgo,
    slaDate: yesterday,
    notes: 'T+2 settlement gecikmesi. Ödeme henüz gerçekleşmedi.',
    possibleCause: 'Nakit transferinde banka gecikmesi.',
    recommendedAction: 'Takasbank settlement ekibine bildir, nakit transferini hızlandır.',
    relatedReconciliationId: 'mkk-005',
    isDemo: true,
  },
  {
    id: 'tak-006',
    type: 'Nakit Blokaj',
    status: 'Kapandı',
    risk: 'Düşük',
    account: 'TR-33445566',
    member: 'Bireysel Müşteri F',
    amount: 150000,
    currency: 'TRY',
    responsible: 'Can Özdemir',
    createdAt: twoDaysAgo,
    notes: 'Nakit blokaj kaldırıldı. Müşteri teminat yatırdı.',
    isDemo: true,
  },
  {
    id: 'tak-007',
    type: 'Teminat Açığı',
    status: 'Açık',
    risk: 'Orta',
    account: 'TR-55667788',
    member: 'Aracı Kurum G',
    amount: 800000,
    currency: 'USD',
    responsible: 'Ahmet Yılmaz',
    createdAt: today,
    slaDate: today,
    notes: 'Döviz teminat açığı. Kur hareketliliği sonrası oluştu.',
    possibleCause: 'USD/TRY kurundaki ani yükseliş.',
    recommendedAction: 'Döviz teminat tamamlanması için müşteri bilgilendirme.',
    isDemo: true,
  },
  {
    id: 'tak-008',
    type: 'Limit Aşımı',
    status: 'Açık',
    risk: 'Kritik',
    account: 'TR-77889900',
    member: 'Portföy Yönetimi H',
    amount: 145000000,
    currency: 'TRY',
    responsible: 'Selin Kaya',
    createdAt: yesterday,
    slaDate: today,
    notes: 'Limit kullanım oranı %98. Acil limit artırımı gerekiyor.',
    possibleCause: 'Yoğun emir akışı nedeniyle limit aşımı.',
    recommendedAction: 'Limit artırımı talebi yönetime sunuldu. Onay bekleniyor.',
    isDemo: true,
  },
]

export function getTakasbankStats(alerts: TakasbankAlert[]) {
  const total = alerts.length
  const successful = alerts.filter((a) => a.status === 'Kapandı').length
  const failed = alerts.filter((a) => a.type === 'Takas Başarısızlığı').length
  const marginCalls = alerts.filter((a) => a.type === 'Margin Çağrısı' && a.status !== 'Kapandı').length
  const limitBreach = alerts.filter((a) => a.type === 'Limit Aşımı' && a.status !== 'Kapandı').length
  const critical = alerts.filter((a) => a.risk === 'Kritik' && a.status !== 'Kapandı').length
  const slaBreach = alerts.filter((a) => {
    if (!a.slaDate || a.status === 'Kapandı') return false
    return new Date(a.slaDate) < new Date()
  }).length
  return { total, successful, failed, marginCalls, limitBreach, critical, slaBreach }
}

export function getTakasbankRiskBadgeClass(risk: TakasbankAlertRisk) {
  switch (risk) {
    case 'Kritik': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'Yüksek': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'Orta': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Düşük': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}

export function getTakasbankStatusBadgeClass(status: TakasbankAlertStatus) {
  switch (status) {
    case 'Kapandı': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'Onay Bekliyor': return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'Aksiyon Bekliyor': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'İncelemede': return 'bg-violet-50 text-violet-700 border-violet-200/60'
    case 'Açık': return 'bg-rose-50 text-rose-700 border-rose-200/60'
  }
}
