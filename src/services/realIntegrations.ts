export type IntegrationStatus = 'live' | 'watch-ready' | 'credential-required' | 'adapter-required'
export type IntegrationTier = 'api' | 'rss' | 'web-watch' | 'partner-gateway'
export type IntegrationRegion = 'TR' | 'Global'

export interface RealIntegrationSource {
  id: string
  authority: string
  region: IntegrationRegion
  tier: IntegrationTier
  status: IntegrationStatus
  endpointLabel: string
  watchIntervalSeconds: number
  lastCheckedAt: string
  health: number
  owner: string
  scope: string
  nextStep: string
}

export interface IntegrationEvent {
  id: string
  authority: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  detectedAt: string
  routedTo: string
  notification: 'created' | 'queued' | 'sent'
}

const now = Date.now()

export const realIntegrationSources: RealIntegrationSource[] = [
  {
    id: 'src-spk-ws',
    authority: 'SPK',
    region: 'TR',
    tier: 'api',
    status: 'live',
    endpointLabel: 'SPK Web Servisleri + Bülten Watcher',
    watchIntervalSeconds: 60,
    lastCheckedAt: new Date(now - 46_000).toISOString(),
    health: 96,
    owner: 'RegIntel',
    scope: 'Bültenler, idari yaptırım, tedbir, faaliyet izinleri',
    nextStep: 'Production ortamda IP/timeout metriklerini gözlemle.',
  },
  {
    id: 'src-bddk-web',
    authority: 'BDDK',
    region: 'TR',
    tier: 'web-watch',
    status: 'watch-ready',
    endpointLabel: 'Duyurular ve basın duyuruları',
    watchIntervalSeconds: 60,
    lastCheckedAt: new Date(now - 58_000).toISOString(),
    health: 91,
    owner: 'Data Hub',
    scope: 'Duyuru listesi, basın açıklaması, veri yayımlama bildirimleri',
    nextStep: 'HTML değişimlerinde selector health alarmı üret.',
  },
  {
    id: 'src-masak-web',
    authority: 'MASAK',
    region: 'TR',
    tier: 'web-watch',
    status: 'watch-ready',
    endpointLabel: 'Duyurular, rehberler, yaptırım listesi',
    watchIntervalSeconds: 60,
    lastCheckedAt: new Date(now - 52_000).toISOString(),
    health: 88,
    owner: 'AML',
    scope: 'AML rehberleri, şüpheli işlem ve yaptırım kaynakları',
    nextStep: 'Yaptırım listesi formatı için dosya parser ekle.',
  },
  {
    id: 'src-resmigazete',
    authority: 'Resmi Gazete',
    region: 'TR',
    tier: 'web-watch',
    status: 'watch-ready',
    endpointLabel: 'Günlük sayı ve mevzuat araması',
    watchIntervalSeconds: 60,
    lastCheckedAt: new Date(now - 61_000).toISOString(),
    health: 90,
    owner: 'RegIntel',
    scope: 'Kanun, yönetmelik, tebliğ, karar ve yürürlük tarihleri',
    nextStep: 'Anahtar kelime profillerini kurum bazlı genişlet.',
  },
  {
    id: 'src-kvkk',
    authority: 'KVKK',
    region: 'TR',
    tier: 'web-watch',
    status: 'watch-ready',
    endpointLabel: 'Duyurular ve kurul kararları',
    watchIntervalSeconds: 60,
    lastCheckedAt: new Date(now - 49_000).toISOString(),
    health: 93,
    owner: 'Data Privacy',
    scope: 'Veri ihlali, rehber, karar ve kamuoyu duyuruları',
    nextStep: 'İhlal duyurularını Data Privacy Center kayıtlarına bağla.',
  },
  {
    id: 'src-mkk',
    authority: 'MKK',
    region: 'TR',
    tier: 'partner-gateway',
    status: 'credential-required',
    endpointLabel: 'Üye servisleri / veri sağlayıcı entegrasyonu',
    watchIntervalSeconds: 60,
    lastCheckedAt: new Date(now - 70_000).toISOString(),
    health: 72,
    owner: 'Operasyon',
    scope: 'Mutabakat, saklama, yatırımcı ve raporlama servisleri',
    nextStep: 'MKK kurum credential ve IP izinleri tanımlanmalı.',
  },
  {
    id: 'src-takasbank',
    authority: 'Takasbank',
    region: 'TR',
    tier: 'partner-gateway',
    status: 'credential-required',
    endpointLabel: 'Üye servisleri / teminat ve settlement akışı',
    watchIntervalSeconds: 60,
    lastCheckedAt: new Date(now - 74_000).toISOString(),
    health: 70,
    owner: 'Operasyon',
    scope: 'Teminat, margin call, limit ve settlement uyarıları',
    nextStep: 'Takasbank servis sözleşmesi ve test credential gerekli.',
  },
  {
    id: 'src-tcmb',
    authority: 'TCMB',
    region: 'TR',
    tier: 'api',
    status: 'adapter-required',
    endpointLabel: 'EVDS / duyuru kaynakları',
    watchIntervalSeconds: 60,
    lastCheckedAt: new Date(now - 84_000).toISOString(),
    health: 81,
    owner: 'Risk',
    scope: 'Piyasa verisi, faiz, kur ve makro gösterge izleme',
    nextStep: 'EVDS anahtarı girildiğinde adapter live moda geçer.',
  },
  {
    id: 'src-sec',
    authority: 'SEC',
    region: 'Global',
    tier: 'api',
    status: 'adapter-required',
    endpointLabel: 'SEC releases / EDGAR API',
    watchIntervalSeconds: 60,
    lastCheckedAt: new Date(now - 67_000).toISOString(),
    health: 86,
    owner: 'Global Compliance',
    scope: 'SEC duyuruları, enforcement ve disclosure etkileri',
    nextStep: 'Global entity watchlist ile eşleştir.',
  },
  {
    id: 'src-fca',
    authority: 'FCA',
    region: 'Global',
    tier: 'web-watch',
    status: 'watch-ready',
    endpointLabel: 'News, publications, warnings',
    watchIntervalSeconds: 60,
    lastCheckedAt: new Date(now - 55_000).toISOString(),
    health: 89,
    owner: 'Global Compliance',
    scope: 'UK regülasyon, consumer duty ve warning list',
    nextStep: 'Warning list sinyallerini adverse media ile birleştir.',
  },
  {
    id: 'src-esma',
    authority: 'ESMA',
    region: 'Global',
    tier: 'web-watch',
    status: 'watch-ready',
    endpointLabel: 'News, consultations, publications',
    watchIntervalSeconds: 60,
    lastCheckedAt: new Date(now - 59_000).toISOString(),
    health: 87,
    owner: 'Global Compliance',
    scope: 'EU sermaye piyasası, MiFID/MiCA ve consultation paper takibi',
    nextStep: 'Horizon Scanning taslak düzenleme akışına bağla.',
  },
  {
    id: 'src-iosco',
    authority: 'IOSCO',
    region: 'Global',
    tier: 'web-watch',
    status: 'watch-ready',
    endpointLabel: 'Public reports and media releases',
    watchIntervalSeconds: 60,
    lastCheckedAt: new Date(now - 63_000).toISOString(),
    health: 84,
    owner: 'Global Compliance',
    scope: 'Uluslararası sermaye piyasası standartları ve raporları',
    nextStep: 'Board report özetlerine global benchmark notu ekle.',
  },
]

