export type EnterprisePhaseKey =
  | 'incident'
  | 'vendor-risk'
  | 'internal-audit'
  | 'compliance-calendar'
  | 'horizon-scanning'
  | 'training-awareness'
  | 'aml-masak'
  | 'business-continuity'
  | 'data-privacy'
  | 'esg-sustainability'
  | 'enterprise-search'
  | 'ai-compliance-officer'
  | 'real-integrations'

export type EnterprisePhaseStatus = 'Normal' | 'Watch' | 'Critical'

export interface EnterprisePhaseMetric {
  label: string
  value: string
  helper: string
  status: EnterprisePhaseStatus
}

export interface EnterprisePhaseRecord {
  id: string
  title: string
  owner: string
  status: string
  risk: 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'
  dueDate: string
  description: string
}

export interface EnterprisePhaseModule {
  key: EnterprisePhaseKey
  phase: string
  title: string
  subtitle: string
  badge: string
  route: string
  workflow: string[]
  metrics: EnterprisePhaseMetric[]
  records: EnterprisePhaseRecord[]
}

const modules: EnterprisePhaseModule[] = [
  {
    key: 'incident',
    phase: 'FAZ 27',
    title: 'Incident Management',
    subtitle: 'Operasyonel olay, kök neden ve düzeltici aksiyon takibi.',
    badge: 'Operasyonel Olay',
    route: '/incidents',
    workflow: ['Incident', 'Root Cause', 'Corrective Action', 'Verification', 'Closure'],
    metrics: [
      { label: 'Açık Incident', value: '6', helper: '2 kritik', status: 'Critical' },
      { label: 'Ortalama Kapanış', value: '3.4 gün', helper: 'SLA içinde', status: 'Watch' },
      { label: 'RCA Tamamlandı', value: '%72', helper: 'Son 30 gün', status: 'Watch' },
      { label: 'Tekrarlayan Olay', value: '2', helper: 'Aksiyon gerekli', status: 'Critical' },
    ],
    records: [
      { id: 'INC-001', title: 'Takas işleminde gecikme', owner: 'Operasyon', status: 'RCA Bekliyor', risk: 'Yüksek', dueDate: '2026-06-28', description: 'Takas sürecinde batch gecikmesi ve müşteri etkisi.' },
      { id: 'INC-002', title: 'Veri aktarım hatası', owner: 'IT Operasyon', status: 'Düzeltici Aksiyon', risk: 'Kritik', dueDate: '2026-06-26', description: 'MKK veri aktarımında format uyuşmazlığı.' },
      { id: 'INC-003', title: 'Müşteri şikayeti yoğunluğu', owner: 'Müşteri Operasyon', status: 'İncelemede', risk: 'Orta', dueDate: '2026-07-02', description: 'Aynı işlem tipinde artan şikayet sayısı.' },
    ],
  },
  {
    key: 'vendor-risk',
    phase: 'FAZ 28',
    title: 'Vendor Risk Management',
    subtitle: 'SaaS, tedarikçi ve veri sağlayıcı risk değerlendirmeleri.',
    badge: 'Üçüncü Taraf',
    route: '/vendor-risk',
    workflow: ['Vendor Inventory', 'Risk Assessment', 'Due Diligence', 'Contract Controls', 'Review'],
    metrics: [
      { label: 'Aktif Tedarikçi', value: '18', helper: '5 kritik servis', status: 'Watch' },
      { label: 'Eksik Due Diligence', value: '4', helper: 'Sözleşme öncesi', status: 'Critical' },
      { label: 'SLA İzleme', value: '%91', helper: 'Aylık başarı', status: 'Normal' },
      { label: 'Yenileme Riski', value: '3', helper: '30 gün içinde', status: 'Watch' },
    ],
    records: [
      { id: 'VRM-001', title: 'AWS altyapı hizmetleri', owner: 'IT Güvenlik', status: 'Yıllık Review', risk: 'Kritik', dueDate: '2026-07-10', description: 'Bulut altyapı ve veri lokasyonu kontrolü.' },
      { id: 'VRM-002', title: 'MKK veri servisi', owner: 'Operasyon', status: 'SLA İzleme', risk: 'Yüksek', dueDate: '2026-07-05', description: 'Kritik dış veri sağlayıcı süreklilik takibi.' },
      { id: 'VRM-003', title: 'Üçüncü parti SaaS raporlama', owner: 'Uyum', status: 'Due Diligence Eksik', risk: 'Orta', dueDate: '2026-06-30', description: 'KVKK ve erişim kontrolleri tamamlanmalı.' },
    ],
  },
  {
    key: 'internal-audit',
    phase: 'FAZ 30',
    title: 'Internal Audit Management',
    subtitle: 'Denetim planı, bulgular, tavsiyeler ve kapanış takibi.',
    badge: 'İç Denetim',
    route: '/internal-audit',
    workflow: ['Audit Plan', 'Fieldwork', 'Findings', 'Recommendations', 'Closure'],
    metrics: [
      { label: 'Aktif Denetim', value: '5', helper: '2 saha çalışması', status: 'Watch' },
      { label: 'Açık Bulgu', value: '12', helper: '3 kritik', status: 'Critical' },
      { label: 'Tavsiye Kapanışı', value: '%68', helper: 'Hedef %85', status: 'Watch' },
      { label: 'Geciken Denetim', value: '1', helper: 'Komite bildirimi', status: 'Critical' },
    ],
    records: [
      { id: 'AUD-001', title: 'SPK uyum süreç denetimi', owner: 'İç Denetim', status: 'Saha Çalışması', risk: 'Yüksek', dueDate: '2026-07-12', description: 'Yükümlülük ve kontrol testleri örneklemi.' },
      { id: 'AUD-002', title: 'Takasbank limit izleme denetimi', owner: 'İç Denetim', status: 'Bulgu Yazımı', risk: 'Kritik', dueDate: '2026-07-01', description: 'Limit aşımı kontrolleri ve alarm mekanizması.' },
      { id: 'AUD-003', title: 'Politika review denetimi', owner: 'İç Denetim', status: 'Planlandı', risk: 'Orta', dueDate: '2026-08-05', description: 'Politika yaşam döngüsü ve onay izleri.' },
    ],
  },
  {
    key: 'compliance-calendar',
    phase: 'FAZ 31',
    title: 'Compliance Calendar',
    subtitle: 'SPK bildirimleri, MKK raporları, denetim ve politika tarihleri.',
    badge: 'Uyum Takvimi',
    route: '/compliance-calendar',
    workflow: ['Calendar Item', 'Owner Assignment', 'Reminder', 'Completion', 'Evidence'],
    metrics: [
      { label: 'Yaklaşan Tarih', value: '9', helper: '14 gün içinde', status: 'Watch' },
      { label: 'Geciken Kayıt', value: '2', helper: 'SLA ihlali', status: 'Critical' },
      { label: 'Tamamlama', value: '%84', helper: 'Aylık', status: 'Normal' },
      { label: 'Kanıt Bekleyen', value: '5', helper: 'Kapanış için', status: 'Watch' },
    ],
    records: [
      { id: 'CAL-001', title: 'SPK haftalık bildirim', owner: 'Uyum', status: 'Yaklaşıyor', risk: 'Yüksek', dueDate: '2026-06-27', description: 'Haftalık SPK raporlama yükümlülüğü.' },
      { id: 'CAL-002', title: 'MKK aylık mutabakat raporu', owner: 'Operasyon', status: 'Kanıt Bekliyor', risk: 'Orta', dueDate: '2026-06-30', description: 'Aylık MKK raporu ve kanıt yükleme.' },
      { id: 'CAL-003', title: 'Politika review tarihi', owner: 'Yönetişim', status: 'Planlandı', risk: 'Orta', dueDate: '2026-07-15', description: 'Bilgi güvenliği politikası yıllık review.' },
    ],
  },
  {
    key: 'horizon-scanning',
    phase: 'FAZ 32',
    title: 'Regulatory Horizon Scanning',
    subtitle: 'Henüz yürürlüğe girmemiş düzenlemelerin etki takibi.',
    badge: 'Horizon',
    route: '/horizon-scanning',
    workflow: ['Draft Regulation', 'Effective Date', 'Impact Analysis', 'Obligation Draft', 'Readiness'],
    metrics: [
      { label: 'Taslak Düzenleme', value: '7', helper: 'Takipte', status: 'Watch' },
      { label: 'Yüksek Etki', value: '3', helper: 'Ön analiz gerekli', status: 'Critical' },
      { label: 'Hazırlık Skoru', value: '%61', helper: 'Hedef %80', status: 'Watch' },
      { label: 'Yürürlük Yakın', value: '2', helper: '45 gün içinde', status: 'Critical' },
    ],
    records: [
      { id: 'HOR-001', title: 'SPK taslak raporlama değişikliği', owner: 'RegIntel', status: 'Etki Analizi', risk: 'Yüksek', dueDate: '2026-08-01', description: 'Bildirim formatı ve veri alanları değişebilir.' },
      { id: 'HOR-002', title: 'KVKK ikincil düzenleme taslağı', owner: 'KVKK Ekibi', status: 'Yükümlülük Taslağı', risk: 'Orta', dueDate: '2026-09-15', description: 'Saklama ve imha prosedürü etkisi.' },
      { id: 'HOR-003', title: 'MASAK rehber güncellemesi', owner: 'AML', status: 'Hazırlık', risk: 'Kritik', dueDate: '2026-07-20', description: 'Şüpheli işlem senaryoları güncellenmeli.' },
    ],
  },
  {
    key: 'training-awareness',
    phase: 'FAZ 33',
    title: 'Training & Awareness Center',
    subtitle: 'Uyum, KVKK ve AML eğitimlerinin atanması ve takip edilmesi.',
    badge: 'Eğitim',
    route: '/training-awareness',
    workflow: ['Training Catalog', 'Assignment', 'Completion', 'Assessment', 'Certificate'],
    metrics: [
      { label: 'Aktif Eğitim', value: '11', helper: '3 zorunlu', status: 'Normal' },
      { label: 'Tamamlama', value: '%76', helper: 'Hedef %90', status: 'Watch' },
      { label: 'Geciken Katılımcı', value: '14', helper: 'Hatırlatma', status: 'Critical' },
      { label: 'Sertifika', value: '128', helper: 'Bu yıl', status: 'Normal' },
    ],
    records: [
      { id: 'TRN-001', title: 'AML farkındalık eğitimi', owner: 'MASAK Uyum', status: 'Atandı', risk: 'Yüksek', dueDate: '2026-07-05', description: 'Şüpheli işlem ve müşteri tanıma eğitimi.' },
      { id: 'TRN-002', title: 'KVKK veri işleme eğitimi', owner: 'KVKK Ekibi', status: 'Devam Ediyor', risk: 'Orta', dueDate: '2026-07-12', description: 'Veri işleme, saklama ve imha farkındalığı.' },
      { id: 'TRN-003', title: 'SPK uyum onboarding', owner: 'Uyum', status: 'Tamamlama Bekliyor', risk: 'Orta', dueDate: '2026-06-29', description: 'Yeni çalışanlar için regülasyon onboarding.' },
    ],
  },
  {
    key: 'aml-masak',
    phase: 'FAZ 34',
    title: 'AML & MASAK Center',
    subtitle: 'Şüpheli işlem, AML senaryoları ve müşteri risk puanlama.',
    badge: 'AML / MASAK',
    route: '/aml-masak',
    workflow: ['Scenario Alert', 'Case Review', 'Risk Scoring', 'STR Decision', 'MASAK Evidence'],
    metrics: [
      { label: 'AML Alarmı', value: '23', helper: 'Son 7 gün', status: 'Critical' },
      { label: 'Şüpheli İşlem', value: '5', helper: 'İncelemede', status: 'Critical' },
      { label: 'Yüksek Risk Müşteri', value: '18', helper: 'EDD gerekli', status: 'Watch' },
      { label: 'STR Hazırlık', value: '2', helper: 'Karar bekliyor', status: 'Watch' },
    ],
    records: [
      { id: 'AML-001', title: 'Olağandışı işlem paterni', owner: 'AML Analist', status: 'Case Review', risk: 'Kritik', dueDate: '2026-06-25', description: 'Kısa sürede tekrarlayan yüksek tutarlı transferler.' },
      { id: 'AML-002', title: 'PEP müşteri izleme', owner: 'AML Analist', status: 'EDD Gerekli', risk: 'Yüksek', dueDate: '2026-06-29', description: 'Politik nüfuz sahibi müşteri için gelişmiş inceleme.' },
      { id: 'AML-003', title: 'MASAK bildirim kararı', owner: 'Uyum Müdürü', status: 'Karar Bekliyor', risk: 'Kritik', dueDate: '2026-06-27', description: 'Şüpheli işlem bildirimi için karar ve kanıt hazırlığı.' },
    ],
  },
  {
    key: 'business-continuity',
    phase: 'FAZ 35',
    title: 'Business Continuity Management',
    subtitle: 'BCP, DRP, kriz masası ve kurtarma tatbikatlarının merkezi takibi.',
    badge: 'BCP / DRP',
    route: '/business-continuity',
    workflow: ['Business Impact', 'BCP Plan', 'DRP Scenario', 'Exercise', 'Recovery Evidence'],
    metrics: [
      { label: 'Kritik Süreç', value: '14', helper: 'RTO/RPO tanımlı', status: 'Watch' },
      { label: 'Tatbikat Başarısı', value: '%82', helper: 'Son 12 ay', status: 'Normal' },
      { label: 'Açık Kurtarma Aksiyonu', value: '6', helper: '2 kritik', status: 'Critical' },
      { label: 'Kriz Hazırlığı', value: '%74', helper: 'Hedef %90', status: 'Watch' },
    ],
    records: [
      { id: 'BCP-001', title: 'Takas operasyonu iş sürekliliği planı', owner: 'Operasyon', status: 'Tatbikat Planlandı', risk: 'Kritik', dueDate: '2026-07-18', description: 'Takas süreçlerinde RTO 2 saat, RPO 15 dakika hedefi doğrulanacak.' },
      { id: 'BCP-002', title: 'Veri merkezi felaket kurtarma senaryosu', owner: 'IT Güvenlik', status: 'DRP Testi', risk: 'Yüksek', dueDate: '2026-07-25', description: 'Yedek bölge geçişi, erişim ve veri bütünlüğü kanıtları toplanacak.' },
      { id: 'BCP-003', title: 'Kriz iletişim matrisi', owner: 'Yönetişim', status: 'Review', risk: 'Orta', dueDate: '2026-08-04', description: 'Komite, regülatör ve müşteri iletişim rolleri güncellenecek.' },
    ],
  },
  {
    key: 'data-privacy',
    phase: 'FAZ 36',
    title: 'Data Privacy Center',
    subtitle: 'KVKK envanteri, veri saklama, imha ve ihlal bildirim süreçleri.',
    badge: 'KVKK Merkezi',
    route: '/data-privacy',
    workflow: ['Processing Inventory', 'Retention Rule', 'Consent / Legal Basis', 'Deletion', 'Breach Response'],
    metrics: [
      { label: 'İşleme Envanteri', value: '42', helper: '8 yüksek risk', status: 'Watch' },
      { label: 'Saklama Kuralı Eksik', value: '5', helper: 'Departman review', status: 'Critical' },
      { label: 'İmha Başarısı', value: '%88', helper: 'Aylık döngü', status: 'Normal' },
      { label: 'İhlal Tatbikatı', value: '1', helper: '30 gün içinde', status: 'Watch' },
    ],
    records: [
      { id: 'DPC-001', title: 'Müşteri onboarding veri envanteri', owner: 'KVKK Ekibi', status: 'Hukuki Sebep Review', risk: 'Yüksek', dueDate: '2026-07-08', description: 'Kimlik, iletişim ve işlem verileri için saklama gerekçesi doğrulanacak.' },
      { id: 'DPC-002', title: 'Log verisi saklama ve imha kuralı', owner: 'IT Güvenlik', status: 'Kural Eksik', risk: 'Kritik', dueDate: '2026-06-30', description: 'Audit log ve erişim logları için süre ve imha kanıtı tanımlanmalı.' },
      { id: 'DPC-003', title: 'Veri ihlali müdahale playbook', owner: 'Uyum', status: 'Tatbikat Bekliyor', risk: 'Yüksek', dueDate: '2026-07-22', description: '72 saat değerlendirme, kurul bildirimi ve ilgili kişi iletişimi test edilecek.' },
    ],
  },
  {
    key: 'esg-sustainability',
    phase: 'FAZ 37',
    title: 'ESG & Sustainability',
    subtitle: 'ESG göstergeleri, sürdürülebilirlik raporları ve karbon takip alanı.',
    badge: 'ESG',
    route: '/esg-sustainability',
    workflow: ['ESG Metric', 'Evidence Collection', 'Control Review', 'Disclosure', 'Board Reporting'],
    metrics: [
      { label: 'ESG Metrik', value: '28', helper: '12 kanıt bağlı', status: 'Normal' },
      { label: 'Eksik Kanıt', value: '7', helper: 'Rapor öncesi', status: 'Watch' },
      { label: 'Yüksek Etki Alanı', value: '4', helper: 'İklim / yönetişim', status: 'Critical' },
      { label: 'Rapor Hazırlığı', value: '%69', helper: 'Komite öncesi', status: 'Watch' },
    ],
    records: [
      { id: 'ESG-001', title: 'Sürdürülebilirlik raporu kontrol listesi', owner: 'Yönetişim', status: 'Kanıt Toplanıyor', risk: 'Yüksek', dueDate: '2026-08-12', description: 'Çevresel, sosyal ve yönetişim beyanları kanıt kasasına bağlanacak.' },
      { id: 'ESG-002', title: 'Karbon ayak izi veri kalitesi', owner: 'Finans', status: 'Doğrulama', risk: 'Orta', dueDate: '2026-08-30', description: 'Veri sağlayıcı, hesaplama yöntemi ve yönetim onayı eşleştirilecek.' },
      { id: 'ESG-003', title: 'Yönetim kurulu çeşitlilik göstergesi', owner: 'İK', status: 'Review', risk: 'Orta', dueDate: '2026-07-28', description: 'Kurumsal yönetişim beyanları için metrik ve kanıt takibi.' },
    ],
  },
  {
    key: 'enterprise-search',
    phase: 'FAZ 38',
    title: 'Enterprise Search',
    subtitle: 'Regülasyon, case, görev, onay, politika, kanıt ve audit genel araması.',
    badge: 'Unified Search',
    route: '/enterprise-search',
    workflow: ['Index Source', 'Normalize Metadata', 'Permission Filter', 'Semantic Match', 'Action'],
    metrics: [
      { label: 'İndekslenen Kayıt', value: '1.284', helper: '12 kaynak', status: 'Normal' },
      { label: 'Yetki Filtresi', value: 'Aktif', helper: 'Rol bazlı', status: 'Normal' },
      { label: 'Eksik Metadata', value: '19', helper: 'Temizlenecek', status: 'Watch' },
      { label: 'Kritik Sonuç', value: '11', helper: 'Son 24 saat', status: 'Critical' },
    ],
    records: [
      { id: 'SRCH-001', title: 'SPK yükümlülük + kanıt arama indeksi', owner: 'Uyum', status: 'Aktif', risk: 'Yüksek', dueDate: '2026-07-02', description: 'Yükümlülük, kontrol testi ve kanıt ilişkileri tek sonuçta gösterilecek.' },
      { id: 'SRCH-002', title: 'Case ve CAPA semantik arama', owner: 'Operasyon', status: 'Pilot', risk: 'Orta', dueDate: '2026-07-16', description: 'Benzer bulgu, kök neden ve aksiyon kayıtları eşleştirilecek.' },
      { id: 'SRCH-003', title: 'Audit log permission filter', owner: 'IT Güvenlik', status: 'Review', risk: 'Kritik', dueDate: '2026-06-29', description: 'Denetim kayıtlarında rol bazlı görünürlük ve maskeleme uygulanacak.' },
    ],
  },
  {
    key: 'ai-compliance-officer',
    phase: 'FAZ 39',
    title: 'AI Compliance Officer',
    subtitle: 'Copilot’un mevzuat, yükümlülük, etki zinciri ve aksiyon öneren kurumsal hali.',
    badge: 'AI Officer',
    route: '/ai-compliance-officer',
    workflow: ['Question', 'Source Retrieval', 'Impact Chain', 'Obligation Draft', 'Workflow Action'],
    metrics: [
      { label: 'Cevap Güveni', value: '%86', helper: 'Kaynaklı yanıt', status: 'Normal' },
      { label: 'Etki Zinciri', value: '23', helper: 'Otomatik eşleşme', status: 'Watch' },
      { label: 'Önerilen Aksiyon', value: '17', helper: 'Onaya hazır', status: 'Watch' },
      { label: 'Kritik Uyarı', value: '4', helper: 'Yönetici brifingi', status: 'Critical' },
    ],
    records: [
      { id: 'AICO-001', title: 'SPK değişikliği etki analizi', owner: 'AKOP AI', status: 'Kaynaklı Yanıt', risk: 'Yüksek', dueDate: '2026-06-26', description: 'Yeni SPK metni; yükümlülük, kontrol ve politika zinciriyle eşleşti.' },
      { id: 'AICO-002', title: 'MASAK senaryo önerisi', owner: 'Finansal Suçlar', status: 'Onay Bekliyor', risk: 'Kritik', dueDate: '2026-06-27', description: 'Adverse media sinyali AML senaryo eşiğiyle birleştirildi.' },
      { id: 'AICO-003', title: 'Yönetim kurulu brifingi', owner: 'Yönetici', status: 'Taslak', risk: 'Orta', dueDate: '2026-07-01', description: 'Son 7 gün regülasyon etkileri kısa yönetici brifingine dönüştürüldü.' },
    ],
  },
  {
    key: 'real-integrations',
    phase: 'FAZ 40',
    title: 'Real Integration Layer',
    subtitle: 'Kurum kaynakları, cron/worker, kalıcı kayıt, bildirim ve retry altyapısı.',
    badge: 'Production Layer',
    route: '/real-integrations',
    workflow: ['Source Registry', 'Connector', 'Cron Watch', 'Deduplication', 'Notification'],
    metrics: [
      { label: 'Kaynak Registry', value: '12', helper: 'TR + global', status: 'Normal' },
      { label: '1 dk Watch', value: 'Aktif', helper: 'Cron-ready', status: 'Normal' },
      { label: 'Adapter Gerekli', value: '4', helper: 'Kapalı/üyelikli kaynak', status: 'Watch' },
      { label: 'Retry Queue', value: 'Hazır', helper: 'Backoff + health', status: 'Normal' },
    ],
    records: [
      { id: 'INT-001', title: 'SPK web servis + bülten watcher', owner: 'RegIntel', status: 'Live Adapter', risk: 'Yüksek', dueDate: '2026-06-23', description: 'SPK web servisleri ve bülten sayfaları tek kaynak adaptöründe izlenir.' },
      { id: 'INT-002', title: 'BDDK / KVKK / Resmi Gazete watcher', owner: 'Data Hub', status: 'Watcher Ready', risk: 'Yüksek', dueDate: '2026-06-23', description: 'Duyuru sayfaları checksum/dedup mantığıyla 1 dakikalık taramaya hazırlandı.' },
      { id: 'INT-003', title: 'MKK / Takasbank / KAP entegrasyon kapısı', owner: 'Operasyon', status: 'Credential Required', risk: 'Kritik', dueDate: '2026-06-24', description: 'Üyelik/API anahtarı gerektiren kaynaklar adapter-ready olarak ayrıldı.' },
    ],
  },
]

export function fetchEnterprisePhaseModules(): EnterprisePhaseModule[] {
  return modules
}

export function getEnterprisePhaseModule(key: EnterprisePhaseKey): EnterprisePhaseModule {
  const module = modules.find((item) => item.key === key)
  if (!module) throw new Error(`Unknown enterprise phase module: ${key}`)
  return module
}

export function getEnterpriseStatusBadgeClass(status: EnterprisePhaseStatus) {
  switch (status) {
    case 'Normal': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'Watch': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Critical': return 'bg-rose-50 text-rose-700 border-rose-200/60'
  }
}

export function getEnterpriseRiskBadgeClass(risk: EnterprisePhaseRecord['risk']) {
  switch (risk) {
    case 'Kritik': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'Yüksek': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'Orta': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Düşük': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}
