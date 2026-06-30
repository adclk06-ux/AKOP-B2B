export type SceneKey = 'hero' | 'data' | 'risk' | 'core' | 'executive'

export type NarrativeScene = {
  key: SceneKey
  range: string
  eyebrow: string
  title: string
  body: string
  modules: string[]
  metrics?: { label: string; value: string; tone?: 'info' | 'success' | 'warning' | 'risk' }[]
  cards: ExperienceCard[]
}

export type ExperienceCard = {
  title: string
  lines: string[]
  detail: string
  attributes: string[]
  workflow: string[]
  copilot: string
}

export const scenes: NarrativeScene[] = [
  {
    key: 'hero',
    range: '0% - 20%',
    eyebrow: 'Sistemin Merkezi',
    title: 'Regülasyondan Operasyona, Tek Kontrol Merkezi',
    body:
      'AKOP; finans kurumlarının mevzuat, risk, mutabakat, kontrol, onay, denetim ve yapay zeka süreçlerini tek bir Compliance Operating System altında birleştirir.',
    modules: ['Live Regulatory Intelligence', 'AI Risk Scoring', 'Real-time Watch Layer'],
    metrics: [
      { label: 'SPK / BDDK / MASAK / MKK / Takasbank', value: 'Canlı izleme', tone: 'info' },
      { label: 'RegTech katmanı', value: 'Aktif', tone: 'success' },
      { label: 'Watch signals', value: '1.248', tone: 'info' },
    ],
    cards: [
      {
        title: 'Command Center',
        lines: ['Canlı regülasyon izleme', 'Yükümlülükten kanıta izlenebilirlik', 'Kurumsal denetim izi'],
        detail:
          'AKOP Aracı Kurum Operasyon Platformu; regülasyon, mutabakat, vaka, onay, kontrol testi, kanıt ve yönetim raporlamasını tek bir operasyon omurgasında birleştirir.',
        attributes: ['Tek kontrol merkezi', '7/24 operasyon görünürlüğü', 'SPK, BDDK, MASAK, MKK ve Takasbank kapsamı'],
        workflow: ['Kaynak izlenir', 'Etki analizi yapılır', 'Aksiyon göreve dönüşür', 'Kanıt ve audit trail oluşur'],
        copilot: 'AKOP Copilot; kullanıcının baktığı ekranı, açık görevleri, SLA baskısını ve regülasyon bağlamını birlikte okuyarak aksiyon önerir.',
      },
    ],
  },
  {
    key: 'data',
    range: '20% - 40%',
    eyebrow: 'Data Hub & Intel',
    title: 'Algılama ve Analiz Katmanı',
    body:
      'Regülasyon kaynakları, entegrasyon sinyalleri ve kurum içi operasyon verisi tek bir veri zekası katmanında normalize edilir.',
    modules: ['Data Hub', 'Regulatory Intelligence', 'Horizon Scanning', 'Notification Center'],
    cards: [
      {
        title: 'Data Hub',
        lines: ['SPK, BDDK, MASAK, MKK ve Takasbank kaynakları izleniyor', 'TCMB, KVKK ve Resmi Gazete akışları sınıflanıyor'],
        detail: 'Dağınık regülasyon ve operasyon kaynaklarını tek veri sözlüğüne indirger; mükerrer kayıt, manuel takip ve e-posta bağımlılığını azaltır.',
        attributes: ['Kaynak bazlı izleme', 'Versiyon geçmişi', 'Entegrasyon sağlığı', 'Bildirim önceliği'],
        workflow: ['Kaynak taranır', 'Veri normalize edilir', 'Kurum içi modülle eşleştirilir', 'İlgili ekibe bildirim düşer'],
        copilot: 'Copilot yeni veri geldiğinde “bu kurum için ne değişti?” sorusuna kaynaklı ve aksiyonlanabilir cevap üretir.',
      },
      {
        title: 'Regulatory Intelligence',
        lines: ['Yeni düzenlemeler eski versiyonlarla karşılaştırılıyor', 'Etki alanı ve sorumlu ekip öneriliyor'],
        detail: 'Mevzuat değişikliklerini sadece listelemez; farkı, etki alanını, risk seviyesini ve uygulanacak kontrol zincirini çıkarır.',
        attributes: ['Metin karşılaştırma', 'Etki skoru', 'Sorumlu ekip önerisi', 'Yürürlük tarihi takibi'],
        workflow: ['Yeni metin alınır', 'Önceki versiyonla kıyaslanır', 'Yükümlülük çıkarılır', 'Kontrol ve görev önerilir'],
        copilot: 'Copilot mevzuatı sade Türkçeyle açıklar, hangi ekranlarda aksiyon alınacağını doğrudan gösterir.',
      },
      {
        title: 'Horizon Scanning',
        lines: ['Taslak düzenlemeler yürürlük öncesi takip ediliyor', 'Riskli tarih ve aksiyon pencereleri çıkarılıyor'],
        detail: 'Henüz yürürlüğe girmemiş taslakları izleyerek kurumu son dakika paniğinden çıkarır; hazırlık penceresini görünür kılar.',
        attributes: ['Taslak izleme', 'Erken uyarı', 'Hazırlık takvimi', 'Ön etki analizi'],
        workflow: ['Taslak yakalanır', 'Olası etki hesaplanır', 'Hazırlık görevi açılır', 'Yönetici özeti hazırlanır'],
        copilot: 'Copilot “önümüzdeki 30 günde hangi düzenlemeler bizi etkiler?” sorusuna operasyonel cevap verir.',
      },
    ],
  },
  {
    key: 'risk',
    range: '40% - 60%',
    eyebrow: 'AI Risk Scoring',
    title: 'Analitik Düşünce Motoru',
    body:
      'AKOP, mevzuat etkisini, kurum riskini, işlem bağlamını ve SLA baskısını bir araya getirerek uygulanabilir risk skoru üretir.',
    modules: ['Risk Center', 'AI Risk Scoring', 'Adverse Media', 'AML & MASAK'],
    metrics: [
      { label: 'Compliance Score', value: '87.4', tone: 'success' },
      { label: 'Critical Risks', value: '23', tone: 'risk' },
      { label: 'Adverse Media Signals', value: '6', tone: 'warning' },
      { label: 'AML Watch Flags', value: '4', tone: 'risk' },
    ],
    cards: [
      {
        title: 'AI Risk Scoring Engine',
        lines: ['Ülke riski', 'Kurum riski', 'İşlem riski', 'SLA riski', 'Mevzuat etki skoru'],
        detail: 'Risk puanı tek bir sayıya indirgenmez; mevzuat etkisi, operasyon yoğunluğu, SLA gecikmesi ve kurum hassasiyeti birlikte değerlendirilir.',
        attributes: ['Dinamik risk skoru', 'Heatmap görünümü', 'AML/MASAK sinyalleri', 'Adverse media izleme'],
        workflow: ['Sinyal alınır', 'Risk modeli çalışır', 'Kritik alan renklendirilir', 'Case veya görev önerilir'],
        copilot: 'Copilot riskin neden yükseldiğini açıklar ve “hangi aksiyon bunu düşürür?” sorusuna modül bazlı cevap verir.',
      },
    ],
  },
  {
    key: 'core',
    range: '60% - 80%',
    eyebrow: 'Operational Core',
    title: 'Riskten Aksiyona Çalışan İşletim Çekirdeği',
    body:
      'Tespit edilen sinyaller yükümlülüğe, kontrole, teste, vakaya, onaya ve kanıta dönüşür. Her adım izlenebilir ve denetlenebilirdir.',
    modules: ['Obligation Management', 'Control Testing', 'Workflow Engine', 'Case Management', 'Approval Center', 'Evidence Vault'],
    cards: [
      {
        title: 'Regülasyon zinciri',
        lines: ['Regülasyon -> Yükümlülük -> Kontrol -> Test -> Kanıt'],
        detail: 'AKOP, regülasyonu okunmuş bir doküman olarak bırakmaz; yükümlülüğe, kontrole, teste ve denetlenebilir kanıta dönüştürür.',
        attributes: ['Obligation Management', 'Control Testing', 'Evidence Vault', 'Audit Trail'],
        workflow: ['Regülasyon seçilir', 'Yükümlülük açılır', 'Kontrol testi planlanır', 'Kanıt kasaya alınır'],
        copilot: 'Copilot eksik kanıtı, geciken testi ve uyumsuz yükümlülüğü yönetici sormadan önce gündeme getirir.',
      },
      {
        title: 'Risk zinciri',
        lines: ['Risk -> Case -> Workflow -> Approval'],
        detail: 'Kritik riskler vaka yönetimine düşer; sorumlu, SLA, onay seviyesi ve karar izi tek akışta yönetilir.',
        attributes: ['Case Management', 'Multi-Level Workflow', 'Approval Center', 'SLA Guard'],
        workflow: ['Risk case olur', 'Sahip atanır', 'Onay akışı başlar', 'Karar ve iz saklanır'],
        copilot: 'Copilot bekleyen onayları, geciken SLA’ları ve aynı riske bağlı vakaları tek yanıtla özetler.',
      },
      {
        title: 'Operasyon zinciri',
        lines: ['MKK/Takasbank farkı -> Incident -> CAPA'],
        detail: 'Mutabakat veya takas farkı operasyonel kör nokta olmaktan çıkar; incident, kök neden ve CAPA sürecine bağlanır.',
        attributes: ['MKK Mutabakat', 'Takasbank İzleme', 'Incident Management', 'CAPA Center'],
        workflow: ['Fark yakalanır', 'Incident açılır', 'Kök neden belirlenir', 'CAPA kapanışı takip edilir'],
        copilot: 'Copilot farkın etkisini, ilgili işlem kümelerini ve kapanış için gereken aksiyonu operasyon dilinde anlatır.',
      },
    ],
  },
  {
    key: 'executive',
    range: '80% - 100%',
    eyebrow: 'Executive Board',
    title: 'Büyük Resim: Yönetilebilir, Raporlanabilir, Denetlenebilir',
    body:
      'Operasyonel karmaşa yönetim kuruluna hazır, sakin ve karar verilebilir bir uyum görünümüne dönüşür.',
    modules: ['Executive Mode', 'Dashboard', 'Board Report', 'AI Compliance Officer', 'Advanced Analytics', 'Enterprise Search'],
    metrics: [
      { label: 'Board report', value: 'Hazır', tone: 'success' },
      { label: 'Workflow health', value: '%94', tone: 'info' },
      { label: 'SLA recovery', value: '%100', tone: 'success' },
    ],
    cards: [
      {
        title: 'AKOP Copilot',
        lines: ['SLA aşan mutabakatlar temizlendi.', 'Yeni SPK tebliğine uyum %100 sağlandı.', 'Kritik riskler yönetim raporuna hazırlandı.'],
        detail:
          'AKOP Copilot sitenin üstüne eklenmiş bir sohbet kutusu değildir; Aracı Kurum Operasyon Platformu’nun regülasyon, risk, görev, vaka, onay, mutabakat ve raporlama hafızasını konuşulabilir hale getiren ana zeka katmanıdır.',
        attributes: ['Doğal dil sorgu', 'Ekran bağlamı', 'Kaynaklı cevap', 'Aksiyon önerisi', 'Yönetici özeti'],
        workflow: ['Kullanıcı sorar', 'Copilot operasyon bağlamını okur', 'Kaynak ve modül eşleşir', 'Cevap aksiyona dönüşür'],
        copilot: 'Copilot; yöneticiye büyük resmi, operasyon ekibine yapılacak işi, uyum ekibine denetlenebilir kanıtı aynı platform içinde verir.',
      },
    ],
  },
]

