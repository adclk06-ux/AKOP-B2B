import type { EnterpriseTone } from '@/components/enterprise/EnterprisePrimitives'

export type FuturePhaseKey =
  | 'multi-tenant'
  | 'billing'
  | 'white-label'
  | 'customer-portal'
  | 'api-gateway'
  | 'integration-marketplace'
  | 'advanced-analytics'
  | 'ai-agent'
  | 'autonomous-actions'
  | 'platform-one'

export interface FuturePhaseMetric {
  label: string
  value: string
  helper: string
  tone: EnterpriseTone
}

export interface FuturePhaseRecord {
  id: string
  title: string
  owner: string
  status: string
  risk: 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'
  dataObject: string
  nextAction: string
}

export interface FuturePhaseModule {
  key: FuturePhaseKey
  phase: string
  title: string
  subtitle: string
  route: string
  badge: string
  pattern: string
  metrics: FuturePhaseMetric[]
  kayıtlar: FuturePhaseRecord[]
  timeline: Array<{ id: string; title: string; description: string; time: string; tone: EnterpriseTone }>
  capabilities: Array<{ name: string; description: string; status: string; tone: EnterpriseTone; meta: string }>
  aiNotes: string[]
}

export interface FuturePhaseTool {
  name: string
  description: string
  status: string
  tone: EnterpriseTone
  meta: string
}

const sharedGovernanceTools: FuturePhaseTool[] = [
  { name: 'Denetim Trail', description: 'Her kritik işlem için kullanıcı, zaman, kaynak ve önce/sonra izini tutar.', status: 'Zorunlu', tone: 'danger', meta: 'Denetim izi' },
  { name: 'SLA Watcher', description: 'Gecikme, yaklaşan termin ve sahiplik boşluklarını otomatik işaretler.', status: 'Hazır', tone: 'success', meta: 'Süre kontrolü' },
  { name: 'Evidence Linker', description: 'Kayıtları kanıt kasası, hash ve onay süreciyle ilişkilendirir.', status: 'Hazır', tone: 'info', meta: 'Kanıt bağı' },
]

