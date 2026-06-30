import express, { type Request, type Response } from 'express'
import { readFileSync } from 'fs'
import { join } from 'path'
import { OpenAI } from 'openai'
import multer from 'multer'

// Server service imports removed for Vercel stability – use dynamic import where needed

// Dynamic loaders for optional PDF services
async function getFetchSpkPdfText() {
  try {
    const m = await import('../server/services/spkPdfParser.js')
    return m.fetchSpkPdfText
  } catch (e) {
    console.warn('[PDF] fetchSpkPdfText unavailable:', e)
    return null
  }
}
async function getParsePdfBuffer() {
  try {
    const m = await import('../server/services/spkPdfParser.js')
    return m.parsePdfBuffer
  } catch (e) {
    console.warn('[PDF] parsePdfBuffer unavailable:', e)
    return null
  }
}

const app = express()
app.use(express.json())

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (file.mimetype === 'application/pdf') cb(null, true)
    else cb(new Error('Sadece PDF dosyaları kabul edilir.'), false)
  },
})

// ── Load SPK archive cache ──────────────────────────────────────────────────
let spkCache: any = null
let lastRefreshedAt: string | null = null

function loadCache() {
  if (spkCache) return spkCache
  const candidates = [
    join(process.cwd(), 'server', '_cache', 'spk-archive.json'),
    join(process.cwd(), 'api', '..', 'server', '_cache', 'spk-archive.json'),
  ]
  for (const p of candidates) {
    try {
      const raw = readFileSync(p, 'utf-8')
      spkCache = JSON.parse(raw)
      console.info(`[API] Loaded SPK cache: ${spkCache.records?.length} records`)
      return spkCache
    } catch {
      // continue
    }
  }
  console.warn('[API] No SPK cache found')
  spkCache = { total: 0, source: 'none', records: [] }
  return spkCache
}

// ── Load BDDK archive cache ─────────────────────────────────────────────────
let bddkCache: any = null

function loadBddkCache() {
  if (bddkCache) return bddkCache
  const candidates = [
    join(process.cwd(), 'server', '_cache', 'bddk-archive.json'),
    join(process.cwd(), 'api', '..', 'server', '_cache', 'bddk-archive.json'),
  ]
  for (const p of candidates) {
    try {
      const raw = readFileSync(p, 'utf-8')
      bddkCache = JSON.parse(raw)
      console.info(`[API] Loaded BDDK cache: ${bddkCache.records?.length} records`)
      return bddkCache
    } catch {
      // continue
    }
  }
  console.warn('[API] No BDDK cache found')
  bddkCache = { total: 0, source: 'none', records: [] }
  return bddkCache
}

// ── Merge helper ────────────────────────────────────────────────────────────
function mergeRecords(existing: any[], fresh: any[]) {
  const map = new Map<string, any>()
  for (const r of existing) {
    map.set(r.id, r)
  }
  let added = 0
  for (const r of fresh) {
    if (!map.has(r.id)) {
      map.set(r.id, r)
      added++
    }
  }
  const merged = Array.from(map.values())
  merged.sort((a: any, b: any) => {
    const ta = a.isoDate ? new Date(a.isoDate).getTime() : 0
    const tb = b.isoDate ? new Date(b.isoDate).getTime() : 0
    return tb - ta
  })
  return { merged, added }
}

// ── Live refresh (stale-while-revalidate) ───────────────────────────────────
async function refreshSpkCache() {
  const currentYear = new Date().getFullYear()
  const cached = loadCache()
  let liveRecords: any[] = []
  let fetchLog = [] as string[]

  try {
    console.info('[Refresh] Fetching bulletins 2025-' + currentYear)
    const m = await import('../server/services/spkBulletins.js')
    const { records: bRecords } = await m.fetchSpkBulletinArchiveRange({
      startYear: 2025,
      endYear: currentYear,
      limitPerYear: 200,
    })
    liveRecords.push(...bRecords)
    fetchLog.push(`bulletins:${bRecords.length}`)
  } catch (err: any) {
    console.warn('[Refresh] Bulletins failed:', err.message || err)
    fetchLog.push(`bulletins:error`)
  }

  try {
    console.info('[Refresh] Fetching press releases 2025-' + currentYear)
    const m = await import('../server/services/spkPressReleases.js')
    const { records: pRecords } = await m.fetchSpkPressReleaseArchive({
      startYear: 2025,
      endYear: currentYear,
      limitPerYear: 200,
    })
    liveRecords.push(...pRecords)
    fetchLog.push(`press:${pRecords.length}`)
  } catch (err: any) {
    console.warn('[Refresh] Press failed:', err.message || err)
    fetchLog.push(`press:error`)
  }

  try {
    console.info('[Refresh] Fetching legislation')
    const m = await import('../server/services/spkLegislation.js')
    const { records: lRecords } = await m.fetchSpkLegislationArchive({ limit: 100 })
    liveRecords.push(...lRecords)
    fetchLog.push(`legislation:${lRecords.length}`)
  } catch (err: any) {
    console.warn('[Refresh] Legislation failed:', err.message || err)
    fetchLog.push(`legislation:error`)
  }

  const { merged, added } = mergeRecords(cached.records || [], liveRecords)
  spkCache = {
    ...cached,
    records: merged,
    total: merged.length,
    source: added > 0 ? 'live' : (cached.source || 'cache'),
    lastRefreshedAt: new Date().toISOString(),
    refreshLog: fetchLog,
    counts: {
      bulletin: merged.filter((r: any) => r.sourceType === 'bulletin').length,
      pressRelease: merged.filter((r: any) => r.sourceType === 'press-release').length,
      legislation: merged.filter((r: any) => r.sourceType === 'legislation').length,
      total: merged.length,
    },
  }
  lastRefreshedAt = spkCache.lastRefreshedAt
  console.info(`[Refresh] Total: ${merged.length}, Added: ${added}`)
  return { merged, added, fetchLog }
}

