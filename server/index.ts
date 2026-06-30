import 'dotenv/config'
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { OpenAI } from 'openai'
import multer from 'multer'
// @ts-ignore
import { fetchLatestSpkBulletin, fetchSpkBulletinArchiveRange } from './services/spkBulletins.js'
// @ts-ignore
import { fetchLatestSpkPressRelease, fetchSpkPressReleaseArchive } from './services/spkPressReleases.js'
// @ts-ignore
import { fetchSpkPdfText, parsePdfBuffer } from './services/spkPdfParser.js'
// @ts-ignore
import { upsertSpkArchiveRecords, getSpkArchiveRecords, getSpkArchiveSummary, filterSpkArchive, setArchiveCoverage } from './services/spkSyncStore.js'
// @ts-ignore
import { createNotification, getNotifications, getUnreadCount, markNotificationRead, markAllNotificationsRead, deleteNotification, deleteAllNotifications, getNotificationStoreStats } from './stores/notificationStore.js'
// @ts-ignore
import { addDurableAlertEmail, deleteAllDurableNotifications, deleteDurableNotification, getDurableAlertEmails, getDurableNotifications, hasDurableSourceRecord, isDurableWatchEnabled, markAllDurableNotificationsRead, markDurableNotificationRead, removeDurableAlertEmail, saveDurableNotification } from './stores/regulatoryWatchStore.js'
// @ts-ignore
import { sendSms } from './integrations/sms/smsProvider.js'
// @ts-ignore
import { fetchBddkArchive, debugBddkArchive } from './services/bddkArchive.js'
// @ts-ignore
import { getIntegrationHealth, getIntegrationRegistry, runIntegrationWatchScan } from './services/realIntegrationRegistry.js'

const app = express()
app.use(cors())
app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
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

// ── Cold-start cache: load pre-built SPK archive on serverless cold starts ──
import { readFileSync } from 'fs'
import { join } from 'path'

function loadSpkCacheFromFile() {
  const candidates = [
    join(process.cwd(), 'server', '_cache', 'spk-archive.json'),
    join(process.cwd(), 'api', '..', 'server', '_cache', 'spk-archive.json'),
  ]
  for (const cachePath of candidates) {
    try {
      const raw = readFileSync(cachePath, 'utf-8')
      const cached = JSON.parse(raw)
      if (cached.records && cached.records.length > 0) {
        upsertSpkArchiveRecords(cached.records, cached.source || 'live')
        if (cached.coverage) setArchiveCoverage(cached.coverage)
        console.info(`[SPK Cache] Loaded ${cached.records.length} records from ${cachePath}`)
        return
      }
    } catch {
      // try next candidate
    }
  }
  console.warn('[SPK Cache] No file cache found. Starting with empty archive.')
}

// Load cache immediately on import (useful for serverless cold starts)
loadSpkCacheFromFile()

// Rate limit: memory-based, max 20 requests per minute per IP
const rateLimitMap = new Map<string, number[]>()
const MAX_REQUESTS = 20
const WINDOW_MS = 60_000

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []
  const valid = timestamps.filter((t) => now - t < WINDOW_MS)
  if (valid.length >= MAX_REQUESTS) return false
  valid.push(now)
  rateLimitMap.set(ip, valid)
  return true
}

// ── SPK AI helpers ──────────────────────────────────────────────────────────

const AREA_KEYWORDS: Record<string, string[]> = {
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

function inferAffectedAreasFromText(text: string, record: any): string[] {
  const combined = `${text || ''} ${record?.title || ''} ${record?.number || ''}`.toLowerCase()
  const matched: string[] = []
  for (const [area, keywords] of Object.entries(AREA_KEYWORDS)) {
    if (keywords.some((kw) => combined.includes(kw))) matched.push(area)
  }
  const deduped = [...new Set(matched)]

  if (record?.sourceType === 'press-release') {
    // Press releases: prefer non-compliance areas
    const withoutUyum = deduped.filter((a) => a !== 'Uyum')
    if (withoutUyum.length > 0) return withoutUyum.slice(0, 2)
    return PRESS_FALLBACK_AREAS
  }

  // Bulletins: if zero matched, return single Uyum; if only Uyum matched, keep just Uyum
  if (deduped.length === 0) return BULLETIN_FALLBACK_AREAS
  return deduped.slice(0, 2)
}

function computeImpactLevel(text: string, record: any): 'low' | 'medium' | 'high' {
  const combined = `${text || ''} ${record?.title || ''}`.toLowerCase()
  const highSignals = ['idari para cezası', 'ceza', 'iptal', 'men', 'tedbir', 'geçici', 'soruşturma', 'ihlal', 'ciddi']
  const mediumSignals = ['uyarı', 'bildirim', 'duyuru', 'değişiklik', 'güncelleme', 'tebliğ']
  if (highSignals.some((s) => combined.includes(s))) return 'high'
  if (mediumSignals.some((s) => combined.includes(s))) return 'medium'
  return 'low'
}

function buildFallbackAnalysis(record: any, sourceText: string, reason: string) {
  const areas = inferAffectedAreasFromText(sourceText, record)
  const impact = computeImpactLevel(sourceText, record)
  const sourceTypeLabel = record?.sourceType === 'bulletin' ? 'bülteni' : 'basın duyurusu'
  const number = record?.number || 'Bilinmeyen'

  const summaries: string[] = []
  if (sourceText && sourceText.length > 50) {
    summaries.push(`${number} numaralı SPK ${sourceTypeLabel} üzerinde AI analizi denendi ancak ${reason}. Metin önizlemesi: "${sourceText.slice(0, 120).replace(/\s+/g, ' ').trim()}...". Uyum ekibi manuel inceleme yapmalıdır.`)
  } else {
    summaries.push(`${number} numaralı SPK ${sourceTypeLabel} için otomatik analiz alınamadı. Sebep: ${reason}. Kayıt başlığı ve tarih bilgisine göre uyum ekibi tarafından manuel incelenmesi önerilir.`)
  }

  const keyDecisions: string[] = []
  if (sourceText && sourceText.length > 50) {
    const lines = sourceText.split(/\n|\r/).filter((l) => l.trim().length > 15).slice(0, 3)
    lines.forEach((line, idx) => {
      keyDecisions.push(`${line.trim().slice(0, 90)}${line.length > 90 ? '...' : ''}`)
    })
  }
  if (keyDecisions.length === 0) {
    keyDecisions.push(`${number} kaydının detaylı incelenmesi gerekmektedir.`)
  }

  const complianceMap: Record<string, string[]> = {
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

  const checklist: string[] = []
  areas.slice(0, 2).forEach((area) => {
    const items = complianceMap[area] || complianceMap['Uyum']
    if (items) checklist.push(...items)
  })
  if (checklist.length === 0) {
    checklist.push('Kayıt başlığı ve tarihi kaydedilmeli.', 'İlgili ekibe inceleme için yönlendirilmeli.')
  }

  const actionMap: Record<string, string> = {
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

  const operationalMap: Record<string, string> = {
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

async function safeOpenAiCall(params: any, timeoutMs = 30000): Promise<any> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('OpenAI timeout')), timeoutMs)
    openai!.chat.completions.create(params)
      .then((result) => { clearTimeout(timer); resolve(result) })
      .catch((err) => { clearTimeout(timer); reject(err) })
  })
}