export const futurePhaseToolsets: Record<FuturePhaseKey, FuturePhaseTool[]> = {
  'multi-tenant': [
    { name: 'Tenant Resolver', description: 'Alan adı, kullanıcı oturumu ve API anahtarından doğru kurumu çözümler.', status: 'İskelet Hazır', tone: 'info', meta: 'Kurum çözümleme' },
    { name: 'Tenant Data Boundary', description: 'Sorgu ve indekslerde kurum_id olmadan veri dönmesini engeller.', status: 'Zorunlu', tone: 'danger', meta: 'Veri izolasyonu' },
    { name: 'Tenant Health Board', description: 'Her kurumun job, mail, entegrasyon ve hata oranını ayrı izler.', status: 'Planlandı', tone: 'warning', meta: 'Sağlık paneli' },
    ...sharedGovernanceTools,
  ],
  billing: [
    { name: 'Plan Entitlement Guard', description: 'Modül, kullanıcı, API ve entegrasyon limitlerini plana göre uygular.', status: 'İskelet Hazır', tone: 'info', meta: 'Paket yetkisi' },
    { name: 'Kullanım Ölçeri', description: 'Tarama, bildirim, mail, API çağrısı ve AI kullanımını ölçer.', status: 'Tasarlanmış', tone: 'warning', meta: 'Kullanım ölçümü' },
    { name: 'Dunning Monitor', description: 'Ödeme gecikmesi, abonelik askıya alma ve uyarı akışını takip eder.', status: 'Planlandı', tone: 'warning', meta: 'Tahsilat takibi' },
    ...sharedGovernanceTools,
  ],
  'white-label': [
    { name: 'Brand Token Editor', description: 'Kurum rengi, vurgu rengi ve koyu mod değerlerini değişken olarak yönetir.', status: 'Temel Hazır', tone: 'success', meta: 'Tema tokenı' },
    { name: 'Logo Asset Registry', description: 'Açık/koyu logo, favicon ve mail logosu varlıklarını saklar.', status: 'Planlandı', tone: 'warning', meta: 'Marka varlığı' },
    { name: 'Alan Adı Teması Resolver', description: 'app, docs ve www alan adlarına göre doğru kurum temasını uygular.', status: 'Haritalandı', tone: 'info', meta: 'Alan adı teması' },
    ...sharedGovernanceTools,
  ],
  'customer-portal': [
    { name: 'User Invite Console', description: 'Kurum yöneticisinin davet, rol ve pasifleştirme işlemlerini yönetir.', status: 'İskelet Hazır', tone: 'info', meta: 'Kullanıcı işlemi' },
    { name: 'Permission Matrix', description: 'Rol, kapsam ve modül yetkilerini tablo düzeninde gösterir.', status: 'Haritalandı', tone: 'success', meta: 'Yetki matrisi' },
    { name: 'Kendi Kendine Yönetim Request Queue', description: 'Domain, mail, kullanıcı limiti ve entegrasyon taleplerini kuyruğa alır.', status: 'Planlandı', tone: 'warning', meta: 'Talep kuyruğu' },
    ...sharedGovernanceTools,
  ],
  'api-gateway': [
    { name: 'Endpoint Catalog', description: 'Görev, yükümlülük, risk, kanıt ve bildirim API uçlarını listeler.', status: 'Tasarlanmış', tone: 'info', meta: 'API kataloğu' },
    { name: 'Scope Enforcer', description: 'API anahtarını kurum, rol, uç nokta ve veri sınıfı bazında sınırlar.', status: 'Zorunlu', tone: 'danger', meta: 'Erişim kapsamı' },
    { name: 'Çağrı Limiti Ledger', description: 'Kurum ve anahtar bazlı çağrı limitlerini ölçer ve ihlali bildirir.', status: 'Planlandı', tone: 'warning', meta: 'Limit defteri' },
    ...sharedGovernanceTools,
  ],
  'integration-marketplace': [
    { name: 'Bağlantı Sağlığı İzleme', description: 'Jira, Teams, Outlook, SAP ve ServiceNow bağlantı sağlığını izler.', status: 'Temel Hazır', tone: 'success', meta: 'Bağlantı sağlığı' },
    { name: 'Secret Rotation Planner', description: 'Webhook, OAuth ve API anahtarı yenileme tarihlerini takip eder.', status: 'Zorunlu', tone: 'danger', meta: 'Gizli anahtar' },
    { name: 'Flow Replay Queue', description: 'Başarısız veri akışlarını yeniden deneme kuyruğuna alır.', status: 'Planlandı', tone: 'warning', meta: 'Yeniden deneme' },
    ...sharedGovernanceTools,
  ],
  'advanced-analytics': [
    { name: 'Risk Isı Haritası Builder', description: 'Kurum, regülasyon, süreç ve kontrol bazlı risk haritası üretir.', status: 'Haritalandı', tone: 'success', meta: 'Risk ısı haritası' },
    { name: 'Trend Detaya İniş', description: 'Grafik altındaki ham veri satırlarını tabloyla açar.', status: 'Temel Hazır', tone: 'info', meta: 'Ham veri inişi' },
    { name: 'Anomaly Detector', description: 'SLA, işlem hacmi, kontrol başarısızlığı ve bildirim sapmalarını yakalar.', status: 'Pilot', tone: 'warning', meta: 'Sapma tespiti' },
    ...sharedGovernanceTools,
  ],
  'ai-agent': [
    { name: 'Kaynak Dayanağı Console', description: 'AI cevabında hangi kaynak, kayıt ve kanıtın kullanıldığını gösterir.', status: 'Zorunlu', tone: 'danger', meta: 'Kaynak dayanağı' },
    { name: 'Ajan Action Boundary', description: 'AI aksiyonlarını rol, kurum, risk ve onay sınırlarına göre durdurur.', status: 'Haritalandı', tone: 'success', meta: 'Aksiyon sınırı' },
    { name: 'Prompt Policy Registry', description: 'Kurum bazlı yasaklı veri, maskeleme ve cevap politikalarını tutar.', status: 'Planlandı', tone: 'warning', meta: 'Prompt politikası' },
    ...sharedGovernanceTools,
  ],
  'autonomous-actions': [
    { name: 'Aksiyon Zinciri Simulator', description: 'Yükümlülükten göreve, onaya ve kanıta giden zinciri canlıya almadan test eder.', status: 'İskelet Hazır', tone: 'info', meta: 'Akış simülasyonu' },
    { name: 'Approval Gatekeeper', description: 'Kritik riskte AI aksiyonunu otomatik durdurup yöneticiden onay ister.', status: 'Zorunlu', tone: 'danger', meta: 'Onay kapısı' },
    { name: 'Rollback Ledger', description: 'Yanlış başlatılan görev, onay veya kanıt isteğini geri alma izini tutar.', status: 'Planlandı', tone: 'warning', meta: 'Geri alma defteri' },
    ...sharedGovernanceTools,
  ],
  'platform-one': [
    { name: 'Platform Command Center', description: 'Tüm fazların canlılık, veri, entegrasyon ve risk durumunu tek merkezde gösterir.', status: 'Temel Hazır', tone: 'success', meta: 'Üst komuta' },
    { name: 'canlı Readiness Gate', description: 'Canlıya çıkmadan önce DB, kuyruk, yedekleme, izleme ve kimlik bilgisi kontrolü yapar.', status: 'Zorunlu', tone: 'danger', meta: 'Canlıya geçiş' },
    { name: 'Module Dependency Map', description: 'Fazlar arası veri ve iş akışı bağımlılıklarını görünür kılar.', status: 'Haritalandı', tone: 'info', meta: 'Bağımlılık haritası' },
    ...sharedGovernanceTools,
  ],
}

