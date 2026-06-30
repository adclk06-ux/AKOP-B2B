// server/services/spkSyncStore.js
// In-memory store for SPK sync archive records

import { createSpkArchiveKey, isBetterRecord } from '../utils/spkArchiveKey.js'
import { getRecordSortTimestamp } from '../utils/dateSort.js'
import { createNotificationFromRegulatoryRecord, hasNotificationForSourceRecord } from '../stores/notificationStore.js'

/** @type {Array<import('./spkBulletins.js').ArchiveRecord>} */
let spkArchiveRecords = []
let archiveSource = 'none' // 'live' | 'fallback' | 'none'
let archiveCoverage = { startYear: null, endYear: null, fetchedYears: [], skippedYears: [] }

export function setSpkArchiveRecords(records) {
  spkArchiveRecords = records
}

export function getSpkArchiveRecords() {
  return [...spkArchiveRecords]
}

export function setArchiveSource(source) {
  archiveSource = source
}

export function getArchiveSource() {
  return archiveSource
}

export function upsertSpkArchiveRecords(records, source = 'live') {
  if (!Array.isArray(records) || records.length === 0) return

  const existingMap = new Map()
  spkArchiveRecords.forEach((r) => {
    const key = createSpkArchiveKey(r)
    existingMap.set(key, r)
  })

  let added = 0
  let replaced = 0

  for (const record of records) {
    const key = createSpkArchiveKey(record)
    const existing = existingMap.get(key)
    record._sourceQuality = source

    if (!existing) {
      existingMap.set(key, record)
      added++
      // Create in-app notification for new regulatory record (skip duplicates)
      if (!hasNotificationForSourceRecord(record.id)) {
        createNotificationFromRegulatoryRecord(record)
      }
    } else if (isBetterRecord(record, existing)) {
      existingMap.set(key, record)
      replaced++
    }
  }

  spkArchiveRecords = Array.from(existingMap.values())
  archiveSource = source
  console.info(`[SPK Store] Upserted ${added} new, ${replaced} replaced (${source}). Total unique: ${spkArchiveRecords.length}`)
}

export function findSpkArchiveRecordById(id) {
  return spkArchiveRecords.find((r) => r.id === id) || null
}

export function setArchiveCoverage(coverage) {
  archiveCoverage = { ...archiveCoverage, ...coverage }
}

export function getArchiveCoverage() {
  return { ...archiveCoverage }
}

export function getSpkArchiveSummary(limit = 100) {
  return {
    total: spkArchiveRecords.length,
    records: spkArchiveRecords.slice(0, limit),
    source: archiveSource,
    coverage: getArchiveCoverage(),
  }
}

export function filterSpkArchive({ year, limit = 100, sourceType } = {}) {
  let results = [...spkArchiveRecords]

  if (year !== undefined && year !== null && year !== '') {
    const y = Number(year)
    results = results.filter((r) => r.year === y)
  }

  if (sourceType && sourceType !== 'all') {
    results = results.filter((r) => r.sourceType === sourceType)
  }

  // Sort: newest first, undated records at the end
  results.sort((a, b) => getRecordSortTimestamp(b) - getRecordSortTimestamp(a))

  const years = results.map((r) => r.year).filter((y) => typeof y === 'number' && y > 1900)
  const yearRange = years.length > 0
    ? { minYear: Math.min(...years), maxYear: Math.max(...years) }
    : { minYear: null, maxYear: null }

  return {
    total: results.length,
    records: results.slice(0, Number(limit) || 100),
    yearRange,
  }
}

export function getDuplicateStats() {
  const seen = new Map()
  let duplicates = 0
  const examples = []

  for (const r of spkArchiveRecords) {
    const key = createSpkArchiveKey(r)
    if (seen.has(key)) {
      duplicates++
      if (examples.length < 5) {
        examples.push({ key, title: r.title, number: r.number, sourceType: r.sourceType })
      }
    } else {
      seen.set(key, r)
    }
  }

  return {
    rawTotal: spkArchiveRecords.length + duplicates,
    uniqueTotal: spkArchiveRecords.length,
    duplicateTotal: duplicates,
    duplicateExamples: examples,
  }
}
