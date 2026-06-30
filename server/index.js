import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { OpenAI } from 'openai'
import multer from 'multer'
import { fetchLatestSpkBulletin, getMockBulletin, fetchSpkBulletinArchive, fetchSpkBulletinArchiveRange, getMockBulletinArchive } from './services/spkBulletins.js'
import { fetchLatestSpkPressRelease, getMockPressRelease, fetchSpkPressReleaseArchive, getMockPressReleaseArchive } from './services/spkPressReleases.js'
import { fetchSpkLegislationArchive, getMockLegislationArchive, debugSpkLegislation } from './services/spkLegislation.js'
import { fetchSpkPdfText, parsePdfBuffer } from './services/spkPdfParser.js'
import { enrichLegislationRecord, fetchSpkLegislationPdfText, getCachedLegislationContent, extractLegislationDatesFromText } from './services/spkLegislationPdfParser.js'
import { upsertSpkArchiveRecords, getSpkArchiveRecords, getSpkArchiveSummary, filterSpkArchive, setArchiveCoverage, setSpkArchiveRecords, getDuplicateStats } from './services/spkSyncStore.js'
import { getRecordSortTimestamp } from './utils/dateSort.js'
import { fetchBddkArchive, debugBddkArchive } from './services/bddkArchive.js'
import { getIntegrationHealth, getIntegrationRegistry, runIntegrationWatchScan } from './services/realIntegrationRegistry.js'

// ── Helpers for archive normalization ──────────────────────────────────────