// ── Health ──────────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true, env: process.env.VERCEL ? 'vercel' : 'local' })
})

// ── SPK Archive ─────────────────────────────────────────────────────────────
app.get('/api/spk/archive', async (req: Request, res: Response) => {
  const isRefresh = req.query.refresh === 'true'
  const year = req.query.year as string | undefined
  const sourceType = req.query.sourceType as string | undefined
  const limit = Number(req.query.limit) || 100

  let data = loadCache()
  let added = 0
  let fetchLog: string[] = []

  if (isRefresh) {
    try {
      const result = await refreshSpkCache()
      data = spkCache
      added = result.added
      fetchLog = result.fetchLog
    } catch (err: any) {
      console.warn('[Archive] Refresh failed:', err.message || err)
      data = loadCache()
      fetchLog = ['refresh-fatal-error']
    }
  }

  let records = data.records || []
  if (year !== undefined && year !== '' && year !== 'all') {
    const y = Number(year)
    records = records.filter((r: any) => r.year === y)
  }
  if (sourceType && sourceType !== 'all') {
    records = records.filter((r: any) => r.sourceType === sourceType)
  }

  // Sort: newest first
  records.sort((a: any, b: any) => {
    const ta = a.isoDate ? new Date(a.isoDate).getTime() : 0
    const tb = b.isoDate ? new Date(b.isoDate).getTime() : 0
    return tb - ta
  })

  const sliced = records.slice(0, limit)
  const counts = data.counts || {
    bulletin: records.filter((r: any) => r.sourceType === 'bulletin').length,
    pressRelease: records.filter((r: any) => r.sourceType === 'press-release').length,
    legislation: records.filter((r: any) => r.sourceType === 'legislation').length,
    total: records.length,
  }

  // Find latest bulletin number for UI
  const bulletins = records.filter((r: any) => r.sourceType === 'bulletin')
  const latestBulletin = bulletins.length > 0 ? bulletins[0] : null

  res.json({
    total: records.length,
    source: isRefresh ? 'live' : (data.source || 'cache'),
    records: sliced,
    counts,
    coverage: data.coverage,
    stats: data.stats,
    yearRange: data.yearRange,
    lastRefreshedAt: data.lastRefreshedAt || lastRefreshedAt,
    refreshLog: fetchLog,
    added,
    latestBulletin: latestBulletin ? {
      number: latestBulletin.number,
      title: latestBulletin.title,
      isoDate: latestBulletin.isoDate,
      url: latestBulletin.url,
    } : null,
  })
})

// ── SPK Sync Status ───────────────────────────────────────────────────────
app.get('/api/spk/sync-status', async (_req: Request, res: Response) => {
  const cached = loadCache()
  const now = new Date().toISOString()
  const today = now.split('T')[0]

  // Find latest bulletin from cache (or try live if very stale)
  const bulletins = (cached.records || []).filter((r: any) => r.sourceType === 'bulletin')
  const latestBulletin = bulletins.length > 0 ? bulletins[0] : null
  const latestPress = (cached.records || []).filter((r: any) => r.sourceType === 'press-release')[0]

  res.json({
    status: 'active',
    lastCheckedAt: now,
    sources: [
      {
        name: 'SPK Bültenleri',
        type: 'bulletin',
        url: 'https://spk.gov.tr/spk-bultenleri',
        status: 'ok',
        latestTitle: latestBulletin?.title || 'SPK Bülteni',
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
        url: 'https://spk.gov.tr/duyurular/basin-duyurulari',
        status: 'ok',
        latestTitle: latestPress?.title || 'Basın duyuruları kontrol edildi',
        latestDate: latestPress?.isoDate || today,
      },
    ],
    updates: [],
    archive: {
      total: cached.total || 0,
      source: cached.source || 'live',
      records: (cached.records || []).slice(0, 20),
      counts: cached.counts,
      stats: cached.stats,
      coverage: cached.coverage,
      yearRange: cached.yearRange,
      lastRefreshedAt: cached.lastRefreshedAt || lastRefreshedAt,
      latestBulletin: latestBulletin ? {
        number: latestBulletin.number,
        title: latestBulletin.title,
        isoDate: latestBulletin.isoDate,
      } : null,
    },
  })
})

