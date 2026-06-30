export interface SpkSyncSource {
  name: string
  type: 'bulletin' | 'regulation' | 'announcement'
  url: string
  status: 'ok' | 'error' | 'warning'
  latestTitle: string
  latestDate: string
}

export interface SpkSyncUpdate {
  id: string
  source: string
  title: string
  url?: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  detectedAt: string
  requiresComplianceReview: boolean
}

export interface SpkArchiveRecord {
  id: string
  source?: string
  authority?: 'SPK' | 'BDDK'
  number: string
  title: string
  date: string
  isoDate: string
  effectiveDate?: string
  effectiveYear?: number
  needsDateEnrichment?: boolean
  url: string
  year: number
  sourceType: 'bulletin' | 'press-release' | 'legislation' | 'bddk-announcement' | 'bddk-decision' | 'bddk-regulation' | 'bddk-press-release'
  category?: string
}

export interface SpkSyncStatus {
  status: 'active' | 'inactive' | 'error'
  lastCheckedAt: string
  sources: SpkSyncSource[]
  updates: SpkSyncUpdate[]
  archive?: {
    total: number
    records: SpkArchiveRecord[]
    source?: 'live' | 'fallback' | 'none'
    coverage?: {
      startYear: number | null
      endYear: number | null
      fetchedYears: number[]
      skippedYears: number[]
    }
    counts?: {
      bulletin: number
      pressRelease: number
      legislation: number
      total: number
    }
    stats?: {
      rawTotal: number
      uniqueTotal: number
      duplicateTotal: number
      duplicateExamples: Array<{ key: string; title: string; number: string; sourceType: string }>
      missingDates?: number
    }
    yearRange?: {
      minYear: number | null
      maxYear: number | null
    }
  }
}

export function getMockSpkSyncStatus(): SpkSyncStatus {
  const now = new Date().toISOString()
  return {
    status: 'active',
    lastCheckedAt: now,
    sources: [
      {
        name: 'SPK Bültenleri',
        type: 'bulletin',
        url: 'https://spk.gov.tr/spk-bultenleri',
        status: 'ok',
        latestTitle: 'SPK Bülteni',
        latestDate: now.split('T')[0],
      },
      {
        name: 'SPK Mevzuat Sistemi',
        type: 'regulation',
        url: 'https://mevzuat.spk.gov.tr/',
        status: 'ok',
        latestTitle: 'Mevzuat Sistemi kontrol edildi',
        latestDate: now.split('T')[0],
      },
      {
        name: 'SPK Basın Duyuruları',
        type: 'announcement',
        url: 'https://spk.gov.tr/duyurular/basin-duyurulari',
        status: 'ok',
        latestTitle: 'Basın duyuruları kontrol edildi',
        latestDate: now.split('T')[0],
      },
    ],
    updates: [
      {
        id: 'spk-bulletin-001',
        source: 'SPK Bültenleri',
        title: 'Yeni SPK bülteni tespit edildi',
        url: 'https://spk.gov.tr/spk-bultenleri',
        impact: 'medium',
        summary: 'Uyum ekibi tarafından incelenmesi gereken yeni bülten kaydı.',
        detectedAt: now,
        requiresComplianceReview: true,
      },
      {
        id: 'spk-press-001',
        source: 'SPK Basın Duyuruları',
        title: 'Basın duyurusu kontrol edildi',
        url: 'https://spk.gov.tr/duyurular/basin-duyurulari',
        impact: 'low',
        summary: 'Yeni basın duyurusu olup olmadığı kontrol edildi.',
        detectedAt: now,
        requiresComplianceReview: true,
      },
    ],
    archive: {
      total: 0,
      source: 'none',
      records: [],
    },
  }
}

export function getEmptySpkSyncStatus(): SpkSyncStatus {
  const now = new Date().toISOString()
  return {
    status: 'error',
    lastCheckedAt: now,
    sources: [],
    updates: [],
    archive: {
      total: 0,
      source: 'none',
      records: [],
    },
  }
}

