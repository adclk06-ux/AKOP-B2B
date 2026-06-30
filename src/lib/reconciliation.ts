export interface ReconciliationResults {
  dup_sistem: Record<string, any>[]
  dup_karsi: Record<string, any>[]
  only_sistem: Record<string, any>[]
  only_karsi: Record<string, any>[]
  amount_diff: Record<string, any>[]
  date_diff: Record<string, any>[]
  past_date_issues: Record<string, any>[]
  musteri_diff: Record<string, any>[]
  islem_diff: Record<string, any>[]
  optional_diffs: Record<string, any>[]
  total_sistem: number
  total_karsi: number
  matched: number
  total_errors: number
}

export interface IssueRow {
  'Önem': string
  'Kategori': string
  'Referans No': string
  'Müşteri No': string
  'Sistem Değeri': string
  'Karşı Taraf Değeri': string
  'Açıklama': string
  'Risk Skoru'?: number
  'Risk Seviyesi'?: string
  'Önerilen Aksiyon'?: string
}

const REQUIRED_COLUMNS = ['referans_no', 'musteri_no', 'islem_tipi', 'tutar', 'islem_tarihi']

export async function parseFile(file: File): Promise<Record<string, any>[]> {
  const buffer = await file.arrayBuffer()
  const XLSX = await import('xlsx')
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName = workbook.SheetNames[0]
  const worksheet = workbook.Sheets[sheetName]
  return XLSX.utils.sheet_to_json(worksheet, { defval: '' })
}

export function normalizeColumns(df: Record<string, any>[]): Record<string, any>[] {
  if (!df.length) return []
  const cols = Object.keys(df[0])
  const mapping: Record<string, string> = {}
  for (const c of cols) {
    mapping[c] = c.trim().toLowerCase().replace(/ /g, '_')
  }
  return df.map((row) => {
    const newRow: Record<string, any> = {}
    for (const [k, v] of Object.entries(row)) {
      newRow[mapping[k]] = v
    }
    return newRow
  })
}

export function detectReconciliationFileType(headers: string[]): 'system' | 'counterparty' | 'unknown' {
  const normalized = headers.map((h) =>
    h.trim().toLowerCase().replace(/[_\s]/g, '')
  )

  const systemKeywords = [
    'internalaccountno',
    'musterino',
    'kurumhesapno',
    'sistemhesapno',
    'internalbalance',
    'kurumbakiye',
    'sistembakiye',
    'internal_account_no',
    'internal_balance',
    'sistem_hesap_no',
    'sistem_bakiye',
    'kurum_hesap_no',
    'kurum_bakiye',
    'musteri_no',
    'müşterino',
    'müşteri_no',
  ]

  const counterpartyKeywords = [
    'mkkaccountno',
    'mkksicilno',
    'karsitarafhesapno',
    'karsitarafbakiye',
    'mkkbakiye',
    'mkk_balance',
    'mkk_account_no',
    'mkk_sicil_no',
    'karşıtarafhesapno',
    'karşıtarafbakiye',
    'karşitarafhesapno',
    'karşitarafbakiye',
    'karsi_taraf_hesap_no',
    'karsi_taraf_bakiye',
    'karşi_taraf_hesap_no',
    'karşi_taraf_bakiye',
    'mkk_hesap_no',
    'mkk_sicil_no',
    'mkk_bakiye',
    'karsitaraf',
    'karşitaraf',
  ]

  let systemScore = 0
  let counterpartyScore = 0

  for (const h of normalized) {
    for (const kw of systemKeywords) {
      if (h.includes(kw.replace(/[_\s]/g, ''))) {
        systemScore++
      }
    }
    for (const kw of counterpartyKeywords) {
      if (h.includes(kw.replace(/[_\s]/g, ''))) {
        counterpartyScore++
      }
    }
  }

  if (systemScore >= 2 && systemScore > counterpartyScore) return 'system'
  if (counterpartyScore >= 2 && counterpartyScore > systemScore) return 'counterparty'
  return 'unknown'
}

