export type DataSourceStatus = 'ACTIVE' | 'WARNING' | 'ERROR' | 'DISABLED'
export type DataSourceType = 'REGULATOR' | 'EXCHANGE' | 'CLEARING' | 'BANK' | 'OFFICIAL' | 'AUDIT'

export interface DataSource {
  id: string
  name: string
  authority: string
  sourceType: DataSourceType
  baseUrl: string
  enabled: boolean
  status: DataSourceStatus
  syncInterval: number
  lastSync?: string
  lastSuccess?: string
  lastError?: string
  recordsCount: number
  createdAt: string
  updatedAt: string
}

export const SYNC_INTERVALS = [
  { value: 15, label: '15 dk' },
  { value: 30, label: '30 dk' },
  { value: 60, label: '1 saat' },
  { value: 360, label: '6 saat' },
  { value: 720, label: '12 saat' },
  { value: 1440, label: '24 saat' },
]

const SOURCES_KEY = 'akop_datasources_v1'

function load(): DataSource[] {
  try { const raw = localStorage.getItem(SOURCES_KEY); return raw ? JSON.parse(raw) as DataSource[] : seedDemoDataSources() } catch { return seedDemoDataSources() }
}
function save(items: DataSource[]) { localStorage.setItem(SOURCES_KEY, JSON.stringify(items)) }

export function seedDemoDataSources(): DataSource[] {
  const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString()
  const threeMinAgo = new Date(Date.now() - 3 * 60000).toISOString()
  const fortyMinAgo = new Date(Date.now() - 45 * 60000).toISOString()
  const oneHourAgo = new Date(Date.now() - 60 * 60000).toISOString()
  const twoHoursAgo = new Date(Date.now() - 120 * 60000).toISOString()
  const sources: DataSource[] = [
    { id: 'SRC-SPK', name: 'SPK Tebliğleri', authority: 'SPK', sourceType: 'REGULATOR', baseUrl: 'https://www.spk.gov.tr/tebligler', enabled: true, status: 'ACTIVE', syncInterval: 60, lastSync: fiveMinAgo, lastSuccess: fiveMinAgo, recordsCount: 1125, createdAt: '2026-01-15T00:00:00Z', updatedAt: fiveMinAgo },
    { id: 'SRC-BDDK', name: 'BDDK Düzenlemeleri', authority: 'BDDK', sourceType: 'REGULATOR', baseUrl: 'https://www.bddk.org.tr/mevzuat', enabled: true, status: 'ACTIVE', syncInterval: 60, lastSync: threeMinAgo, lastSuccess: threeMinAgo, recordsCount: 487, createdAt: '2026-01-15T00:00:00Z', updatedAt: threeMinAgo },
    { id: 'SRC-MASAK', name: 'MASAK Uyarıları', authority: 'MASAK', sourceType: 'REGULATOR', baseUrl: 'https://www.masak.gov.tr/uyarilar', enabled: true, status: 'ERROR', syncInterval: 30, lastSync: fortyMinAgo, lastError: 'Timeout: bağlantı 30 saniye içinde yanıt vermedi', recordsCount: 234, createdAt: '2026-01-15T00:00:00Z', updatedAt: fortyMinAgo },
    { id: 'SRC-MKK', name: 'MKK Mutabakat', authority: 'MKK', sourceType: 'CLEARING', baseUrl: 'https://www.mkk.com.tr/api/reconciliation', enabled: true, status: 'ACTIVE', syncInterval: 15, lastSync: threeMinAgo, lastSuccess: threeMinAgo, recordsCount: 892, createdAt: '2026-01-15T00:00:00Z', updatedAt: threeMinAgo },
    { id: 'SRC-TAKASBANK', name: 'Takasbank Uyarıları', authority: 'TAKASBANK', sourceType: 'CLEARING', baseUrl: 'https://www.takasbank.com.tr/api/alerts', enabled: true, status: 'WARNING', syncInterval: 15, lastSync: oneHourAgo, lastSuccess: oneHourAgo, recordsCount: 156, createdAt: '2026-01-15T00:00:00Z', updatedAt: oneHourAgo },
    { id: 'SRC-TCMB', name: 'TCMB Duyuruları', authority: 'TCMB', sourceType: 'BANK', baseUrl: 'https://www.tcmb.gov.tr/duyurular', enabled: true, status: 'ACTIVE', syncInterval: 360, lastSync: twoHoursAgo, lastSuccess: twoHoursAgo, recordsCount: 78, createdAt: '2026-01-15T00:00:00Z', updatedAt: twoHoursAgo },
    { id: 'SRC-KVKK', name: 'KVKK Kararları', authority: 'KVKK', sourceType: 'OFFICIAL', baseUrl: 'https://www.kvkk.gov.tr/kararlar', enabled: true, status: 'ACTIVE', syncInterval: 1440, lastSync: threeMinAgo, lastSuccess: threeMinAgo, recordsCount: 312, createdAt: '2026-01-15T00:00:00Z', updatedAt: threeMinAgo },
    { id: 'SRC-RESMI_GAZETE', name: 'Resmi Gazete Düzenlemeleri', authority: 'RESMI_GAZETE', sourceType: 'OFFICIAL', baseUrl: 'https://www.resmigazete.gov.tr', enabled: true, status: 'ACTIVE', syncInterval: 1440, lastSync: fiveMinAgo, lastSuccess: fiveMinAgo, recordsCount: 1567, createdAt: '2026-01-15T00:00:00Z', updatedAt: fiveMinAgo },
  ]
  localStorage.setItem(SOURCES_KEY, JSON.stringify(sources))
  return sources
}

