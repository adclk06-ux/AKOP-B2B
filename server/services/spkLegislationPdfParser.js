// server/services/spkLegislationPdfParser.js
// Fetches and extracts text/dates from SPK Mevzuat System PDF/HTML documents

import https from 'https'
import { parsePdfBuffer } from './spkPdfParser.js'

const MEVZUAT_BASE_URL = 'https://mevzuat.spk.gov.tr'
const FETCH_TIMEOUT_MS = 30000
const MAX_TEXT_LENGTH = 20000

/**
 * Fallback HTTPS GET using Node.js https module.
 * rejectUnauthorized: false ONLY for mevzuat.spk.gov.tr
 */
function httpsGetBuffer(urlStr) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr)
    const isMevzuat = parsed.hostname === 'mevzuat.spk.gov.tr'
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      rejectUnauthorized: isMevzuat ? false : true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/pdf,text/html,application/xhtml+xml,*/*',
        Referer: `${MEVZUAT_BASE_URL}/`,
      },
    }

    const req = https.request(options, (res) => {
      const chunks = []
      res.on('data', (chunk) => { chunks.push(chunk) })
      res.on('end', () => {
        const buffer = Buffer.concat(chunks)
        const contentType = res.headers['content-type'] || ''
        resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, buffer, contentType })
      })
    })

    req.on('error', (err) => reject(err))
    req.setTimeout(FETCH_TIMEOUT_MS, () => { req.destroy(); reject(new Error('Timeout')) })
    req.end()
  })
}

/**
 * In-memory cache for legislation PDF text extracts.
 * Key: record.id, Value: { textPreview, extractedDate, extractedYear, dateSource, fetchedAt }
 */
const legislationContentCache = new Map()

/**
 * Build full URL from a legislation record link.
 * SPA link format: "IlkeKarari/Dosya/371" or "Mevzuat/Dosya/195"
 * API download format: "api/IlkeKarari/File/371" or "api/Mevzuat/File/195"
 */
export function buildLegislationUrl(record) {
  if (!record) return null
  // If record already has a direct API file URL, use it
  if (record.fileUrl && record.fileUrl.startsWith('http')) return record.fileUrl

  const link = record.link || record.dosyaLink || record.dosyaYolu
  if (link) {
    // Convert SPA route to API download route
    // e.g., "Mevzuat/Dosya/195" -> "api/Mevzuat/File/195"
    const apiPath = link.replace(/\/Dosya\//i, '/File/')
    return `${MEVZUAT_BASE_URL}/api/${apiPath}`
  }

  // Fallback to record.url if it looks like an API endpoint
  if (record.url && record.url.includes('/api/')) return record.url

  return null
}

/**
 * Fetch PDF or HTML content and extract text.
 * Returns { text: string|null, contentType: string|null, url: string }
 */
export async function fetchSpkLegislationPdfText(record) {
  const url = buildLegislationUrl(record)
  if (!url) {
    console.warn('[LegislationPDF] No URL for record:', record?.id)
    return { text: null, contentType: null, url: null }
  }

  // Check cache first
  const cached = legislationContentCache.get(record.id)
  if (cached && (Date.now() - cached.fetchedAt) < 24 * 60 * 60 * 1000) {
    console.info(`[LegislationPDF] Cache hit for ${record.id}`)
    return { text: cached.textPreview, contentType: cached.contentType, url }
  }

  let buffer = null
  let contentType = ''
  let fetchOk = false

  // 1. Try native fetch first
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AKOP-Bot/1.0)',
        Accept: 'application/pdf,text/html,application/xhtml+xml,*/*',
      },
    })
    clearTimeout(timeout)

    if (res.ok) {
      fetchOk = true
      contentType = res.headers.get('content-type') || ''
      buffer = Buffer.from(await res.arrayBuffer())
      console.info(`[LegislationPDF] Native fetch OK: ${url}`)
    } else {
      console.warn(`[LegislationPDF] Native fetch HTTP ${res.status} from ${url}`)
    }
  } catch (err) {
    console.warn(`[LegislationPDF] Native fetch failed: ${err.message || err}`)
  }

  // 2. Fallback to https module for mevzuat.spk.gov.tr
  if (!fetchOk && url.includes('mevzuat.spk.gov.tr')) {
    try {
      const httpsRes = await httpsGetBuffer(url)
      if (httpsRes.ok && httpsRes.buffer) {
        buffer = httpsRes.buffer
        contentType = httpsRes.contentType
        fetchOk = true
        console.info(`[LegislationPDF] HTTPS fallback OK: ${url}`)
      } else {
        console.warn(`[LegislationPDF] HTTPS fallback HTTP ${httpsRes.status} from ${url}`)
      }
    } catch (err) {
      console.warn(`[LegislationPDF] HTTPS fallback failed: ${err.message || err}`)
    }
  }

  if (!fetchOk || !buffer) {
    return { text: null, contentType: null, url }
  }

  let text = ''
  if (contentType.includes('pdf') || url.toLowerCase().endsWith('.pdf')) {
    text = await parsePdfBuffer(buffer)
  } else if (contentType.includes('html') || contentType.includes('text')) {
    text = extractTextFromHtml(buffer.toString('utf-8'))
  } else {
    // Try PDF parse as fallback
    text = await parsePdfBuffer(buffer)
    if (!text || text.length < 50) {
      text = extractTextFromHtml(buffer.toString('utf-8'))
    }
  }

  const trimmed = text?.slice(0, MAX_TEXT_LENGTH) || ''
  console.info(`[LegislationPDF] Extracted ${trimmed.length} chars from ${url} (${contentType})`)

  // Cache result
  legislationContentCache.set(record.id, {
    textPreview: trimmed,
    contentType,
    fetchedAt: Date.now(),
  })

  return { text: trimmed, contentType, url }
}