export function validateColumns(df: Record<string, any>[], fileLabel: string): void {
  if (!df.length) return
  const cols = Object.keys(df[0])
  const missing = REQUIRED_COLUMNS.filter((c) => !cols.includes(c))
  if (missing.length) {
    throw new Error(
      `${fileLabel} dosyasında zorunlu kolonlar eksik: ${missing.join(', ')}`
    )
  }
}

export function safeFloat(val: any): number {
  try {
    return parseFloat(String(val).replace(',', '.').replace(/ /g, '').trim())
  } catch {
    return NaN
  }
}

export function detectDuplicates(df: Record<string, any>[], label: string): Record<string, any>[] {
  const seen = new Map<string, number>()
  for (const row of df) {
    const ref = String(row['referans_no'] || '').trim()
    if (!ref) continue
    seen.set(ref, (seen.get(ref) || 0) + 1)
  }
  const dups: Record<string, any>[] = []
  for (const row of df) {
    const ref = String(row['referans_no'] || '').trim()
    if (seen.get(ref)! > 1) {
      dups.push({ source: label, ...row })
    }
  }
  return dups
}

export function runReconciliation(
  dfSistemRaw: Record<string, any>[],
  dfKarsiRaw: Record<string, any>[],
  selectedDate?: string | null,
  allDates: boolean = true
): ReconciliationResults {
  const dupSistem = detectDuplicates(dfSistemRaw, 'System Report')
  const dupKarsi = detectDuplicates(dfKarsiRaw, 'Counterparty Report')

  const seenS = new Set<string>()
  const s = dfSistemRaw.filter((r) => {
    const ref = String(r['referans_no'] || '').trim().toUpperCase().replace(/\s+/g, '')
    if (seenS.has(ref)) return false
    seenS.add(ref)
    return true
  })

  const seenK = new Set<string>()
  const k = dfKarsiRaw.filter((r) => {
    const ref = String(r['referans_no'] || '').trim().toUpperCase().replace(/\s+/g, '')
    if (seenK.has(ref)) return false
    seenK.add(ref)
    return true
  })

  const sMap = new Map<string, Record<string, any>>()
  for (const row of s) {
    const ref = String(row['referans_no'] || '').trim().toUpperCase().replace(/\s+/g, '')
    sMap.set(ref, row)
  }
  const kMap = new Map<string, Record<string, any>>()
  for (const row of k) {
    const ref = String(row['referans_no'] || '').trim().toUpperCase().replace(/\s+/g, '')
    kMap.set(ref, row)
  }

  const onlySistem: Record<string, any>[] = []
  const onlyKarsi: Record<string, any>[] = []
  const both: { ref: string; s: Record<string, any>; k: Record<string, any> }[] = []

  for (const [ref, row] of sMap) {
    if (kMap.has(ref)) {
      both.push({ ref, s: row, k: kMap.get(ref)! })
    } else {
      onlySistem.push(row)
    }
  }
  for (const [ref, row] of kMap) {
    if (!sMap.has(ref)) onlyKarsi.push(row)
  }

  const amountDiff: Record<string, any>[] = []
  for (const { ref, s: rs, k: rk } of both) {
    const ts = safeFloat(rs['tutar'])
    const tk = safeFloat(rk['tutar'])
    if (!isNaN(ts) && !isNaN(tk) && Math.abs(ts - tk) > 0.001) {
      amountDiff.push({
        referans_no: ref,
        musteri_no: rs['musteri_no'],
        islem_tipi: rs['islem_tipi'],
        islem_tarihi: rs['islem_tarihi'],
        tutar_sistem: rs['tutar'],
        tutar_karsi: rk['tutar'],
        fark_tl: parseFloat((tk - ts).toFixed(2)),
      })
    }
  }

  const dateDiff: Record<string, any>[] = []
  for (const { ref, s: rs, k: rk } of both) {
    const ds = String(rs['islem_tarihi'] || '').trim()
    const dk = String(rk['islem_tarihi'] || '').trim()
    if (ds !== dk) {
      dateDiff.push({
        referans_no: ref,
        musteri_no: rs['musteri_no'],
        islem_tipi: rs['islem_tipi'],
        tutar: rs['tutar'],
        tarih_sistem: ds,
        tarih_karsi: dk,
      })
    }
  }

  const pastDateIssues: Record<string, any>[] = []
  if (!allDates && selectedDate) {
    const selDt = new Date(selectedDate)
    for (const { ref, s: rs, k: rk } of both) {
      const ds = new Date(rs['islem_tarihi'])
      const dk = new Date(rk['islem_tarihi'])
      if (!isNaN(ds.getTime()) && !isNaN(dk.getTime()) && (ds < selDt || dk < selDt)) {
        pastDateIssues.push({
          referans_no: ref,
          musteri_no: rs['musteri_no'],
          islem_tipi: rs['islem_tipi'],
          tarih_sistem: rs['islem_tarihi'],
          tarih_karsi: rk['islem_tarihi'],
        })
      }
    }
  }

  const musteriDiff: Record<string, any>[] = []
  for (const { ref, s: rs, k: rk } of both) {
    const ms = String(rs['musteri_no'] || '').trim()
    const mk = String(rk['musteri_no'] || '').trim()
    if (ms !== mk) {
      musteriDiff.push({
        referans_no: ref,
        musteri_no_sistem: ms,
        musteri_no_karsi: mk,
        islem_tipi: rs['islem_tipi'],
        tutar: rs['tutar'],
        islem_tarihi: rs['islem_tarihi'],
      })
    }
  }

  const islemDiff: Record<string, any>[] = []
  for (const { ref, s: rs, k: rk } of both) {
    const ts = String(rs['islem_tipi'] || '').trim()
    const tk = String(rk['islem_tipi'] || '').trim()
    if (ts !== tk) {
      islemDiff.push({
        referans_no: ref,
        musteri_no: rs['musteri_no'],
        islem_tipi_sistem: ts,
        islem_tipi_karsi: tk,
        tutar: rs['tutar'],
        islem_tarihi: rs['islem_tarihi'],
      })
    }
  }

  const OPTIONAL_COLS: [string, string][] = [
    ['para_birimi', 'Para Birimi Farkı'],
    ['valor_tarihi', 'Valör Tarihi Farkı'],
    ['durum', 'Durum Farkı'],
    ['kanal', 'Kanal Farkı'],
    ['sube_kodu', 'Şube Farkı'],
    ['hesap_no', 'Hesap No Farkı'],
    ['islem_saati', 'İşlem Saati Farkı'],
    ['mutabakat_durumu', 'Mutabakat Durumu Farkı'],
    ['istisna_kodu', 'İstisna Kodu Farkı'],
  ]
  const optionalDiffs: Record<string, any>[] = []
  for (const { ref, s: rs, k: rk } of both) {
    for (const [col, label] of OPTIONAL_COLS) {
      const vs = String(rs[col] ?? '').trim()
      const vk = String(rk[col] ?? '').trim()
      if (vs && vk && vs !== vk) {
        optionalDiffs.push({
          referans_no: ref,
          kategori: label,
          musteri_no: rs['musteri_no'],
          sistem_degeri: vs,
          karsi_taraf_degeri: vk,
          islem_tarihi: rs['islem_tarihi'],
        })
      }
    }
  }

  const totalErrors =
    onlySistem.length +
    onlyKarsi.length +
    amountDiff.length +
    dateDiff.length +
    musteriDiff.length +
    islemDiff.length +
    dupSistem.length +
    dupKarsi.length +
    optionalDiffs.length +
    pastDateIssues.length

  return {
    dup_sistem: dupSistem,
    dup_karsi: dupKarsi,
    only_sistem: onlySistem,
    only_karsi: onlyKarsi,
    amount_diff: amountDiff,
    date_diff: dateDiff,
    past_date_issues: pastDateIssues,
    musteri_diff: musteriDiff,
    islem_diff: islemDiff,
    optional_diffs: optionalDiffs,
    total_sistem: dfSistemRaw.length,
    total_karsi: dfKarsiRaw.length,
    matched: both.length,
    total_errors: totalErrors,
  }
}