// ── OpenAI setup ────────────────────────────────────────────────────────────
const openaiApiKey = process.env.OPENAI_API_KEY
const openai = openaiApiKey ? new OpenAI({ apiKey: openaiApiKey }) : null
const openaiModel = process.env.OPENAI_MODEL || 'gpt-4o-mini'

function buildFallback(reason: string) {
  return {
    summary: `AI analizi yapılamadı. ${reason}`,
    keyDecisions: [],
    affectedAreas: ['Uyum'],
    recommendedAction: 'Lütfen tekrar deneyin veya destek ekibine başvurun.',
    impactLevel: 'low',
    complianceChecklist: [],
    possibleOperationalImpact: 'Bilinmiyor.',
    sourceBasis: 'fallback',
    reliability: 'low',
    disclaimer: 'Bu analiz bilgilendirme amaçlıdır, uyum ekibi incelemesinin yerine geçmez.',
  }
}

// ── SPK Analyze Bulletin ────────────────────────────────────────────────────
app.post('/api/spk/analyze-bulletin', async (req: Request, res: Response) => {
  const { record } = req.body || {}
  if (!record) {
    return res.status(400).json({ error: 'Missing record' })
  }

  // Try fetching PDF text
  let pdfText: string | null = null
  let sourceBasis: 'pdf_content' | 'metadata_only' | 'openai' = 'metadata_only'
  try {
    if (record.url && record.url.endsWith('.pdf')) {
      const fetchPdf = await getFetchSpkPdfText()
      if (fetchPdf) {
        pdfText = await fetchPdf(record.url)
        if (pdfText && pdfText.length > 100) {
          sourceBasis = 'pdf_content'
          console.info(`[Analyze] PDF text loaded: ${pdfText.length} chars`)
        }
      }
    }
  } catch (err: any) {
    console.warn('[Analyze] PDF fetch failed:', err.message || err)
  }

  const sourceText = pdfText || `${record.title || ''} ${record.number || ''}`

  if (!openai) {
    console.warn('[Analyze] OPENAI_API_KEY eksik')
    return res.json(buildFallback('OPENAI_API_KEY environment variable eksik. Vercel Environment Variables ayarlarından ekleyin.'))
  }

  const userContent = pdfText && pdfText.length > 100
    ? `Bülten: ${record.number || ''} — ${record.title || ''} — ${record.date || ''}\n\nPDF İçeriği (ilk bölüm):\n${pdfText.slice(0, 8000)}`
    : `Bülten: ${record.number || ''} — ${record.title || ''} — ${record.date || ''} — ${record.url || ''}\n\nNot: PDF içeriği yüklenemedi, sadece metadata üzerinden analiz yap.`

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    const completion = await openai.chat.completions.create(
      {
        model: openaiModel,
        messages: [
          {
            role: 'system',
            content:
              'Sen SPK bültenlerini aracı kurum uyum, risk ve operasyon ekipleri açısından özetleyen kıdemli regülasyon analistisin.\n\nKURALLAR:\n1. Verilmeyen bilgiyi kesinlikle uydurma.\n2. Her kayıtta aynı genel cümleleri tekrarlama.\n3. Metinde açıkça geçen kararları, kurul kararlarını, ceza kararlarını, duyuruları veya düzenleme başlıklarını çıkar.\n4. En az 3 somut madde üretmeye çalış.\n5. affectedAreas sadece metinde açıkça ilişkili alanlardan seçilmeli; varsayılan olarak Uyum/Risk/Operasyon verme.\n6. Türkçe yanıt ver.\n7. Sadece JSON formatında yanıt ver, dışarıda metin olmasın.\n\nOlası affectedAreas: Uyum, Risk, Operasyon, MKK, Takasbank, MASAK, Müşteri Bildirimi, Emir İletimi, Açığa Satış, Halka Arz, Portföy Yönetimi, Yatırım Danışmanlığı, Araştırma, İç Kontrol, Bilgi Teknolojileri.',
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
        temperature: 0.15,
        max_tokens: 700,
        response_format: { type: 'json_object' },
      },
      { signal: controller.signal as any }
    )
    clearTimeout(timeout)

    const raw = completion.choices[0]?.message?.content?.trim() || ''
    let parsed: any = {}
    try {
      const match = raw.match(/\{[\s\S]*\}/)
      parsed = match ? JSON.parse(match[0]) : {}
    } catch {
      parsed = {}
    }

    const result = {
      summary: parsed.summary || 'Özet üretilemedi.',
      keyDecisions: Array.isArray(parsed.keyDecisions) ? parsed.keyDecisions : [],
      affectedAreas: Array.isArray(parsed.affectedAreas) ? parsed.affectedAreas : ['Uyum'],
      recommendedAction: parsed.recommendedAction || 'İnceleme önerilir.',
      impactLevel: ['low', 'medium', 'high'].includes(parsed.impactLevel) ? parsed.impactLevel : 'low',
      complianceChecklist: Array.isArray(parsed.complianceChecklist) ? parsed.complianceChecklist : [],
      possibleOperationalImpact: parsed.possibleOperationalImpact || 'Belirlenmedi.',
      sourceBasis,
      reliability: sourceBasis === 'pdf_content' ? 'high' : 'medium',
      disclaimer: 'Bu analiz bilgilendirme amaçlıdır, uyum ekibi incelemesinin yerine geçmez.',
    }

    console.info('[Analyze] OpenAI success', record.number, 'source:', sourceBasis)
    res.json(result)
  } catch (err: any) {
    console.warn('[Analyze] OpenAI error:', err.message || err)
    res.json(buildFallback(`OpenAI çağrısı başarısız: ${err.message || 'Bilinmeyen hata'}`))
  }
})

// ── SPK Analyze Bulletin PDF ────────────────────────────────────────────────
app.post('/api/spk/analyze-bulletin-pdf', upload.single('pdf'), async (req: Request, res: Response) => {
  try {
    const record = req.body.record ? JSON.parse(req.body.record) : null
    if (!record) {
      return res.status(400).json({ error: 'Missing record' })
    }
    const multerFile = (req as any).file
    if (!multerFile || !multerFile.buffer) {
      return res.status(400).json({ error: 'PDF dosyası eksik' })
    }

    let pdfText = ''
    try {
      const parseBuf = await getParsePdfBuffer()
      if (parseBuf) {
        pdfText = await (parseBuf as any)(multerFile.buffer)
        console.info(`[Analyze PDF] Extracted ${pdfText.length} chars`)
      }
    } catch (err: any) {
      console.warn('[Analyze PDF] Parse failed:', err.message || err)
    }

    const sourceText = pdfText || `${record.title || ''} ${record.number || ''}`

    if (!openai) {
      return res.json(buildFallback('OPENAI_API_KEY environment variable eksik.'))
    }

    if (!pdfText || pdfText.length < 50) {
      return res.json(buildFallback("Yüklenen PDF'den yeterli metin çıkarılamadı"))
    }

    const userContent = `Bülten: ${record.number || ''} — ${record.title || ''} — ${record.date || ''}\n\nYüklenen PDF İçeriği:\n${pdfText.slice(0, 8000)}`

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 30000)

      const completion = await openai.chat.completions.create(
        {
          model: openaiModel,
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
        },
        { signal: controller.signal as any }
      )
      clearTimeout(timeout)

      const raw = completion.choices[0]?.message?.content?.trim() || ''
      let parsed: any = {}
      try {
        const match = raw.match(/\{[\s\S]*\}/)
        parsed = match ? JSON.parse(match[0]) : {}
      } catch {
        parsed = {}
      }

      const result = {
        summary: parsed.summary || buildFallback('OpenAI yanıtı eksik').summary,
        keyDecisions: Array.isArray(parsed.keyDecisions) && parsed.keyDecisions.length > 0 ? parsed.keyDecisions : buildFallback('OpenAI yanıtı eksik').keyDecisions,
        affectedAreas: Array.isArray(parsed.affectedAreas) ? parsed.affectedAreas : ['Uyum'],
        recommendedAction: parsed.recommendedAction || buildFallback('OpenAI yanıtı eksik').recommendedAction,
        impactLevel: ['low', 'medium', 'high'].includes(parsed.impactLevel) ? parsed.impactLevel : 'low',
        complianceChecklist: Array.isArray(parsed.complianceChecklist) && parsed.complianceChecklist.length > 0 ? parsed.complianceChecklist : buildFallback('OpenAI yanıtı eksik').complianceChecklist,
        possibleOperationalImpact: parsed.possibleOperationalImpact || buildFallback('OpenAI yanıtı eksik').possibleOperationalImpact,
        sourceBasis: 'uploaded_pdf',
        reliability: 'high',
        disclaimer: 'Bu analiz bilgilendirme amaçlıdır, uyum ekibi incelemesinin yerine geçmez.',
      }

      console.info('[Analyze PDF]', record.number, 'impact:', result.impactLevel)
      res.json(result)
    } catch (err: any) {
      console.warn('[Analyze PDF] OpenAI error:', err.message || err)
      res.json(buildFallback(`OpenAI çağrısı başarısız: ${err.message || 'Bilinmeyen hata'}`))
    }
  } catch (err: any) {
    console.warn('[Analyze PDF] Error:', err.message || err)
    res.status(500).json({ error: 'Analiz işlenirken hata oluştu.' })
  }
})

