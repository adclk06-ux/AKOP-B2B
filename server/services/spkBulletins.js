// server/services/spkBulletins.js
// Fetches and parses SPK Bültenleri from the official SPK website

const SPK_BULLETINS_URL = 'https://spk.gov.tr/spk-bultenleri/2026-yili-spk-bultenleri'

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

/**
 * Decode common HTML entities
 */
function decodeHtmlEntities(str) {
  if (!str) return str
  return str
    .replace(/&#252;/g, 'ü')
    .replace(/&#220;/g, 'Ü')
    .replace(/&#231;/g, 'ç')
    .replace(/&#199;/g, 'Ç')
    .replace(/&#246;/g, 'ö')
    .replace(/&#214;/g, 'Ö')
    .replace(/&#287;/g, 'ğ')
    .replace(/&#286;/g, 'Ğ')
    .replace(/&#305;/g, 'ı')
    .replace(/&#304;/g, 'İ')
    .replace(/&#351;/g, 'ş')
    .replace(/&#350;/g, 'Ş')
    .replace(/&#39;/g, "'")
    .replace(/&#226;/g, 'â')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

/**
 * Convert Turkish date string like "13 Haziran 2026 Cumartesi" or "31 Mar 2026" to ISO date "2026-06-13"
 */
function parseTurkishDate(dateStr) {
  const clean = decodeHtmlEntities(dateStr)
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    // Remove day-of-week suffix
    .replace(/\s+(pazartesi|salı|sali|çarşamba|carsamba|perşembe|persembe|cuma|cumartesi|pazar)\s*$/i, '')

  const parts = clean.split(' ')
  if (parts.length < 3) return null

  const day = parts[0].padStart(2, '0')
  const monthName = parts[1].toLowerCase()
  const year = parts[2]

  const month = MONTH_MAP[monthName]
  if (!month) return null

  const iso = `${year}-${month}-${day}`
  // Validate
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  return iso
}

/**
 * Build a stable id from record fields
 */
function buildBulletinId(year, number, title) {
  const normalizedTitle = decodeHtmlEntities(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u00e7\u011f\u0131\u00f6\u015f\u00fc]/gi, '')
    .slice(0, 30)
  return `bulletin-${year}-${number.replace(/\//g, '-')}-${normalizedTitle}`
}

/**
 * Extract bulletin entries from SPK HTML.
 * Uses per-block extraction: for each PDF link, look in a nearby HTML
 * window for the matching number and date instead of global regex.
 */
function parseBulletins(html) {
  const decodedHtml = decodeHtmlEntities(html)
  const entries = []
  const seenNumbers = new Set()

  // Find all PDF links with year/number pattern
  const pdfPattern = /href="([^"]*\/(\d{4})-(\d+)\.pdf)"/g
  let pdfMatch
  while ((pdfMatch = pdfPattern.exec(decodedHtml)) !== null) {
    const pdfUrl = pdfMatch[1]
    const year = pdfMatch[2]
    const numPart = pdfMatch[3]
    const fullNumber = `${year}/${numPart}`

    // Extract a context window around the PDF link (1200 chars before, 600 after)
    const matchIndex = pdfMatch.index
    const start = Math.max(0, matchIndex - 1200)
    const end = Math.min(decodedHtml.length, matchIndex + 600)
    const context = decodedHtml.slice(start, end)

    // Look for bulletin number in context
    const numRegex = new RegExp(`B[ü\\u00fc]lten No\\s*:\\s*(${year}\\/\\d+)`, 'i')
    const numMatch = context.match(numRegex)
    const number = numMatch ? numMatch[1] : fullNumber

    // Look for date in context with flexible patterns
    const datePatterns = [
      /Yay[ıi\u0131]mlanma\s*[:Tt]\s*([^<\n]+)/i,
      /Yay[ıi\u0131]n\s*Tarihi\s*[:Tt]\s*([^<\n]+)/i,
      /Tarih\s*[:Tt]\s*([^<\n]+)/i,
    ]
    let rawDate = ''
    for (const pattern of datePatterns) {
      const dateMatch = context.match(pattern)
      if (dateMatch) {
        rawDate = dateMatch[1].trim()
        break
      }
    }
    const isoDate = rawDate ? parseTurkishDate(rawDate) : null

    if (seenNumbers.has(number)) continue
    seenNumbers.add(number)

    entries.push({
      number,
      title: `SPK Bülteni ${number}`,
      date: rawDate || isoDate || '',
      isoDate: isoDate || '',
      url: pdfUrl.startsWith('http') ? pdfUrl : `https://spk.gov.tr${pdfUrl}`,
    })
  }

  // Fallback: if no PDF links found, try global list-item/card extraction
  if (entries.length === 0) {
    const cardPattern = /<(?:li|div|article)[^>]*>([\s\S]*?)<\/(?:li|div|article)>/gi
    let cardMatch
    while ((cardMatch = cardPattern.exec(decodedHtml)) !== null) {
      const block = cardMatch[1]

      const numMatch = block.match(/B[ü\u00fc]lten No\s*:\s*(\d{4}\/\d+)/i)
      if (!numMatch) continue
      const number = numMatch[1]
      if (seenNumbers.has(number)) continue

      const datePatternsFallback = [
        /Yay[ıi\u0131]mlanma\s*[:Tt]\s*([^<\n]+)/i,
        /Yay[ıi\u0131]n\s*Tarihi\s*[:Tt]\s*([^<\n]+)/i,
        /Tarih\s*[:Tt]\s*([^<\n]+)/i,
      ]
      let rawDate = ''
      for (const pattern of datePatternsFallback) {
        const dateMatch = block.match(pattern)
        if (dateMatch) {
          rawDate = dateMatch[1].trim()
          break
        }
      }
      const isoDate = rawDate ? parseTurkishDate(rawDate) : null

      const urlMatch = block.match(/href="([^"]*\.pdf)"/)
      const pdfUrl = urlMatch ? urlMatch[1] : ''

      seenNumbers.add(number)
      entries.push({
        number,
        title: `SPK Bülteni ${number}`,
        date: rawDate || isoDate || '',
        isoDate: isoDate || '',
        url: pdfUrl.startsWith('http') ? pdfUrl : pdfUrl ? `https://spk.gov.tr${pdfUrl}` : '',
      })
    }
  }

  return entries
}

/**
 * Fetch latest SPK bulletin info
 * @returns {Promise<{number:string, title:string, date:string, isoDate:string, url:string}|null>}
 */
export async function fetchLatestSpkBulletin() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)

    const res = await fetch(SPK_BULLETINS_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AKOP-Bot/1.0)',
        Accept: 'text/html',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.warn(`[SPK] HTTP ${res.status} from ${SPK_BULLETINS_URL}`)
      return null
    }

    const html = await res.text()
    const bulletins = parseBulletins(html)

    if (bulletins.length === 0) {
      console.warn('[SPK] No bulletins parsed from page')
      return null
    }

    // First entry is the latest
    const latest = bulletins[0]
    console.info(`[SPK] Latest bulletin fetched: ${latest.number} (${latest.isoDate})`)
    return latest
  } catch (err) {
    console.warn('[SPK] Fetch failed, using fallback:', err.message || err)
    return null
  }
}

/**
 * Fetch SPK bulletin archive entries
 * @param {{year?:number, limit?:number}} options
 * @returns {Promise<Array<{number:string, title:string, date:string, isoDate:string, url:string, year:number}>>}
 */
export async function fetchSpkBulletinArchive(options = {}) {
  const { year = new Date().getFullYear(), limit = 50 } = options
  const urlsToTry = [
    `https://spk.gov.tr/spk-bultenleri/${year}-yili-spk-bultenleri`,
    `https://spk.gov.tr/spk-bultenleri/gecmis-yillara-ait-bultenler/${year}-yili-spk-bultenleri`,
  ]

  for (const url of urlsToTry) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AKOP-Bot/1.0)',
          Accept: 'text/html',
        },
      })
      clearTimeout(timeout)

      if (!res.ok) {
        console.warn(`[SPK] HTTP ${res.status} from ${url}`)
        continue
      }

      const html = await res.text()
      const bulletins = parseBulletins(html)

      if (bulletins.length === 0) {
        console.warn(`[SPK] No bulletins parsed from ${url}`)
        continue
      }

      const withYear = bulletins.slice(0, limit).map((b) => {
        const title = decodeHtmlEntities(b.title || `SPK Bülteni ${b.number}`)
        return {
          ...b,
          title,
          source: 'SPK Bültenleri',
          year,
          sourceType: 'bulletin',
          id: buildBulletinId(year, b.number, title),
        }
      })

      console.info(`[SPK] Archive fetched: ${withYear.length} bulletins for ${year} from ${url}`)
      return withYear
    } catch (err) {
      console.warn(`[SPK] Archive fetch failed for ${url}:`, err.message || err)
    }
  }

  return []
}

/**
 * Build mock fallback archive for when fetch fails
 * @param {number} year
 * @param {number} limit
 * @returns {Array<{id:string, number:string, title:string, date:string, isoDate:string, url:string, year:number, sourceType:string}>}
 */
export function getMockBulletinArchive(year = 2026, limit = 10) {
  const records = []
  const baseDate = new Date(year, 5, 13) // June 13
  for (let i = 0; i < limit; i++) {
    const bulletinNo = year + '/' + (38 - i)
    const d = new Date(baseDate)
    d.setDate(d.getDate() - i * 3)
    const iso = d.toISOString().split('T')[0]
    const day = d.getDate()
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    const dateStr = `${day} ${months[d.getMonth()]} ${year}`
    const title = `SPK Bülteni ${bulletinNo}`
    records.push({
      id: buildBulletinId(year, bulletinNo, title),
      source: 'SPK Bültenleri',
      number: bulletinNo,
      title,
      date: dateStr,
      isoDate: iso,
      url: `https://spk.gov.tr/spk-bultenleri`,
      year,
      sourceType: 'bulletin',
    })
  }
  return records
}

/**
 * Build mock fallback bulletin for when fetch fails
 */
/**
 * Fetch SPK bulletin archive for a range of years
 * @param {{startYear?:number, endYear?:number, limitPerYear?:number}} options
 * @returns {Promise<{records: Array, fetchedYears: number[], skippedYears: number[]}>}
 */
export async function fetchSpkBulletinArchiveRange(options = {}) {
  const currentYear = new Date().getFullYear()
  const { startYear = 2020, endYear = currentYear, limitPerYear = 100 } = options

  const allRecords = []
  const fetchedYears = []
  const skippedYears = []
  const seenIds = new Set()

  for (let year = startYear; year <= endYear; year++) {
    try {
      const yearRecords = await fetchSpkBulletinArchive({ year, limit: limitPerYear })
      if (yearRecords.length > 0) {
        const unique = yearRecords.filter((r) => !seenIds.has(r.id))
        unique.forEach((r) => seenIds.add(r.id))
        allRecords.push(...unique)
        fetchedYears.push(year)
        console.info(`[SPK Range] Year ${year}: ${unique.length} bulletins`)
      } else {
        skippedYears.push(year)
        console.warn(`[SPK Range] Year ${year}: no bulletins found`)
      }
    } catch (err) {
      skippedYears.push(year)
      console.warn(`[SPK Range] Year ${year} skipped:`, err.message || err)
    }
  }

  // Sort by isoDate descending
  allRecords.sort((a, b) => new Date(b.isoDate) - new Date(a.isoDate))

  return { records: allRecords, fetchedYears, skippedYears }
}

export function getMockBulletin() {
  const now = new Date()
  const iso = now.toISOString().split('T')[0]
  return {
    number: '2026/38',
    title: 'SPK Bülteni 2026/38',
    date: '13 Haziran 2026 Cumartesi',
    isoDate: iso,
    url: 'https://spk.gov.tr/spk-bultenleri',
  }
}