export function buildIssues(results: ReconciliationResults): IssueRow[] {
  const rows: IssueRow[] = []

  const pushRow = (
    onem: string,
    kategori: string,
    ref: string,
    mus: string,
    sysVal: string,
    karsiVal: string,
    aciklama: string
  ) => {
    rows.push({
      'Önem': onem,
      'Kategori': kategori,
      'Referans No': ref,
      'Müşteri No': mus,
      'Sistem Değeri': sysVal,
      'Karşı Taraf Değeri': karsiVal,
      'Açıklama': aciklama,
    })
  }

  for (const r of results.only_sistem) {
    pushRow('Kritik', 'Sadece Sistemde', String(r['referans_no'] || ''), String(r['musteri_no'] || ''), 'Var', 'Yok', 'Sistem raporunda bulunuyor, karşı taraf raporunda eşleşmedi.')
  }
  for (const r of results.only_karsi) {
    pushRow('Kritik', 'Sadece Karşı Tarafta', String(r['referans_no'] || ''), String(r['musteri_no'] || ''), 'Yok', 'Var', 'Karşı taraf raporunda bulunuyor, sistem raporunda eşleşmedi.')
  }
  for (const r of results.amount_diff) {
    pushRow('Kritik', 'Tutar Farkı', String(r['referans_no'] || ''), String(r['musteri_no'] || ''), String(r['tutar_sistem'] || ''), String(r['tutar_karsi'] || ''), `Tutar farkı: ${r['fark_tl']} ₺`)
  }
  for (const r of results.date_diff) {
    pushRow('Uyarı', 'Tarih Uyumsuzluğu', String(r['referans_no'] || ''), String(r['musteri_no'] || ''), String(r['tarih_sistem'] || ''), String(r['tarih_karsi'] || ''), 'İşlem tarihi raporlar arasında farklı.')
  }
  for (const r of results.musteri_diff) {
    pushRow('Uyarı', 'Müşteri No Farkı', String(r['referans_no'] || ''), String(r['musteri_no_sistem'] || ''), String(r['musteri_no_sistem'] || ''), String(r['musteri_no_karsi'] || ''), 'Aynı referans için müşteri numarası farklı.')
  }
  for (const r of results.islem_diff) {
    pushRow('Uyarı', 'İşlem Tipi Farkı', String(r['referans_no'] || ''), String(r['musteri_no'] || ''), String(r['islem_tipi_sistem'] || ''), String(r['islem_tipi_karsi'] || ''), 'Aynı referans için işlem tipi farklı.')
  }
  for (const r of results.dup_sistem) {
    pushRow('Bilgi', 'Mükerrer (Sistem)', String(r['referans_no'] || ''), String(r['musteri_no'] || ''), 'Mükerrer kayıt', '—', 'Sistem raporunda aynı referans no birden fazla kez.')
  }
  for (const r of results.dup_karsi) {
    pushRow('Bilgi', 'Mükerrer (Karşı Taraf)', String(r['referans_no'] || ''), String(r['musteri_no'] || ''), '—', 'Mükerrer kayıt', 'Karşı taraf raporunda aynı referans no birden fazla kez.')
  }
  for (const r of results.optional_diffs) {
    pushRow('Uyarı', String(r['kategori'] || 'Opsiyonel Alan Farkı'), String(r['referans_no'] || ''), String(r['musteri_no'] || ''), String(r['sistem_degeri'] || ''), String(r['karsi_taraf_degeri'] || ''), `${r['kategori'] || 'Alan'} — sistem ve karşı taraf değerleri farklı.`)
  }
  for (const r of results.past_date_issues) {
    pushRow('Uyarı', 'Geçmiş Tarihli İşlem', String(r['referans_no'] || ''), String(r['musteri_no'] || ''), String(r['tarih_sistem'] || ''), String(r['tarih_karsi'] || ''), 'İşlem tarihi seçili tarihten önce.')
  }

  return rows
}

