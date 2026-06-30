/**
 * Parse various date formats into ISO YYYY-MM-DD.
 * Supports:
 * - YYYY-MM-DD
 * - DD.MM.YYYY
 * - DD/MM/YYYY
 * - Native Date.parse (including Turkish month names via browser/node)
 */
function parseDateFlexible(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return null
  const s = dateStr.trim()

  // Already ISO: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  // DD.MM.YYYY
  const dotMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (dotMatch) {
    const iso = `${dotMatch[3]}-${dotMatch[2].padStart(2, '0')}-${dotMatch[1].padStart(2, '0')}`
    const d = new Date(iso)
    return isNaN(d.getTime()) ? null : iso
  }

  // DD/MM/YYYY
  const slashMatch = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const iso = `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`
    const d = new Date(iso)
    return isNaN(d.getTime()) ? null : iso
  }

  // Try native Date.parse for other formats (e.g. "17 Haziran 2026", "12 Haz 2026")
  const native = Date.parse(s)
  if (!isNaN(native)) {
    const d = new Date(native)
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return iso
  }

  return null
}

/**
 * Get a numeric timestamp for sorting archive records.
 * Priority:
 * 1. effectiveDate (enriched legislation date)
 * 2. isoDate
 * 3. parsed raw date string
 * 4. effectiveYear fallback (legislation enrichment)
 * 5. year fallback (mid-year approximation)
 * 6. 0 (no date → end of list)
 */
export function getRecordSortTimestamp(record) {
  if (!record) return 0

  // 1. effectiveDate (enriched)
  if (record.effectiveDate && /^\d{4}-\d{2}-\d{2}$/.test(record.effectiveDate)) {
    const ts = new Date(record.effectiveDate).getTime()
    if (!isNaN(ts)) return ts
  }

  // 2. isoDate
  if (record.isoDate && /^\d{4}-\d{2}-\d{2}$/.test(record.isoDate)) {
    const ts = new Date(record.isoDate).getTime()
    if (!isNaN(ts)) return ts
  }

  // 3. raw date string
  if (record.date) {
    const parsed = parseDateFlexible(record.date)
    if (parsed) {
      const ts = new Date(parsed).getTime()
      if (!isNaN(ts)) return ts
    }
  }

  // 4. effectiveYear fallback (legislation enrichment, uses Jan 1 to keep year order)
  if (typeof record.effectiveYear === 'number' && record.effectiveYear > 1900) {
    return new Date(`${record.effectiveYear}-01-01`).getTime()
  }

  // 5. Year fallback (mid-year approximation)
  if (typeof record.year === 'number' && record.year > 1900) {
    return new Date(`${record.year}-06-15`).getTime()
  }

  // 6. No date → push to end
  return 0
}