function buildContextLabel(context: Record<string, unknown>): string {
  const roleMap: Record<string, string> = {
    operation: 'Operasyon',
    admin: 'Admin',
    approver: 'Admin',
  }
  const pageMap: Record<string, string> = {
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
  const roleLabel = roleMap[(context?.userRole as string) || ''] || 'Operasyon'
  const page = pageMap[(context?.currentPage as string) || ''] || 'Genel'
  const tx = (context?.selectedTransactionType as string) || 'Genel Yardım'
  return `${roleLabel} / ${page} / ${tx}`
}

function buildSystemPrompt(
  context: Record<string, unknown>,
  ragContext?: string
): string {
  const txType = (context?.selectedTransactionType as string) || ''
  const txDescriptions: Record<string, string> = {
    'TX-001': 'Pay Dağılım Raporu',
    'TX-002': 'Yabancı Yatırımcı Listesi',
    'TX-003': 'Kurumsal Eylem Verileri',
  }

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
   - İşlemler (transactions): Tüm MKK işlemlerinin listesi. Filtreleme (durum, tip, tarih). Her işlemde detay, validasyon, dosya yükleme, audit log.
   - Yeni İşlem (transactions/new): TX-001 Pay Dağılımı, TX-002 Yabancı Yatırımcı, TX-003 Kurumsal Eylem şablonlarını indirme ve yükleme.
   - İşlem Detay (transactions/:id): Durum geçişleri, validasyon hataları, dosya geçmişi, audit log, onay aksiyonları.

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

app.post('/api/assistant/chat', async (req: Request, res: Response) => {
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

    const completion = await openai!.chat.completions.create(
      {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...(history || [])
            .slice(-10)
            .map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant' | 'system',
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
    const err = error as any
    console.error('[Assistant Proxy] Fallback reason: openai_error', {
      name: err?.name,
      message: err?.message,
      status: err?.status,
      code: err?.code,
    })
    return res.json({
      content:
        'Şu anda akıllı asistan servisine erişilemiyor. Mevcut sistem bilgi havuzuna göre ilerleyebilir veya işlemin detay ekranındaki kaynakları kontrol edebilirsiniz.',
      source: 'Sistem Bilgi Havuzu',
      contextLabel: buildContextLabel(context || {}),
    })
  }
})

app.get('/api/spk/sync-status', async (req: Request, res: Response) => {
  try {
  const now = new Date().toISOString()
  const today = now.split('T')[0]

  let latestBulletin: any, latestPress: any
  try {
    latestBulletin = await fetchLatestSpkBulletin()
  } catch (err: any) {
    console.warn('[SPK] Bulletin fetch error:', err.message || err)
  }

  try {
    latestPress = await fetchLatestSpkPressRelease()
  } catch (err: any) {
    console.warn('[SPK] Press fetch error:', err.message || err)
  }

  // Archive: fetch all sources (bulletin, press-release, legislation)
  const currentYear = new Date().getFullYear()
  let archiveRecords = getSpkArchiveRecords()
  let liveFetchCount = 0

  // 1. SPK Bültenleri
  if (archiveRecords.length === 0) {
    try {
      const { records: bulletinRecords, fetchedYears: bYears, skippedYears: bSkipped } = await fetchSpkBulletinArchiveRange({
        startYear: 1990,
        endYear: currentYear,
        limitPerYear: 200,
      })
      if (bulletinRecords.length > 0) {
        upsertSpkArchiveRecords(bulletinRecords, 'live')
        liveFetchCount += bulletinRecords.length
      }
    } catch (err: any) {
      console.warn('[SPK] Bulletin archive range fetch error:', err.message || err)
    }
  }

  // 2. SPK Basın Duyuruları
  if (archiveRecords.length === 0) {
    try {
      const { records: pressRecords } = await fetchSpkPressReleaseArchive({
        startYear: 1990,
        endYear: currentYear,
        limitPerYear: 200,
      })
      if (pressRecords.length > 0) {
        upsertSpkArchiveRecords(pressRecords, 'live')
        liveFetchCount += pressRecords.length
      }
    } catch (err: any) {
      console.warn('[SPK] Press release archive fetch error:', err.message || err)
    }
  }

  // 3. SPK Mevzuat / Kurul Kararları (always fetch if not present)
  const currentRecords = getSpkArchiveRecords()
  const hasLegislation = currentRecords.some((r: any) => r.sourceType === 'legislation')
  console.info(`[SPK] Legislation check: store=${currentRecords.length}, hasLegislation=${hasLegislation}`)
  if (!hasLegislation) {
    try {
      const { fetchSpkLegislationArchive } = await import('./services/spkLegislation.js')
      const { records: legislationRecords } = await fetchSpkLegislationArchive({ limit: 1000 })
      if (legislationRecords.length > 0) {
        upsertSpkArchiveRecords(legislationRecords, 'live')
        liveFetchCount += legislationRecords.length
        console.info(`[SPK] Legislation archive: ${legislationRecords.length} records loaded`)
      }
    } catch (err: any) {
      console.warn('[SPK] Legislation archive fetch error:', err.message || err)
    }
  }

  archiveRecords = getSpkArchiveRecords()

  const archiveSummary = {
    total: archiveRecords.length,
    source: liveFetchCount > 0 ? 'live' as const : (archiveRecords.length > 0 ? 'fallback' as const : 'none' as const),
    records: archiveRecords.slice(0, 20),
  }
  console.info('[SPK] Archive response total:', archiveRecords.length, 'source:', archiveSummary.source)

  res.json({
    status: 'active',
    lastCheckedAt: now,
    sources: [
      {
        name: 'SPK Bültenleri',
        type: 'bulletin',
        url: latestBulletin?.url || 'https://spk.gov.tr/spk-bultenleri',
        status: latestBulletin ? 'ok' : 'error',
        latestTitle: latestBulletin?.title || 'Bülten alınamadı',
        latestDate: latestBulletin?.isoDate || today,
      },
      {
        name: 'SPK Mevzuat Sistemi',
        type: 'regulation',
        url: 'https://mevzuat.spk.gov.tr/',
        status: 'ok',
        latestTitle: 'Mevzuat Sistemi kontrol edildi',
        latestDate: today,
      },
      {
        name: 'SPK Basın Duyuruları',
        type: 'announcement',
        url: latestPress?.url || 'https://spk.gov.tr/duyurular/basin-duyurulari',
        status: latestPress ? 'ok' : 'error',
        latestTitle: latestPress?.title || 'Basın duyurusu alınamadı',
        latestDate: latestPress?.isoDate || today,
      },
    ],
    updates: [
      {
        id: 'spk-bulletin-001',
        source: 'SPK Bültenleri',
        title: latestBulletin ? `Son bülten: ${latestBulletin.number}` : 'Yeni SPK bülteni tespit edildi',
        url: latestBulletin?.url || 'https://spk.gov.tr/spk-bultenleri',
        impact: 'medium',
        summary: latestBulletin
          ? `${latestBulletin.number} - ${latestBulletin.date} tarihli bülten kaydedildi.`
          : 'Uyum ekibi tarafından incelenmesi gereken yeni bülten kaydı.',
        detectedAt: now,
        requiresComplianceReview: true,
      },
      {
        id: 'spk-press-001',
        source: 'SPK Basın Duyuruları',
        title: latestPress ? `Son duyuru: ${latestPress.title}` : 'Basın duyurusu kontrol edildi',
        url: latestPress?.url || 'https://spk.gov.tr/duyurular/basin-duyurulari',
        impact: 'medium',
        summary: latestPress
          ? `${latestPress.title} - ${latestPress.date} tarihli duyuru kaydedildi.`
          : 'Yeni basın duyurusu olup olmadığı kontrol edildi.',
        detectedAt: now,
        requiresComplianceReview: true,
      },
    ],
    archive: archiveSummary,
  })
  } catch (err: any) {
    console.error('[SPK] sync-status endpoint error:', err.message || err)
    const fallbackSummary = getSpkArchiveSummary()
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

app.get('/api/spk/archive', async (req: Request, res: Response) => {
  const { year, startYear, endYear, limit, sourceType } = req.query as Record<string, string | undefined>
  const currentYear = new Date().getFullYear()

  const queryStartYear = startYear ? Number(startYear) : 1990
  const queryEndYear = endYear ? Number(endYear) : currentYear
  const queryLimit = limit ? Number(limit) : 1000

  // If store is empty, try multi-year fetch for both bulletins and press releases
  const summary = getSpkArchiveSummary()
  if (summary.total === 0) {
    try {
      // Fetch bulletins with wide range
      let bulletinRecords: any[] = []
      let fetchedYears: number[] = []
      let skippedYears: number[] = []
      try {
        const bulletinResult = await fetchSpkBulletinArchiveRange({ startYear: queryStartYear, endYear: queryEndYear, limitPerYear: 200 })
        bulletinRecords = bulletinResult.records
        fetchedYears = bulletinResult.fetchedYears
        skippedYears = bulletinResult.skippedYears
      } catch (err: any) {
        console.warn('[SPK] Bulletin archive fetch error:', err.message || err)
      }

      // Fetch press releases
      let pressRecords: any[] = []
      try {
        const pressResult = await fetchSpkPressReleaseArchive({ startYear: queryStartYear, endYear: queryEndYear, limitPerYear: 100 })
        pressRecords = pressResult.records
      } catch (err: any) {
        console.warn('[SPK] Press release archive fetch error:', err.message || err)
      }

      const allRecords = [...bulletinRecords, ...pressRecords]
      allRecords.sort((a, b) => {
        const da = a.isoDate && a.isoDate.includes('-') ? new Date(a.isoDate).getTime() : 0
        const db = b.isoDate && b.isoDate.includes('-') ? new Date(b.isoDate).getTime() : 0
        return db - da
      })

      if (allRecords.length > 0) {
        upsertSpkArchiveRecords(allRecords, 'live')
        setArchiveCoverage({ startYear: queryStartYear, endYear: queryEndYear, fetchedYears, skippedYears })
        console.info(`[SPK Archive] bulletins: ${bulletinRecords.length} pressReleases: ${pressRecords.length} total: ${allRecords.length}`)
      } else {
        console.warn(`[SPK Archive Warning] No records fetched from SPK`)
      }
    } catch (err: any) {
      console.warn('[SPK] Archive endpoint fetch error:', err.message || err)
    }
  }

  const result = (filterSpkArchive as any)({
    year: year ? Number(year) : undefined,
    limit: queryLimit,
    sourceType: sourceType || undefined,
  })
  const storeSummary = getSpkArchiveSummary()
  const allRecords = getSpkArchiveRecords()
  const counts = {
    bulletin: allRecords.filter((r: any) => r.sourceType === 'bulletin').length,
    pressRelease: allRecords.filter((r: any) => r.sourceType === 'press-release').length,
    legislation: allRecords.filter((r: any) => r.sourceType === 'legislation').length,
    total: allRecords.length,
  }

  if (counts.total < 50) {
    console.warn(`[SPK Archive Warning] Low record count: ${counts.total}`)
  }

  res.json({
    ...result,
    source: storeSummary.source,
    coverage: storeSummary.coverage,
    counts,
  })
})

app.get('/api/spk/archive/debug', async (req: Request, res: Response) => {
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
      ? numMatches.map((m: any) => m[1])
      : [...html.matchAll(/B\u00fclten No\s*:\s*(\d{4}\/\d+)/g)].map((m: any) => m[1])
    const dateMatches = [...html.matchAll(/Yay[ıi]mlanma\s*:\s*([^<]+)/gi)]

    fetchedTotal = Math.min(urlMatches.length, numbers.length, dateMatches.length)
    if (fetchedTotal > 0) {
      firstFetchedRecord = {
        number: numbers[0],
        dateRaw: dateMatches[0]?.[1]?.trim(),
        url: urlMatches[0]?.[1],
      }
    }
  } catch (err: any) {
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

// ── BDDK Debug ──────────────────────────────────────────────────────────────

app.get('/api/bddk/debug', async (_req: Request, res: Response) => {
  try {
    const result = await debugBddkArchive()
    res.json(result)
  } catch (err: any) {
    console.warn('[BDDK Debug] Error:', err.message || err)
    res.status(500).json({
      apiBaseUrl: process.env.BDDK_API_BASE_URL || 'https://www.bddk.org.tr',
      hasApiKey: !!process.env.BDDK_API_KEY,
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

// ── Unified Regulatory Archive ────────────────────────────────────────────

app.get('/api/regulatory/archive', async (req: Request, res: Response) => {
  const { authority, limit } = req.query as Record<string, string | undefined>
  const archiveLimit = Math.min(Number(limit) || 200, 500)
  let spkRecords: any[] = []
  let bddkRecords: any[] = []
  let spkSource = 'none'
  let bddkSource = 'none'
  let lastRefreshedAt = new Date().toISOString()

  // Fetch SPK records if requested
  if (!authority || authority === 'all' || authority === 'spk') {
    try {
      const spkData = getSpkArchiveRecords()
      spkRecords = spkData.slice(0, archiveLimit)
      spkSource = spkRecords.length > 0 ? 'store' : 'none'
    } catch (err: any) {
      console.warn('[Regulatory Archive] SPK fetch error:', err.message)
      spkSource = 'error'
    }
  }

  // Fetch BDDK records if requested
  if (!authority || authority === 'all' || authority === 'bddk') {
    try {
      const bddkData = await fetchBddkArchive({ limit: archiveLimit })
      bddkRecords = bddkData.records || []
      bddkSource = bddkData.status === 'ok' ? 'live' : bddkData.status
      lastRefreshedAt = bddkData.lastRefreshedAt || lastRefreshedAt
    } catch (err: any) {
      console.warn('[Regulatory Archive] BDDK fetch error:', err.message)
      bddkSource = 'error'
    }
  }

  // Combine and sort by date descending
  const allRecords = [...spkRecords, ...bddkRecords]
  allRecords.sort((a, b) => String(b.isoDate || '').localeCompare(String(a.isoDate || '')))

  const spkCount = spkRecords.length
  const bddkCount = bddkRecords.length

  res.json({
    total: allRecords.length,
    counts: {
      spk: spkCount,
      bddk: bddkCount,
      total: allRecords.length,
    },
    records: allRecords.slice(0, archiveLimit),
    source: {
      spk: spkSource,
      bddk: bddkSource,
    },
    lastRefreshedAt,
  })
})

app.post('/api/spk/analyze-bulletin', async (req: Request, res: Response) => {
  const { record } = req.body || {}
  if (!record) {
    return res.status(400).json({ error: 'Missing record' })
  }

  // Try fetching PDF text
  let pdfText: string | null = null
  let sourceBasis: 'pdf_content' | 'metadata_only' = 'metadata_only'
  try {
    if (record.url && record.url.endsWith('.pdf')) {
      pdfText = await fetchSpkPdfText(record.url)
      if (pdfText && pdfText.length > 100) {
        sourceBasis = 'pdf_content'
        console.info(`[SPK Analyze] PDF text loaded: ${pdfText.length} chars`)
      }
    }
  } catch (err: any) {
    console.warn('[SPK Analyze] PDF fetch failed:', err.message || err)
  }

  const sourceText = pdfText || `${record.title || ''} ${record.number || ''}`

  if (!openai) {
    console.warn('[SPK Analyze] OpenAI not configured, returning fallback')
    return res.json(buildFallbackAnalysis(record, sourceText, 'OpenAI API anahtarı yapılandırılmamış'))
  }

  const userContent = pdfText && pdfText.length > 100
    ? `Bülten: ${record.number} — ${record.title || ''} — ${record.date || ''}\n\nPDF İçeriği (ilk bölüm):\n${pdfText.slice(0, 8000)}`
    : `Bülten: ${record.number} — ${record.title || ''} — ${record.date || ''} — ${record.url || ''}\n\nNot: PDF içeriği yüklenemedi, sadece metadata üzerinden analiz yap.`

  try {
    const completion = await safeOpenAiCall({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Sen SPK bültenlerini aracı kurum uyum, risk ve operasyon ekipleri açısından özetleyen kıdemli regülasyon analistisin.\n\nKURALLAR:\n1. Verilmeyen bilgiyi kesinlikle uydurma.\n2. Her kayıtta aynı genel cümleleri tekrarlama ("SPK düzenlemelerine ilişkin önemli duyurular" gibi).\n3. PDF veya metin içinde açıkça geçen kararları, kurul kararlarını, ceza kararlarını, duyuruları veya düzenleme başlıklarını çıkar.\n4. PDF/metin yetersizse "İçerikte yeterli detay bulunamadı" de ve tahmin yürütüyorsan bunu açıkça belirt.\n5. En az 3 somut madde üretmeye çalış.\n6. affectedAreas sadece metinde açıkça ilişkili alanlardan seçilmeli; varsayılan olarak Uyum/Risk/Operasyon verme.\n7. Türkçe yanıt ver.\n8. Sadece JSON formatında yanıt ver, dışarıda metin olmasın.\n\nOlası affectedAreas: Uyum, Risk, Operasyon, MKK, Takasbank, MASAK, Müşteri Bildirimi, Emir İletimi, Açığa Satış, Halka Arz, Portföy Yönetimi, Yatırım Danışmanlığı, Araştırma, İç Kontrol, Bilgi Teknolojileri.',
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

    const raw = (completion as any).choices[0]?.message?.content?.trim() || ''
    let parsed: any = {}
    try {
      const match = raw.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : {}
    } catch {
      parsed = {}
    }

    // Post-process affectedAreas: fallback to inferred areas if empty or generic trio
    let areas: string[] = Array.isArray(parsed.affectedAreas) ? parsed.affectedAreas : []
    if (areas.length === 0 || areas.join(',') === 'Uyum,Risk,Operasyon') {
      areas = inferAffectedAreasFromText(sourceText, record)
    }
    // Press releases: strip Uyum, prefer non-compliance areas
    if (record?.sourceType === 'press-release') {
      const withoutUyum = areas.filter((a) => a !== 'Uyum')
      if (withoutUyum.length > 0) areas = withoutUyum
      else areas = PRESS_FALLBACK_AREAS
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
  } catch (err: any) {
    console.warn('[SPK Analyze] OpenAI error:', err.message || err)
    res.json(buildFallbackAnalysis(record, sourceText, err.message || 'OpenAI çağrısı başarısız'))
  }
})

app.post('/api/spk/analyze-bulletin-pdf', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    const record = req.body.record ? JSON.parse(req.body.record) : null
    if (!record) {
      return res.status(400).json({ error: 'Missing record' })
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'PDF dosyası eksik' })
    }

    // Parse uploaded PDF
    let pdfText = ''
    try {
      pdfText = await (parsePdfBuffer as any)(req.file.buffer)
      console.info(`[SPK Analyze PDF] Extracted ${pdfText.length} chars`)
    } catch (err: any) {
      console.warn('[SPK Analyze PDF] Parse failed:', err.message || err)
    }

    const sourceText = pdfText || `${record.title || ''} ${record.number || ''}`

    if (!openai) {
      return res.json(buildFallbackAnalysis(record, sourceText, 'OpenAI API anahtarı yapılandırılmamış'))
    }

    if (!pdfText || pdfText.length < 50) {
      return res.json(buildFallbackAnalysis(record, sourceText, "Yüklenen PDF'den yeterli metin çıkarılamadı"))
    }

    const userContent = `Bülten: ${record.number} — ${record.title || ''} — ${record.date || ''}\n\nYüklenen PDF İçeriği:\n${pdfText.slice(0, 8000)}`

    try {
      const completion = await safeOpenAiCall({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content:
              'Sen SPK bültenlerini aracı kurum uyum, risk ve operasyon ekipleri açısından özetleyen kıdemli regülasyon analistisin.\n\nKURALLAR:\n1. Verilmeyen bilgiyi kesinlikle uydurma.\n2. PDF içinde açıkça geçen kararları, kurul kararlarını, ceza kararlarını, duyuruları veya düzenleme başlıklarını çıkar.\n3. En az 3 somut madde üretmeye çalış.\n4. Her bülten için aynı genel cümleleri tekrarlama.\n5. affectedAreas sadece metinde açıkça ilişkili alanlardan seçilmeli; varsayılan olarak Uyum/Risk/Operasyon verme.\n6. Türkçe yanıt ver.\n7. Sadece JSON formatında yanıt ver, dışarıda metin olmasın.\n\nOlası affectedAreas: Uyum, Risk, Operasyon, MKK, Takasbank, MASAK, Müşteri Bildirimi, Emir İletimi, Açığa Satış, Halka Arz, Portföy Yönetimi, Yatırım Danışmanlığı, Araştırma, İç Kontrol, Bilgi Teknolojileri.',
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

      const raw = (completion as any).choices[0]?.message?.content?.trim() || ''
      let parsed: any = {}
      try {
        const match = raw.match(/\{[\s\S]*\}/)
        parsed = match ? JSON.parse(match[0]) : {}
      } catch {
        parsed = {}
      }

      // Post-process affectedAreas: fallback to inferred areas if empty or generic trio
      let areas: string[] = Array.isArray(parsed.affectedAreas) ? parsed.affectedAreas : []
      if (areas.length === 0 || areas.join(',') === 'Uyum,Risk,Operasyon') {
        areas = inferAffectedAreasFromText(sourceText, record)
      }
      // Press releases: strip Uyum, prefer non-compliance areas
      if (record?.sourceType === 'press-release') {
        const withoutUyum = areas.filter((a) => a !== 'Uyum')
        if (withoutUyum.length > 0) areas = withoutUyum
        else areas = PRESS_FALLBACK_AREAS
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
    } catch (err: any) {
      console.warn('[SPK Analyze PDF] OpenAI error:', err.message || err)
      res.json(buildFallbackAnalysis(record, sourceText, err.message || 'OpenAI çağrısı başarısız'))
    }
  } catch (err: any) {
    console.warn('[SPK Analyze PDF] Error:', err.message || err)
    res.status(500).json({ error: 'Analiz işlenirken hata oluştu.' })
  }
})

// ── Live Regulatory Watch ────────────────────────────────────────────────────

type LiveAuthority = 'SPK' | 'BDDK' | 'MASAK' | 'MKK' | 'TAKASBANK' | 'TCMB' | 'KVKK' | 'RESMI_GAZETE'
  | 'SEC' | 'FINRA' | 'CFTC' | 'NFA' | 'FCA' | 'PRA' | 'ESMA' | 'EBA' | 'EIOPA' | 'ECB' | 'IOSCO' | 'FATF' | 'BIS'

const LIVE_AUTHORITIES: Array<{ authority: LiveAuthority; label: string; targetTab: string }> = [
  { authority: 'SPK', label: 'SPK', targetTab: 'spk' },
  { authority: 'BDDK', label: 'BDDK', targetTab: 'bddk' },
  { authority: 'MASAK', label: 'MASAK', targetTab: 'masak' },
  { authority: 'MKK', label: 'MKK', targetTab: 'reconciliation' },
  { authority: 'TAKASBANK', label: 'Takasbank', targetTab: 'takasbank' },
  { authority: 'TCMB', label: 'TCMB', targetTab: 'datahub' },
  { authority: 'KVKK', label: 'KVKK', targetTab: 'regintel' },
  { authority: 'RESMI_GAZETE', label: 'Resmi Gazete', targetTab: 'regintel' },
  { authority: 'SEC', label: 'SEC', targetTab: 'global' },
  { authority: 'FINRA', label: 'FINRA', targetTab: 'global' },
  { authority: 'CFTC', label: 'CFTC', targetTab: 'global' },
  { authority: 'NFA', label: 'NFA', targetTab: 'global' },
  { authority: 'FCA', label: 'FCA', targetTab: 'global' },
  { authority: 'PRA', label: 'PRA', targetTab: 'global' },
  { authority: 'ESMA', label: 'ESMA', targetTab: 'global' },
  { authority: 'EBA', label: 'EBA', targetTab: 'global' },
  { authority: 'EIOPA', label: 'EIOPA', targetTab: 'global' },
  { authority: 'ECB', label: 'ECB', targetTab: 'global' },
  { authority: 'IOSCO', label: 'IOSCO', targetTab: 'global' },
  { authority: 'FATF', label: 'FATF', targetTab: 'global' },
  { authority: 'BIS', label: 'BIS', targetTab: 'global' },
]

const GENERIC_LIVE_URLS: Partial<Record<LiveAuthority, string>> = {
  MASAK: 'https://masak.hmb.gov.tr',
  MKK: 'https://www.mkk.com.tr',
  TAKASBANK: 'https://www.takasbank.com.tr',
  TCMB: 'https://www.tcmb.gov.tr',
  KVKK: 'https://www.kvkk.gov.tr',
  RESMI_GAZETE: 'https://www.resmigazete.gov.tr',
  SEC: 'https://www.sec.gov/newsroom',
  FINRA: 'https://www.finra.org/rules-guidance/notices',
  CFTC: 'https://www.cftc.gov/PressRoom/PressReleases',
  NFA: 'https://www.nfa.futures.org/news/newsRel.asp',
  FCA: 'https://www.fca.org.uk/news',
  PRA: 'https://www.bankofengland.co.uk/prudential-regulation',
  ESMA: 'https://www.esma.europa.eu/press-news/esma-news',
  EBA: 'https://www.eba.europa.eu/publications-and-media/press-releases',
  EIOPA: 'https://www.eiopa.europa.eu/media/news_en',
  ECB: 'https://www.ecb.europa.eu/press/html/index.en.html',
  IOSCO: 'https://www.iosco.org/news/',
  FATF: 'https://www.fatf-gafi.org/en/publications.html',
  BIS: 'https://www.bis.org/press/index.htm',
}

const RSS_LIVE_URLS: Partial<Record<LiveAuthority, string[]>> = {
  SEC: ['https://www.sec.gov/newsroom/press-releases'],
  FINRA: ['http://feeds.finra.org/news-and-events/feed', 'https://www.finra.org/rules-guidance/notices'],
  FCA: ['https://www.fca.org.uk/news'],
  ESMA: ['https://www.esma.europa.eu/press-news/esma-news'],
}

function stableHash(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function decodeXmlText(value: string) {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseLatestFeedItem(xml: string, fallbackUrl: string, authority: LiveAuthority) {
  const item = xml.match(/<item\b[\s\S]*?<\/item>/i)?.[0] || xml.match(/<entry\b[\s\S]*?<\/entry>/i)?.[0]
  if (!item) return null
  const title = decodeXmlText(item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || `${authority} resmi RSS kaydı`)
  const link =
    decodeXmlText(item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || '') ||
    decodeXmlText(item.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || '') ||
    fallbackUrl
  const pubDate =
    decodeXmlText(item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] || '') ||
    decodeXmlText(item.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] || '') ||
    decodeXmlText(item.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1] || '')
  const signature = stableHash(`${authority}:${title}:${link}:${pubDate}`)
  const parsedDate = pubDate ? new Date(pubDate) : null
  return {
    id: `feed-${authority}-${signature}`,
    title,
    url: link,
    sourceType: 'official-rss-feed',
    isoDate: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString(),
  }
}

async function fetchGenericLiveRecord(authority: LiveAuthority) {
  const urls = [...(RSS_LIVE_URLS[authority] || []), ...(GENERIC_LIVE_URLS[authority] ? [GENERIC_LIVE_URLS[authority] as string] : [])]
  if (!urls.length) return null
  try {
    for (const url of urls) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'AKOP-Regulatory-Watch/1.0',
          Accept: 'application/rss+xml,application/atom+xml,application/xml,text/xml,text/html,application/xhtml+xml',
        },
      })
      clearTimeout(timer)
      if (!response.ok) continue
      const body = await response.text()
      const feedRecord = parseLatestFeedItem(body, url, authority)
      if (feedRecord) return feedRecord
      const title = decodeXmlText(body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || `${authority} resmi kaynak`)
      const signature = stableHash(`${url}:${title}:${body.slice(0, 5000)}`)
      return {
        id: `live-${authority}-${signature}`,
        title,
        url,
        sourceType: 'official-live-page',
        isoDate: new Date().toISOString(),
      }
    }
  } catch {
    return null
  }
  return null
}

function normalizeImpact(record: any): 'low' | 'medium' | 'high' | 'critical' {
  if (record?.impactLevel && ['low', 'medium', 'high', 'critical'].includes(record.impactLevel)) return record.impactLevel
  if (record?.sourceType === 'legislation' || record?.sourceType === 'bddk-regulation') return 'high'
  if (record?.sourceType === 'bulletin' || record?.sourceType === 'bddk-decision') return 'medium'
  return 'low'
}

async function latestRecordForAuthority(authority: LiveAuthority) {
  if (authority === 'SPK') {
    const records = getSpkArchiveRecords()
    return records
      .filter((r: any) => (r.authority || 'SPK') === 'SPK')
      .sort((a: any, b: any) => new Date(b.isoDate || b.date || 0).getTime() - new Date(a.isoDate || a.date || 0).getTime())[0]
  }
  if (authority === 'BDDK') {
    try {
      const bddk = await fetchBddkArchive({ limit: 1 })
      return (bddk?.records || [])[0]
    } catch {
      return null
    }
  }
  return fetchGenericLiveRecord(authority)
}

async function createLiveNotificationFromRecord(authorityInfo: { authority: LiveAuthority; label: string; targetTab: string }, record: any) {
  if (!record?.id) return null
  const sourceRecordId = `${authorityInfo.authority}:${record.id}`
  if (await hasDurableSourceRecord(sourceRecordId)) return null
  const impactLevel = normalizeImpact(record)
  const title = `Yeni ${authorityInfo.label} bildirimi: ${record.title || record.number || 'Yeni kayıt'}`
  const message = `${authorityInfo.label} kaynağında yeni veya güncel bir düzenleyici kayıt tespit edildi. Uyum ekibi incelemesi önerilir.`
  const notification = createNotification({
    authority: authorityInfo.authority,
    sourceType: record.sourceType || 'regulatory-notice',
    sourceRecordId,
    title,
    message,
    url: record.url || null,
    impactLevel,
    requiresComplianceReview: impactLevel !== 'low',
    createdAt: new Date().toISOString(),
    channels: {
      inApp: true,
      sms: impactLevel === 'high' || impactLevel === 'critical',
    },
  })
  if (notification) await saveDurableNotification(notification)
  return notification
}

async function runLiveRegulatoryScan() {
  const results = await Promise.all(LIVE_AUTHORITIES.map(async (authorityInfo) => {
    const record = await latestRecordForAuthority(authorityInfo.authority)
    const notification = record ? await createLiveNotificationFromRecord(authorityInfo, record) : null
    return {
      authority: authorityInfo.authority,
      checkedAt: new Date().toISOString(),
      status: record ? 'checked' : 'no-live-adapter',
      latestRecordId: record?.id || null,
      latestTitle: record?.title || null,
      notificationCreated: Boolean(notification),
      notificationId: notification?.id || null,
    }
  }))
  const created = results.filter((item) => item.notificationCreated).length
  return {
    checkedAt: new Date().toISOString(),
    created,
    unreadCount: getUnreadCount(),
    results,
  }
}

app.post('/api/regulatory/live-scan', async (_req: Request, res: Response) => {
  res.json(await runLiveRegulatoryScan())
})

app.get('/api/cron/regulatory-live-scan', async (req: Request, res: Response) => {
  const expected = process.env.CRON_SECRET
  if (expected && req.query.secret !== expected && req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized cron request.' })
  }
  res.json(await runLiveRegulatoryScan())
})

// ── Real Integration Layer ──────────────────────────────────────────────────

app.get('/api/integrations/registry', (_req: Request, res: Response) => {
  res.json({
    sources: getIntegrationRegistry(),
    health: getIntegrationHealth(),
  })
})

app.get('/api/integrations/health', (_req: Request, res: Response) => {
  res.json(getIntegrationHealth())
})

app.post('/api/integrations/scan', async (_req: Request, res: Response) => {
  try {
    const result = await runIntegrationWatchScan({ createNotifications: true })
    res.json(result)
  } catch (err: any) {
    console.warn('[Real Integrations] scan failed:', err.message || err)
    res.status(502).json({
      error: 'Integration scan failed',
      detail: err.message || String(err),
      scannedAt: new Date().toISOString(),
    })
  }
})

app.get('/api/cron/integration-watch', async (req: Request, res: Response) => {
  const expected = process.env.CRON_SECRET
  if (expected && req.query.secret !== expected && req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized cron request.' })
  }
  res.json(await runIntegrationWatchScan({ createNotifications: true }))
})

// ── Notifications ────────────────────────────────────────────────────────────

app.get('/api/notifications', async (req: Request, res: Response) => {
  const unreadOnly = req.query.unreadOnly === 'true'
  const limit = Number(req.query.limit) || 20
  if (isDurableWatchEnabled()) {
    const durable = await getDurableNotifications({ unreadOnly, limit })
    return res.json(durable)
  }
  const result = getNotifications({ unreadOnly, limit })
  res.json(result)
})

app.get('/api/notifications/unread-count', async (_req: Request, res: Response) => {
  if (isDurableWatchEnabled()) {
    const durable = await getDurableNotifications({ limit: 1 })
    return res.json({ unreadCount: durable?.unreadCount || 0 })
  }
  res.json({ unreadCount: getUnreadCount() })
})

app.get('/api/alert-emails', async (_req: Request, res: Response) => {
  const envRecipients = (process.env.ALERT_EMAIL_TO || '').split(',').map((item) => item.trim()).filter(Boolean)
  const userRecipients = isDurableWatchEnabled() ? await getDurableAlertEmails() : []
  res.json({
    durableEnabled: isDurableWatchEnabled(),
    emails: Array.from(new Set([...envRecipients, ...userRecipients])),
    userEmails: userRecipients,
  })
})

app.post('/api/alert-emails', async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Geçerli bir e-posta girin.' })
  if (!isDurableWatchEnabled()) return res.status(503).json({ error: 'Kalıcı mail ayarı için Upstash Redis env değişkenleri gerekli.' })
  await addDurableAlertEmail(email)
  res.json({ success: true, email, emails: await getDurableAlertEmails() })
})

app.delete('/api/alert-emails/:email', async (req: Request, res: Response) => {
  if (!isDurableWatchEnabled()) return res.status(503).json({ error: 'Kalıcı mail ayarı için Upstash Redis env değişkenleri gerekli.' })
  await removeDurableAlertEmail(req.params.email)
  res.json({ success: true, emails: await getDurableAlertEmails() })
})

app.post('/api/notifications/:id/read', async (req: Request, res: Response) => {
  const { id } = req.params
  if (isDurableWatchEnabled()) {
    const ok = await markDurableNotificationRead(id)
    if (!ok) return res.status(404).json({ error: 'Bildirim bulunamadı.' })
    return res.json({ success: true })
  }
  const ok = markNotificationRead(id)
  if (!ok) {
    return res.status(404).json({ error: 'Bildirim bulunamadı.' })
  }
  res.json({ success: true })
})

app.post('/api/notifications/read-all', async (_req: Request, res: Response) => {
  if (isDurableWatchEnabled()) {
    const changed = await markAllDurableNotificationsRead()
    return res.json({ success: true, changed })
  }
  const changed = markAllNotificationsRead()
  res.json({ success: true, changed })
})

app.delete('/api/notifications/:id', async (req: Request, res: Response) => {
  const { id } = req.params
  if (isDurableWatchEnabled()) {
    const ok = await deleteDurableNotification(id)
    if (!ok) return res.status(404).json({ error: 'Bildirim bulunamadı.' })
    return res.json({ success: true })
  }
  const ok = deleteNotification(id)
  if (!ok) {
    return res.status(404).json({ error: 'Bildirim bulunamadı.' })
  }
  res.json({ success: true })
})

app.delete('/api/notifications/delete-all', async (_req: Request, res: Response) => {
  if (isDurableWatchEnabled()) {
    const deleted = await deleteAllDurableNotifications()
    return res.json({ success: true, deleted })
  }
  const deleted = deleteAllNotifications()
  res.json({ success: true, deleted })
})

// ── SMS Mock Send (internal testing) ────────────────────────────────────────

app.post('/api/sms/send', async (req: Request, res: Response) => {
  const { to, message, notificationId } = req.body || {}
  try {
    const result = await sendSms({ to: to || '+905xxxxxxxxx', message, notificationId })
    res.json(result)
  } catch (err: any) {
    console.warn('[SMS] Mock send error:', err.message || err)
    res.status(500).json({ success: false, error: err.message || 'SMS gönderilemedi.' })
  }
})

export { app }

// Only start HTTP server in local dev (not in Vercel serverless)
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`Assistant proxy server running on port ${PORT}`)
  })
}
