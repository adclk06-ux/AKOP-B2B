// server/services/spkPressReleases.js
// Fetches and parses SPK Basın Duyuruları from the official SPK website

const SPK_PRESS_URL = 'https://spk.gov.tr/duyurular/basin-duyurulari/2026'

const MONTH_MAP_SHORT = {
  'oca': '01',
  'ocak': '01',
  'sub': '02',
  'subat': '02',
  'şubat': '02',
  'mart': '03',
  'nis': '04',
  'nisan': '04',
  'may': '05',
  'mayis': '05',
  'mayıs': '05',
  'haz': '06',
  'haziran': '06',
  'tem': '07',
  'temmuz': '07',
  'agu': '08',
  'agustos': '08',
  'ağustos': '08',
  'eyl': '09',
  'eylul': '09',
  'eylül': '09',
  'eki': '10',
  'ekim': '10',
  'kas': '11',
  'kasim': '11',
  'kasım': '11',
  'ara': '12',
  'aralik': '12',
  'aralık': '12',
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
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#226;/g, 'â')
}

/**
 * Convert short Turkish date like "12 Haz 2026" to ISO date "2026-06-12"
 */
function parseShortTurkishDate(dateStr) {
  const clean = dateStr.trim().toLowerCase().replace(/\s+/g, ' ')
  const parts = clean.split(' ')
  if (parts.length < 3) return null

  const day = parts[0].padStart(2, '0')
  const monthName = parts[1].toLowerCase()
  const year = parts[2]

  const month = MONTH_MAP_SHORT[monthName]
  if (!month) return null

  return `${year}-${month}-${day}`
}

/**
 * Extract press release entries from SPK HTML
 */
function parsePressReleases(html) {
  const entries = []

  // Match each <a class="link">...</a> block
  const linkPattern = /<a[^>]*class="link"[^>]*>([\s\S]*?)<\/a>/g
  const matches = [...html.matchAll(linkPattern)]

  for (const match of matches) {
    const fullTag = match[0]
    const inner = match[1]

    // Extract href from the <a> tag itself
    const hrefMatch = fullTag.match(/href="([^"]*)"/)
    const href = hrefMatch ? hrefMatch[1] : null

    // Skip navigation/menu links (only keep actual press release links)
    if (!href || !href.includes('/duyurular/basin-duyurulari/')) continue

    // Extract date
    const dateMatch = inner.match(/<div class="liste-tarih">\s*([^<]+)\s*<\/div>/)
    const dateRaw = dateMatch ? dateMatch[1].trim() : null

    // Extract title
    const titleMatch = inner.match(/<div class="liste-baslik">\s*([^<]+)\s*<\/div>/)
    const titleRaw = titleMatch ? titleMatch[1].trim() : null

    if (dateRaw && titleRaw) {
      const url = href.startsWith('http') ? href : `https://spk.gov.tr${href}`
      const title = decodeHtmlEntities(titleRaw)
      const isoDate = parseShortTurkishDate(dateRaw)
      entries.push({
        title,
        date: dateRaw,
        isoDate: isoDate || dateRaw,
        url,
      })
    }
  }

  return entries
}

/**
 * Fetch latest SPK press release info
 * @returns {Promise<{title:string, date:string, isoDate:string, url:string}|null>}
 */
export async function fetchLatestSpkPressRelease() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const res = await fetch(SPK_PRESS_URL, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AKOP-Bot/1.0)',
        Accept: 'text/html',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) {
      console.warn(`[SPK] Press release HTTP ${res.status} from ${SPK_PRESS_URL}`)
      return null
    }

    const html = await res.text()
    const releases = parsePressReleases(html)

    if (releases.length === 0) {
      console.warn('[SPK] No press releases parsed from page')
      return null
    }

    const latest = releases[0]
    console.info(`[SPK] Latest press release fetched: "${latest.title}" (${latest.isoDate})`)
    return latest
  } catch (err) {
    console.warn('[SPK] Press release fetch failed, using fallback:', err.message || err)
    return null
  }
}

/**
 * Fetch SPK press release archive for a range of years
 * @param {{startYear?:number, endYear?:number, limitPerYear?:number}} options
 * @returns {Promise<{records: Array, fetchedYears: number[], skippedYears: number[]}>}
 */
export async function fetchSpkPressReleaseArchive(options = {}) {
  const currentYear = new Date().getFullYear()
  const { startYear = 2020, endYear = currentYear, limitPerYear = 50 } = options

  const allRecords = []
  const fetchedYears = []
  const skippedYears = []
  const seenUrls = new Set()

  for (let year = endYear; year >= startYear; year--) {
    const url = `https://spk.gov.tr/duyurular/basin-duyurulari/${year}`
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
        skippedYears.push(year)
        console.warn(`[SPK Press] HTTP ${res.status} for year ${year}`)
        continue
      }

      const html = await res.text()
      const releases = parsePressReleases(html)

      if (releases.length === 0) {
        skippedYears.push(year)
        console.warn(`[SPK Press] No releases parsed for year ${year}`)
        continue
      }

      const withMeta = releases.slice(0, limitPerYear).map((r) => {
        const titleSlug = (r.title || '')
          .toLowerCase()
          .replace(/[^a-z0-9\u00e7\u011f\u0131\u00f6\u015f\u00fc]/gi, '')
          .slice(0, 20)
        const id = `press-release-${titleSlug}-${year}`
        return {
          ...r,
          id,
          source: 'SPK Basın Duyuruları',
          year,
          sourceType: 'press-release',
          number: '',
        }
      }).filter((r) => {
        if (seenUrls.has(r.url)) return false
        seenUrls.add(r.url)
        return true
      })

      allRecords.push(...withMeta)
      fetchedYears.push(year)
      console.info(`[SPK Press] Year ${year}: ${withMeta.length} releases`)
    } catch (err) {
      skippedYears.push(year)
      console.warn(`[SPK Press] Year ${year} skipped:`, err.message || err)
    }
  }

  // Sort by isoDate descending
  allRecords.sort((a, b) => {
    const da = a.isoDate && a.isoDate.includes('-') ? new Date(a.isoDate) : new Date(0)
    const db = b.isoDate && b.isoDate.includes('-') ? new Date(b.isoDate) : new Date(0)
    return db - da
  })

  return { records: allRecords, fetchedYears, skippedYears }
}

/**
 * Build mock fallback press release archive
 */
export function getMockPressReleaseArchive(year = 2026, limit = 10) {
  const records = []
  const baseDate = new Date(year, 5, 13)
  for (let i = 0; i < limit; i++) {
    const d = new Date(baseDate)
    d.setDate(d.getDate() - i * 5)
    const iso = d.toISOString().split('T')[0]
    const day = d.getDate()
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    const dateStr = `${day} ${months[d.getMonth()]} ${year}`
    records.push({
      id: `press-${year}-${i}`,
      source: 'SPK Basın Duyuruları',
      number: `${year}/${i + 1}`,
      title: `SPK Basın Duyurusu ${year}/${i + 1}`,
      date: dateStr,
      isoDate: iso,
      url: 'https://spk.gov.tr/duyurular/basin-duyurulari',
      year,
      sourceType: 'press-release',
    })
  }
  return records
}

/**
 * Build mock fallback press release for when fetch fails
 */
export function getMockPressRelease() {
  const now = new Date()
  const iso = now.toISOString().split('T')[0]
  return {
    title: 'SPK Basın Duyurusu',
    date: '12 Haz 2026',
    isoDate: iso,
    url: 'https://spk.gov.tr/duyurular/basin-duyurulari',
  }
}
