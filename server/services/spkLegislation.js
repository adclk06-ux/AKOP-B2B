// server/services/spkLegislation.js
// Fetches SPK Mevzuat Sistemi legislation records
// Discovered API: POST https://mevzuat.spk.gov.tr/api/Search
// Returns: array of {id, title, contentSource, tur, kisim, bolum, kurulKararTarih, kurulKararTarihi, link, ...}

import https from 'https'

const MEVZUAT_BASE_URL = 'https://mevzuat.spk.gov.tr'
const API_URL = `${MEVZUAT_BASE_URL}/api`
const FETCH_TIMEOUT_MS = 45000
const RETRY_DELAY_MS = 1500
const MAX_RETRIES = 3
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes

const EXTRACTED_ENDPOINTS = [
  'GET /api/Duyuru/List',
  'POST /api/Search',
  'GET /api/Search/{text}',
  'GET /api/{type}/File/{id}',
]

/** In-memory cache for legislation records */
let legislationCache = {
  records: [],
  fetchedAt: 0,
}

function isCacheValid() {
  return legislationCache.records.length > 0 && (Date.now() - legislationCache.fetchedAt) < CACHE_TTL_MS
}

function updateCache(records) {
  legislationCache = { records: [...records], fetchedAt: Date.now() }
}

function decodeHtmlEntities(str) {
  if (!str) return str
  return str
    .replace(/&#252;/g, 'ü').replace(/&#220;/g, 'Ü')
    .replace(/&#231;/g, 'ç').replace(/&#199;/g, 'Ç')
    .replace(/&#246;/g, 'ö').replace(/&#214;/g, 'Ö')
    .replace(/&#287;/g, 'ğ').replace(/&#286;/g, 'Ğ')
    .replace(/&#305;/g, 'ı').replace(/&#304;/g, 'İ')
    .replace(/&#351;/g, 'ş').replace(/&#350;/g, 'Ş')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&#226;/g, 'â')
}

function slug(str) {
  return decodeHtmlEntities(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9\u00e7\u011f\u0131\u00f6\u015f\u00fc]/gi, '')
    .slice(0, 20)
}

function detectCategoryFromSource(contentSource, title, tur) {
  const source = (contentSource || '').toLowerCase()
  const titleLower = (title || '').toLowerCase()
  const turLower = (tur || '').toLowerCase()

  if (source === 'kanun' || /kanun/.test(turLower)) return 'Kanun'
  if (source === 'mevzuat') {
    if (/tebli[gğ]/.test(titleLower)) return 'Tebliğ'
    if (/y[öo]netmelik/.test(titleLower)) return 'Yönetmelik'
    if (/genelge/.test(titleLower)) return 'Genelge'
    if (/sirk[üu]ler/.test(titleLower)) return 'Sirküler'
    return 'Mevzuat'
  }
  if (source === 'ilkekarari' || /ilke karar/.test(turLower)) return 'İlke Kararı'
  if (source === 'rehber' || /rehber/.test(turLower)) return 'Rehber'
  if (/duyuru/.test(titleLower)) return 'Duyuru'
  if (/bildirim/.test(titleLower)) return 'Bildirim'
  return tur || 'Diğer'
}

/**
 * Fallback HTTPS POST using Node.js https module.
 * rejectUnauthorized: false ONLY for mevzuat.spk.gov.tr
 */
function httpsPostJson(hostname, path, bodyObj) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(bodyObj)
    const isMevzuat = hostname === 'mevzuat.spk.gov.tr'
    const options = {
      hostname,
      path,
      method: 'POST',
      rejectUnauthorized: isMevzuat ? false : true,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
        Referer: `${MEVZUAT_BASE_URL}/`,
      },
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({ status: res.statusCode, body: data })
      })
    })

    req.on('error', (err) => reject(err))
    req.setTimeout(FETCH_TIMEOUT_MS, () => { req.destroy(); reject(new Error('Timeout')) })
    req.write(postData)
    req.end()
  })
}

async function fetchWithNative(url, body) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Content-Type': 'application/json',
        Accept: 'application/json, text/plain, */*',
        Referer: `${MEVZUAT_BASE_URL}/`,
      },
      body: JSON.stringify(body),
    })
    clearTimeout(timeout)
    const text = await res.text()
    return { ok: res.ok, status: res.status, text }
  } catch (err) {
    clearTimeout(timeout)
    throw err
  }
}

async function fetchWithHttpsFallback(hostname, path, body) {
  const httpsRes = await httpsPostJson(hostname, path, body)
  return { ok: httpsRes.status === 200, status: httpsRes.status, text: httpsRes.body }
}

/**
 * Unified POST /api/Search with retries, timeout, and fallback.
 * Used by both debug and archive flows.
 */