// ── SPK Legislation Debug ───────────────────────────────────────────────────
app.get('/api/spk/legislation/debug', (_req: Request, res: Response) => {
  const cached = loadCache()
  const legislation = (cached.records || []).filter((r: any) => r.sourceType === 'legislation')
  res.json({
    total: legislation.length,
    records: legislation.slice(0, 10),
  })
})

// ── Live Regulatory Watch + Notifications ─────────────────────────────────
type ApiNotification = {
  id: string
  authority: string
  sourceType: string
  sourceRecordId: string
  title: string
  message: string
  url: string | null
  impactLevel: 'low' | 'medium' | 'high' | 'critical'
  requiresComplianceReview: boolean
  createdAt: string
  readAt: string | null
  channels: { inApp: boolean; sms: boolean }
}

let apiNotifications: ApiNotification[] = []
const apiSeenSourceRecordIds = new Set<string>()
const API_NOTIFICATIONS_KEY = 'akop:notifications'
const API_SEEN_KEY = 'akop:regulatory-watch:seen-source-records'
const API_ALERT_EMAILS_KEY = 'akop:alert-emails'
const API_MAX_NOTIFICATIONS = 1000

function isApiDurableEnabled() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
}

async function apiRedis(command: string, ...args: unknown[]) {
  if (!isApiDurableEnabled()) return null
  const response = await fetch(process.env.UPSTASH_REDIS_REST_URL as string, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([command, ...args]),
  })
  const body = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(body?.error || `Redis HTTP ${response.status}`)
  return body.result
}