function decodeHtmlEntities(str) {
  if (!str) return str
  return str
    .replace(/&#252;/g, 'ü').replace(/&#220;/g, 'Ü')
    .replace(/&#231;/g, 'ç').replace(/&#199;/g, 'Ç')
    .replace(/&#246;/g, 'ö').replace(/&#214;/g, 'Ö')
    .replace(/&#287;/g, 'ğ').replace(/&#286;/g, 'Ğ')
    .replace(/&#305;/g, 'ı').replace(/&#304;/g, 'İ')
    .replace(/&#351;/g, 'ş').replace(/&#350;/g, 'Ş')
    .replace(/&#39;/g, "'").replace(/&#226;/g, 'â')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
}

const MONTH_MAP = {
  'ocak': '01', 'oca': '01',
  'subat': '02', 'sub': '02', 'şubat': '02',
  'mart': '03', 'mar': '03',
  'nisan': '04', 'nis': '04',
  'mayis': '05', 'mayıs': '05', 'may': '05',
  'haziran': '06', 'haz': '06',
  'temmuz': '07', 'tem': '07',
  'agustos': '08', 'agu': '08', 'ağustos': '08',
  'eylul': '09', 'eylül': '09', 'eyl': '09',
  'ekim': '10', 'eki': '10',
  'kasim': '11', 'kasım': '11', 'kas': '11',
  'aralik': '12', 'aralık': '12', 'ara': '12',
}

function parseTurkishDateFallback(dateStr) {
  const clean = decodeHtmlEntities(dateStr)
    .replace(/\s+/g, ' ').trim().toLowerCase()
    .replace(/\s+(pazartesi|salı|sali|çarşamba|carsamba|perşembe|persembe|cuma|cumartesi|pazar)\s*$/i, '')
  const parts = clean.split(' ')
  if (parts.length < 3) return null
  const day = parts[0].padStart(2, '0')
  const monthName = parts[1].toLowerCase()
  const year = parts[2]
  const month = MONTH_MAP[monthName]
  if (!month) return null
  const iso = `${year}-${month}-${day}`
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : iso
}

function slug(str) {
  return decodeHtmlEntities(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u00e7\u011f\u0131\u00f6\u015f\u00fc]/gi, '')
    .slice(0, 30)
}

const app = express()
app.use(cors())
app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Sadece PDF dosyaları kabul edilir.'), false)
  },
})

const hasOpenAIKey = Boolean(process.env.OPENAI_API_KEY)
const openai = hasOpenAIKey
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

console.info('[Assistant Proxy] OPENAI_API_KEY loaded:', hasOpenAIKey)
console.info('[Assistant Proxy] OPENAI_MODEL:', process.env.OPENAI_MODEL || 'gpt-4o-mini')

// Rate limit: memory-based, max 20 requests per minute per IP
const rateLimitMap = new Map()
const MAX_REQUESTS = 20
const WINDOW_MS = 60_000

function rateLimit(ip) {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []
  const valid = timestamps.filter((t) => now - t < WINDOW_MS)
  if (valid.length >= MAX_REQUESTS) return false
  valid.push(now)
  rateLimitMap.set(ip, valid)
  return true
}

// ── SPK AI helpers ──────────────────────────────────────────────────────────

const AREA_KEYWORDS = {
  Uyum: ['idari para cezası', 'tebliğ', 'kurul kararı', 'düzenleme', 'mevzuat', 'yönetmelik', 'genelge', 'soruşturma', 'denetim', 'ceza', 'suç duyurusu', 'yaptırım'],
  Risk: ['risk yönetimi', 'temerrüt', 'özkaynak', 'kaldıraç', 'marj', 'sermaye yeterliliği', 'açığa satış', 'kredili işlem'],
  Operasyon: ['operasyonel prosedür', 'işlem talimatı', 'uygulama esasları', 'netleştirme', 'valör'],
  MKK: ['merkezi kayıt kuruluşu', 'kaydi sistem', 'kaydi üyelik', 'merkezi saklama', 'sicil'],
  Takasbank: ['takasbank', 'takas ve saklama', 'teminat yönetimi', 'clearing'],
  MASAK: ['masak', 'kara para', 'şüpheli işlem', 'mali suç', 'uyap'],
  'Müşteri Bildirimi': ['müşteri bilgilendirme', 'risk bildirimi', 'mağdur', 'tazminat'],
  'Emir İletimi': ['hızlı emir', 'elektronik işlem', 'otomatik emir', 'algoritmik'],
  'Açığa Satış': ['açığa satış', 'kredili işlem', 'borçlanma', 'kısa pozisyon', 'ödünç'],
  'Halka Arz': ['halka arz', 'izahname', 'sermaye artırım', 'pay ihracı'],
  'Portföy Yönetimi': ['portföy yönetimi', 'yatırım fonu', 'emeklilik fonu', 'kolektif yatırım'],
  'Yatırım Danışmanlığı': ['yatırım danışmanlığı', 'uygunluk testi', 'yatırım önerisi', 'suitability'],
  Araştırma: ['araştırma raporu', 'hedef fiyat', 'yatırım araştırması'],
  'İç Kontrol': ['iç kontrol', 'gözetim', 'self assessment', 'denetim komitesi'],
  'Bilgi Teknolojileri': ['bilgi sistemleri', 'siber güvenlik', 'dijital platform', 'altyapı'],
}

// Single-area fallback to avoid repetition
const BULLETIN_FALLBACK_AREAS = ['Uyum']
const PRESS_FALLBACK_AREAS = ['Piyasa Bilgilendirme']

function inferAffectedAreasFromText(text, record) {
  const combined = `${text || ''} ${record?.title || ''} ${record?.number || ''}`.toLowerCase()
  const matched = []
  for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
    if (keywords.some((kw) => combined.includes(kw))) matched.push(area)
  }
  const deduped = [...new Set(matched)]

  if (record?.sourceType === 'press-release') {
    const withoutUyum = deduped.filter((a) => a !== 'Uyum')
    if (withoutUyum.length > 0) return withoutUyum.slice(0, 2)
    return PRESS_FALLBACK_AREAS
  }

  if (record?.sourceType === 'legislation') {
    if (deduped.length > 0) return deduped.slice(0, 2)
    return ['Uyum', 'Operasyon']
  }

  if (deduped.length === 0) return BULLETIN_FALLBACK_AREAS
  return deduped.slice(0, 2)
}

function computeImpactLevel(text, record) {
  const combined = `${text || ''} ${record?.title || ''}`.toLowerCase()
  const highSignals = ['idari para cezası', 'ceza', 'iptal', 'men', 'tedbir', 'geçici', 'soruşturma', 'ihlal', 'ciddi']
  const mediumSignals = ['uyarı', 'bildirim', 'duyuru', 'değişiklik', 'güncelleme', 'tebliğ']
  if (highSignals.some((s) => combined.includes(s))) return 'high'
  if (mediumSignals.some((s) => combined.includes(s))) return 'medium'
  return 'low'
}

function buildFallbackAnalysis(record, sourceText, reason) {
  const areas = inferAffectedAreasFromText(sourceText, record)
  const impact = computeImpactLevel(sourceText, record)
  const sourceTypeLabel = record?.sourceType === 'bulletin' ? 'bülteni' : record?.sourceType === 'legislation' ? 'mevzuat düzenlemesi' : 'basın duyurusu'
  const number = record?.number || record?.title || 'Bilinmeyen'

  const summaries = []
  if (sourceText && sourceText.length > 50) {
    summaries.push(`${number} numaralı SPK ${sourceTypeLabel} üzerinde AI analizi denendi ancak ${reason}. Metin önizlemesi: "${sourceText.slice(0, 120).replace(/\s+/g, ' ').trim()}...". Uyum ekibi manuel inceleme yapmalıdır.`)
  } else {
    summaries.push(`${number} numaralı SPK ${sourceTypeLabel} için otomatik analiz alınamadı. Sebep: ${reason}. Kayıt başlığı ve tarih bilgisine göre uyum ekibi tarafından manuel incelenmesi önerilir.`)
  }

  const keyDecisions = []
  if (sourceText && sourceText.length > 50) {
    const lines = sourceText.split(/\n|\r/).filter((l) => l.trim().length > 15).slice(0, 3)
    lines.forEach((line) => {
      keyDecisions.push(`${line.trim().slice(0, 90)}${line.length > 90 ? '...' : ''}`)
    })
  }
  if (keyDecisions.length === 0) {
    keyDecisions.push(`${number} kaydının detaylı incelenmesi gerekmektedir.`)
  }

  const complianceMap = {
    Uyum: ['İlgili tebliğ/yönetmelik metni incelenmeli.', 'Mevzuat değişikliği ekiplerine duyurulmalı.'],
    Risk: ['Risk limitleri ve özkaynak etkisi hesaplanmalı.', 'Kredi ve marj parametreleri kontrol edilmeli.'],
    Operasyon: ['İşlem akışları ve valör tarihleri gözden geçirilmeli.', 'Operasyon ekibi bilgilendirilmeli.'],
    MKK: ['Merkezi kayıt sicili ve bildirim kontrolü yapılmalı.', 'Kaydi sistem uyumu doğrulanmalı.'],
    Takasbank: ['Takas tarihleri ve netleştirme süreçleri incelenmeli.', 'Teminat yönetimi ve temerrüt kontrolü yapılmalı.'],
    MASAK: ['Şüpheli işlem bildirim prosedürleri gözden geçirilmeli.', 'Müşteri kimlik tespiti ve kayıtları kontrol edilmeli.'],
    'Müşteri Bildirimi': ['Müşteri bilgilendirme şablonları güncellenmeli.', 'Risk bildirim formları yeniden değerlendirilmeli.'],
    'Emir İletimi': ['Elektronik emir iletim altyapısı kontrol edilmeli.', 'Hızlı emir ve algoritmik işlem prosedürleri incelenmeli.'],
    'Açığa Satış': ['Açığa satış limitleri ve emir kontrolü yapılmalı.', 'Kredili işlem ve ödünç alma süreçleri denetlenmeli.'],
    'Halka Arz': ['İzahname ve fiyat tespit raporu incelenmeli.', 'Dağıtım ve talep toplama süreçleri kontrol edilmeli.'],
    'Portföy Yönetimi': ['Fon içtüzüğü ve portföy sözleşmeleri kontrol edilmeli.', 'Yatırım limitleri ve varlık dağılımı gözden geçirilmeli.'],
    'Yatırım Danışmanlığı': ['Uygunluk testi formları ve müşteri profili incelenmeli.', 'Yatırım önerisi dokümantasyonu güncellenmeli.'],
    Araştırma: ['Araştırma raporu bağımsızlık politikası kontrol edilmeli.', 'Hedef fiyat ve rating metodolojisi gözden geçirilmeli.'],
    'İç Kontrol': ['İç kontrol prosedürleri ve risk haritası güncellenmeli.', 'Denetim komitesi raporlaması hazırlanmalı.'],
    'Bilgi Teknolojileri': ['Bilgi sistemleri erişim logları incelenmeli.', 'Siber güvenlik yama ve altyapı kontrolü yapılmalı.'],
    'Kurumsal Duyuru': ['Basın duyurusu metni ve yasal dayanak kontrol edilmeli.', 'Kurumsal iletişim ekibi bilgilendirilmeli.'],
    'Piyasa Bilgilendirme': ['Piyasa duyurusu kapsamı ve yatırımcı etkisi değerlendirilmeli.', 'İç bilgilendirme ve halka açık açıklama tutarlılığı kontrol edilmeli.'],
  }

  const checklist = []
  areas.slice(0, 2).forEach((area) => {
    const items = complianceMap[area] || complianceMap['Uyum']
    if (items) checklist.push(...items)
  })
  if (checklist.length === 0) {
    checklist.push('Kayıt başlığı ve tarihi kaydedilmeli.', 'İlgili ekibe inceleme için yönlendirilmeli.')
  }

  const actionMap = {
    Uyum: 'Uyum ekibi kaydı detaylı incelemeli ve ilgili düzenleme değişikliklerini değerlendirmelidir.',
    Risk: 'Risk yönetimi ekibi ilgili riskleri değerlendirmeli ve özkaynak etkisini hesaplamalıdır.',
    Operasyon: 'Operasyon ekibi süreçleri gözden geçirmeli ve gerekli prosedür güncellemelerini yapmalıdır.',
    MKK: 'MKK bildirim sorumlusu kaydı incelemeli ve yatırımcı bilgilendirme süreçlerini kontrol etmelidir.',
    Takasbank: 'Takas ve saklama ekibi ilgili işlem akışlarını incelemeli ve teminat yönetimini güncellemelidir.',
    MASAK: 'MASAK uyum sorumlusu müşteri tanıma ve şüpheli işlem prosedürlerini gözden geçirmelidir.',
    'Müşteri Bildirimi': 'Müşteri ilişkileri ekibi bildirim şablonlarını ve haklar prosedürlerini güncellemelidir.',
    'Emir İletimi': 'Emir iletim ekibi sistem kontrollerini yapmalı ve elektronik işlem altyapısını incelemelidir.',
    'Açığa Satış': 'Kredili işlem ekibi açığa satış limitlerini ve ödünç alma süreçlerini kontrol etmelidir.',
    'Halka Arz': 'Halka arz ekibi izahname güncellemelerini ve prosedürleri gözden geçirmelidir.',
    'Portföy Yönetimi': 'Portföy yönetimi ekibi sözleşme ve fon işlemlerini incelemelidir.',
    'Yatırım Danışmanlığı': 'Yatırım danışmanlığı ekibi uygunluk testi formlarını ve sözleşmeleri güncellemelidir.',
    Araştırma: 'Araştırma ekibi rapor politikalarını ve hedef fiyat yöntemlerini gözden geçirmelidir.',
    'İç Kontrol': 'İç kontrol ekibi prosedürleri güncellemeli ve risk komitesini bilgilendirmelidir.',
    'Bilgi Teknolojileri': 'BT ekibi bilgi sistemleri güvenliğini ve dijital altyapıyı kontrol etmelidir.',
  }

  const recommendedAction = actionMap[areas[0]] || 'Uyum ekibi kaydı incelemeli ve gerekli aksiyonları belirlemelidir.'

  const operationalMap = {
    Uyum: 'Düzenleme değişikliklerine bağlı prosedür güncellemesi gerekebilir.',
    Risk: 'Risk parametrelerinin ve limitlerin güncellenmesi gerekebilir.',
    Operasyon: 'Operasyonel süreçlerde değişiklik ve ek eğitim ihtiyacı olabilir.',
    MKK: 'MKK bildirim sistemlerinde ve yatırımcı kayıtlarında güncelleme gerekebilir.',
    Takasbank: 'Takas ve saklama işlemlerinde ek kontrol veya sistem ayarı gerekebilir.',
    MASAK: 'Müşteri tanıma ve şüpheli işlem tarama süreçlerinde güncelleme gerekebilir.',
    'Müşteri Bildirimi': 'Müşteri bildirim şablonlarının ve iletişim süreçlerinin güncellenmesi gerekebilir.',
    'Emir İletimi': 'Emir iletim sistemlerinde teknik kontrol veya altyapı güncellemesi gerekebilir.',
    'Açığa Satış': 'Açığa satış ve kredili işlem limitlerinin sistemsel güncellenmesi gerekebilir.',
    'Halka Arz': 'Halka arz süreçlerinde izahname ve prosedür güncellemesi gerekebilir.',
    'Portföy Yönetimi': 'Portföy yönetim sistemlerinde fon işlemleri ve sözleşme güncellemesi gerekebilir.',
    'Yatırım Danışmanlığı': 'Yatırım danışmanlığı platformlarında uygunluk testi güncellemesi gerekebilir.',
    Araştırma: 'Araştırma raporu yayınlama süreçlerinde politika güncellemesi gerekebilir.',
    'İç Kontrol': 'İç kontrol prosedürlerinde ve komite raporlamalarında değişiklik gerekebilir.',
    'Bilgi Teknolojileri': 'BT sistemlerinde güvenlik yaması veya altyapı güncellemesi gerekebilir.',
  }

  return {
    summary: summaries[0],
    keyDecisions,
    affectedAreas: areas,
    recommendedAction,
    impactLevel: impact,
    complianceChecklist: checklist.slice(0, 4),
    possibleOperationalImpact: operationalMap[areas[0]] || 'Potansiyel operasyonel değişiklik gerekebilir.',
    sourceBasis: 'fallback',
    reliability: 'low',
    errorNote: reason,
    disclaimer: 'Bu analiz otomatik sistem tarafından üretilmiştir, kesin bilgi için ilgili düzenlemeye başvurun.',
  }
}

async function safeOpenAiCall(params, timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('OpenAI timeout')), timeoutMs)
    openai.chat.completions.create(params)
      .then((result) => { clearTimeout(timer); resolve(result) })
      .catch((err) => { clearTimeout(timer); reject(err) })
  })
}

function buildContextLabel(context) {
  const roleMap = {
    operation: 'Operasyon',
    admin: 'Admin',
    approver: 'Admin',
  }
  const pageMap = {
    '/': 'Dashboard',
    '/assistant': 'Asistan',
    '/dashboard': 'Dashboard',
    '/transactions': 'İşlemler',
    '/approvals': 'Onaylar',
    '/reports': 'Raporlar',
    '/audit-logs': 'Audit Log',
    '/users': 'Kullanıcılar',
    '/new-transaction': 'Yeni İşlem',
  }
  const roleLabel = roleMap[context?.userRole] || 'Operasyon'
  const page = pageMap[context?.currentPage] || 'Genel'
  const tx = context?.selectedTransactionType || 'Genel Yardım'
  return `${roleLabel} / ${page} / ${tx}`
}

