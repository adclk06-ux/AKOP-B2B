export type ChangeType = 'Yeni Düzenleme' | 'Madde Değişikliği' | 'Yürürlük Değişikliği' | 'Kaldırıldı' | 'Ek Yükümlülük'
export type ImpactLevel = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'

export interface RegulationVersion {
  id: string
  regulationId: string
  authority: string
  title: string
  version: string
  publishedAt: string
  effectiveAt: string
  sourceUrl: string
  contentHash: string
  summary: string
  isDemo: boolean
}

export interface RegulationChange {
  id: string
  regulationId: string
  fromVersion: string
  toVersion: string
  changeType: ChangeType
  articleReference: string
  oldText: string
  newText: string
  impactLevel: ImpactLevel
  affectedOperations: string[]
  suggestedObligations: string[]
  detectedAt: string
  isDemo: boolean
}

export interface RegulatoryImpactChain {
  id: string
  regulationId: string
  changeId: string
  affectedObligations: string[]
  affectedTasks: string[]
  affectedCases: string[]
  affectedApprovals: string[]
  affectedEvidence: string[]
  summary: string
  riskLevel: ImpactLevel
}

const VERSIONS_KEY = 'akop_regintel_versions_v1'
const CHANGES_KEY = 'akop_regintel_changes_v1'
const CHAINS_KEY = 'akop_regintel_chains_v1'

function loadVersions(): RegulationVersion[] {
  try { const raw = localStorage.getItem(VERSIONS_KEY); return raw ? JSON.parse(raw) as RegulationVersion[] : [] } catch { return [] }
}
function saveVersions(v: RegulationVersion[]) { localStorage.setItem(VERSIONS_KEY, JSON.stringify(v)) }

function loadChanges(): RegulationChange[] {
  try { const raw = localStorage.getItem(CHANGES_KEY); return raw ? JSON.parse(raw) as RegulationChange[] : [] } catch { return [] }
}
function saveChanges(c: RegulationChange[]) { localStorage.setItem(CHANGES_KEY, JSON.stringify(c)) }

function loadChains(): RegulatoryImpactChain[] {
  try { const raw = localStorage.getItem(CHAINS_KEY); return raw ? JSON.parse(raw) as RegulatoryImpactChain[] : [] } catch { return [] }
}
function saveChains(c: RegulatoryImpactChain[]) { localStorage.setItem(CHAINS_KEY, JSON.stringify(c)) }

export function fetchRegulationVersions(): RegulationVersion[] {
  const v = loadVersions()
  if (v.length === 0) { const s = seedDemoVersions(); saveVersions(s); return s }
  return v
}

export function fetchRegulationChanges(): RegulationChange[] {
  const c = loadChanges()
  if (c.length === 0) { const s = seedDemoChanges(); saveChanges(s); return s }
  return c
}

export function fetchImpactChains(): RegulatoryImpactChain[] {
  const c = loadChains()
  if (c.length === 0) { const s = seedDemoChains(); saveChains(s); return s }
  return c
}