async function apiHasDurableSourceRecord(sourceRecordId: string) {
  if (!sourceRecordId || !isApiDurableEnabled()) return false
  const result = await apiRedis('SISMEMBER', API_SEEN_KEY, sourceRecordId)
  return result === 1 || result === true
}

async function apiSaveDurableNotification(notification: ApiNotification) {
  if (!isApiDurableEnabled()) return
  await apiRedis('LPUSH', API_NOTIFICATIONS_KEY, JSON.stringify(notification))
  await apiRedis('LTRIM', API_NOTIFICATIONS_KEY, 0, API_MAX_NOTIFICATIONS - 1)
  await apiRedis('SADD', API_SEEN_KEY, notification.sourceRecordId)
}

async function apiGetDurableNotifications({ unreadOnly = false, limit = 20 } = {}) {
  if (!isApiDurableEnabled()) return null
  const rawItems = await apiRedis('LRANGE', API_NOTIFICATIONS_KEY, 0, API_MAX_NOTIFICATIONS - 1)
  const parsed = (Array.isArray(rawItems) ? rawItems : [])
    .map((item) => {
      try { return JSON.parse(String(item)) as ApiNotification } catch { return null }
    })
    .filter(Boolean) as ApiNotification[]
  return {
    notifications: parsed.filter((item) => !unreadOnly || !item.readAt).slice(0, Math.max(1, limit)),
    unreadCount: parsed.filter((item) => !item.readAt).length,
  }
}

async function apiRewriteDurableNotifications(mutator: (items: ApiNotification[]) => ApiNotification[]) {
  const current = await apiGetDurableNotifications({ limit: API_MAX_NOTIFICATIONS })
  const next = mutator(current?.notifications || [])
  await apiRedis('DEL', API_NOTIFICATIONS_KEY)
  for (let i = next.length - 1; i >= 0; i--) {
    await apiRedis('LPUSH', API_NOTIFICATIONS_KEY, JSON.stringify(next[i]))
  }
  await apiRedis('LTRIM', API_NOTIFICATIONS_KEY, 0, API_MAX_NOTIFICATIONS - 1)
  return next
}

async function apiGetAlertEmails() {
  const envRecipients = getAlertEmailRecipients()
  if (!isApiDurableEnabled()) return { userEmails: [], emails: envRecipients }
  const stored = await apiRedis('SMEMBERS', API_ALERT_EMAILS_KEY)
  const userEmails = Array.isArray(stored) ? stored.map(String) : []
  return { userEmails, emails: Array.from(new Set([...envRecipients, ...userEmails])) }
}

function getAlertEmailRecipients() {
  return (process.env.ALERT_EMAIL_TO || '').split(',').map((item) => item.trim()).filter(Boolean)
}

function isApiEmailEnabled() {
  return Boolean(process.env.RESEND_API_KEY && process.env.ALERT_EMAIL_FROM && getAlertEmailRecipients().length > 0)
}