function buildSystemPrompt(context, ragContext) {
  const txType = context?.selectedTransactionType || ''

  let prompt = `Sen "AKOP — Aracı Kurum Operasyon Platformu" içerisinde çalışan uzman bir Operasyon, Mevzuat ve Risk Asistanısın. Sitenin her modülünü, sürecini ve ekranını eksiksiz biliyorsun. Siteye ilk kez giren kullanıcılara da platformu adım adım öğretiyorsun.

## Kullanıcı Durumu
Kullanıcı Rolü: ${context?.userRole || 'Operasyon'}
Mevcut Sayfa: ${context?.currentPage || 'Genel'}
Seçili İşlem ID: ${context?.selectedTransactionId || 'Yok'}
Seçili İşlem Tipi: ${txType || 'Yok'}
İşlem Durumu: ${context?.selectedTransactionStatus || 'Yok'}
Onay Yetkisi: ${context?.canApprove ? 'Var' : 'Yok'}

## Platform Modülleri (Tam Kapsam)

1. OPERASYON
   - Dashboard: Bekleyen işlemler, yaklaşan deadline'lar, son aktiviteler, hızlı aksiyon kartları.
   - İşlemler (/transactions): Tüm MKK işlemlerinin listesi. Filtreleme (durum, tip, tarih). Her işlemde detay, validasyon, dosya yükleme, audit log.
   - Yeni İşlem (/transactions/new): TX-001 Pay Dağılımı, TX-002 Yabancı Yatırımcı, TX-003 Kurumsal Eylem şablonlarını indirme ve yükleme.
   - İşlem Detay (/transactions/:id): Durum geçişleri, validasyon hataları, dosya geçmişi, audit log, onay aksiyonları.

2. MKK
   - Raporlar: MKK'ya gönderilmiş işlemlerin özet raporları.
   - MKK Mutabakatı (/reconciliation): Excel yükleme, MKK verileriyle karşılaştırma, farklı kayıtların tespiti.

3. RISK & UYUM
   - Audit Log (/audit-logs): Tüm kullanıcı aksiyonlarının zaman damgalı kaydı. "Kim ne zaman ne yaptı" sorgulanabilir.
   - RegTech Uyum & Risk (/regtech): SPK bültenleri ve basın duyuruları arşivi. AI analizi (affectedAreas, impactLevel, complianceChecklist). SPK arşivinde yıl, kaynak tipi ve limit filtreleri var.
   - Takasbank İzleme (/takasbank): Takas durumu, nakit ve menkul kıymet yükümlülükleri, teminat uyarıları, mutabakat farkları, mock takas kayıtları tablosu.

4. YAPAY ZEKA
   - Süreç Asistanı (/assistant): Sen buradasın. Kullanıcılara platformu öğretir, süreçleri açıklar, hataları çözer, doğru ekrana yönlendirir.

5. YÖNETİM
   - Onaylar (/approvals): Admin/yönetici rolündeki kullanıcıların bekleyen işlemleri inceleyip onayladığı veya reddettiği ekran.
   - Kullanıcılar (/users): Kullanıcı yönetimi, roller (admin, operation, approver, auditor, manager), aktif/pasif durum.

## İşlem Tipleri
- TX-001: Pay Dağılım Raporu — Şirketteki pay sahiplerinin MKK'ya bildirilmesi.
- TX-002: Yabancı Yatırımcı Listesi — Yabancı yatırımcı portföy bilgileri. LEI kodu kritik.
- TX-003: Kurumsal Eylem Verileri — Temettü, bedelli/bedelsiz sermaye artırımı, hak kullanımı.

## İşlem Durumları
- Taslak: Oluşturuldu, dosya henüz yüklenmedi.
- Validasyon Hatası: Dosyada format hatası var.
- Onay Bekliyor: Validasyon başarılı, yetkili onayı bekleniyor.
- Onaylandı: İşlem onaylandı, MKK'ya gönderime hazır.
- Tamamlandı: MKK'ya başarıyla gönderildi.
- Reddedildi: Onay verilmedi, revize gerekli.

## Validasyon Kuralları
- TCKN: 11 hane, sadece rakam.
- VKN: 10 hane, sadece rakam.
- Tarih: GG.AA.YYYY formatında.
- Pay miktarı: Negatif olamaz, maksimum 2 ondalık.
- LEI Kodu: Yabancı yatırımcılarda zorunlu.

## Dört Göz İlkesi (Maker-Checker)
- Operasyon kullanıcısı (maker) işlemi hazırlar.
- Yönetici/Admin (checker) kontrol edip onaylar veya reddeder.
- Aynı kişi hem hazırlayıp hem onaylayamaz.

## SPK Arşiv & AI Analizi
- RegTech ekranında SPK bültenleri + basın duyuruları birleşik arşiv.
- AI analizi: summary, keyDecisions, affectedAreas (Uyum, Risk, Operasyon, MKK, Takasbank, MASAK, Açığa Satış, Halka Arz, Portföy Yönetimi, vb.), impactLevel (low/medium/high), complianceChecklist, sourceBasis, reliability.
- Filtreler: Yıl (2000-günümüz), Kaynak Tipi (all/bulletin/press-release), Limit (10-1000).

## Takasbank İzleme
- Takas Durumu: Gün içi izleme.
- Nakit Yükümlülükleri: Açık pozisyon takibi.
- Menkul Kıymet Yükümlülükleri: Açık pozisyon takibi.
- Teminat Uyarıları: Eksik teminat bildirimleri.
- Mutabakat Farkları: MKK/Takasbank karşılaştırması.
- Kayıt alanları: market, settlementDate, accountNo, isin, instrument, obligationType (cash/security), expectedAmount, actualAmount, difference, status (matched/mismatch/pending).

## Kurallar
- Cevapların Açıklama / Neden Önemli? / Ne Yapmalısınız? / Sonraki Adım formatında olsun.
- Kullanıcı ilk kez giriyorsa platformu basitçe tanıt, menü yapısını açıkla.
- Emin olmadığın bilgiyi uydurma.
- Yetki dışı işlem önerme.
- MKK'ya gönderim/onay gibi aksiyonları kullanıcıya yaptır, sen yapma.
- Sadece kullanıcıyı doğru ekrana yönlendir.`

  if (ragContext && ragContext.trim().length > 0) {
    prompt += `\n\n## İlgili Bilgi Kaynakları\nAşağıdaki bilgiler kurum içi bilgi tabanından getirilmiştir.\nCevap verirken bu bilgileri önceliklendir.\nBilgi kaynaklarında olmayan kritik konularda varsayım yapma.\n\n${ragContext}`
  }

  return prompt
}

app.post('/api/assistant/chat', async (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown'

  if (!rateLimit(ip)) {
    return res.status(429).json({
      error: 'Rate limit exceeded. Max 20 requests per minute.',
    })
  }

  const { message, context, history, ragContext } = req.body

  // Audit log (no API key, no sensitive user data)
  console.info(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      userRole: context?.userRole,
      currentPage: context?.currentPage,
      selectedTransactionType: context?.selectedTransactionType,
      intent: 'proxy',
      success: true,
      ip,
    })
  )

  const systemPrompt = buildSystemPrompt(context || {}, ragContext)

  // Safe fallback when OpenAI client is not available (no API key)
  if (!openai) {
    console.warn('[Assistant Proxy] Fallback reason: missing_api_key')
    return res.json({
      content:
        'Şu anda akıllı asistan servisine erişilemiyor. Mevcut sistem bilgi havuzuna göre ilerleyebilir veya işlemin detay ekranındaki kaynakları kontrol edebilirsiniz.',
      source: 'Sistem Bilgi Havuzu',
      contextLabel: buildContextLabel(context || {}),
    })
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 20_000)

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    console.info('[Assistant Proxy] Calling OpenAI model:', model)

    const completion = await openai.chat.completions.create(
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...(history || [])
            .slice(-10)
            .map((m) => ({
              role: m.role,
              content: m.content,
            })),
          { role: 'user', content: message },
        ],
        temperature: 0.3,
        max_tokens: 800,
      },
      { signal: controller.signal }
    )

    clearTimeout(timeout)

    const content = completion.choices[0]?.message?.content || ''

    if (!content) {
      console.warn('[Assistant Proxy] Fallback reason: empty_openai_response')
      return res.json({
        content:
          'Şu anda akıllı asistan servisine erişilemiyor. Mevcut sistem bilgi havuzuna göre ilerleyebilir veya işlemin detay ekranındaki kaynakları kontrol edebilirsiniz.',
        source: 'Sistem Bilgi Havuzu',
        contextLabel: buildContextLabel(context || {}),
      })
    }

    console.info('[Assistant Proxy] OpenAI success')

    return res.json({
      content,
      source: 'OpenAI / LLM Proxy',
      contextLabel: buildContextLabel(context || {}),
    })
  } catch (error) {
    console.error('[Assistant Proxy] Fallback reason: openai_error', {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      code: error?.code,
    })
    return res.json({
      content:
        'Şu anda akıllı asistan servisine erişilemiyor. Mevcut sistem bilgi havuzuna göre ilerleyebilir veya işlemin detay ekranındaki kaynakları kontrol edebilirsiniz.',
      source: 'Sistem Bilgi Havuzu',
      contextLabel: buildContextLabel(context || {}),
    })
  }
})