export function fetchDataSources(): DataSource[] {
  return load()
}

export function getDataSourceById(id: string): DataSource | undefined {
  return load().find((s) => s.id === id)
}

export function updateDataSource(id: string, updates: Partial<DataSource>): DataSource | null {
  const items = load()
  const idx = items.findIndex((s) => s.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() }
  save(items)
  return items[idx]
}

export function syncDataSource(id: string): DataSource | null {
  const items = load()
  const idx = items.findIndex((s) => s.id === id)
  if (idx === -1) return null
  const source = items[idx]
  if (!source.enabled) return source

  const now = new Date().toISOString()

  // Simulate sync result
  const isSuccess = Math.random() > 0.1
  const newRecords = isSuccess ? Math.floor(Math.random() * 15) + 1 : 0

  if (isSuccess) {
    items[idx] = {
      ...source,
      status: 'ACTIVE' as DataSourceStatus,
      lastSync: now,
      lastSuccess: now,
      recordsCount: source.recordsCount + newRecords,
      updatedAt: now,
    }
  } else {
    const errors = ['Timeout', '503 Service Unavailable', 'SSL Certificate Error', 'Rate limit exceeded']
    items[idx] = {
      ...source,
      status: 'ERROR' as DataSourceStatus,
      lastSync: now,
      lastError: errors[Math.floor(Math.random() * errors.length)],
      updatedAt: now,
    }
  }
  save(items)
  return items[idx]
}

export function syncAllDataSources(): DataSource[] {
  const items = load()
  const now = new Date().toISOString()
  items.forEach((source, i) => {
    if (!source.enabled) return
    const isSuccess = Math.random() > 0.1
    const newRecords = isSuccess ? Math.floor(Math.random() * 15) + 1 : 0
    if (isSuccess) {
      items[i] = { ...source, status: 'ACTIVE' as DataSourceStatus, lastSync: now, lastSuccess: now, recordsCount: source.recordsCount + newRecords, updatedAt: now }
    } else {
      const errors = ['Timeout', '503 Service Unavailable', 'SSL Certificate Error', 'Rate limit exceeded']
      items[i] = { ...source, status: 'ERROR' as DataSourceStatus, lastSync: now, lastError: errors[Math.floor(Math.random() * errors.length)], updatedAt: now }
    }
  })
  save(items)
  return items
}

export function toggleDataSource(id: string): DataSource | null {
  const items = load()
  const idx = items.findIndex((s) => s.id === id)
  if (idx === -1) return null
  const enabled = !items[idx].enabled
  items[idx] = { ...items[idx], enabled, status: enabled ? 'ACTIVE' : 'DISABLED', updatedAt: new Date().toISOString() }
  save(items)
  return items[idx]
}

export function getDataSourceStats(sources: DataSource[]) {
  const now = new Date().getTime()
  const oneDay = 24 * 3600000
  return {
    total: sources.length,
    active: sources.filter((s) => s.status === 'ACTIVE').length,
    warning: sources.filter((s) => s.status === 'WARNING').length,
    error: sources.filter((s) => s.status === 'ERROR').length,
    disabled: sources.filter((s) => s.status === 'DISABLED').length,
    syncedLast24h: sources.filter((s) => s.lastSync && (now - new Date(s.lastSync).getTime()) < oneDay).length,
    failedSync: sources.filter((s) => s.status === 'ERROR' || s.lastError).length,
    totalRecords: sources.reduce((sum, s) => sum + s.recordsCount, 0),
  }
}

export function getStatusBadgeClass(status: DataSourceStatus) {
  switch (status) {
    case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'WARNING': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'ERROR': return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'DISABLED': return 'bg-slate-100 text-slate-500 border-slate-200'
    default: return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function getSourceTypeBadgeClass(type: DataSourceType) {
  switch (type) {
    case 'REGULATOR': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'EXCHANGE': return 'bg-teal-100 text-teal-800 border-teal-200'
    case 'CLEARING': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
    case 'BANK': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'OFFICIAL': return 'bg-slate-100 text-slate-800 border-slate-200'
    case 'AUDIT': return 'bg-violet-100 text-violet-800 border-violet-200'
    default: return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function getNewRecordsSince(sources: DataSource[], hours: number): number {
  const cutoff = new Date().getTime() - hours * 3600000
  return sources.filter((s) => s.lastSync && new Date(s.lastSync).getTime() > cutoff).reduce((sum, s) => sum + s.recordsCount, 0)
}