export function getRegIntelStats(changes: RegulationChange[], versions: RegulationVersion[]) {
  return {
    totalVersions: versions.length,
    totalChanges: changes.length,
    criticalChanges: changes.filter((c) => c.impactLevel === 'Kritik').length,
    highChanges: changes.filter((c) => c.impactLevel === 'Yüksek').length,
    suggestedObligations: changes.reduce((sum, c) => sum + c.suggestedObligations.length, 0),
    affectedTasks: changes.filter((c) => c.affectedOperations.length > 0).length,
    affectedCases: changes.filter((c) => c.impactLevel === 'Kritik' || c.impactLevel === 'Yüksek').length,
    thisMonthChanges: changes.filter((c) => {
      const d = new Date(c.detectedAt)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length,
  }
}

export function getChangeTypeBadgeClass(type: ChangeType) {
  switch (type) {
    case 'Yeni Düzenleme': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Madde Değişikliği': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Yürürlük Değişikliği': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Kaldırıldı': return 'bg-slate-100 text-slate-800 border-slate-200'
    case 'Ek Yükümlülük': return 'bg-violet-100 text-violet-800 border-violet-200'
    default: return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function getImpactBadgeClass(level: ImpactLevel) {
  switch (level) {
    case 'Düşük': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Orta': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Yüksek': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Kritik': return 'bg-rose-100 text-rose-800 border-rose-200'
    default: return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

function seedDemoVersions(): RegulationVersion[] {
  const baseDate = new Date().toISOString()
  return [
    {
      id: 'VER-001',
      regulationId: 'SPK-III-37.1',
      authority: 'SPK',
      title: 'Yatırım Kuruluşları Risk Değerlendirmesi',
      version: '2.1',
      publishedAt: baseDate,
      effectiveAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      sourceUrl: 'https://www.spk.gov.tr/duzenleme/III-37.1',
      contentHash: 'a1b2c3d4e5f6',
      summary: 'Risk yönetimi prosedürlerinde güncelleme. Operasyonel risk kategorileri genişletildi.',
      isDemo: true,
    },
    {
      id: 'VER-002',
      regulationId: 'BDDK-DISK-2025',
      authority: 'BDDK',
      title: 'Dijital Bankacılık Kredi Risk Yönetimi',
      version: '3.0',
      publishedAt: baseDate,
      effectiveAt: new Date(Date.now() + 60 * 86400000).toISOString(),
      sourceUrl: 'https://www.bddk.org.tr/disk',
      contentHash: 'b2c3d4e5f6g7',
      summary: 'Dijital kredi değerlendirme kriterleri yeniden düzenlendi. Kredi limiti hesaplama formülü güncellendi.',
      isDemo: true,
    },
    {
      id: 'VER-003',
      regulationId: 'MASAK-SU-2026',
      authority: 'MASAK',
      title: 'Şüpheli İşlem Bildirimi Prosedürü',
      version: '1.5',
      publishedAt: baseDate,
      effectiveAt: new Date(Date.now() + 15 * 86400000).toISOString(),
      sourceUrl: 'https://www.masak.gov.tr/su',
      contentHash: 'c3d4e5f6g7h8',
      summary: 'Şüpheli işlem tespit kriterleri genişletildi. Kripto varlık işlemleri eklendi.',
      isDemo: true,
    },
    {
      id: 'VER-004',
      regulationId: 'MKK-PAY-2026',
      authority: 'MKK',
      title: 'Pay Sahipleri Yapısı Raporlama',
      version: '1.2',
      publishedAt: baseDate,
      effectiveAt: new Date(Date.now() + 45 * 86400000).toISOString(),
      sourceUrl: 'https://www.mkk.com.tr/pay',
      contentHash: 'd4e5f6g7h8i9',
      summary: 'Pay sahipliği bildirim eşikleri düşürüldü. Raporlama sıklığı artırıldı.',
      isDemo: true,
    },
    {
      id: 'VER-005',
      regulationId: 'TAKASBANK-MARG-2026',
      authority: 'TAKASBANK',
      title: 'Marj Çağrısı Prosedürleri',
      version: '4.0',
      publishedAt: baseDate,
      effectiveAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      sourceUrl: 'https://www.takasbank.com.tr/marg',
      contentHash: 'e5f6g7h8i9j0',
      summary: 'Marj çağrısı T+0 sistemine geçiş. Otomatik uyarı eşikleri güncellendi.',
      isDemo: true,
    },
  ]
}

function seedDemoChanges(): RegulationChange[] {
  const baseDate = new Date().toISOString()
  return [
    {
      id: 'CHG-001',
      regulationId: 'SPK-III-37.1',
      fromVersion: '2.0',
      toVersion: '2.1',
      changeType: 'Madde Değişikliği',
      articleReference: 'Madde 5 - Operasyonel Risk',
      oldText: 'Operasyonel risk kategorileri: İnsan, süreç, sistem ve dış olaylar.',
      newText: 'Operasyonel risk kategorileri: İnsan, süreç, sistem, dış olaylar, siber güvenlik ve üçüncü taraf riskleri.',
      impactLevel: 'Yüksek',
      affectedOperations: ['Risk Yönetimi', 'Siber Güvenlik', 'Üçüncü Taraf Yönetimi'],
      suggestedObligations: ['Siber güvenlik risk değerlendirmesi güncellemesi', 'Üçüncü tarf sözleşmeleri revizyonu'],
      detectedAt: baseDate,
      isDemo: true,
    },
    {
      id: 'CHG-002',
      regulationId: 'BDDK-DISK-2025',
      fromVersion: '2.9',
      toVersion: '3.0',
      changeType: 'Yeni Düzenleme',
      articleReference: 'Madde 12 - Kredi Limiti',
      oldText: 'Kredi limiti hesaplaması: Gelir x 5 katı.',
      newText: 'Kredi limiti hesaplaması: Gelir x 3 katı + varlık teminatı. Varlık teminatı zorunlu hale getirildi.',
      impactLevel: 'Kritik',
      affectedOperations: ['Kredi Risk', 'İpotek Yönetimi', 'Müşteri Değerlendirme'],
      suggestedObligations: ['Kredi limiti hesaplama formülü güncellemesi', 'Varlık teminatı değerlendirme prosedürü oluşturma'],
      detectedAt: baseDate,
      isDemo: true,
    },
    {
      id: 'CHG-003',
      regulationId: 'MASAK-SU-2026',
      fromVersion: '1.4',
      toVersion: '1.5',
      changeType: 'Ek Yükümlülük',
      articleReference: 'Madde 8 - Kripto Varlıklar',
      oldText: 'Kripto varlık işlemleri raporlanması zorunlu değil.',
      newText: 'Kripto varlık işlemleri (10.000 TL ve üzeri) otomatik olarak MASAK\'a bildirilmelidir.',
      impactLevel: 'Kritik',
      affectedOperations: ['Şüpheli İşlem Bildirimi', 'Kripto Varlık Takibi', 'OTC Masası'],
      suggestedObligations: ['Kripto varlık işlem takip sistemi kurulumu', 'Otomatik MASAK bildirim entegrasyonu'],
      detectedAt: baseDate,
      isDemo: true,
    },
    {
      id: 'CHG-004',
      regulationId: 'MKK-PAY-2026',
      fromVersion: '1.1',
      toVersion: '1.2',
      changeType: 'Madde Değişikliği',
      articleReference: 'Madde 3 - Bildirim Eşiği',
      oldText: 'Pay sahipliği bildirim eşiği: %5.',
      newText: 'Pay sahipliği bildirim eşiği: %3. Ani hareketler (>%1) ayrıca raporlanacak.',
      impactLevel: 'Yüksek',
      affectedOperations: ['Pay Sahiplik Takibi', 'Raporlama', 'İç Denetim'],
      suggestedObligations: ['Bildirim eşiği güncellemesi', 'Ani hareket raporlama mekanizması'],
      detectedAt: baseDate,
      isDemo: true,
    },
    {
      id: 'CHG-005',
      regulationId: 'TAKASBANK-MARG-2026',
      fromVersion: '3.9',
      toVersion: '4.0',
      changeType: 'Yürürlük Değişikliği',
      articleReference: 'Madde 2 - Marj Çağrısı Süresi',
      oldText: 'Marj çağrısı T+1 gün içinde karşılanmalı.',
      newText: 'Marj çağrısı T+0 (aynı gün) karşılanmalı. Otomatik teminat çağrısı etkinleştirildi.',
      impactLevel: 'Kritik',
      affectedOperations: ['Marj Yönetimi', 'Teminat Takibi', 'Risk Kontrol'],
      suggestedObligations: ['T+0 marj çağrısı prosedürü güncellemesi', 'Otomatik teminat çağrısı sistemi testi'],
      detectedAt: baseDate,
      isDemo: true,
    },
    {
      id: 'CHG-006',
      regulationId: 'SPK-III-37.1',
      fromVersion: '2.1',
      toVersion: '2.2',
      changeType: 'Ek Yükümlülük',
      articleReference: 'Madde 9 - Raporlama',
      oldText: 'Risk raporları yıllık hazırlanır.',
      newText: 'Risk raporları aylık hazırlanmalı ve SPK portalına yüklenmelidir.',
      impactLevel: 'Orta',
      affectedOperations: ['Risk Raporlama', 'SPK Portalı'],
      suggestedObligations: ['Aylık risk raporu formatı hazırlama'],
      detectedAt: baseDate,
      isDemo: true,
    },
    {
      id: 'CHG-007',
      regulationId: 'BDDK-DISK-2025',
      fromVersion: '3.0',
      toVersion: '3.1',
      changeType: 'Madde Değişikliği',
      articleReference: 'Madde 15 - Veri İhlali',
      oldText: 'Veri ihlali 72 saat içinde bildirilmelidir.',
      newText: 'Veri ihlali 24 saat içinde KVKK ve BDDK\'ya eşzamanlı bildirilmelidir.',
      impactLevel: 'Yüksek',
      affectedOperations: ['Veri Güvenliği', 'KVKK Uyum', 'BDDK Bildirim'],
      suggestedObligations: ['Veri ihlali bildirim prosedürü güncellemesi', 'Eşzamanlı bildirim sistemi kurulumu'],
      detectedAt: baseDate,
      isDemo: true,
    },
  ]
}

function seedDemoChains(): RegulatoryImpactChain[] {
  return [
    {
      id: 'CHN-001',
      regulationId: 'SPK-III-37.1',
      changeId: 'CHG-001',
      affectedObligations: ['OBL-001'],
      affectedTasks: ['TASK-001'],
      affectedCases: ['CASE-001'],
      affectedApprovals: [],
      affectedEvidence: ['EVD-001'],
      summary: 'Operasyonel risk kategorileri genişletildi. Mevcut risk değerlendirme formu güncellenmeli.',
      riskLevel: 'Yüksek',
    },
    {
      id: 'CHN-002',
      regulationId: 'BDDK-DISK-2025',
      changeId: 'CHG-002',
      affectedObligations: ['OBL-002'],
      affectedTasks: ['TASK-002'],
      affectedCases: ['CASE-002'],
      affectedApprovals: ['APR-002'],
      affectedEvidence: ['EVD-002', 'EVD-006'],
      summary: 'Kredi limiti formülü değişti. Mevcut kredi portföyü yeniden değerlendirilmeli.',
      riskLevel: 'Kritik',
    },
    {
      id: 'CHN-003',
      regulationId: 'MASAK-SU-2026',
      changeId: 'CHG-003',
      affectedObligations: ['OBL-003'],
      affectedTasks: [],
      affectedCases: ['CASE-003'],
      affectedApprovals: [],
      affectedEvidence: ['EVD-003'],
      summary: 'Kripto varlık işlemleri raporlanmalı. Yeni takip sistemi kurulmalı.',
      riskLevel: 'Kritik',
    },
    {
      id: 'CHN-004',
      regulationId: 'MKK-PAY-2026',
      changeId: 'CHG-004',
      affectedObligations: ['OBL-004'],
      affectedTasks: ['TASK-004'],
      affectedCases: [],
      affectedApprovals: [],
      affectedEvidence: ['EVD-004'],
      summary: 'Pay sahipliği eşiği %3\'e düşürüldü. Mevcut pay yapıları yeniden kontrol edilmeli.',
      riskLevel: 'Yüksek',
    },
    {
      id: 'CHN-005',
      regulationId: 'TAKASBANK-MARG-2026',
      changeId: 'CHG-005',
      affectedObligations: ['OBL-005'],
      affectedTasks: [],
      affectedCases: ['CASE-005'],
      affectedApprovals: ['APR-005'],
      affectedEvidence: ['EVD-005'],
      summary: 'T+0 marj çağrısı geçişi. Operasyonel süreçler acil güncellenmeli.',
      riskLevel: 'Kritik',
    },
  ]
}
