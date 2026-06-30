// server/services/bddkArchive.js
// Fetches and parses BDDK resources from the official BDDK website

/**
 * Fetch HTML from URL.
 * Uses global fetch with AbortController timeout.
 * Falls back to empty response on network errors so the API never crashes.
 */
async function fetchHtml(url, { timeoutMs = 15000 } = {}) {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'text/html',
      },
    })
    clearTimeout(timer)
    return res
  } catch (err) {
    // Return a fake response so callers can handle it gracefully
    return { ok: false, status: 0, text: () => Promise.resolve('') }
  }
}

const BDDK_BASE_URL = process.env.BDDK_API_BASE_URL || 'https://www.bddk.org.tr'
const BDDK_API_KEY = process.env.BDDK_API_KEY || null

// Verified BDDK page paths from real HTML structure analysis
const BDDK_SOURCES = [
  { name: 'Tüm Duyurular', path: '/Duyuru/Liste', type: 'bddk-announcement' },
  { name: 'Basın Duyuruları', path: '/Duyuru/Liste/39', type: 'bddk-press-release' },
  { name: 'Mevzuat Duyuruları', path: '/Duyuru/Liste/40', type: 'bddk-regulation' },
  { name: 'Kuruluş Duyuruları', path: '/Duyuru/Liste/48', type: 'bddk-announcement' },
  { name: 'Kurul Kararları', path: '/Mevzuat/Liste/56', type: 'bddk-decision' },
]

/**
 * Decode common HTML entities
 */
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
  ocak: '01', oca: '01',
  subat: '02', sub: '02', şubat: '02',
  mart: '03', mar: '03',
  nisan: '04', nis: '04',
  mayis: '05', mayıs: '05', may: '05',
  haziran: '06', haz: '06',
  temmuz: '07', tem: '07',
  agustos: '08', agu: '08', ağustos: '08',
  eylul: '09', eylül: '09', eyl: '09',
  ekim: '10', eki: '10',
  kasim: '11', kasım: '11', kas: '11',
  aralik: '12', aralık: '12', ara: '12',
}

/**
 * Parse Turkish date strings to ISO format
 */
export function parseBddkDate(input) {
  if (!input) return null
  const clean = decodeHtmlEntities(String(input))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/\s+(pazartesi|salı|sali|çarşamba|carsamba|perşembe|persembe|cuma|cumartesi|pazar)\s*$/i, '')

  // Try DD.MM.YYYY
  const ddmmyyyy = clean.match(/(\d{1,2})[./](\d{1,2})[./](\d{4})/)
  if (ddmmyyyy) {
    const iso = `${ddmmyyyy[3]}-${ddmmyyyy[2].padStart(2, '0')}-${ddmmyyyy[1].padStart(2, '0')}`
    const d = new Date(iso)
    if (!isNaN(d.getTime())) return iso
  }

  // Try "12 Haziran 2026" format
  const parts = clean.split(' ')
  if (parts.length >= 3) {
    const day = parts[0].padStart(2, '0')
    const monthName = parts[1].toLowerCase()
    const year = parts[2]
    const month = MONTH_MAP[monthName]
    if (month) {
      const iso = `${year}-${month}-${day}`
      const d = new Date(iso)
      if (!isNaN(d.getTime())) return iso
    }
  }

  // Try ISO-like YYYY-MM-DD
  const isoLike = clean.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (isoLike) {
    const iso = `${isoLike[1]}-${isoLike[2]}-${isoLike[3]}`
    const d = new Date(iso)
    if (!isNaN(d.getTime())) return iso
  }

  return null
}

/**
 * Normalize a raw BDDK record to the unified format
 */
export function normalizeBddkRecord(raw) {
  const isoDate = parseBddkDate(raw.date || raw.tarih || raw.publishDate)
  const year = isoDate ? Number(isoDate.split('-')[0]) : (raw.year || new Date().getFullYear())
  const title = decodeHtmlEntities(raw.title || raw.baslik || raw.subject || 'BDDK Kaydı')
  const number = raw.number || raw.kararNo || raw.duyuruNo || raw.no || ''
  const url = raw.url || raw.link || (raw.path ? `${BDDK_BASE_URL}${raw.path}` : BDDK_BASE_URL)
  const sourceType = raw.sourceType || 'bddk-announcement'
  const category = raw.category || raw.kategori || 'Genel'

  // Build stable id from number + title + date
  const idBase = number
    ? number.toString().toLowerCase().replace(/[^a-z0-9]/gi, '').slice(0, 20)
    : title.toLowerCase().replace(/[^a-z0-9çğışöü]/gi, '').slice(0, 30)
  const id = `bddk-${sourceType}-${year}-${idBase}-${isoDate || 'nodate'}`

  // Build a meaningful summary
  const summary = raw.summary || raw.ozet || title
  const impactLevel = raw.impactLevel || (
    sourceType === 'bddk-decision' || sourceType === 'bddk-regulation' ? 'high' : 'medium'
  )

  return {
    id,
    authority: 'BDDK',
    source: 'BDDK',
    sourceType,
    title,
    number,
    date: raw.date || raw.tarih || raw.publishDate || '',
    isoDate: isoDate || '',
    year,
    url,
    category,
    summary,
    impactLevel,
    requiresComplianceReview: raw.requiresComplianceReview !== false,
  }
}