function escapeApiHtml(value: string) {
  return String(value || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

async function sendApiRegulatoryEmail(notification: ApiNotification) {
  const recipients = (await apiGetAlertEmails()).emails
  if (!process.env.RESEND_API_KEY || !process.env.ALERT_EMAIL_FROM || recipients.length === 0) return
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.ALERT_EMAIL_FROM,
      to: recipients,
      subject: `[AKOP] ${notification.authority} yeni bildirim: ${notification.title}`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
          <h2 style="margin:0 0 12px">Yeni düzenleyici bildirim</h2>
          <p><strong>Kurum:</strong> ${escapeApiHtml(notification.authority)}</p>
          <p><strong>Etki:</strong> ${escapeApiHtml(notification.impactLevel)}</p>
          <p><strong>Başlık:</strong> ${escapeApiHtml(notification.title)}</p>
          <p>${escapeApiHtml(notification.message)}</p>
          ${notification.url ? `<p><a href="${escapeApiHtml(notification.url)}">Kaynağı incele</a></p>` : ''}
          <p style="font-size:12px;color:#64748b">AKOP Regulatory Watch tarafından otomatik gönderildi.</p>
        </div>
      `,
    }),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    console.warn('[Email] Resend failed:', body?.message || response.status)
  }
}

async function createApiNotification(input: Omit<ApiNotification, 'id' | 'readAt' | 'channels'> & { channels?: Partial<ApiNotification['channels']> }) {
  if (await apiHasDurableSourceRecord(input.sourceRecordId)) return null
  if (apiSeenSourceRecordIds.has(input.sourceRecordId)) return null
  const notification: ApiNotification = {
    ...input,
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    readAt: null,
    channels: { inApp: true, sms: Boolean(input.channels?.sms) },
  }
  apiNotifications.unshift(notification)
  apiSeenSourceRecordIds.add(notification.sourceRecordId)
  await apiSaveDurableNotification(notification)
  if (notification.requiresComplianceReview || notification.impactLevel === 'high' || notification.impactLevel === 'critical') {
    sendApiRegulatoryEmail(notification).catch((err) => console.warn('[Email] Provider error:', err.message || err))
  }
  return notification
}

function apiUnreadCount() {
  return apiNotifications.filter((item) => !item.readAt).length
}

const apiGenericLiveUrls: Record<string, string> = {
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

const apiRssLiveUrls: Record<string, string[]> = {
  SEC: ['https://www.sec.gov/newsroom/press-releases'],
  FINRA: ['http://feeds.finra.org/news-and-events/feed', 'https://www.finra.org/rules-guidance/notices'],
  FCA: ['https://www.fca.org.uk/news'],
  ESMA: ['https://www.esma.europa.eu/press-news/esma-news'],
}

function apiStableHash(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) - hash) + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash).toString(36)
}

function apiDecodeXmlText(value: string) {
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

function apiParseLatestFeedItem(xml: string, fallbackUrl: string, authority: string) {
  const item = xml.match(/<item\b[\s\S]*?<\/item>/i)?.[0] || xml.match(/<entry\b[\s\S]*?<\/entry>/i)?.[0]
  if (!item) return null
  const title = apiDecodeXmlText(item.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || `${authority} resmi RSS kaydı`)
  const link =
    apiDecodeXmlText(item.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || '') ||
    apiDecodeXmlText(item.match(/<link[^>]*href=["']([^"']+)["'][^>]*>/i)?.[1] || '') ||
    fallbackUrl
  const pubDate =
    apiDecodeXmlText(item.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] || '') ||
    apiDecodeXmlText(item.match(/<updated[^>]*>([\s\S]*?)<\/updated>/i)?.[1] || '') ||
    apiDecodeXmlText(item.match(/<published[^>]*>([\s\S]*?)<\/published>/i)?.[1] || '')
  const signature = apiStableHash(`${authority}:${title}:${link}:${pubDate}`)
  const parsedDate = pubDate ? new Date(pubDate) : null
  return {
    id: `feed-${authority}-${signature}`,
    title,
    url: link,
    sourceType: 'official-rss-feed',
    isoDate: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString(),
  }
}

async function latestApiRecord(authority: string) {
  if (authority === 'SPK') {
    const cache = loadCache()
    return [...(cache.records || [])]
      .filter((record: any) => (record.authority || 'SPK') === 'SPK')
      .sort((a: any, b: any) => new Date(b.isoDate || b.date || 0).getTime() - new Date(a.isoDate || a.date || 0).getTime())[0]
  }
  if (authority === 'BDDK') {
    const cache = loadBddkCache()
    return [...(cache.records || [])]
      .sort((a: any, b: any) => new Date(b.isoDate || b.date || 0).getTime() - new Date(a.isoDate || a.date || 0).getTime())[0]
  }
  const urls = [...(apiRssLiveUrls[authority] || []), ...(apiGenericLiveUrls[authority] ? [apiGenericLiveUrls[authority]] : [])]
  if (urls.length) {
    for (const url of urls) {
      try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'AKOP-Regulatory-Watch/1.0', Accept: 'application/rss+xml,application/atom+xml,application/xml,text/xml,text/html,application/xhtml+xml' },
      })
      clearTimeout(timer)
      if (!response.ok) continue
      const body = await response.text()
      const feedRecord = apiParseLatestFeedItem(body, url, authority)
      if (feedRecord) return feedRecord
      const title = apiDecodeXmlText(body.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || `${authority} resmi kaynak`)
      const signature = apiStableHash(`${url}:${title}:${body.slice(0, 5000)}`)
      return { id: `live-${authority}-${signature}`, title, url, sourceType: 'official-live-page', isoDate: new Date().toISOString() }
      } catch {
        continue
      }
    }
  }
  return null
}

function apiImpact(record: any): 'low' | 'medium' | 'high' | 'critical' {
  if (record?.sourceType === 'legislation' || record?.sourceType === 'bddk-regulation') return 'high'
  if (record?.sourceType === 'bulletin' || record?.sourceType === 'bddk-decision') return 'medium'
  return 'low'
}

async function runApiLiveRegulatoryScan() {
  const authorities = ['SPK', 'BDDK', 'MASAK', 'MKK', 'TAKASBANK', 'TCMB', 'KVKK', 'RESMI_GAZETE', 'SEC', 'FINRA', 'CFTC', 'NFA', 'FCA', 'PRA', 'ESMA', 'EBA', 'EIOPA', 'ECB', 'IOSCO', 'FATF', 'BIS']
  const results = await Promise.all(authorities.map(async (authority) => {
    const record = await latestApiRecord(authority)
    const notification = record ? await createApiNotification({
      authority,
      sourceType: record.sourceType || 'regulatory-notice',
      sourceRecordId: `${authority}:${record.id}`,
      title: `Yeni ${authority} bildirimi: ${record.title || record.number || 'Yeni kayıt'}`,
      message: `${authority} kaynağında yeni veya güncel bir düzenleyici kayıt tespit edildi. Uyum ekibi incelemesi önerilir.`,
      url: record.url || null,
      impactLevel: apiImpact(record),
      requiresComplianceReview: apiImpact(record) !== 'low',
      createdAt: new Date().toISOString(),
      channels: { sms: apiImpact(record) === 'high' || apiImpact(record) === 'critical' },
    }) : null
    return {
      authority,
      checkedAt: new Date().toISOString(),
      status: record ? 'checked' : 'no-live-adapter',
      latestRecordId: record?.id || null,
      latestTitle: record?.title || null,
      notificationCreated: Boolean(notification),
      notificationId: notification?.id || null,
    }
  }))
  return { checkedAt: new Date().toISOString(), created: results.filter((item) => item.notificationCreated).length, unreadCount: apiUnreadCount(), results }
}

app.post('/api/regulatory/live-scan', async (_req: Request, res: Response) => {
  res.json(await runApiLiveRegulatoryScan())
})

app.get('/api/cron/regulatory-live-scan', async (req: Request, res: Response) => {
  const expected = process.env.CRON_SECRET
  if (expected && req.query.secret !== expected && req.headers.authorization !== `Bearer ${expected}`) {
    return res.status(401).json({ error: 'Unauthorized cron request.' })
  }
  res.json(await runApiLiveRegulatoryScan())
})

app.get('/api/notifications', async (req: Request, res: Response) => {
  const unreadOnly = req.query.unreadOnly === 'true'
  const limit = Number(req.query.limit) || 20
  if (isApiDurableEnabled()) {
    return res.json(await apiGetDurableNotifications({ unreadOnly, limit }))
  }
  const notifications = apiNotifications
    .filter((item) => !unreadOnly || !item.readAt)
    .slice(0, Math.max(1, limit))
  res.json({ notifications, unreadCount: apiUnreadCount() })
})

app.get('/api/notifications/unread-count', async (_req: Request, res: Response) => {
  if (isApiDurableEnabled()) {
    const durable = await apiGetDurableNotifications({ limit: 1 })
    return res.json({ unreadCount: durable?.unreadCount || 0 })
  }
  res.json({ unreadCount: apiUnreadCount() })
})

app.get('/api/alert-emails', async (_req: Request, res: Response) => {
  const data = await apiGetAlertEmails()
  res.json({ durableEnabled: isApiDurableEnabled(), ...data })
})

app.post('/api/alert-emails', async (req: Request, res: Response) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Geçerli bir e-posta girin.' })
  if (!isApiDurableEnabled()) return res.status(503).json({ error: 'Kalıcı mail ayarı için Upstash Redis env değişkenleri gerekli.' })
  await apiRedis('SADD', API_ALERT_EMAILS_KEY, email)
  res.json({ success: true, email, ...(await apiGetAlertEmails()) })
})

app.delete('/api/alert-emails/:email', async (req: Request, res: Response) => {
  if (!isApiDurableEnabled()) return res.status(503).json({ error: 'Kalıcı mail ayarı için Upstash Redis env değişkenleri gerekli.' })
  await apiRedis('SREM', API_ALERT_EMAILS_KEY, req.params.email)
  res.json({ success: true, ...(await apiGetAlertEmails()) })
})

app.post('/api/notifications/:id/read', async (req: Request, res: Response) => {
  if (isApiDurableEnabled()) {
    let found = false
    await apiRewriteDurableNotifications((items) => items.map((item) => {
      if (item.id !== req.params.id) return item
      found = true
      return { ...item, readAt: item.readAt || new Date().toISOString() }
    }))
    if (!found) return res.status(404).json({ error: 'Bildirim bulunamadı.' })
    return res.json({ success: true })
  }
  const item = apiNotifications.find((notification) => notification.id === req.params.id)
  if (!item) return res.status(404).json({ error: 'Bildirim bulunamadı.' })
  item.readAt = item.readAt || new Date().toISOString()
  res.json({ success: true })
})

app.post('/api/notifications/read-all', async (_req: Request, res: Response) => {
  if (isApiDurableEnabled()) {
    let changed = 0
    await apiRewriteDurableNotifications((items) => items.map((item) => {
      if (item.readAt) return item
      changed++
      return { ...item, readAt: new Date().toISOString() }
    }))
    return res.json({ success: true, changed })
  }
  let changed = 0
  apiNotifications.forEach((item) => {
    if (!item.readAt) {
      item.readAt = new Date().toISOString()
      changed++
    }
  })
  res.json({ success: true, changed })
})

app.delete('/api/notifications/:id', async (req: Request, res: Response) => {
  if (isApiDurableEnabled()) {
    let deleted = 0
    await apiRewriteDurableNotifications((items) => items.filter((item) => {
      if (item.id === req.params.id) {
        deleted = 1
        return false
      }
      return true
    }))
    return res.json({ success: true, deleted })
  }
  const before = apiNotifications.length
  apiNotifications = apiNotifications.filter((item) => item.id !== req.params.id)
  res.json({ success: true, deleted: before - apiNotifications.length })
})

app.delete('/api/notifications/delete-all', async (_req: Request, res: Response) => {
  if (isApiDurableEnabled()) {
    const current = await apiGetDurableNotifications({ limit: API_MAX_NOTIFICATIONS })
    await apiRedis('DEL', API_NOTIFICATIONS_KEY)
    return res.json({ success: true, deleted: current?.notifications.length || 0 })
  }
  const deleted = apiNotifications.length
  apiNotifications = []
  apiSeenSourceRecordIds.clear()
  res.json({ success: true, deleted })
})

// ── BDDK Debug ──────────────────────────────────────────────────────────────
app.get('/api/bddk/debug', async (_req: Request, res: Response) => {
  let liveResult: any = null
  let liveError: string | null = null

  // Try live fetch first
  try {
    const m = await import('../server/services/bddkArchive.js')
    liveResult = await m.debugBddkArchive()
    if (liveResult && liveResult.parsedCount > 0) {
      return res.json({ ...liveResult, source: 'live', liveAvailable: true })
    }
  } catch (err: any) {
    liveError = err.message || String(err)
    console.warn('[BDDK Debug] Live fetch failed:', liveError)
  }

  // Fall back to cache
  const cached = loadBddkCache()
  const records = cached.records || []

  res.json({
    status: 'cache_fallback',
    source: 'cache',
    liveAvailable: false,
    apiBaseUrl: process.env.BDDK_API_BASE_URL || 'https://www.bddk.org.tr',
    hasApiKey: !!process.env.BDDK_API_KEY,
    attemptedUrls: liveResult?.attemptedUrls || [],
    successfulUrl: null,
    htmlLength: liveResult?.htmlLength || 0,
    matchedLinks: liveResult?.matchedLinks || 0,
    first10Candidates: liveResult?.first10Candidates || [],
    sampleRecords: records.slice(0, 5),
    parsedCount: records.length,
    total: records.length,
    cacheInfo: {
      source: cached.source || 'none',
      lastRefreshedAt: cached.lastRefreshedAt || null,
    },
    error: liveError || 'Live fetch unavailable. Serving from cache.',
    timestamp: new Date().toISOString(),
  })
})

// ── Unified Regulatory Archive ────────────────────────────────────────────
app.get('/api/regulatory/archive', async (req: Request, res: Response) => {
  const { authority, limit } = req.query as Record<string, string | undefined>
  const archiveLimit = Math.min(Number(limit) || 200, 5000)
  let spkRecords: any[] = []
  let bddkRecords: any[] = []
  let spkSource = 'none'
  let bddkSource = 'none'

  if (!authority || authority === 'all' || authority === 'spk') {
    try {
      spkRecords = (loadCache().records || []).slice(0, archiveLimit)
      spkSource = spkRecords.length > 0 ? 'cache' : 'none'
    } catch (err: any) {
      console.warn('[Regulatory Archive] SPK error:', err.message)
      spkSource = 'error'
    }
  }

  if (!authority || authority === 'all' || authority === 'bddk') {
    // Try live fetch first
    try {
      const m = await import('../server/services/bddkArchive.js')
      const bddkData = await m.fetchBddkArchive({ limit: archiveLimit })
      if (bddkData.records && bddkData.records.length > 0) {
        bddkRecords = bddkData.records
        bddkSource = 'live'
      } else {
        throw new Error('Live fetch returned empty')
      }
    } catch (err: any) {
      console.warn('[Regulatory Archive] BDDK live failed, falling back to cache:', err.message)
      const cached = loadBddkCache()
      bddkRecords = (cached.records || []).slice(0, archiveLimit)
      bddkSource = bddkRecords.length > 0 ? 'cache' : 'none'
    }
  }

  const allRecords = [...spkRecords, ...bddkRecords]
  allRecords.sort((a, b) => String(b.isoDate || '').localeCompare(String(a.isoDate || '')))

  // Include BDDK cache metadata when serving from cache
  let bddkCacheInfo: any = undefined
  if (bddkSource === 'cache') {
    const cached = loadBddkCache()
    bddkCacheInfo = {
      source: cached.source || 'none',
      lastRefreshedAt: cached.lastRefreshedAt || null,
      recordCount: cached.records?.length || 0,
    }
  }

  res.json({
    total: allRecords.length,
    counts: {
      spk: spkRecords.length,
      bddk: bddkRecords.length,
      total: allRecords.length,
    },
    records: allRecords.slice(0, archiveLimit),
    source: {
      spk: spkSource,
      bddk: bddkSource,
    },
    cacheInfo: bddkSource === 'cache' ? { bddk: bddkCacheInfo } : undefined,
    lastRefreshedAt: new Date().toISOString(),
  })
})

export default (req: any, res: any) => {
  app(req, res)
}
