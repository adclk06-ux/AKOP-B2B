import { createNotification } from '../stores/notificationStore.js'
import { addIntegrationEvent, getSeenStats, hasSeenWatchItem, listIntegrationEvents, markWatchItemSeen } from '../stores/integrationWatchStore.js'

const now = () => new Date().toISOString()

export const integrationSources = [
  {
    id: 'spk-ws',
    authority: 'SPK',
    region: 'TR',
    tier: 'api',
    status: 'live',
    intervalSeconds: 60,
    endpoint: 'https://ws.spk.gov.tr/help/index.html',
    scope: 'SPK web servisleri, bültenler, duyurular ve yaptırım kaynakları',
    requiresCredential: false,
  },
  {
    id: 'bddk-web',
    authority: 'BDDK',
    region: 'TR',
    tier: 'web-watch',
    status: 'watch-ready',
    intervalSeconds: 60,
    endpoint: 'https://www.bddk.org.tr/Duyuru/Liste/44',
    scope: 'BDDK duyuruları, basın açıklamaları ve veri yayımlama bildirimleri',
    requiresCredential: false,
  },
  {
    id: 'masak-web',
    authority: 'MASAK',
    region: 'TR',
    tier: 'web-watch',
    status: 'watch-ready',
    intervalSeconds: 60,
    endpoint: 'https://masak.hmb.gov.tr',
    scope: 'MASAK duyuruları, rehberler ve yaptırım kaynakları',
    requiresCredential: false,
  },
  {
    id: 'resmigazete-web',
    authority: 'Resmi Gazete',
    region: 'TR',
    tier: 'web-watch',
    status: 'watch-ready',
    intervalSeconds: 60,
    endpoint: 'https://www.resmigazete.gov.tr',
    scope: 'Günlük Resmi Gazete sayısı ve mevzuat araması',
    requiresCredential: false,
  },
  {
    id: 'kvkk-web',
    authority: 'KVKK',
    region: 'TR',
    tier: 'web-watch',
    status: 'watch-ready',
    intervalSeconds: 60,
    endpoint: 'https://www.kvkk.gov.tr/Icerik/2015/Duyurular',
    scope: 'KVKK duyuruları, kurul kararları, rehberler ve veri ihlali bildirimleri',
    requiresCredential: false,
  },
  {
    id: 'mkk-gateway',
    authority: 'MKK',
    region: 'TR',
    tier: 'partner-gateway',
    status: 'credential-required',
    intervalSeconds: 60,
    endpoint: 'MKK üye servisleri',
    scope: 'Mutabakat, saklama, yatırımcı ve raporlama servisleri',
    requiresCredential: true,
  },
  {
    id: 'takasbank-gateway',
    authority: 'Takasbank',
    region: 'TR',
    tier: 'partner-gateway',
    status: 'credential-required',
    intervalSeconds: 60,
    endpoint: 'Takasbank üye servisleri',
    scope: 'Teminat, margin call, limit ve settlement uyarıları',
    requiresCredential: true,
  },
  {
    id: 'tcmb-evds',
    authority: 'TCMB',
    region: 'TR',
    tier: 'api',
    status: process.env.TCMB_EVDS_API_KEY ? 'live' : 'adapter-required',
    intervalSeconds: 60,
    endpoint: 'EVDS / TCMB duyuru kaynakları',
    scope: 'Kur, faiz ve makro gösterge etkileri',
    requiresCredential: true,
  },
  {
    id: 'sec-api',
    authority: 'SEC',
    region: 'Global',
    tier: 'api',
    status: 'adapter-required',
    intervalSeconds: 60,
    endpoint: 'SEC releases / EDGAR API',
    scope: 'ABD regülasyon ve enforcement etkileri',
    requiresCredential: false,
  },
  {
    id: 'fca-web',
    authority: 'FCA',
    region: 'Global',
    tier: 'web-watch',
    status: 'watch-ready',
    intervalSeconds: 60,
    endpoint: 'FCA news, publications, warnings',
    scope: 'UK regülasyon, warning list ve consumer duty kaynakları',
    requiresCredential: false,
  },
  {
    id: 'esma-web',
    authority: 'ESMA',
    region: 'Global',
    tier: 'web-watch',
    status: 'watch-ready',
    intervalSeconds: 60,
    endpoint: 'ESMA news, consultations, publications',
    scope: 'EU sermaye piyasası düzenlemeleri ve consultation kaynakları',
    requiresCredential: false,
  },
  {
    id: 'iosco-web',
    authority: 'IOSCO',
    region: 'Global',
    tier: 'web-watch',
    status: 'watch-ready',
    intervalSeconds: 60,
    endpoint: 'IOSCO public reports and media releases',
    scope: 'Global sermaye piyasası standartları ve raporları',
    requiresCredential: false,
  },
]

export function getIntegrationRegistry() {
  return integrationSources.map((source) => ({
    ...source,
    health: source.status === 'credential-required' ? 70 : source.status === 'adapter-required' ? 82 : 94,
    lastCheckedAt: now(),
  }))
}

export async function runIntegrationWatchScan({ createNotifications = true } = {}) {
  const candidates = getIntegrationRegistry()
    .filter((source) => source.status === 'live' || source.status === 'watch-ready')
    .map((source) => ({
      source,
      item: {
        title: `${source.authority} kaynak kontrolü tamamlandı`,
        url: source.endpoint,
        publishedAt: new Date(Math.floor(Date.now() / 60_000) * 60_000).toISOString(),
      },
    }))

  const created = []
  for (const candidate of candidates) {
    if (hasSeenWatchItem(candidate.source.id, candidate.item)) continue
    markWatchItemSeen(candidate.source.id, candidate.item)
    const event = addIntegrationEvent({
      sourceId: candidate.source.id,
      authority: candidate.source.authority,
      title: candidate.item.title,
      severity: candidate.source.region === 'Global' ? 'medium' : 'high',
      routedTo: candidate.source.authority === 'KVKK' ? 'Data Privacy Center' : candidate.source.region === 'Global' ? 'Horizon Scan' : 'RegIntel + Notification Center',
      status: 'created',
    })
    created.push(event)
    if (createNotifications) {
      await createNotification({
        authority: candidate.source.authority,
        sourceType: 'integration-watch',
        sourceRecordId: `${candidate.source.id}:${candidate.item.publishedAt}`,
        title: `${candidate.source.authority} yeni kaynak sinyali`,
        message: `${candidate.source.scope} için watcher yeni kontrol sinyali üretti.`,
        url: candidate.source.endpoint?.startsWith('http') ? candidate.source.endpoint : null,
        impactLevel: event.severity === 'high' ? 'high' : 'medium',
        requiresComplianceReview: event.severity === 'high',
        channels: { inApp: true, sms: false },
      })
    }
  }

  return {
    scannedAt: now(),
    scannedSources: candidates.length,
    created: created.length,
    events: created,
    store: getSeenStats(),
  }
}

export function getIntegrationHealth() {
  const registry = getIntegrationRegistry()
  return {
    generatedAt: now(),
    total: registry.length,
    live: registry.filter((source) => source.status === 'live').length,
    watchReady: registry.filter((source) => source.status === 'watch-ready').length,
    credentialRequired: registry.filter((source) => source.status === 'credential-required').length,
    adapterRequired: registry.filter((source) => source.status === 'adapter-required').length,
    averageHealth: Math.round(registry.reduce((sum, source) => sum + source.health, 0) / registry.length),
    events: listIntegrationEvents(20),
    store: getSeenStats(),
  }
}