/**
 * Parse BDDK Duyuru List pages (e.g. /Duyuru/Liste, /Duyuru/Liste/39)
 * HTML structure:
 * <li><div class="kategoriContainer">
 *   <a href="/Duyuru/Detay/{id}">
 *     <span class="text">
 *       <span class="gorunenTarih">DD.MM.YYYY</span> TITLE
 *     </span>
 *   </a>
 * </div></li>
 */
function parseDuyuruListHtml(html, type) {
  const records = []
  const decoded = decodeHtmlEntities(html)

  const itemPattern = /<li>\s*<div class="kategoriContainer">\s*<a href="(\/Duyuru\/Detay\/\d+)"[^>]*>.*?<span class="gorunenTarih">([^<]+)<\/span>\s*(.*?)<\/a>\s*<\/div>\s*<\/li>/gi

  let match
  while ((match = itemPattern.exec(decoded)) !== null) {
    const path = match[1]
    const date = match[2].trim()
    const rawTitle = match[3].trim()
    const title = rawTitle.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

    if (!title || title.length < 5) continue

    records.push({
      title,
      date,
      path,
      url: `${BDDK_BASE_URL}${path}`,
      sourceType: type,
      category: type === 'bddk-press-release' ? 'Basın' : type === 'bddk-regulation' ? 'Mevzuat' : 'Genel',
    })
  }

  return records
}

/**
 * Parse BDDK Mevzuat/Kurul Kararları pages (e.g. /Mevzuat/Liste/56)
 * HTML structure:
 * <tr>
 *   <td>
 *     <a href="/Mevzuat/Detay/{id}">(DD.MM.YYYY - NUMBER) TITLE</a>
 *   </td>
 * </tr>
 */
function parseMevzuatListHtml(html, type) {
  const records = []
  const decoded = decodeHtmlEntities(html)

  const trPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let trMatch
  while ((trMatch = trPattern.exec(decoded)) !== null) {
    const trContent = trMatch[1]

    const linkMatch = trContent.match(/<a[^>]*href="([^"]+)"[^>]*>\s*\((\d{1,2}[./]\d{1,2}[./]\d{4})\s*-\s*([^)]+)\)\s*(.*?)<\/a>/i)

    if (linkMatch) {
      const path = linkMatch[1].trim()
      const date = linkMatch[2].trim()
      const number = linkMatch[3].trim()
      const title = linkMatch[4].trim().replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

      if (!title || title.length < 5) continue

      records.push({
        title: `(${number}) ${title}`,
        date,
        number,
        path,
        url: path.startsWith('http') ? path : `${BDDK_BASE_URL}${path}`,
        sourceType: type,
        category: 'Kurul Kararı',
      })
    }
  }

  return records
}

/**
 * Attempt to discover links from a BDDK page
 */
async function discoverBddkLinks(url, type) {
  const result = {
    attemptedUrl: url,
    htmlLength: 0,
    matchedLinks: 0,
    first10Candidates: [],
    error: null,
  }

  try {
    const res = await fetchHtml(url, { timeoutMs: 15000 })

    if (!res.ok) {
      result.error = `HTTP ${res.status}`
      return result
    }

    const html = await res.text()
    result.htmlLength = html.length

    const decoded = decodeHtmlEntities(html)

    const linkPattern = /href="([^"]*\/(?:Duyuru|Basin|KurulKarar|Mevzuat|duyuru|basin|karar|mevzuat)[^"]*)"/gi
    const links = [...decoded.matchAll(linkPattern)]
      .map((m) => m[1])
      .filter((href, idx, arr) => arr.indexOf(href) === idx)

    const genericPattern = /href="([^"]*\/(?:detay|Detail|Sayfa|sayfa|icerik|Icerik)[^"]*)"/gi
    const genericLinks = [...decoded.matchAll(genericPattern)]
      .map((m) => m[1])
      .filter((href, idx, arr) => arr.indexOf(href) === idx)

    const allLinks = [...links, ...genericLinks].slice(0, 20)
    result.matchedLinks = allLinks.length

    result.first10Candidates = allLinks.slice(0, 10).map((href) => {
      const absolute = href.startsWith('http') ? href : `${BDDK_BASE_URL}${href}`
      return { href: absolute, type }
    })

    return result
  } catch (err) {
    result.error = err.message || String(err)
    return result
  }
}