app.get('/api/spk/sync-status', async (req, res) => {
  try {
  const now = new Date().toISOString()
  const today = now.split('T')[0]

  let latestBulletin, latestPress
  try {
    latestBulletin = await fetchLatestSpkBulletin()
  } catch (err) {
    console.warn('[SPK] Bulletin fetch error:', err.message || err)
  }
  const bulletin = latestBulletin || getMockBulletin()

  try {
    latestPress = await fetchLatestSpkPressRelease()
  } catch (err) {
    console.warn('[SPK] Press fetch error:', err.message || err)
  }
  const press = latestPress || getMockPressRelease()

  // Archive: ensure records always exist
  const currentYear = new Date().getFullYear()
  let archiveRecords = getSpkArchiveRecords()
  let liveFetchCount = 0

  if (archiveRecords.length === 0) {
    try {
      const liveRecords = await fetchSpkBulletinArchive({ year: currentYear, limit: 50 })
      liveFetchCount = liveRecords.length
      if (liveRecords.length > 0) {
        upsertSpkArchiveRecords(liveRecords, 'live')
      }
    } catch (err) {
      console.warn('[SPK] Archive fetch error:', err.message || err)
    }
    archiveRecords = getSpkArchiveRecords()
    if (archiveRecords.length === 0) {
      const fallback = getMockBulletinArchive(currentYear, 10)
      upsertSpkArchiveRecords(fallback, 'fallback')
      archiveRecords = getSpkArchiveRecords()
    }
  }

  const archiveSummary = {
    total: archiveRecords.length,
    source: liveFetchCount > 0 ? 'live' : (archiveRecords.length > 0 ? 'fallback' : 'none'),
    records: archiveRecords.slice(0, 20),
  }
  console.info('[SPK] Archive response total:', archiveRecords.length, 'source:', archiveSummary.source)

  // Get latest legislation from store
  const legislationRecords = archiveRecords.filter((r) => r.sourceType === 'legislation')
  const latestLegislation = legislationRecords.length > 0
    ? legislationRecords.sort((a, b) => String(b.isoDate || '').localeCompare(String(a.isoDate || '')))[0]
    : null

  res.json({
    status: 'active',
    lastCheckedAt: now,
    sources: [
      {
        name: 'SPK Bültenleri',
        type: 'bulletin',
        url: bulletin.url || 'https://spk.gov.tr/spk-bultenleri',
        status: latestBulletin ? 'ok' : 'fallback',
        latestTitle: bulletin.title,
        latestDate: bulletin.isoDate || today,
      },
      {
        name: 'SPK Mevzuat Sistemi',
        type: 'regulation',
        url: 'https://mevzuat.spk.gov.tr/',
        status: latestLegislation ? 'ok' : 'fallback',
        latestTitle: latestLegislation ? latestLegislation.title : 'Mevzuat Sistemi kontrol edildi',
        latestDate: latestLegislation ? (latestLegislation.isoDate || today) : today,
      },
      {
        name: 'SPK Basın Duyuruları',
        type: 'announcement',
        url: press.url || 'https://spk.gov.tr/duyurular/basin-duyurulari',
        status: latestPress ? 'ok' : 'fallback',
        latestTitle: press.title,
        latestDate: press.isoDate || today,
      },
    ],
    updates: [
      {
        id: 'spk-bulletin-001',
        source: 'SPK Bültenleri',
        title: latestBulletin ? `Son bülten: ${bulletin.number}` : 'Yeni SPK bülteni tespit edildi',
        url: bulletin.url || 'https://spk.gov.tr/spk-bultenleri',
        impact: 'medium',
        summary: latestBulletin
          ? `${bulletin.number} - ${bulletin.date} tarihli bülten kaydedildi.`
          : 'Uyum ekibi tarafından incelenmesi gereken yeni bülten kaydı.',
        detectedAt: now,
        requiresComplianceReview: true,
      },
      {
        id: 'spk-press-001',
        source: 'SPK Basın Duyuruları',
        title: latestPress ? `Son duyuru: ${press.title}` : 'Basın duyurusu kontrol edildi',
        url: press.url || 'https://spk.gov.tr/duyurular/basin-duyurulari',
        impact: 'medium',
        summary: latestPress
          ? `${press.title} - ${press.date} tarihli duyuru kaydedildi.`
          : 'Yeni basın duyurusu olup olmadığı kontrol edildi.',
        detectedAt: now,
        requiresComplianceReview: true,
      },
      ...(latestLegislation ? [{
        id: 'spk-legislation-001',
        source: 'SPK Mevzuat Sistemi',
        title: `Son mevzuat: ${latestLegislation.title}`,
        url: latestLegislation.url || 'https://spk.gov.tr/mevzuat',
        impact: 'high',
        summary: `${latestLegislation.title} - ${latestLegislation.category || 'Mevzuat'} kaydı. Uyum ekibinin incelemesi gerekebilir.`,
        detectedAt: now,
        requiresComplianceReview: true,
      }] : []),
    ],
    archive: archiveSummary,
  })
  } catch (err) {
    console.error('[SPK] sync-status endpoint error:', err.message || err)
    const fallbackSummary = getSpkArchiveSummary()
    if (fallbackSummary.total === 0) {
      const currentYear = new Date().getFullYear()
      const fallback = getMockBulletinArchive(currentYear, 10)
      upsertSpkArchiveRecords(fallback, 'fallback')
    }
    res.json({
      status: 'active',
      lastCheckedAt: new Date().toISOString(),
      sources: [
        { name: 'SPK Bültenleri', type: 'bulletin', url: 'https://spk.gov.tr/spk-bultenleri', status: 'fallback', latestTitle: 'SPK Bülteni', latestDate: new Date().toISOString().split('T')[0] },
        { name: 'SPK Mevzuat Sistemi', type: 'regulation', url: 'https://mevzuat.spk.gov.tr/', status: 'ok', latestTitle: 'Mevzuat Sistemi kontrol edildi', latestDate: new Date().toISOString().split('T')[0] },
        { name: 'SPK Basın Duyuruları', type: 'announcement', url: 'https://spk.gov.tr/duyurular/basin-duyurulari', status: 'fallback', latestTitle: 'Basın duyurusu kontrol edildi', latestDate: new Date().toISOString().split('T')[0] },
      ],
      updates: [],
      archive: getSpkArchiveSummary(),
    })
  }
})