export type Hotspot = {
  id: string
  label: string
  detail: string
  score: string
  scene: SceneKey
  x: number
  y: number
  tone: 'info' | 'success' | 'warning' | 'risk'
}

export const hotspots: Hotspot[] = [
  { id: 'spk', label: 'SPK', detail: 'Yeni tebliğ etki analizi başlatıldı', score: 'Etki: 74', scene: 'data', x: 58, y: 29, tone: 'info' },
  { id: 'bddk', label: 'BDDK', detail: 'Taslak metin karşılaştırması tamamlandı', score: 'Uyum: %91', scene: 'data', x: 68, y: 42, tone: 'success' },
  { id: 'masak', label: 'MASAK / AML Merkezi', detail: 'Şüpheli işlem bildirimi tetiklendi', score: 'Risk: 82 / Kritik', scene: 'risk', x: 61, y: 52, tone: 'risk' },
  { id: 'mkk', label: 'MKK Mutabakat', detail: 'Operasyon farkı case akışına alındı', score: 'SLA: 38 dk', scene: 'core', x: 46, y: 58, tone: 'warning' },
  { id: 'takasbank', label: 'Takasbank İzleme', detail: 'Validasyon uyarısı CAPA önerisine dönüştü', score: 'Durum: İncelemede', scene: 'core', x: 56, y: 66, tone: 'warning' },
  { id: 'risk', label: 'Risk Center', detail: 'Heatmap kritik yoğunluk bölgesi tespit etti', score: '23 kritik', scene: 'risk', x: 43, y: 35, tone: 'risk' },
  { id: 'control', label: 'Control Testing', detail: 'Kanıt toplama kontrol testi ile eşleştirildi', score: 'Başarılı', scene: 'core', x: 36, y: 50, tone: 'success' },
  { id: 'approval', label: 'Approval Center', detail: 'Çok seviyeli onay akışı beklemede', score: '2 onay', scene: 'core', x: 64, y: 48, tone: 'info' },
  { id: 'evidence', label: 'Evidence Vault', detail: 'Denetim kanıtı zaman damgası ile saklandı', score: 'Audit-ready', scene: 'core', x: 48, y: 43, tone: 'success' },
  { id: 'executive', label: 'Executive Mode', detail: 'Yönetim kurulu raporu oluşturuldu', score: 'Hazır', scene: 'executive', x: 55, y: 31, tone: 'success' },
  { id: 'copilot', label: 'AKOP Copilot', detail: 'Kritik riskler yönetim özetine aktarıldı', score: 'Yanıt süresi: 1.2 sn', scene: 'executive', x: 72, y: 58, tone: 'info' },
]