export interface SpkBulletinAnalysis {
  summary: string
  keyDecisions: string[]
  affectedAreas: string[]
  recommendedAction: string
  impactLevel: 'low' | 'medium' | 'high'
  complianceChecklist: string[]
  possibleOperationalImpact: string
  sourceBasis: 'pdf_content' | 'metadata_only' | 'fallback' | 'uploaded_pdf' | 'legislation_pdf_content' | 'openai'
  disclaimer: string
  reliability?: 'high' | 'medium' | 'low'
  errorNote?: string
}

export async function fetchSpkArchive(options?: { startYear?: number; endYear?: number; year?: number; limit?: number; sourceType?: 'all' | 'bulletin' | 'press-release' | 'legislation'; refresh?: boolean }) {
  const params = new URLSearchParams()
  if (options?.startYear !== undefined) params.set('startYear', String(options.startYear))
  if (options?.endYear !== undefined) params.set('endYear', String(options.endYear))
  if (options?.year !== undefined) params.set('year', String(options.year))
  if (options?.limit !== undefined) params.set('limit', String(options.limit))
  if (options?.sourceType) params.set('sourceType', options.sourceType)
  if (options?.refresh) params.set('refresh', 'true')
  console.debug('[Archive Request Params]', params.toString())
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''
  const res = await fetch(`${base}/api/spk/archive?${params.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function analyzeSpkBulletin(record: SpkArchiveRecord): Promise<SpkBulletinAnalysis> {
  const res = await fetch('/api/spk/analyze-bulletin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function enrichLegislationDate(record: SpkArchiveRecord): Promise<{ success: boolean; effectiveDate: string | null; effectiveYear: number | null; dateSource: string; textPreview: string | null }> {
  const res = await fetch('/api/spk/legislation/enrich-date', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ record }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function analyzeSpkBulletinWithPdf(record: SpkArchiveRecord, file: File): Promise<SpkBulletinAnalysis> {
  const formData = new FormData()
  formData.append('pdf', file)
  formData.append('record', JSON.stringify(record))
  const res = await fetch('/api/spk/analyze-bulletin-pdf', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export interface RegulatoryArchiveResponse {
  total: number
  counts: {
    spk: number
    bddk: number
    total: number
  }
  records: SpkArchiveRecord[]
  source: {
    spk: string
    bddk: string
  }
  cacheInfo?: {
    bddk?: {
      source: string
      lastRefreshedAt: string | null
      recordCount: number
    }
  }
  lastRefreshedAt: string
}

export async function fetchRegulatoryArchive(options?: { authority?: 'all' | 'spk' | 'bddk'; limit?: number; refresh?: boolean }): Promise<RegulatoryArchiveResponse> {
  const params = new URLSearchParams()
  if (options?.authority) params.set('authority', options.authority)
  if (options?.limit !== undefined) params.set('limit', String(options.limit))
  if (options?.refresh) params.set('refresh', 'true')
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''
  const res = await fetch(`${base}/api/regulatory/archive?${params.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchBddkDebug(): Promise<{
  attemptedUrls: string[]
  successfulUrl: string | null
  htmlLength: number
  matchedLinks: number
  first10Candidates: Array<{ href: string; type: string }>
  sampleRecords: unknown[]
  parsedCount: number
  error: string | null
  timestamp: string
}> {
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''
  const res = await fetch(`${base}/api/bddk/debug`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchSpkSyncStatus(): Promise<SpkSyncStatus> {
  console.log('[Archive Fetch Started]')
  const base = (import.meta.env.VITE_API_BASE_URL as string | undefined) || ''
  try {
    const res = await fetch(`${base}/api/spk/sync-status`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    console.log('[Archive API Response]', JSON.stringify({ archiveTotal: data?.archive?.total, archiveSource: data?.archive?.source }))
    return data
  } catch (err) {
    console.warn('[Archive API Error]', err)
    if (import.meta.env.DEV) {
      return getMockSpkSyncStatus()
    }
    return getEmptySpkSyncStatus()
  }
}