app.get('/api/spk/archive', async (req, res) => {
  const { year, startYear, endYear, limit, sourceType, refresh, debug } = req.query
  const currentYear = new Date().getFullYear()

  const queryStartYear = startYear ? Number(startYear) : 2012
  const queryEndYear = endYear ? Number(endYear) : currentYear
  const queryLimit = limit ? Number(limit) : 1500
  const isRefresh = refresh === 'true' || refresh === '1'
  const isDebug = debug === 'true' || debug === '1'

  const debugInfo = {
    storeBefore: 0,
    fetchedBulletins: 0,
    fetchedPressReleases: 0,
    fetchedLegislation: 0,
    afterNormalize: 0,
    afterDedupe: 0,
    droppedRecords: 0,
    dropReasons: [],
    storeAfter: 0,
    sourceType: sourceType || 'all',
    startYear: queryStartYear,
    endYear: queryEndYear,
    limit: queryLimit,
    refresh: isRefresh,
  }

  const summary = getSpkArchiveSummary()
  const existingRecords = getSpkArchiveRecords()
  const hasLegislation = existingRecords.some((r) => r.sourceType === 'legislation')
  debugInfo.storeBefore = summary.total
  console.info(`[SPK Archive Before] storeTotal: ${summary.total}, hasLegislation: ${hasLegislation}`)

  // ALWAYS fetch on refresh, if store is empty, or if legislation is missing
  if (summary.total === 0 || isRefresh || !hasLegislation) {
    try {
      // Fetch bulletins with wide range
      let bulletinRecords = []
      let fetchedYears = []
      let skippedYears = []
      try {
        const bulletinResult = await fetchSpkBulletinArchiveRange({ startYear: queryStartYear, endYear: queryEndYear, limitPerYear: 200 })
        bulletinRecords = bulletinResult.records
        fetchedYears = bulletinResult.fetchedYears
        skippedYears = bulletinResult.skippedYears
        debugInfo.fetchedBulletins = bulletinRecords.length
        console.info(`[SPK Archive Fetch] bulletins: ${bulletinRecords.length}`)
      } catch (err) {
        console.warn('[SPK] Bulletin archive fetch error:', err.message || err)
        debugInfo.dropReasons.push(`bulletinFetchError: ${err.message || err}`)
      }

      // Fetch press releases
      let pressRecords = []
      try {
        const pressResult = await fetchSpkPressReleaseArchive({ startYear: queryStartYear, endYear: queryEndYear, limitPerYear: 100 })
        pressRecords = pressResult.records
        debugInfo.fetchedPressReleases = pressRecords.length
        console.info(`[SPK Archive Fetch] pressReleases: ${pressRecords.length}`)
      } catch (err) {
        console.warn('[SPK] Press release archive fetch error:', err.message || err)
        debugInfo.dropReasons.push(`pressFetchError: ${err.message || err}`)
      }

      // Fetch legislation
      let legislationRecords = []
      try {
        const legislationResult = await fetchSpkLegislationArchive({ limit: 500 })
        legislationRecords = legislationResult.records
        debugInfo.fetchedLegislation = legislationRecords.length
        console.info(`[SPK Archive Fetch] legislation: ${legislationRecords.length}`)
      } catch (err) {
        console.warn('[SPK] Legislation archive fetch error:', err.message || err)
        debugInfo.dropReasons.push(`legislationFetchError: ${err.message || err}`)
      }

      // Normalize: NEVER drop records, only fill missing fields with fallbacks
      const normalizeRecord = (r) => {
        const yr = r.year || currentYear
        // Only fallback to title-extracted number when r.number is genuinely missing (not empty string)
        const num = r.number != null && r.number !== '' ? r.number : (r.title ? r.title.replace(/[^0-9\/]/g, '').slice(0, 20) : '')
        const rawDate = r.date || ''
        const parsedIsoDate = rawDate ? parseTurkishDateFallback(rawDate) : null
        // Legislation-specific date fallbacks
        let legislationIso = null
        if (!parsedIsoDate && r.kurulKararTarihi) {
          const d = new Date(r.kurulKararTarihi)
          if (!isNaN(d.getTime())) legislationIso = r.kurulKararTarihi.split('T')[0]
        }
        if (!parsedIsoDate && !legislationIso && r.resmiGazeteTarihi) {
          const d = new Date(r.resmiGazeteTarihi)
          if (!isNaN(d.getTime())) legislationIso = r.resmiGazeteTarihi.split('T')[0]
        }
        const isoDate = (r.isoDate && /^\d{4}-\d{2}-\d{2}$/.test(r.isoDate)) ? r.isoDate : (parsedIsoDate || legislationIso || null)
        let fallbackUrl
        if (r.sourceType === 'press-release') {
          fallbackUrl = `https://spk.gov.tr/duyurular/basin-duyurulari/${yr}`
        } else if (r.sourceType === 'legislation') {
          const mevzuatLink = r.link || r.dosyaLink || r.dosyaYolu
          fallbackUrl = mevzuatLink ? `https://mevzuat.spk.gov.tr/${mevzuatLink}` : 'https://spk.gov.tr/mevzuat'
        } else {
          fallbackUrl = `https://spk.gov.tr/spk-bultenleri/${yr}-yili-spk-bultenleri`
        }
        const title = decodeHtmlEntities(r.title || `SPK Kaydı ${num || '—'}`)
        const idBase = num || slug(title) || `rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        // Preserve legislation records' unique id to avoid client-side dedup drops
        const id = r.sourceType === 'legislation' && r.id
          ? r.id
          : `${r.sourceType || 'unknown'}-${yr}-${idBase}-${isoDate || rawDate || 'nodate'}`

        // Effective date extraction (legislation enrichment)
        let effectiveDate = isoDate
        let effectiveYear = yr
        if (r.sourceType === 'legislation' && !effectiveDate) {
          // Try more date sources
          for (const field of [r.kurulKararTarihi, r.kurulKararTarih, r.resmiGazeteTarihi, r.resmiGazeteTarih]) {
            if (field) {
              const d = new Date(field)
              if (!isNaN(d.getTime())) {
                effectiveDate = field.split('T')[0]
                break
              }
            }
          }
          // Title regex extraction
          if (!effectiveDate) {
            const titleMatch = title.match(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/)
            if (titleMatch) {
              const iso = `${titleMatch[3]}-${titleMatch[2].padStart(2, '0')}-${titleMatch[1].padStart(2, '0')}`
              const d = new Date(iso)
              if (!isNaN(d.getTime())) effectiveDate = iso
            }
          }
          if (!effectiveDate) {
            const titleMatch2 = title.match(/(\d{1,2})\s+([A-Za-zÇçĞğİıÖöŞşÜü]+)\s+(\d{4})/i)
            if (titleMatch2) {
              const ts = Date.parse(`${titleMatch2[1]} ${titleMatch2[2]} ${titleMatch2[3]}`)
              if (!isNaN(ts)) {
                const d = new Date(ts)
                effectiveDate = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
              }
            }
          }
          // bultenYili
          if (!effectiveDate && r.bultenYili) {
            effectiveYear = Number(r.bultenYili)
          }
        }
        const hasAnyDate = Boolean(effectiveDate || isoDate || parsedIsoDate || r.date || r.kurulKararTarihi || r.kurulKararTarih || r.resmiGazeteTarihi || r.resmiGazeteTarih)
        const needsDateEnrichment = r.sourceType === 'legislation' && !hasAnyDate

        return {
          ...r,
          id,
          year: yr,
          number: num,
          title,
          date: rawDate || '',
          isoDate: isoDate || '',
          effectiveDate: effectiveDate || '',
          effectiveYear: effectiveYear || yr,
          needsDateEnrichment,
          url: r.url || fallbackUrl,
          sourceType: r.sourceType || 'bulletin',
        }
      }

      const allRaw = [...bulletinRecords, ...pressRecords, ...legislationRecords]
      debugInfo.afterNormalize = allRaw.length

      const normalized = allRaw.map(normalizeRecord)

      // Deduplicate: ONLY exact same id. Never drop based on number/year.
      const seenIds = new Set(getSpkArchiveRecords().map((r) => r.id))
      const deduped = []
      for (const r of normalized) {
        if (seenIds.has(r.id)) {
          debugInfo.droppedRecords++
          debugInfo.dropReasons.push(`duplicateId: ${r.id}`)
          continue
        }
        seenIds.add(r.id)
        deduped.push(r)
      }
      debugInfo.afterDedupe = deduped.length

      // Sort: newest first, undated records at the end
      deduped.sort((a, b) => getRecordSortTimestamp(b) - getRecordSortTimestamp(a))

      if (deduped.length > 0) {
        upsertSpkArchiveRecords(deduped, 'live')
        setArchiveCoverage({ startYear: queryStartYear, endYear: queryEndYear, fetchedYears, skippedYears })
        console.info(`[SPK Archive] Appended ${deduped.length} new records. bulletins: ${bulletinRecords.length} pressReleases: ${pressRecords.length} legislation: ${legislationRecords.length}`)
      } else {
        console.warn(`[SPK Archive Warning] No new records to append after dedup. Fetched: ${allRaw.length}`)
        debugInfo.dropReasons.push('noNewRecords: all fetched records already in store or deduped')
      }
    } catch (err) {
      console.warn('[SPK] Archive endpoint fetch error:', err.message || err)
      debugInfo.dropReasons.push(`endpointError: ${err.message || err}`)
    }
  }

  const storeSummary = getSpkArchiveSummary()
  const allRecords = getSpkArchiveRecords()
  const counts = {
    bulletin: allRecords.filter((r) => r.sourceType === 'bulletin').length,
    pressRelease: allRecords.filter((r) => r.sourceType === 'press-release').length,
    legislation: allRecords.filter((r) => r.sourceType === 'legislation').length,
    total: allRecords.length,
  }
  const stats = getDuplicateStats()
  stats.missingDates = allRecords.filter((r) =>
    r.sourceType === 'legislation' &&
    !r.isoDate && !r.effectiveDate && !r.date &&
    !r.kurulKararTarihi && !r.kurulKararTarih &&
    !r.resmiGazeteTarihi && !r.resmiGazeteTarih
  ).length
  debugInfo.storeAfter = counts.total
  debugInfo.stats = stats

  const effectiveSourceType = sourceType && sourceType !== 'all' ? sourceType : undefined
  const filterOpts = {
    year: year ? Number(year) : undefined,
    limit: queryLimit,
    sourceType: effectiveSourceType,
  }
  debugInfo.effectiveSourceType = effectiveSourceType
  debugInfo.recordsBeforeFilter = getSpkArchiveRecords().length
  debugInfo.filterOpts = filterOpts

  let result = filterSpkArchive(filterOpts)
  debugInfo.recordsAfterPrimaryFilter = result.total

  // Fallback: if all types requested but filter returned empty, manually merge all source types
  if ((sourceType === 'all' || !sourceType) && result.records.length === 0 && counts.total > 0) {
    const bulletinResult = filterSpkArchive({ sourceType: 'bulletin', limit: 10000 })
    const pressResult = filterSpkArchive({ sourceType: 'press-release', limit: 10000 })
    const legislationResult = filterSpkArchive({ sourceType: 'legislation', limit: 10000 })
    const mergedRecords = [...(bulletinResult.records || []), ...(pressResult.records || []), ...(legislationResult.records || [])]
      .sort((a, b) => getRecordSortTimestamp(b) - getRecordSortTimestamp(a))
    const mergedYears = mergedRecords.map((r) => r.year).filter((y) => typeof y === 'number' && y > 1900)
    const mergedYearRange = mergedYears.length > 0
      ? { minYear: Math.min(...mergedYears), maxYear: Math.max(...mergedYears) }
      : { minYear: null, maxYear: null }
    result = {
      total: mergedRecords.length,
      records: mergedRecords.slice(0, Number(queryLimit) || 100),
      yearRange: mergedYearRange,
    }
    debugInfo.recordsAfterAllFallback = result.total
  }

  console.info(`[SPK Archive After] storeTotal: ${counts.total}, unique: ${stats.uniqueTotal}, duplicates: ${stats.duplicateTotal}, filteredResult: ${result.total}`)

  if (counts.total < 50) {
    console.warn(`[SPK Archive Warning] Low record count: ${counts.total}`)
  }

  const response = {
    ...result,
    source: storeSummary.source,
    coverage: storeSummary.coverage,
    counts,
    stats,
  }

  if (isDebug) {
    response.debug = debugInfo
  }
  res.json(response)
})

app.get('/api/spk/archive/debug', async (req, res) => {
  const currentYear = new Date().getFullYear()
  let fetchAttempted = false
  let fetchedTotal = 0
  let firstFetchedRecord = null
  let error = null
  let sampleHtmlLength = 0

  try {
    fetchAttempted = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const url = `https://spk.gov.tr/spk-bultenleri/${currentYear}-yili-spk-bultenleri`
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AKOP-Bot/1.0)',
        Accept: 'text/html',
      },
    })
    clearTimeout(timeout)

    const html = await response.text()
    sampleHtmlLength = html.length

    const urlMatches = [...html.matchAll(/href="([^"]*\/\d{4}-\d+\.pdf)"/g)]
    const numMatches = [...html.matchAll(/B[&#252;]lten No\s*:\s*(\d{4}\/\d+)/gi)]
    const numbers = numMatches.length > 0
      ? numMatches.map((m) => m[1])
      : [...html.matchAll(/B\u00fclten No\s*:\s*(\d{4}\/\d+)/g)].map((m) => m[1])
    const dateMatches = [...html.matchAll(/Yay[ıi]mlanma\s*:\s*([^<]+)/gi)]

    fetchedTotal = Math.min(urlMatches.length, numbers.length, dateMatches.length)
    if (fetchedTotal > 0) {
      firstFetchedRecord = {
        number: numbers[0],
        dateRaw: dateMatches[0]?.[1]?.trim(),
        url: urlMatches[0]?.[1],
      }
    }
  } catch (err) {
    error = err.message || String(err)
  }

  const storeSummary = getSpkArchiveSummary()

  res.json({
    storeTotal: storeSummary.total,
    fetchAttempted,
    fetchedTotal,
    firstFetchedRecord,
    error,
    sampleHtmlLength,
    parserMode: 'regex-extract',
  })
})

app.get('/api/spk/legislation/debug', async (_req, res) => {
  try {
    const debugData = await debugSpkLegislation()
    res.json(debugData)
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) })
  }
})