/**
 * Fetch BDDK archive from real sources.
 * If parsing fails, returns empty records with api_discovery_required status.
 */
export async function fetchBddkArchive({ limit = 100, refresh = false } = {}) {
  const attemptedUrls = []
  const discoveryResults = []
  let allRecords = []
  let successfulUrl = null
  let parsedCount = 0
  let lastError = null

  for (const source of BDDK_SOURCES) {
    const url = `${BDDK_BASE_URL}${source.path}`
    attemptedUrls.push(url)

    try {
      const res = await fetchHtml(url, { timeoutMs: 15000 })

      if (!res.ok) {
        console.warn(`[BDDK] HTTP ${res.status} from ${url}`)
        discoveryResults.push({ url, status: 'error', error: `HTTP ${res.status}` })
        continue
      }

      const html = await res.text()

      // Choose parser based on URL pattern
      const isMevzuatPage = source.path.includes('/Mevzuat/')
      const records = isMevzuatPage
        ? parseMevzuatListHtml(html, source.type)
        : parseDuyuruListHtml(html, source.type)

      if (records.length > 0) {
        successfulUrl = url
        const normalized = records.map(normalizeBddkRecord)
        allRecords.push(...normalized)
        parsedCount += normalized.length
        console.info(`[BDDK] Parsed ${normalized.length} records from ${source.name}`)
        discoveryResults.push({ url, status: 'ok', parsedCount: records.length })
      } else {
        console.warn(`[BDDK] No records parsed from ${source.name} (${url})`)
        discoveryResults.push({ url, status: 'no_records', htmlLength: html.length })
      }
    } catch (err) {
      console.warn(`[BDDK] Fetch failed for ${source.name}:`, err.message || err)
      lastError = err.message || String(err)
      discoveryResults.push({ url, status: 'error', error: lastError })
    }
  }

  // Deduplicate and sort
  const seen = new Set()
  const unique = []
  for (const r of allRecords) {
    if (!seen.has(r.id)) {
      seen.add(r.id)
      unique.push(r)
    }
  }
  unique.sort((a, b) => String(b.isoDate || '').localeCompare(String(a.isoDate || '')))
  const finalRecords = unique.slice(0, limit)

  if (finalRecords.length > 0) {
    return {
      status: 'ok',
      records: finalRecords,
      parsedCount: finalRecords.length,
      attemptedUrls,
      successfulUrl,
      discoveryResults,
      lastError: null,
      lastRefreshedAt: new Date().toISOString(),
    }
  }

  // No records parsed — API discovery mode
  console.warn('[BDDK] No records parsed from any source. Status: api_discovery_required')
  return {
    status: 'api_discovery_required',
    records: [],
    parsedCount: 0,
    attemptedUrls,
    successfulUrl: null,
    discoveryResults,
    lastError: lastError || 'No parseable content found on any BDDK page',
    lastRefreshedAt: new Date().toISOString(),
  }
}

/**
 * Debug BDDK archive discovery
 */
export async function debugBddkArchive() {
  const attemptedUrls = []
  const discoveryResults = []
  let successfulUrl = null
  let htmlLength = 0
  let matchedLinks = 0
  let first10Candidates = []
  let sampleRecords = []
  let parsedCount = 0
  let error = null

  for (const source of BDDK_SOURCES) {
    const url = `${BDDK_BASE_URL}${source.path}`
    attemptedUrls.push(url)

    try {
      const res = await fetchHtml(url, { timeoutMs: 15000 })

      if (!res.ok) {
        discoveryResults.push({ url, status: 'error', error: `HTTP ${res.status}` })
        continue
      }

      const html = await res.text()
      htmlLength = Math.max(htmlLength, html.length)

      const isMevzuatPage = source.path.includes('/Mevzuat/')
      const records = isMevzuatPage
        ? parseMevzuatListHtml(html, source.type)
        : parseDuyuruListHtml(html, source.type)

      if (records.length > 0) {
        successfulUrl = url
        parsedCount += records.length
        sampleRecords.push(...records.slice(0, 3).map(normalizeBddkRecord))
      }

      const discovery = await discoverBddkLinks(url, source.type)
      discoveryResults.push({ url, status: 'ok', ...discovery })
      matchedLinks += discovery.matchedLinks
      if (first10Candidates.length === 0) {
        first10Candidates = discovery.first10Candidates
      }
    } catch (err) {
      error = err.message || String(err)
      discoveryResults.push({ url, status: 'error', error })
    }
  }

  return {
    apiBaseUrl: BDDK_BASE_URL,
    hasApiKey: !!BDDK_API_KEY,
    attemptedUrls,
    successfulUrl,
    htmlLength,
    matchedLinks,
    first10Candidates,
    sampleRecords: sampleRecords.slice(0, 5),
    parsedCount,
    error,
    timestamp: new Date().toISOString(),
  }
}
