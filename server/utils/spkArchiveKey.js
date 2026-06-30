/**
 * Normalize a field for deduplication key generation
 */
function normalizeField(str) {
  if (!str) return ''
  return String(str)
    .replace(/&#252;/g, 'ü').replace(/&#220;/g, 'Ü')
    .replace(/&#231;/g, 'ç').replace(/&#199;/g, 'Ç')
    .replace(/&#246;/g, 'ö').replace(/&#214;/g, 'Ö')
    .replace(/&#287;/g, 'ğ').replace(/&#286;/g, 'Ğ')
    .replace(/&#305;/g, 'ı').replace(/&#304;/g, 'İ')
    .replace(/&#351;/g, 'ş').replace(/&#350;/g, 'Ş')
    .replace(/&#39;/g, "'").replace(/&#226;/g, 'â')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

function slug(str) {
  return normalizeField(str)
    .replace(/[^a-z0-9\u00e7\u011f\u0131\u00f6\u015f\u00fc]/gi, '')
    .slice(0, 30)
}

/**
 * Create a stable deduplication key for an SPK archive record.
 * Key format: sourceType + normalizedNumber + normalizedTitle + normalizedDate
 */
export function createSpkArchiveKey(record) {
  const sourceType = normalizeField(record.sourceType || 'unknown')
  const number = normalizeField(record.number || '')
  const title = normalizeField(record.title || '')
  const date = normalizeField(record.isoDate || record.date || '')
  const category = normalizeField(record.category || '')
  const rawId = normalizeField(record.rawId || '')

  let dedupPart = ''
  if (sourceType === 'legislation') {
    // legislation: rawId + title + category (rawId ensures unique records from API)
    dedupPart = `${rawId}::${title}::${category}`
  } else if (number) {
    // bulletins have real numbers
    dedupPart = number
  } else {
    // press releases and others: title + date
    dedupPart = `${title}::${date}`
  }
  return `${sourceType}::${dedupPart}`
}

/**
 * Create a stable id from record fields (used for initial id generation)
 */
export function createStableId(record) {
  const sourceType = normalizeField(record.sourceType || 'unknown')
  const year = record.year || new Date().getFullYear()
  const number = normalizeField(record.number || '')
  const titleSlug = slug(record.title || '')
  const date = normalizeField(record.isoDate || record.date || '')
  return `${sourceType}-${year}-${number || titleSlug || 'norecord'}-${date || 'nodate'}`
}

/**
 * Compare two records to determine which is "higher quality"
 * Returns true if a is better than b
 */
export function isBetterRecord(a, b) {
  // Priority: source quality
  const sourcePriority = { live: 3, pdf: 2, fallback: 1 }
  const aPriority = sourcePriority[a._sourceQuality] || sourcePriority[a.source] || 1
  const bPriority = sourcePriority[b._sourceQuality] || sourcePriority[b.source] || 1
  if (aPriority !== bPriority) return aPriority > bPriority

  // Has url > no url
  if (Boolean(a.url) !== Boolean(b.url)) return Boolean(a.url) > Boolean(b.url)

  // Has isoDate > no isoDate
  if (Boolean(a.isoDate) !== Boolean(b.isoDate)) return Boolean(a.isoDate) > Boolean(b.isoDate)

  // Longer title > shorter title (more descriptive)
  if ((a.title?.length || 0) !== (b.title?.length || 0)) {
    return (a.title?.length || 0) > (b.title?.length || 0)
  }

  return false
}