export function enrichIssuesWithRisk(issues: IssueRow[]): IssueRow[] {
  if (!issues.length) return issues
  return issues.map((row) => {
    const kategori = row['Kategori']
    const onem = row['Önem']
    let skor = 0
    let seviye = ''
    let aksiyon = ''

    if (kategori === 'Sadece Sistemde' || kategori === 'Sadece Karşı Tarafta') {
      skor = 100
      seviye = 'Yüksek Risk'
      aksiyon = 'Karşı taraf / sistem kaynağı ile mutabakatı sağlayın. Eksik kayıt gönderimi veya alımı var.'
    } else if (kategori === 'Tutar Farkı') {
      skor = 90
      seviye = 'Yüksek Risk'
      aksiyon = 'Tutar farkı kritik. İlgili işlem evrakı ve onay zinciri incelenmeli.'
    } else if (kategori === 'Tarih Uyumsuzluğu') {
      skor = 60
      seviye = 'Orta Risk'
      aksiyon = 'Tarih farklılığı valör / işlem tarihi uyumsuzluğuna işaret edebilir.'
    } else if (kategori === 'Müşteri No Farkı') {
      skor = 70
      seviye = 'Orta Risk'
      aksiyon = 'Müşteri numarası farklılığı hesap eşleştirme hatası olabilir.'
    } else if (kategori === 'İşlem Tipi Farkı') {
      skor = 50
      seviye = 'Düşük Risk'
      aksiyon = 'İşlem tipi farklılığı kodlama veya sınıflandırma hatası olabilir.'
    } else if (kategori.startsWith('Mükerrer')) {
      skor = 40
      seviye = 'Düşük Risk'
      aksiyon = 'Mükerrer kayıtları temizleyin.'
    } else {
      skor = 30
      seviye = 'Düşük Risk'
      aksiyon = 'Alan farklılığını kontrol edin.'
    }

    if (onem === 'Kritik' && skor < 80) skor = 80
    if (onem === 'Bilgi' && skor > 50) skor = 50

    return {
      ...row,
      'Risk Skoru': skor,
      'Risk Seviyesi': seviye,
      'Önerilen Aksiyon': aksiyon,
    }
  })
}