app.post('/api/spk/legislation/enrich-date', async (req, res) => {
  const { record } = req.body || {}
  if (!record || !record.id) {
    return res.status(400).json({ error: 'Missing record or record.id' })
  }
  if (record.sourceType !== 'legislation') {
    return res.status(400).json({ error: 'Record is not legislation' })
  }

  try {
    const result = await enrichLegislationRecord(record)
    res.json({
      success: result.success,
      effectiveDate: result.effectiveDate || null,
      effectiveYear: result.effectiveYear || null,
      dateSource: result.dateSource || 'missing',
      textPreview: result.textPreview || null,
    })
  } catch (err) {
    console.warn('[EnrichDate] Error:', err.message || err)
    res.status(500).json({ error: err.message || String(err), success: false })
  }
})

app.post('/api/spk/analyze-bulletin', async (req, res) => {
  const { record } = req.body || {}
  if (!record || !record.title) {
    return res.status(400).json({ error: 'Missing record or record.title' })
  }

  let pdfText = null
  let sourceBasis = 'metadata_only'
  const isLegislation = record?.sourceType === 'legislation'
  const isBddk = record?.authority === 'BDDK' || String(record?.sourceType || '').startsWith('bddk')

  try {
    if (isLegislation) {
      // Check cache first
      const cached = getCachedLegislationContent(record.id)
      if (cached?.textPreview && cached.textPreview.length > 100) {
        pdfText = cached.textPreview
        sourceBasis = 'legislation_pdf_content'
        console.info(`[SPK Analyze] Legislation cache hit: ${pdfText.length} chars`)
      } else {
        const { text } = await fetchSpkLegislationPdfText(record)
        if (text && text.length > 100) {
          pdfText = text
          sourceBasis = 'legislation_pdf_content'
          console.info(`[SPK Analyze] Legislation PDF loaded: ${text.length} chars`)
        }
      }
    } else if (record.url && record.url.endsWith('.pdf')) {
      pdfText = await fetchSpkPdfText(record.url)
      if (pdfText && pdfText.length > 100) {
        sourceBasis = 'pdf_content'
        console.info(`[SPK Analyze] PDF text loaded: ${pdfText.length} chars`)
      }
    }
  } catch (err) {
    console.warn('[SPK Analyze] PDF fetch failed:', err.message || err)
  }

  const sourceText = pdfText || `${record.title || ''} ${record.number || ''}`

  if (!openai) {
    console.warn('[SPK Analyze] OpenAI not configured, returning fallback')
    return res.json(buildFallbackAnalysis(record, sourceText, 'OpenAI API anahtarı yapılandırılmamış'))
  }

  let userContent, systemPrompt

  if (isBddk) {
    userContent = pdfText && pdfText.length > 100
      ? `BDDK Kaydı: ${record.title || ''} — ${record.category || ''} — ${record.number || ''} — ${record.date || ''}\n\nPDF İçeriği (ilk bölüm):\n${pdfText.slice(0, 8000)}\n\nYukarıdaki BDDK düzenlemesini analiz et. Bankacılık düzenlemeleri açısından içeriği değerlendir, aracı kurum/finans operasyonuna etkisini belirt, uyum kontrol maddelerini listele, risk seviyesini belirle ve önerilen aksiyonları sırala.`
      : `BDDK Kaydı: ${record.title || ''} — ${record.category || ''} — ${record.number || ''} — ${record.date || ''} — ${record.url || ''}\n\nNot: PDF içeriği yüklenemedi, sadece metadata üzerinden analiz yap. Bankacılık düzenlemeleri, aracı kurum/finans operasyonuna etkisi, uyum kontrol maddeleri, risk seviyesi ve önerilen aksiyonları değerlendir.`
    systemPrompt = 'Sen BDDK (Bankacılık Düzenleme ve Denetleme Kurumu) düzenlemelerini aracı kurum uyum, risk ve operasyon ekipleri açısından analiz eden kıdemli regülasyon analistisin.\n\nKURALLAR:\n1. Verilmeyen bilgiyi kesinlikle uydurma.\n2. PDF içeriği varsa doğrudan içerikten analiz yap; metadata yetersizse PDF içeriğine odaklan.\n3. Düzenlemenin bankacılık süreçlerine ve aracı kurum/finans operasyonlarına etkisini belirt.\n4. Uyum ekibinin kontrol etmesi gereken maddeleri somut olarak listele.\n5. Risk seviyesini düşük/orta/yüksek olarak belirt ve gerekçelendir.\n6. affectedAreas sadece metinde açıkça ilişkili alanlardan seçilmeli; varsayılan olarak Uyum/Risk/Operasyon verme.\n7. Türkçe yanıt ver.\n8. Sadece JSON formatında yanıt ver, dışarıda metin olmasın.\n\nOlası affectedAreas: Uyum, Risk, Operasyon, MKK, Takasbank, MASAK, Müşteri Bildirimi, Emir İletimi, Açığa Satış, Halka Arz, Portföy Yönetimi, Yatırım Danışmanlığı, Araştırma, İç Kontrol, Bilgi Teknolojileri, Kredi Riski, Sermaye Yeterliliği, Likidite.'
  } else if (isLegislation) {
    userContent = pdfText && pdfText.length > 100
      ? `Mevzuat: ${record.title || ''} — ${record.category || ''} — ${record.effectiveDate || record.date || ''} — ${record.url || ''}\n\nPDF/Mevzuat İçeriği (ilk bölüm):\n${pdfText.slice(0, 8000)}\n\nYukarıdaki mevzuat içeriğini analiz et. Düzenleme konusu, hangi kurum süreçlerini etkiler, aracı kurum operasyonlarına etkisi, MKK/Takasbank bağlantısı, uyum ekibinin kontrol maddeleri, risk seviyesi ve önerilen aksiyonları değerlendir.`
      : `Mevzuat: ${record.title || ''} — ${record.category || ''} — ${record.effectiveDate || record.date || ''} — ${record.url || ''}\n\nNot: PDF içeriği yüklenemedi, sadece metadata üzerinden analiz yap. Düzenleme konusu, aracı kurum operasyonlarına etkisi, uyum ekibinin kontrol etmesi gereken maddeler, risk seviyesi ve uygulanacak aksiyonları değerlendir.`
    systemPrompt = 'Sen SPK mevzuat düzenlemelerini aracı kurum uyum, risk ve operasyon ekipleri açısından analiz eden kıdemli regülasyon analistisin.\n\nKURALLAR:\n1. Verilmeyen bilgiyi kesinlikle uydurma.\n2. PDF içeriği varsa doğrudan içerikten analiz yap; metadata yetersizse PDF içeriğine odaklan.\n3. Düzenlemenin hangi aracı kurum süreçlerini etkilediğini, MKK ve Takasbank bağlantılarını belirt.\n4. Uyum ekibinin kontrol etmesi gereken maddeleri somut olarak listele.\n5. Risk seviyesini düşük/orta/yüksek olarak belirt ve gerekçelendir.\n6. affectedAreas sadece metinde açıkça ilişkili alanlardan seçilmeli; varsayılan olarak Uyum/Risk/Operasyon verme.\n7. Türkçe yanıt ver.\n8. Sadece JSON formatında yanıt ver, dışarıda metin olmasın.\n\nOlası affectedAreas: Uyum, Risk, Operasyon, MKK, Takasbank, MASAK, Müşteri Bildirimi, Emir İletimi, Açığa Satış, Halka Arz, Portföy Yönetimi, Yatırım Danışmanlığı, Araştırma, İç Kontrol, Bilgi Teknolojileri.'
  } else {
    userContent = pdfText && pdfText.length > 100
      ? `Bülten: ${record.number} — ${record.title || ''} — ${record.date || ''}\n\nPDF İçeriği (ilk bölüm):\n${pdfText.slice(0, 8000)}`
      : `Bülten: ${record.number} — ${record.title || ''} — ${record.date || ''} — ${record.url || ''}\n\nNot: PDF içeriği yüklenemedi, sadece metadata üzerinden analiz yap.`
    systemPrompt = 'Sen SPK bültenlerini aracı kurum uyum, risk ve operasyon ekipleri açısından özetleyen kıdemli regülasyon analistisin.\n\nKURALLAR:\n1. Verilmeyen bilgiyi kesinlikle uydurma.\n2. Her kayıtta aynı genel cümleleri tekrarlama ("SPK düzenlemelerine ilişkin önemli duyurular" gibi).\n3. PDF veya metin içinde açıkça geçen kararları, kurul kararlarını, ceza kararlarını, duyuruları veya düzenleme başlıklarını çıkar.\n4. PDF/metin yetersizse "İçerikte yeterli detay bulunamadı" de ve tahmin yürütüyorsan bunu açıkça belirt.\n5. En az 3 somut madde üretmeye çalış.\n6. affectedAreas sadece metinde açıkça ilişkili alanlardan seçilmeli; varsayılan olarak Uyum/Risk/Operasyon verme.\n7. Türkçe yanıt ver.\n8. Sadece JSON formatında yanıt ver, dışarıda metin olmasın.\n\nOlası affectedAreas: Uyum, Risk, Operasyon, MKK, Takasbank, MASAK, Müşteri Bildirimi, Emir İletimi, Açığa Satış, Halka Arz, Portföy Yönetimi, Yatırım Danışmanlığı, Araştırma, İç Kontrol, Bilgi Teknolojileri.'
  }

  try {
    const completion = await safeOpenAiCall({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      temperature: 0.15,
      max_tokens: 700,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content?.trim() || ''
    let parsed = {}
    try {
      const match = raw.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : {}
    } catch {
      parsed = {}
    }

    // Post-process affectedAreas: fallback to inferred areas if empty or generic trio
    let areas = Array.isArray(parsed.affectedAreas) ? parsed.affectedAreas : []
    if (areas.length === 0 || areas.join(',') === 'Uyum,Risk,Operasyon') {
      areas = inferAffectedAreasFromText(sourceText, record)
    }
    // Press releases: strip Uyum, prefer non-compliance areas
    if (record?.sourceType === 'press-release') {
      const withoutUyum = areas.filter((a) => a !== 'Uyum')
      if (withoutUyum.length > 0) areas = withoutUyum
      else areas = PRESS_FALLBACK_AREAS
    }
    // Legislation: keep Uyum, add Operasyon if empty
    if (record?.sourceType === 'legislation') {
      if (areas.length === 0) areas = ['Uyum', 'Operasyon']
    }

    const result = {
      summary: parsed.summary || buildFallbackAnalysis(record, sourceText, 'OpenAI yanıtı eksik').summary,
      keyDecisions: Array.isArray(parsed.keyDecisions) && parsed.keyDecisions.length > 0 ? parsed.keyDecisions : buildFallbackAnalysis(record, sourceText, 'OpenAI yanıtı eksik').keyDecisions,
      affectedAreas: areas,
      recommendedAction: parsed.recommendedAction || buildFallbackAnalysis(record, sourceText, 'OpenAI yanıtı eksik').recommendedAction,
      impactLevel: ['low', 'medium', 'high'].includes(parsed.impactLevel) ? parsed.impactLevel : computeImpactLevel(sourceText, record),
      complianceChecklist: Array.isArray(parsed.complianceChecklist) && parsed.complianceChecklist.length > 0 ? parsed.complianceChecklist : buildFallbackAnalysis(record, sourceText, 'OpenAI yanıtı eksik').complianceChecklist,
      possibleOperationalImpact: parsed.possibleOperationalImpact || buildFallbackAnalysis(record, sourceText, 'OpenAI yanıtı eksik').possibleOperationalImpact,
      sourceBasis,
      reliability: sourceBasis === 'pdf_content' ? 'high' : 'medium',
      disclaimer: 'Bu analiz bilgilendirme amaçlıdır, uyum ekibi incelemesinin yerine geçmez.',
    }

    console.info('[SPK Analyze]', record.number, 'impact:', result.impactLevel, 'source:', sourceBasis, 'areas:', areas.join(','))
    res.json(result)
  } catch (err) {
    console.warn('[SPK Analyze] OpenAI error:', err.message || err)
    res.json(buildFallbackAnalysis(record, sourceText, err.message || 'OpenAI çağrısı başarısız'))
  }
})

app.post('/api/spk/analyze-bulletin-pdf', upload.single('pdf'), async (req, res) => {
  try {
    const record = req.body.record ? JSON.parse(req.body.record) : null
    if (!record || !record.title) {
      return res.status(400).json({ error: 'Missing record or record.title' })
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'PDF dosyası eksik' })
    }

    let pdfText = ''
    try {
      pdfText = await parsePdfBuffer(req.file.buffer)
      console.info(`[SPK Analyze PDF] Extracted ${pdfText.length} chars`)
    } catch (err) {
      console.warn('[SPK Analyze PDF] Parse failed:', err.message || err)
    }

    const sourceText = pdfText || `${record.title || ''} ${record.number || ''}`

    if (!openai) {
      return res.json(buildFallbackAnalysis(record, sourceText, 'OpenAI API anahtarı yapılandırılmamış'))
    }

    if (!pdfText || pdfText.length < 50) {
      return res.json(buildFallbackAnalysis(record, sourceText, "Yüklenen PDF'den yeterli metin çıkarılamadı"))
    }

    const isLegislation = record?.sourceType === 'legislation'
    const isBddk = record?.authority === 'BDDK' || String(record?.sourceType || '').startsWith('bddk')

    let userContent, systemPrompt
    if (isBddk) {
      userContent = `BDDK Kaydı: ${record.title || ''} — ${record.category || ''} — ${record.number || ''} — ${record.date || ''}\n\nYüklenen PDF İçeriği:\n${pdfText.slice(0, 8000)}`
      systemPrompt = 'Sen BDDK (Bankacılık Düzenleme ve Denetleme Kurumu) düzenlemelerini aracı kurum uyum, risk ve operasyon ekipleri açısından analiz eden kıdemli regülasyon analistisin.\n\nKURALLAR:\n1. Verilmeyen bilgiyi kesinlikle uydurma.\n2. PDF içinde açıkça geçen düzenlemeleri, maddeleri ve kuralları çıkar.\n3. En az 3 somut madde üretmeye çalış.\n4. affectedAreas sadece metinde açıkça ilişkili alanlardan seçilmeli; varsayılan olarak Uyum/Risk/Operasyon verme.\n5. Türkçe yanıt ver.\n6. Sadece JSON formatında yanıt ver, dışarıda metin olmasın.\n\nOlası affectedAreas: Uyum, Risk, Operasyon, MKK, Takasbank, MASAK, Müşteri Bildirimi, Emir İletimi, Açığa Satış, Halka Arz, Portföy Yönetimi, Yatırım Danışmanlığı, Araştırma, İç Kontrol, Bilgi Teknolojileri, Kredi Riski, Sermaye Yeterliliği, Likidite.'
    } else if (isLegislation) {
      userContent = `Mevzuat: ${record.title || ''} — ${record.category || ''} — ${record.date || ''}\n\nYüklenen PDF İçeriği:\n${pdfText.slice(0, 8000)}`
      systemPrompt = 'Sen SPK mevzuat düzenlemelerini aracı kurum uyum, risk ve operasyon ekipleri açısından analiz eden kıdemli regülasyon analistisin.\n\nKURALLAR:\n1. Verilmeyen bilgiyi kesinlikle uydurma.\n2. PDF içinde açıkça geçen düzenlemeleri, maddeleri ve kuralları çıkar.\n3. En az 3 somut madde üretmeye çalış.\n4. affectedAreas sadece metinde açıkça ilişkili alanlardan seçilmeli; varsayılan olarak Uyum/Risk/Operasyon verme.\n5. Türkçe yanıt ver.\n6. Sadece JSON formatında yanıt ver, dışarıda metin olmasın.\n\nOlası affectedAreas: Uyum, Risk, Operasyon, MKK, Takasbank, MASAK, Müşteri Bildirimi, Emir İletimi, Açığa Satış, Halka Arz, Portföy Yönetimi, Yatırım Danışmanlığı, Araştırma, İç Kontrol, Bilgi Teknolojileri.'
    } else {
      userContent = `Bülten: ${record.number} — ${record.title || ''} — ${record.date || ''}\n\nYüklenen PDF İçeriği:\n${pdfText.slice(0, 8000)}`
      systemPrompt = 'Sen SPK bültenlerini aracı kurum uyum, risk ve operasyon ekipleri açısından özetleyen kıdemli regülasyon analistisin.\n\nKURALLAR:\n1. Verilmeyen bilgiyi kesinlikle uydurma.\n2. PDF içinde açıkça geçen kararları, kurul kararlarını, ceza kararlarını, duyuruları veya düzenleme başlıklarını çıkar.\n3. En az 3 somut madde üretmeye çalış.\n4. Her bülten için aynı genel cümleleri tekrarlama.\n5. affectedAreas sadece metinde açıkça ilişkili alanlardan seçilmeli; varsayılan olarak Uyum/Risk/Operasyon verme.\n6. Türkçe yanıt ver.\n7. Sadece JSON formatında yanıt ver, dışarıda metin olmasın.\n\nOlası affectedAreas: Uyum, Risk, Operasyon, MKK, Takasbank, MASAK, Müşteri Bildirimi, Emir İletimi, Açığa Satış, Halka Arz, Portföy Yönetimi, Yatırım Danışmanlığı, Araştırma, İç Kontrol, Bilgi Teknolojileri.'
    }

    try {
      const completion = await safeOpenAiCall({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
        temperature: 0.15,
        max_tokens: 700,
        response_format: { type: 'json_object' },
      })

      const raw = completion.choices[0]?.message?.content?.trim() || ''
      let parsed = {}
      try {
        const match = raw.match(/\{[\s\S]*\}/)
        parsed = match ? JSON.parse(match[0]) : {}
      } catch {
        parsed = {}
      }

      // Post-process affectedAreas: fallback to inferred areas if empty or generic trio
      let areas = Array.isArray(parsed.affectedAreas) ? parsed.affectedAreas : []
      if (areas.length === 0 || areas.join(',') === 'Uyum,Risk,Operasyon') {
        areas = inferAffectedAreasFromText(sourceText, record)
      }
      // Press releases: strip Uyum, prefer non-compliance areas
      if (record?.sourceType === 'press-release') {
        const withoutUyum = areas.filter((a) => a !== 'Uyum')
        if (withoutUyum.length > 0) areas = withoutUyum
        else areas = PRESS_FALLBACK_AREAS
      }
      // Legislation: keep Uyum, add Operasyon if empty
      if (record?.sourceType === 'legislation') {
        if (areas.length === 0) areas = ['Uyum', 'Operasyon']
      }

      const result = {
        summary: parsed.summary || buildFallbackAnalysis(record, sourceText, 'OpenAI yanıtı eksik').summary,
        keyDecisions: Array.isArray(parsed.keyDecisions) && parsed.keyDecisions.length > 0 ? parsed.keyDecisions : buildFallbackAnalysis(record, sourceText, 'OpenAI yanıtı eksik').keyDecisions,
        affectedAreas: areas,
        recommendedAction: parsed.recommendedAction || buildFallbackAnalysis(record, sourceText, 'OpenAI yanıtı eksik').recommendedAction,
        impactLevel: ['low', 'medium', 'high'].includes(parsed.impactLevel) ? parsed.impactLevel : computeImpactLevel(sourceText, record),
        complianceChecklist: Array.isArray(parsed.complianceChecklist) && parsed.complianceChecklist.length > 0 ? parsed.complianceChecklist : buildFallbackAnalysis(record, sourceText, 'OpenAI yanıtı eksik').complianceChecklist,
        possibleOperationalImpact: parsed.possibleOperationalImpact || buildFallbackAnalysis(record, sourceText, 'OpenAI yanıtı eksik').possibleOperationalImpact,
        sourceBasis: 'uploaded_pdf',
        reliability: 'high',
        disclaimer: 'Bu analiz bilgilendirme amaçlıdır, uyum ekibi incelemesinin yerine geçmez.',
      }

      console.info('[SPK Analyze PDF]', record.number, 'impact:', result.impactLevel, 'areas:', areas.join(','))
      res.json(result)
    } catch (err) {
      console.warn('[SPK Analyze PDF] OpenAI error:', err.message || err)
      res.json(buildFallbackAnalysis(record, sourceText, err.message || 'OpenAI çağrısı başarısız'))
    }
  } catch (err) {
    console.warn('[SPK Analyze PDF] Error:', err.message || err)
    res.status(500).json({ error: 'Analiz işlenirken hata oluştu.' })
  }
})