export const futureEnterpriseModules: FuturePhaseModule[] = [
  {
    key: 'multi-tenant',
    phase: 'FAZ 41',
    title: 'Multi-Tenant SaaS',
    subtitle: 'Kurum izolasyonu, kurum bazlı veri ayrımı, rol ve alan adı yönetimi.',
    route: '/multi-tenant',
    badge: 'SaaS Core',
    pattern: 'Kurum bağlamı + veri ayrımı + rol bazlı yetki politikası',
    metrics: [
      { label: 'Tenant Model', value: 'Hazır', helper: 'A/B/C kurum izolasyonu', tone: 'success' },
      { label: 'Veri Ayrımı', value: 'Şema', helper: 'Kurum anahtarı zorunlu', tone: 'info' },
      { label: 'Alan Adı Eşleştirme', value: '3', helper: 'app/www/api/docs', tone: 'neutral' },
      { label: 'Eksik Parça', value: 'DB RLS', helper: 'canlı ortamda zorunlu', tone: 'warning' },
    ],
    kayıtlar: [
      { id: 'TEN-001', title: 'Kurum kaydı', owner: 'Platform', status: 'Temel Hazır', risk: 'Yüksek', dataObject: 'kurum_id, paket_id, alan adı', nextAction: 'DB kurum anahtarı ve RLS politikasını ekle' },
      { id: 'TEN-002', title: 'Kurum bazlı bildirim yönlendirme', owner: 'Bildirimler', status: 'Tasarlanmış', risk: 'Orta', dataObject: 'kurum_id, kullanıcı_id, kanal', nextAction: 'Mail kuyruğu kurum filtresine bağlanacak' },
      { id: 'TEN-003', title: 'Rol izolasyon matrisi', owner: 'Güvenlik', status: 'Haritalandı', risk: 'Kritik', dataObject: 'rol, kapsam, yetki', nextAction: 'API middleware seviyesinde zorla' },
    ],
    timeline: [
      { id: 't1', title: 'Kurum bağlamı oluşturuldu', description: 'UI ve servis katmanında kurum tokenları hazır.', time: 'S1', tone: 'success' },
      { id: 't2', title: 'Kalıcı kayıt izolasyonu', description: 'Kalıcı DB’de kurum bölümlendirme uygulanacak.', time: 'S2', tone: 'warning' },
      { id: 't3', title: 'Canlı kurum açılışı', description: 'İlk müşteri tenant açılışı ve alan adı mapping.', time: 'S3', tone: 'info' },
    ],
    capabilities: [
      { name: 'Kurum Kaydı', description: 'Kurum, alan adı, plan ve durum kaydı.', status: 'Hazır', tone: 'success', meta: 'Çekirdek nesne' },
      { name: 'Rol Kapsamı', description: 'Rol yetkilerini kurum sınırı içinde tutar.', status: 'Haritalandı', tone: 'info', meta: 'Güvenlik kritik' },
    ],
    aiNotes: ['AI yanıtları kurum sınırını aşmadan kaynak getirmeli.', 'Vector/search index kurum_id olmadan sorgulanmamalı.'],
  },
  {
    key: 'billing',
    phase: 'FAZ 42',
    title: 'Billing & Subscription',
    subtitle: 'Starter, Professional, Enterprise planları; kullanım ve faturalama kayıtları.',
    route: '/billing',
    badge: 'Revenue Ops',
    pattern: 'Paket hakkı + kullanım defteri + fatura durumu',
    metrics: [
      { label: 'Plan', value: '3', helper: 'Starter / Pro / Enterprise', tone: 'success' },
      { label: 'Kullanım Ölçeri', value: '7', helper: 'API, kullanıcı, scan, mail', tone: 'info' },
      { label: 'Fatura Durumu', value: 'Taslak', helper: 'Tahakkuk modeli', tone: 'warning' },
      { label: 'Ticari Hazırlık', value: '%64', helper: 'Ödeme sağlayıcı bekliyor', tone: 'warning' },
    ],
    kayıtlar: [
      { id: 'BIL-001', title: 'Paket hak matrisi', owner: 'Gelir Operasyonları', status: 'Taslak', risk: 'Orta', dataObject: 'plan, limit, özellik_bayrağı', nextAction: 'Özellik bayrağı zorlaması ekle' },
      { id: 'BIL-002', title: 'Kullanım defteri', owner: 'Platform', status: 'Tasarlanmış', risk: 'Yüksek', dataObject: 'kurum_id, metrik, miktar', nextAction: 'API çağrısı ve tarama sayaçları bağlanacak' },
      { id: 'BIL-003', title: 'Fatura iş akışı', owner: 'Finans', status: 'Planlandı', risk: 'Orta', dataObject: 'fatura_id, dönem, tutar', nextAction: 'Ödeme sağlayıcı seçilecek' },
    ],
    timeline: [
      { id: 'b1', title: 'Plan kataloğu', description: 'Paket limitleri ve modül erişimleri ayrıldı.', time: 'S1', tone: 'success' },
      { id: 'b2', title: 'Kullanım defteri', description: 'Her kullanım olayı ölçülebilir hale getirilecek.', time: 'S2', tone: 'info' },
      { id: 'b3', title: 'Billing sağlayıcı', description: 'Ödeme/fatura sağlayıcı entegrasyonu.', time: 'S3', tone: 'warning' },
    ],
    capabilities: [
      { name: 'Entitlement Guard', description: 'Plan limitlerine göre modül erişimi.', status: 'İskelet Hazır', tone: 'info', meta: 'SaaS koruması' },
      { name: 'Usage Ledger', description: 'Kullanım bazlı ticari veri tabanı.', status: 'Tasarlanmış', tone: 'warning', meta: 'Faturalama çekirdeği' },
    ],
    aiNotes: ['AI taraması ve ajan aksiyonları plan limitlerine göre ölçülmeli.', 'Enterprise müşteride özel kota desteklenmeli.'],
  },
  {
    key: 'white-label',
    phase: 'FAZ 43',
    title: 'White Label Engine',
    subtitle: 'Kurum logosu, renkleri, alan adları ve görünüm politikaları.',
    route: '/white-label',
    badge: 'Branding',
    pattern: 'Kurum tema değişkenleri + marka varlık kaydı',
    metrics: [
      { label: 'CSS Token', value: 'Hazır', helper: 'Kurum renkleri hazır', tone: 'success' },
      { label: 'Logo Slot', value: 'Planlandı', helper: 'Üst bar/yan menü', tone: 'warning' },
      { label: 'Alan Adı Teması', value: 'Haritalandı', helper: 'www/app/docs', tone: 'info' },
      { label: 'Arayüz Sapma Riski', value: 'Düşük', helper: 'Token tabanlı', tone: 'success' },
    ],
    kayıtlar: [
      { id: 'WLE-001', title: 'Kurum renk tokenları', owner: 'Tasarım Sistemi', status: 'Uygulandı', risk: 'Düşük', dataObject: '--akop-tenant-*', nextAction: 'Ayarlar ekranına renk seçici ekle' },
      { id: 'WLE-002', title: 'Logo varlık kaydı', owner: 'Platform', status: 'Planlandı', risk: 'Orta', dataObject: 'logo_light, logo_dark', nextAction: 'Varlık yükleme deposu ekle' },
      { id: 'WLE-003', title: 'Alan adı bazlı tema', owner: 'SaaS', status: 'Haritalandı', risk: 'Orta', dataObject: 'kurum_alan_adı, tema_id', nextAction: 'Kurum çözümleyici ile bağla' },
    ],
    timeline: [
      { id: 'w1', title: 'Token altyapısı', description: 'Birincil/vurgu renkleri kurum değişkenlerinden besleniyor.', time: 'Tamam', tone: 'success' },
      { id: 'w2', title: 'Logo ve favicon', description: 'Kurum asset registry eklenecek.', time: 'Sıradaki', tone: 'info' },
      { id: 'w3', title: 'Alan adı teması', description: 'Alan adı çözümleyici ile otomatik tema.', time: 'Sonra', tone: 'warning' },
    ],
    capabilities: [
      { name: 'Renk Tokenları', description: 'Kurum rengi tüm state ve aksiyonlara yayılır.', status: 'Hazır', tone: 'success', meta: 'Lokal renk yok' },
      { name: 'Marka Kaydı', description: 'Logo, favicon, mail şablonu ve alan adı.', status: 'İskelet Hazır', tone: 'info', meta: 'Kurum varlığı' },
    ],
    aiNotes: ['AI çıktılarında kurum adı ve marka dili kullanılabilir.', 'Mail şablonları kurum teması ile render edilmeli.'],
  },
  {
    key: 'customer-portal',
    phase: 'FAZ 44',
    title: 'Customer Portal',
    subtitle: 'Kurum adminlerinin kullanıcı, yetki, abonelik ve ayarlarını yönettiği portal.',
    route: '/customer-portal',
    badge: 'Yönetim Paneli',
    pattern: 'Yönetim paneli + yetki tablosu + kendi kendine işlem akışı',
    metrics: [
      { label: 'Yönetim Paneli', value: 'Hazır', helper: 'temel bileşen mevcut', tone: 'success' },
      { label: 'Kullanıcı İşlemleri', value: '8', helper: 'Invite, rol, deactivate', tone: 'info' },
      { label: 'Kendi Kendine Yönetim', value: '%70', helper: 'Fatura hariç', tone: 'warning' },
      { label: 'Denetim Kapsamı', value: 'Zorunlu', helper: 'Her işlem loglanmalı', tone: 'danger' },
    ],
    kayıtlar: [
      { id: 'CSP-001', title: 'Kullanıcı davet akışı', owner: 'Kurum Yöneticisi', status: 'İskelet Hazır', risk: 'Orta', dataObject: 'e-posta, rol, kurum_id', nextAction: 'Davet e-postası sağlayıcı bağla' },
      { id: 'CSP-002', title: 'Yetki tablosu', owner: 'Güvenlik', status: 'Haritalandı', risk: 'Kritik', dataObject: 'yetki, kapsam, rol', nextAction: 'Rol matrisi UI ile eşleştir' },
      { id: 'CSP-003', title: 'Kurum ayarları', owner: 'Platform', status: 'Temel Hazır', risk: 'Yüksek', dataObject: 'kurum profili, bildirim e-postası', nextAction: 'mevcut Ayarlar ekranını portal paneli’a taşı' },
    ],
    timeline: [
      { id: 'c1', title: 'Yönetim paneli altyapısı', description: 'Sol panel + veri tablosu iskeleti hazır.', time: 'Tamam', tone: 'success' },
      { id: 'c2', title: 'Davet akışı', description: 'Mail ve token akışı eklenecek.', time: 'Sıradaki', tone: 'warning' },
      { id: 'c3', title: 'Denetim bağı', description: 'Her portal aksiyonu denetim kaydı’a yazılacak.', time: 'Sıradaki', tone: 'danger' },
    ],
    capabilities: [
      { name: 'Kendi Kendine Yönetim Settings', description: 'Kurum bilgisi, mail, alan adı ve tema yönetimi.', status: 'Temel', tone: 'info', meta: 'Ayarlar yeniden kullanımı' },
      { name: 'Rol Matrisi', description: 'Kullanıcı yetkilerini tablo halinde kırılmadan gösterir.', status: 'Haritalandı', tone: 'success', meta: 'RBAC' },
    ],
    aiNotes: ['AI yönetici önerileri yetki sınırını aşmamalı.', 'Kritik rol değişikliklerinde onay iş akışını önerilmeli.'],
  },
  {
    key: 'api-gateway',
    phase: 'FAZ 45',
    title: 'AKOP API Gateway',
    subtitle: 'POST /tasks, GET /obligations, GET /risks gibi dış erişim API katmanı.',
    route: '/api-gateway',
    badge: 'Developer Platform',
    pattern: 'Uç nokta kaydı + API anahtarı yönetişimi + denetim ara katmanı',
    metrics: [
      { label: 'Uç Nokta Kaydı', value: '9', helper: 'Çekirdek GRC uç noktaları', tone: 'success' },
      { label: 'API Anahtarı', value: 'Yönetimli', helper: 'Döndürme/iptal hazır', tone: 'info' },
      { label: 'Çağrı Limiti', value: 'Zorunlu', helper: 'Tenant bazlı', tone: 'warning' },
      { label: 'Denetim', value: 'Zorunlu', helper: 'Tüm çağrılar loglanır', tone: 'danger' },
    ],
    kayıtlar: [
      { id: 'API-001', title: 'Görevler API', owner: 'Platform API', status: 'Tasarlanmış', risk: 'Yüksek', dataObject: 'görev içeriği, durum, sorumlu', nextAction: 'Doğrulama şeması ekle' },
      { id: 'API-002', title: 'Yükümlülükler API', owner: 'Uyum API', status: 'Tasarlanmış', risk: 'Yüksek', dataObject: 'yükümlülük_id, kurum, durum', nextAction: 'GET filtreleri ve sayfalama ekle' },
      { id: 'API-003', title: 'Riskler API', owner: 'Risk API', status: 'Tasarlanmış', risk: 'Kritik', dataObject: 'risk_skoru, varlık, eğilim', nextAction: 'Salt okunur token kapsam uygula' },
    ],
    timeline: [
      { id: 'a1', title: 'Uç nokta sözleşmesi', description: 'Core uç nokta listesi netleşti.', time: 'S1', tone: 'success' },
      { id: 'a2', title: 'Kimlik doğrulama ara katmanı', description: 'API anahtarı, kurum ve kapsam kontrolü.', time: 'S2', tone: 'danger' },
      { id: 'a3', title: 'Dokümantasyon portalı', description: 'docs.akop.io için sözleşme dışa aktarımı.', time: 'S3', tone: 'info' },
    ],
    capabilities: [
      { name: 'API Anahtarı Governance', description: 'Anahtar üretme, döndürme, iptal ve kapsam.', status: 'Güvenlik Hazır', tone: 'info', meta: 'Security Center yeniden kullanımı' },
      { name: 'Denetim Middleware', description: 'Tüm dış API çağrılarını denetim kaydına çevirir.', status: 'Zorunlu', tone: 'danger', meta: 'Uyum kritik' },
    ],
    aiNotes: ['Ajan aksiyonları da API geçidi politika ile sınırlandırılmalı.', 'Her dış çağrı kurum ve kapsam taşımalı.'],
  },
  {
    key: 'integration-marketplace',
    phase: 'FAZ 46',
    title: 'Integration Marketplace',
    subtitle: 'Jira, ServiceNow, Teams, Slack, Outlook, SAP ve veri sağlayıcı bağlantıları.',
    route: '/integration-marketplace',
    badge: 'Marketplace',
    pattern: 'Bağlantı kartları + bağlantı sağlığı + veri akışı durumu',
    metrics: [
      { label: 'Bağlantı', value: '12', helper: 'SaaS + enterprise', tone: 'info' },
      { label: 'Aktif Akış', value: '5', helper: 'Bildirim/görev senkronizasyonu', tone: 'success' },
      { label: 'Kimlik Bilgisi Gerekli', value: '7', helper: 'OAuth/API anahtarı', tone: 'warning' },
      { label: 'Akış Hataları', value: '0', helper: 'Sağlık kontrolü hazır', tone: 'success' },
    ],
    kayıtlar: [
      { id: 'MKT-001', title: 'Jira iş kaydı senkronizasyonu', owner: 'Entegrasyon Pazarı', status: 'İskelet Hazır', risk: 'Orta', dataObject: 'vaka_id, iş_kaydı_no, durum', nextAction: 'OAuth uygulaması kurulacak' },
      { id: 'MKT-002', title: 'Teams bildirimi', owner: 'Bildirimler', status: 'Tasarlanmış', risk: 'Orta', dataObject: 'kanal_id, mesaj, önem', nextAction: 'Webhook gizli anahtar deposu ekle' },
      { id: 'MKT-003', title: 'ServiceNow olay köprüsü', owner: 'Operasyon', status: 'Planlandı', risk: 'Yüksek', dataObject: 'olay_id, öncelik, sorumlu', nextAction: 'Çift yönlü senkronizasyon sözleşmesi yaz' },
    ],
    timeline: [
      { id: 'm1', title: 'Bağlantı kartı grid yapısı', description: 'Bağlantı kartları hizalı grid içinde sunulur.', time: 'Tamam', tone: 'success' },
      { id: 'm2', title: 'Kimlik bilgisi kasası', description: 'Gizli anahtar saklama üretim katmanına bağlanacak.', time: 'Sıradaki', tone: 'danger' },
      { id: 'm3', title: 'Akış izleme', description: 'Başarısız senkronizasyon durumları Bildirim Merkezi’a düşer.', time: 'Sıradaki', tone: 'info' },
    ],
    capabilities: [
      { name: 'Bağlantı Cards', description: 'Logo, durum, kimlik bilgisi ve son senkronizasyon gösterimi.', status: 'Hazır', tone: 'success', meta: 'Grid uyumlu' },
      { name: 'Veri Akışı Sağlığı', description: 'Her entegrasyonun akış sağlığı izlenir.', status: 'Haritalandı', tone: 'info', meta: 'Faz 40 yeniden kullanımı' },
    ],
    aiNotes: ['AI ajan bağlantısı seçerken izin ve veri sınıfı kontrol etmeli.', 'Failed senkronizasyon durumunda otomatik case önerilebilir.'],
  },
  {
    key: 'advanced-analytics',
    phase: 'FAZ 47',
    title: 'Gelişmiş Analitik',
    subtitle: 'Yönetici eğilimleri, risk heatmap, SLA eğilimleri ve uyum performansı.',
    route: '/advanced-analytics',
    badge: 'Analytics',
    pattern: 'Trend panelleri + risk analitiği + detaya inen veri tablosu',
    metrics: [
      { label: 'Trend Modeli', value: '6', helper: 'Risk/SLA/Kontrol', tone: 'info' },
      { label: 'Isı Haritası', value: 'Hazır', helper: 'Entity + kurum', tone: 'success' },
      { label: 'Detaya İniş', value: 'Table', helper: 'Veri öncelikli', tone: 'success' },
      { label: 'Tahmin', value: 'Pilot', helper: 'AI katmanı ile birleşir', tone: 'warning' },
    ],
    kayıtlar: [
      { id: 'ANA-001', title: 'Compliance performance eğilim', owner: 'Analitik', status: 'İskelet Hazır', risk: 'Orta', dataObject: 'dönem, tamamlama_oranı, gecikme', nextAction: 'KPI service ile bağla' },
      { id: 'ANA-002', title: 'Kontrol etkinliği ısı haritası', owner: 'Kontroller', status: 'Haritalandı', risk: 'Yüksek', dataObject: 'kontrol_id, skor, bulgu_sayısı', nextAction: 'Control Testing veri birleştirmesi' },
      { id: 'ANA-003', title: 'Regulatory impact eğilim', owner: 'RegIntel', status: 'Tasarlanmış', risk: 'Yüksek', dataObject: 'kurum, etki, yükümlülük_sayısı', nextAction: 'RegIntel kayıtlar ile bağla' },
    ],
    timeline: [
      { id: 'an1', title: 'KPI/KRI yeniden kullanımı', description: 'Faz 25 göstergeleri analytics katmanına kaynak olur.', time: 'S1', tone: 'success' },
      { id: 'an2', title: 'Detaya İniş tables', description: 'Grafik arkasındaki ham veri tabloyla açılır.', time: 'S2', tone: 'info' },
      { id: 'an3', title: 'Tahmin layer', description: 'Faz 48 AI tahmin motoru ile birleşir.', time: 'S3', tone: 'warning' },
    ],
    capabilities: [
      { name: 'Trend Paneli', description: 'Yönetici seviyesinde zaman bazlı performans.', status: 'İskelet Hazır', tone: 'info', meta: 'Veri öncelikli' },
      { name: 'Risk Isı Haritası', description: 'Kurum, regülasyon ve süreç bazlı risk dağılımı.', status: 'Haritalandı', tone: 'success', meta: 'Risk Center yeniden kullanımı' },
    ],
    aiNotes: ['Tahmin açıklanabilir olmalı; hangi veri eğiliminden geldiği gösterilmeli.', 'Yönetici brifinginde ham veri bağlantısı korunmalı.'],
  },
  {
    key: 'ai-agent',
    phase: 'FAZ 48',
    title: 'AI Copilot & Ajan Layer',
    subtitle: 'Analiz, öneri, risk tahmini ve kontrollü otonom aksiyon katmanı.',
    route: '/ai-ajan',
    badge: 'AI Ajan',
    pattern: 'Yönetimli ajan + kaynak getirme + onay sınırı',
    metrics: [
      { label: 'Ajan Yeteneği', value: '8', helper: 'Analiz et/oluştur/yükselt', tone: 'ai' },
      { label: 'Onay Sınırı', value: 'Açık', helper: 'Kritik aksiyon onay ister', tone: 'success' },
      { label: 'Kaynak Dayanağı', value: '%86', helper: 'Kaynaklı cevap', tone: 'info' },
      { label: 'Otonomi Riski', value: 'Korumalı', helper: 'Policy ile sınırlı', tone: 'warning' },
    ],
    kayıtlar: [
      { id: 'AIA-001', title: 'Yükümlülük taslağı oluşturma', owner: 'AI Uyum Görevlisi', status: 'Korumalı', risk: 'Yüksek', dataObject: 'kaynak, yükümlülük, sahip', nextAction: 'Approval Engine onay sınırı ekle' },
      { id: 'AIA-002', title: 'Bulgudan CAPA önerme', owner: 'AI Uyum Görevlisi', status: 'Tasarlanmış', risk: 'Orta', dataObject: 'bulgu, kök_neden, aksiyon', nextAction: 'CAPA Center’a öneri paneli ekle' },
      { id: 'AIA-003', title: 'Risk tahmini açıklaması', owner: 'Risk AI', status: 'Pilot', risk: 'Kritik', dataObject: 'özellikler, skor, gerekçe', nextAction: 'Açıklanabilirlik kutusu zorunlu' },
    ],
    timeline: [
      { id: 'ai1', title: 'Copilot genişletildi', description: 'Regülasyon, risk ve iş akışı soruları yanıtlanır.', time: 'Tamam', tone: 'success' },
      { id: 'ai2', title: 'Yönetimli aksiyonlar', description: 'Ajan görev açabilir ama onay sınırı korunur.', time: 'Sıradaki', tone: 'warning' },
      { id: 'ai3', title: 'Otonom zincir', description: 'Faz 49 aksiyon zinciriyle birleşir.', time: 'Sıradaki', tone: 'ai' },
    ],
    capabilities: [
      { name: 'AI Bilgi Kutuları', description: 'Uzun metinleri taşmadan, scroll kontrollü gösterir.', status: 'Hazır', tone: 'success', meta: 'Taşma kontrollü' },
      { name: 'Ajan Kontrol Sınırları', description: 'Her aksiyon rol, kurum ve onay politika ile sınırlanır.', status: 'Haritalandı', tone: 'danger', meta: 'Kritik yol' },
    ],
    aiNotes: ['AI asla kurum dışı veri getirmemeli.', 'Kritik aksiyonlar otomatik icra değil, onaya gönderme modunda başlamalı.'],
  },
  {
    key: 'autonomous-actions',
    phase: 'FAZ 49',
    title: 'Otonom Uyum Aksiyonları',
    subtitle: 'Yükümlülük oluştur, görev aç, onay başlat ve kanıt iste zinciri.',
    route: '/autonomous-actions',
    badge: 'Aksiyon Zinciri',
    pattern: 'Yükümlülük > Görev > Onay > Kanıt kontrollü iş akışı',
    metrics: [
      { label: 'Aksiyon Zinciri', value: '4 adım', helper: 'Yükümlülük/görev/onay/kanıt', tone: 'success' },
      { label: 'Manuel Kapı', value: '2', helper: 'Onay + kanıt kabulü', tone: 'warning' },
      { label: 'Denetim Kapsamı', value: 'Tam', helper: 'Her adım izlenir', tone: 'success' },
      { label: 'Risk Koruması', value: 'Sıkı', helper: 'Kritik otomatik durdurma', tone: 'danger' },
    ],
    kayıtlar: [
      { id: 'AUTO-001', title: 'Regülasyon değişikliğinden yükümlülüğe', owner: 'AI Ajan', status: 'Sadece Taslak', risk: 'Yüksek', dataObject: 'regülasyon_değişikliği, yükümlülük_taslağı', nextAction: 'Uyum onayı zorunlu' },
      { id: 'AUTO-002', title: 'Yükümlülükten göreve', owner: 'İş Akışı', status: 'Tasarlanmış', risk: 'Orta', dataObject: 'yükümlülük_id, görev_id', nextAction: 'Task SLA politika ekle' },
      { id: 'AUTO-003', title: 'Görevden kanıt isteğine', owner: 'Evidence Vault', status: 'Haritalandı', risk: 'Yüksek', dataObject: 'görev_id, kanıt_türü', nextAction: 'Kanıt yükleme ve hash ile bağla' },
    ],
    timeline: [
      { id: 'au1', title: 'Taslak aksiyon', description: 'AI öneri üretir, icra için onay gerekir.', time: 'S1', tone: 'ai' },
      { id: 'au2', title: 'Workflow chain', description: 'Görev ve onay akışı deterministik çalışır.', time: 'S2', tone: 'success' },
      { id: 'au3', title: 'Evidence closure', description: 'Kapanış için kanıt ve hash zorunlu olur.', time: 'S3', tone: 'warning' },
    ],
    capabilities: [
      { name: 'Yönetimli Zincir', description: 'AI önerisi iş akışı motoru ile sınırlanır.', status: 'Haritalandı', tone: 'success', meta: 'Faz 15/18 yeniden kullanım' },
      { name: 'Auto-Stop Rules', description: 'Kritik riskte yönetici onayı olmadan ilerlemez.', status: 'Zorunlu', tone: 'danger', meta: 'Kontrol noktası' },
    ],
    aiNotes: ['Otonom aksiyonların tamamı denetim kaydı’a açıklamasıyla yazılmalı.', 'Ajan hiçbir kanıtı gerçek kabul etmeden Evidence Vault doğrulaması istemeli.'],
  },
  {
    key: 'platform-one',
    phase: 'FAZ 50',
    title: 'AKOP Enterprise Platform 1.0',
    subtitle: 'RegTech, GRC, Risk, Compliance, Workflow, Case, Policy, Evidence, Denetim, Control, CAPA, BCM, Privacy, AML ve AI tek çatı.',
    route: '/platform-one',
    badge: 'Enterprise 1.0',
    pattern: 'Birleşik işletim sistemi + faz manifesti + entegrasyon omurgası',
    metrics: [
      { label: 'Çekirdek Modül', value: '40+', helper: 'Tek navigasyon altında', tone: 'success' },
      { label: 'Kritik Yol', value: '10', helper: 'Ticari değerin %80’i', tone: 'info' },
      { label: 'Veri Öncelikli', value: '80/20', helper: 'Veri ağırlıklı ekran', tone: 'success' },
      { label: 'Canlı Ürün Açığı', value: 'Kimlik bilgileri', helper: 'Kapalı kurum API’leri', tone: 'warning' },
    ],
    kayıtlar: [
      { id: 'P10-001', title: 'Birleşik faz kaydı', owner: 'Mimari', status: 'Uygulandı', risk: 'Düşük', dataObject: 'faz, rota, desen, durum', nextAction: 'Platform komuta merkezi’a bağla' },
      { id: 'P10-002', title: 'Kurumsal veri modeli', owner: 'Platform', status: 'Temel Hazır', risk: 'Kritik', dataObject: 'tenant, varlık, iş akışı, audit', nextAction: 'Kalıcı DB şemasını netleştir' },
      { id: 'P10-003', title: 'Canlıya hazırlık kapısı', owner: 'Yönetici', status: 'Bekliyor', risk: 'Yüksek', dataObject: 'SLO, yedekleme, izleme, kimlik bilgileri', nextAction: 'Pilot müşteri kontrol listesi oluştur' },
    ],
    timeline: [
      { id: 'p1', title: 'Platform temeli', description: 'Modüler faz sistemi, tasarım bileşenleri ve entegrasyon katmanı hazır.', time: 'Şimdi', tone: 'success' },
      { id: 'p2', title: 'Canlı veri', description: 'Gerçek DB, kuyruk, kimlik bilgisis ve izleme bağlanacak.', time: 'Sıradaki', tone: 'warning' },
      { id: 'p3', title: 'Pilot müşteri', description: 'İlk kurum tenant’ı, veri bağlantıları ve SLA ile canlıya alınır.', time: 'Canlı', tone: 'info' },
    ],
    capabilities: [
      { name: 'İşletim Sistemi Görünümü', description: 'Tüm GRC/RegTech modülleri tek ürün hissinde birleşir.', status: 'Temel', tone: 'success', meta: 'Kurumsal kabuk' },
      { name: 'Canlıya Geçiş Kapısı', description: 'Demo ürünü gerçek SaaS ürününe çeviren kontrol kapısı.', status: 'Sıradaki', tone: 'warning', meta: 'Son canlıya alma adımı' },
    ],
    aiNotes: ['Faz 50’de AI, platformun üstüne binen kontrollü zeka katmanı olmalı.', 'Ürün canlıya çıkmadan önce izleme, yedekleme ve kimlik bilgisi rotasyonu zorunlu.'],
  },
]

export function getFutureEnterpriseModule(key: FuturePhaseKey): FuturePhaseModule {
  const module = futureEnterpriseModules.find((item) => item.key === key)
  if (!module) throw new Error(`Unknown future enterprise module: ${key}`)
  return module
}