export async function exportToExcel(
  results: ReconciliationResults,
  dfSistem: Record<string, any>[],
  dfKarsi: Record<string, any>[],
  issues?: IssueRow[]
): Promise<Blob> {
  const XLSX = await import('xlsx')
  const workbook = XLSX.utils.book_new()
  const _bos = 'Bu kategoride kayıt bulunmamaktadır.'

  const ozet = [
    ['Metrik', 'Değer'],
    ['Sistem Kayıt Sayısı', results.total_sistem],
    ['Karşı Taraf Kayıt Sayısı', results.total_karsi],
    ['Eşleşen Kayıt Sayısı', results.matched],
    ['Toplam Uyarı Sayısı', results.total_errors],
    ['Sadece Sistemde', results.only_sistem.length],
    ['Sadece Karşı Tarafta', results.only_karsi.length],
    ['Tutar Uyumsuzluğu', results.amount_diff.length],
    ['Tarih Uyumsuzluğu', results.date_diff.length],
    ['Müşteri No Farkı', results.musteri_diff.length],
    ['İşlem Tipi Farkı', results.islem_diff.length],
    ['Opsiyonel Alan Farkı', results.optional_diffs.length],
    ['Mükerrer Kayıt', results.dup_sistem.length + results.dup_karsi.length],
  ]
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(ozet), 'Özet')

  if (issues && issues.length) {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(issues), 'Fark Analizi')
  } else {
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Durum'], [_bos]]), 'Fark Analizi')
  }

  XLSX.utils.book_append_sheet(
    workbook,
    dfSistem.length ? XLSX.utils.json_to_sheet(dfSistem) : XLSX.utils.aoa_to_sheet([['Durum'], [_bos]]),
    'Sistem Raporu'
  )

  XLSX.utils.book_append_sheet(
    workbook,
    dfKarsi.length ? XLSX.utils.json_to_sheet(dfKarsi) : XLSX.utils.aoa_to_sheet([['Durum'], [_bos]]),
    'Karşı Taraf Raporu'
  )

  XLSX.utils.book_append_sheet(
    workbook,
    results.only_sistem.length ? XLSX.utils.json_to_sheet(results.only_sistem) : XLSX.utils.aoa_to_sheet([['Durum'], [_bos]]),
    'Sadece Sistemde'
  )

  XLSX.utils.book_append_sheet(
    workbook,
    results.only_karsi.length ? XLSX.utils.json_to_sheet(results.only_karsi) : XLSX.utils.aoa_to_sheet([['Durum'], [_bos]]),
    'Sadece Karşı Tarafta'
  )

  XLSX.utils.book_append_sheet(
    workbook,
    results.amount_diff.length ? XLSX.utils.json_to_sheet(results.amount_diff) : XLSX.utils.aoa_to_sheet([['Durum'], [_bos]]),
    'Tutar Uyumsuzlukları'
  )

  XLSX.utils.book_append_sheet(
    workbook,
    results.date_diff.length ? XLSX.utils.json_to_sheet(results.date_diff) : XLSX.utils.aoa_to_sheet([['Durum'], [_bos]]),
    'Tarih Uyumsuzlukları'
  )

  const alanFrames: Record<string, any>[] = []
  for (const r of results.musteri_diff) {
    alanFrames.push({
      referans_no: r['referans_no'],
      uyumsuzluk_alani: 'Müşteri No (musteri_no)',
      sistem_degeri: r['musteri_no_sistem'],
      karsi_taraf_degeri: r['musteri_no_karsi'],
      tutar: r['tutar'],
      islem_tarihi: r['islem_tarihi'],
    })
  }
  for (const r of results.islem_diff) {
    alanFrames.push({
      referans_no: r['referans_no'],
      uyumsuzluk_alani: 'İşlem Tipi (islem_tipi)',
      sistem_degeri: r['islem_tipi_sistem'],
      karsi_taraf_degeri: r['islem_tipi_karsi'],
      tutar: r['tutar'],
      islem_tarihi: r['islem_tarihi'],
    })
  }
  XLSX.utils.book_append_sheet(
    workbook,
    alanFrames.length ? XLSX.utils.json_to_sheet(alanFrames) : XLSX.utils.aoa_to_sheet([['Durum'], [_bos]]),
    'Alan Uyumsuzlukları'
  )

  XLSX.utils.book_append_sheet(
    workbook,
    results.optional_diffs.length ? XLSX.utils.json_to_sheet(results.optional_diffs) : XLSX.utils.aoa_to_sheet([['Durum'], [_bos]]),
    'Opsiyonel Alan Farkları'
  )

  const dupFrames = [...results.dup_sistem, ...results.dup_karsi]
  XLSX.utils.book_append_sheet(
    workbook,
    dupFrames.length ? XLSX.utils.json_to_sheet(dupFrames) : XLSX.utils.aoa_to_sheet([['Durum'], [_bos]]),
    'Mükerrer Kayıtlar'
  )

  const buf = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}