export const integrationEvents: IntegrationEvent[] = [
  {
    id: 'evt-001',
    authority: 'SPK',
    title: 'Yeni bülten kaydı dedupe edildi ve Bildirim Merkezi’ne yönlendirildi',
    severity: 'high',
    detectedAt: new Date(now - 4 * 60_000).toISOString(),
    routedTo: 'RegIntel + Notification Center',
    notification: 'created',
  },
  {
    id: 'evt-002',
    authority: 'KVKK',
    title: 'Duyuru sayfasında checksum değişimi yakalandı',
    severity: 'medium',
    detectedAt: new Date(now - 11 * 60_000).toISOString(),
    routedTo: 'Data Privacy Center',
    notification: 'queued',
  },
  {
    id: 'evt-003',
    authority: 'ESMA',
    title: 'Yeni consultation sinyali Horizon Scan’e aday kayıt olarak düştü',
    severity: 'medium',
    detectedAt: new Date(now - 18 * 60_000).toISOString(),
    routedTo: 'Horizon Scan',
    notification: 'created',
  },
]

export function getIntegrationStatusClass(status: IntegrationStatus) {
  switch (status) {
    case 'live': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'watch-ready': return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'credential-required': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'adapter-required': return 'bg-violet-50 text-violet-700 border-violet-200/60'
  }
}

export function getEventSeverityClass(severity: IntegrationEvent['severity']) {
  switch (severity) {
    case 'critical': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'high': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'medium': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'low': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}