app.get('/api/spk/archive/validate', async (req, res) => {
  const { year } = req.query
  const targetYear = year ? Number(year) : new Date().getFullYear()

  let bulletins = []
  let usedUrl = ''
  try {
    const result = await fetchSpkBulletinArchive({ year: targetYear, limit: 200 })
    bulletins = result.map((r) => ({ number: r.number, title: r.title, date: r.date, isoDate: r.isoDate, url: r.url }))
    usedUrl = 'fetchSpkBulletinArchive'
  } catch (err) {
    console.warn(`[Validate] Fetch failed:`, err.message || err)
    return res.status(502).json({ error: 'SPK sitesine erişilemedi', year: targetYear })
  }

  if (bulletins.length === 0) {
    return res.status(502).json({ error: 'SPK sitesinden bülten alınamadı', year: targetYear })
  }

  const suspiciousRecords = []
  const dateFormatErrors = []
  const htmlEntityErrors = []

  bulletins.forEach((b) => {
    // Check for HTML entities in title/number/date
    if (/&#\d+;|&amp;|&quot;/.test(b.number + ' ' + b.title + ' ' + b.date)) {
      htmlEntityErrors.push({ number: b.number, title: b.title, date: b.date })
    }
    // Check for missing or invalid isoDate
    if (!b.isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(b.isoDate)) {
      dateFormatErrors.push({ number: b.number, rawDate: b.date, isoDate: b.isoDate })
    }
    // Check for suspicious patterns (missing PDF, empty number, etc.)
    if (!b.url || !b.number || !b.isoDate) {
      suspiciousRecords.push({ number: b.number, date: b.date, isoDate: b.isoDate, url: b.url })
    }
  })

  res.json({
    year: targetYear,
    fetchedFrom: usedUrl,
    total: bulletins.length,
    first10: bulletins.slice(0, 10),
    suspiciousRecords,
    dateFormatErrors,
    htmlEntityErrors,
  })
})