function extractTextFromHtml(html) {
  if (!html) return ''
  // Strip scripts, styles, and tags
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&\w+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Extract dates from legislation text with source labeling.
 * Returns { effectiveDate, effectiveYear, dateSource }
 */
export function extractLegislationDatesFromText(text, record = {}) {
  if (!text || typeof text !== 'string') {
    return { effectiveDate: null, effectiveYear: null, dateSource: 'missing' }
  }

  const lower = text.toLowerCase()

  // 1. Kurul Karar Tarihi from text
  const kurulMatch = text.match(/Kurul\s+Karar\s*Tarihi\s*[:\-]?\s*(\d{1,2}[\/\.](\d{1,2}|\w+)[\/\.]\d{4})/i)
    || text.match(/Karar\s*Tarihi\s*[:\-]?\s*(\d{1,2}[\/\.](\d{1,2}|\w+)[\/\.]\d{4})/i)
  if (kurulMatch) {
    const iso = parseFlexibleDate(kurulMatch[1])
    if (iso) {
      return { effectiveDate: iso, effectiveYear: Number(iso.split('-')[0]), dateSource: 'pdf_kurul_karar' }
    }
  }

  // 2. Resmi Gazete Tarihi from text
  const rgMatch = text.match(/Resm[iî]\s*Gazete\s*Tarihi\s*[:\-]?\s*(\d{1,2}[\/\.](\d{1,2}|\w+)[\/\.]\d{4})/i)
  if (rgMatch) {
    const iso = parseFlexibleDate(rgMatch[1])
    if (iso) {
      return { effectiveDate: iso, effectiveYear: Number(iso.split('-')[0]), dateSource: 'pdf_resmi_gazete' }
    }
  }

  // 3. First meaningful date in text
  const dateMatches = [...text.matchAll(/(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/g)]
  if (dateMatches.length > 0) {
    const first = dateMatches[0]
    const iso = `${first[3]}-${first[2].padStart(2, '0')}-${first[1].padStart(2, '0')}`
    const d = new Date(iso)
    if (!isNaN(d.getTime())) {
      return { effectiveDate: iso, effectiveYear: Number(first[3]), dateSource: 'pdf_text' }
    }
  }

  // 4. Turkish month names in text
  const turkishMatch = text.match(/(\d{1,2})\s+([A-Za-zÇçĞğİıÖöŞşÜü]+)\s+(\d{4})/i)
  if (turkishMatch) {
    const ts = Date.parse(`${turkishMatch[1]} ${turkishMatch[2]} ${turkishMatch[3]}`)
    if (!isNaN(ts)) {
      const d = new Date(ts)
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return { effectiveDate: iso, effectiveYear: d.getFullYear(), dateSource: 'pdf_text' }
    }
  }

  // 5. bultenYili fallback
  if (record.bultenYili) {
    return { effectiveDate: null, effectiveYear: Number(record.bultenYili), dateSource: 'year_fallback' }
  }

  return { effectiveDate: null, effectiveYear: null, dateSource: 'missing' }
}

function parseFlexibleDate(dateStr) {
  if (!dateStr) return null
  const s = dateStr.trim()

  // DD.MM.YYYY
  const dotMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dotMatch) {
    const iso = `${dotMatch[3]}-${dotMatch[2].padStart(2, '0')}-${dotMatch[1].padStart(2, '0')}`
    return isValidDate(iso) ? iso : null
  }

  // DD/MM/YYYY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const iso = `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`
    return isValidDate(iso) ? iso : null
  }

  return null
}

function isValidDate(iso) {
  const d = new Date(iso)
  return !isNaN(d.getTime())
}

/**
 * Get cached content for a record if available.
 */
export function getCachedLegislationContent(recordId) {
  return legislationContentCache.get(recordId) || null
}

/**
 * Enrich a legislation record with PDF dates if needed.
 * Returns enriched record fields.
 */
export async function enrichLegislationRecord(record) {
  if (!record || record.sourceType !== 'legislation') {
    return { success: false, reason: 'not_legislation' }
  }

  // Already has a date from API
  if (record.effectiveDate || record.isoDate) {
    return { success: true, from: 'api', effectiveDate: record.effectiveDate || record.isoDate, dateSource: 'api' }
  }

  const { text } = await fetchSpkLegislationPdfText(record)
  if (!text || text.length < 50) {
    return { success: false, reason: 'pdf_fetch_failed' }
  }

  const extracted = extractLegislationDatesFromText(text, record)
  return {
    success: Boolean(extracted.effectiveDate || extracted.effectiveYear),
    effectiveDate: extracted.effectiveDate,
    effectiveYear: extracted.effectiveYear,
    dateSource: extracted.dateSource,
    textPreview: text.slice(0, 500),
  }
}