async function postSpkSearch(payload) {
  const url = `${API_URL}/Search`
  const body = {
    id: payload.searchText || '',
    searchField: 'all',
    kisimId: 0,
    bolumId: 0,
    konuGrubuId: 0,
    konuId: 0,
    rgDateBegin: null,
    rgDateEnd: null,
    kkDateBegin: null,
    kkDateEnd: null,
    type: '',
    keywords: '',
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.info(`[SPK Legislation] POST /api/Search attempt ${attempt}/${MAX_RETRIES}`)
    try {
      const httpsRes = await httpsPostJson('mevzuat.spk.gov.tr', '/api/Search', body)
      const text = httpsRes.body

      if (httpsRes.status !== 200) {
        console.warn(`[SPK Legislation] HTTP ${httpsRes.status} (attempt ${attempt})`)
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
          continue
        }
        return { ok: false, status: httpsRes.status, error: `HTTP ${httpsRes.status}` }
      }

      if (!text.trim().startsWith('[')) {
        const err = 'Response is not a JSON array'
        console.warn(`[SPK Legislation] ${err} (attempt ${attempt})`)
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
          continue
        }
        return { ok: false, status: httpsRes.status, error: err, preview: text.slice(0, 200) }
      }

      try {
        const data = JSON.parse(text)
        if (!Array.isArray(data)) {
          const err = 'Parsed data is not an array'
          console.warn(`[SPK Legislation] ${err} (attempt ${attempt})`)
          if (attempt < MAX_RETRIES) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
            continue
          }
          return { ok: false, status: httpsRes.status, error: err, preview: JSON.stringify(data).slice(0, 200) }
        }
        console.info(`[SPK Legislation] parsed: ${data.length}`)
        return { ok: true, status: httpsRes.status, data }
      } catch (parseErr) {
        console.warn(`[SPK Legislation] JSON parse error (attempt ${attempt}): ${parseErr.message}`)
        if (attempt < MAX_RETRIES) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
          continue
        }
        return { ok: false, status: httpsRes.status, error: `JSON parse error: ${parseErr.message}` }
      }
    } catch (err) {
      console.warn(`[SPK Legislation] attempt ${attempt} failed: ${err.message || err}`)
      if (attempt < MAX_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS))
      } else {
        return { ok: false, error: err.message || String(err) }
      }
    }
  }

  return { ok: false, error: 'All retries exhausted' }
}

function normalizeApiRecord(r) {
  const title = decodeHtmlEntities(r.title || r.baslik || '')
  const contentSource = r.contentSource || ''
  const tur = r.tur || ''
  const kisim = r.kisim || ''

  let year = null
  let date = ''
  let isoDate = ''

  if (r.kurulKararTarihi) {
    const d = new Date(r.kurulKararTarihi)
    if (!isNaN(d.getTime())) {
      year = d.getFullYear()
      isoDate = r.kurulKararTarihi.split('T')[0]
      date = r.kurulKararTarih || isoDate
    }
  } else if (r.tarih) {
    const d = new Date(r.tarih)
    if (!isNaN(d.getTime())) {
      year = d.getFullYear()
      isoDate = r.tarih.split('T')[0]
      date = isoDate
    }
  } else if (r.bultenYili) {
    year = Number(r.bultenYili)
  }

  const link = r.link || ''
  const url = link ? `${MEVZUAT_BASE_URL}/${link}` : `${MEVZUAT_BASE_URL}/`

  const id = r.id ? `legislation-${slug(r.id.toString().slice(0, 8))}-${year || 'nodate'}` : `legislation-${slug(title)}-${year || 'nodate'}`

  return {
    id,
    source: 'SPK Mevzuat Sistemi',
    sourceType: 'legislation',
    number: String(r.bultenNo || r.countItems || ''),
    title: title || 'Bilinmeyen',
    date,
    isoDate,
    url,
    year,
    category: detectCategoryFromSource(contentSource, title, tur),
    kisim: kisim.slice(0, 100),
    bolum: (r.bolum || '').slice(0, 100),
    tur: tur.slice(0, 50),
    contentSource: contentSource.slice(0, 50),
    rawId: r.id || '',
  }
}

export async function fetchSpkLegislationArchive({ limit = 500 } = {}) {
  console.info('[SPK Legislation] START')

  const searchResult = await postSpkSearch({ searchText: '' })

  if (!searchResult.ok) {
    console.warn('[SPK Legislation] API error:', searchResult.error)
    if (isCacheValid()) {
      console.info(`[SPK Legislation] live failed, using cache (${legislationCache.records.length} records)`)
      return {
        records: legislationCache.records.slice(0, limit),
        source: 'cache',
        debug: { error: searchResult.error, status: searchResult.status, usingCache: true },
      }
    }
    return { records: [], source: 'fallback', debug: { error: searchResult.error, status: searchResult.status, usingCache: false } }
  }

  const records = searchResult.data.slice(0, limit).map(normalizeApiRecord)
  console.info(`[SPK Legislation] API fetched ${records.length} records`)
  updateCache(records)

  return {
    records,
    source: 'live',
    debug: {
      endpoint: 'POST /api/Search',
      rawCount: searchResult.data.length,
      returnedCount: records.length,
      usingCache: false,
    },
  }
}

export async function debugSpkLegislation() {
  const results = {
    targetUrl: MEVZUAT_BASE_URL,
    extractedApiUrl: API_URL,
    extractedEndpoints: EXTRACTED_ENDPOINTS,
    apiAttempts: [],
    successfulAttempt: null,
    sampleResponseKeys: [],
    sampleRecords: [],
    parsedCount: 0,
    error: null,
  }

  const searchResult = await postSpkSearch({ searchText: '' })
  results.apiAttempts.push({
    endpoint: 'POST /api/Search',
    ok: searchResult.ok,
    status: searchResult.status,
    error: searchResult.error,
    preview: searchResult.preview,
  })

  if (searchResult.ok && Array.isArray(searchResult.data) && searchResult.data.length > 0) {
    results.successfulAttempt = 'POST /api/Search'
    results.parsedCount = searchResult.data.length
    results.sampleResponseKeys = Object.keys(searchResult.data[0])
    results.sampleRecords = searchResult.data.slice(0, 3).map((r) => ({
      id: r.id,
      title: (r.title || r.baslik || '').slice(0, 80),
      contentSource: r.contentSource,
      tur: r.tur,
      link: r.link,
    }))
  } else {
    results.error = searchResult.error || 'Empty response'
  }

  return results
}

export function getMockLegislationArchive() {
  return {
    records: [],
    source: 'fallback',
  }
}