// ── BDDK endpoints ───────────────────────────────────────────────────────

app.get('/api/bddk/debug', async (_req, res) => {
  try {
    const debugData = await debugBddkArchive()
    res.json(debugData)
  } catch (err) {
    console.error('[BDDK Debug] Error:', err.message || err)
    res.status(500).json({
      attemptedUrls: [],
      successfulUrl: null,
      htmlLength: 0,
      matchedLinks: 0,
      first10Candidates: [],
      sampleRecords: [],
      parsedCount: 0,
      error: err.message || String(err),
      timestamp: new Date().toISOString(),
    })
  }
})

// ── Unified Regulatory Archive ───────────────────────────────────────────

app.get('/api/regulatory/archive', async (req, res) => {
  const { authority = 'all', limit = '1500', refresh = 'false' } = req.query
  const queryLimit = Math.min(Number(limit) || 1500, 5000)
  const isRefresh = refresh === 'true' || refresh === '1'
  const now = new Date().toISOString()

  let spkRecords = []
  let bddkRecords = []
  let spkSource = 'cached'
  let bddkStatus = 'skipped'

  // Fetch SPK records (from existing store, no live fetch unless refresh)
  if (authority === 'all' || authority === 'spk') {
    try {
      const spkStore = getSpkArchiveRecords()
      if (spkStore.length === 0 || isRefresh) {
        // Trigger background-like fetch by calling existing archive endpoint logic inline
        const currentYear = new Date().getFullYear()
        try {
          const bulletinResult = await fetchSpkBulletinArchiveRange({ startYear: 2020, endYear: currentYear, limitPerYear: 200 })
          const pressResult = await fetchSpkPressReleaseArchive({ startYear: 2020, endYear: currentYear, limitPerYear: 100 })
          const allRaw = [...bulletinResult.records, ...pressResult.records]
          if (allRaw.length > 0) {
            upsertSpkArchiveRecords(allRaw, 'live')
            spkSource = 'live'
          }
        } catch (err) {
          console.warn('[Regulatory Archive] SPK live fetch failed:', err.message || err)
        }
      }
      spkRecords = getSpkArchiveRecords()
    } catch (err) {
      console.warn('[Regulatory Archive] SPK error:', err.message || err)
    }
  }

  // Fetch BDDK records
  if (authority === 'all' || authority === 'bddk') {
    try {
      const bddkResult = await fetchBddkArchive({ limit: queryLimit, refresh: isRefresh })
      bddkRecords = bddkResult.records || []
      bddkStatus = bddkResult.status
    } catch (err) {
      console.warn('[Regulatory Archive] BDDK error:', err.message || err)
      bddkStatus = 'error'
    }
  }

  // Normalize authority for SPK records
  const spkRecordsWithAuthority = spkRecords.map((r) => ({ ...r, authority: 'SPK' }))
  const allRecords = [...spkRecordsWithAuthority, ...bddkRecords]
    .sort((a, b) => getRecordSortTimestamp(b) - getRecordSortTimestamp(a))
    .slice(0, queryLimit)

  res.json({
    total: allRecords.length,
    counts: {
      spk: spkRecords.length,
      bddk: bddkRecords.length,
      total: allRecords.length,
    },
    records: allRecords,
    source: {
      spk: spkSource,
      bddk: bddkStatus,
    },
    lastRefreshedAt: now,
  })
})

// ── Real Integration Layer endpoints ─────────────────────────────────────

app.get('/api/integrations/registry', (_req, res) => {
  res.json({
    sources: getIntegrationRegistry(),
    health: getIntegrationHealth(),
  })
})

app.get('/api/integrations/health', (_req, res) => {
  res.json(getIntegrationHealth())
})

app.post('/api/integrations/scan', async (_req, res) => {
  try {
    const result = await runIntegrationWatchScan({ createNotifications: true })
    res.json(result)
  } catch (err) {
    console.warn('[Real Integrations] scan failed:', err.message || err)
    res.status(502).json({
      error: 'Integration scan failed',
      detail: err.message || String(err),
      scannedAt: new Date().toISOString(),
    })
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Assistant proxy server running on port ${PORT}`)
})
