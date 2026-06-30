export type EvidenceClassification = 'Public' | 'Internal' | 'Confidential' | 'Restricted'

export type EvidenceStatus = 'Aktif' | 'İncelemede' | 'Onay Bekliyor' | 'Arşivlendi'

export type EvidenceLinkedEntityType =
  | 'obligation'
  | 'task'
  | 'case'
  | 'approval'
  | 'reconciliation'
  | 'takasbank'
  | 'regulation'
  | 'control'
  | 'test'
  | 'finding'

export interface EvidenceDocument {
  id: string
  title: string
  description: string
  fileName: string
  fileType: string
  fileSize: string
  classification: EvidenceClassification
  linkedEntityType: EvidenceLinkedEntityType
  linkedEntityId: string
  linkedEntityTitle: string
  uploadedBy: string
  uploadedAt: string
  version: number
  hash: string
  status: EvidenceStatus
  isDemo: boolean
}

const STORAGE_KEY = 'akop_evidence_documents_v1'

function generateHash(): string {
  const chars = 'abcdef0123456789'
  let hash = ''
  for (let i = 0; i < 32; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)]
  }
  return hash
}

function loadDocuments(): EvidenceDocument[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as EvidenceDocument[]
  } catch {
    return []
  }
}

function saveDocuments(docs: EvidenceDocument[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
}

export function fetchEvidenceDocuments(): EvidenceDocument[] {
  const docs = loadDocuments()
  if (docs.length === 0) {
    const seeded = seedDemoEvidence()
    saveDocuments(seeded)
    return seeded
  }
  return docs
}

export function createEvidenceDocument(
  payload: Omit<EvidenceDocument, 'id' | 'uploadedAt' | 'version' | 'hash' | 'isDemo'>
): EvidenceDocument {
  const docs = loadDocuments()
  const now = new Date().toISOString()
  const newDoc: EvidenceDocument = {
    ...payload,
    id: `EVD-${Date.now()}`,
    uploadedAt: now,
    version: 1,
    hash: generateHash(),
    isDemo: false,
  }
  saveDocuments([newDoc, ...docs])
  return newDoc
}

export function updateEvidenceDocument(
  id: string,
  updates: Partial<Omit<EvidenceDocument, 'id' | 'uploadedAt'>>
): EvidenceDocument | null {
  const docs = loadDocuments()
  const index = docs.findIndex((d) => d.id === id)
  if (index === -1) return null
  const updated: EvidenceDocument = { ...docs[index], ...updates }
  if (updates.version !== undefined) {
    updated.hash = generateHash()
  }
  docs[index] = updated
  saveDocuments(docs)
  return updated
}

export function archiveEvidenceDocument(id: string): EvidenceDocument | null {
  const docs = loadDocuments()
  const index = docs.findIndex((d) => d.id === id)
  if (index === -1) return null
  docs[index] = { ...docs[index], status: 'Arşivlendi' as EvidenceStatus }
  saveDocuments(docs)
  return docs[index]
}

export function getEvidenceStats(docs: EvidenceDocument[]) {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000)
  return {
    total: docs.length,
    restricted: docs.filter((d) => d.classification === 'Restricted').length,
    pendingApproval: docs.filter((d) => d.status === 'Onay Bekliyor').length,
    addedThisMonth: docs.filter((d) => new Date(d.uploadedAt) >= thirtyDaysAgo).length,
    archived: docs.filter((d) => d.status === 'Arşivlendi').length,
  }
}

export function getMissingEvidenceObligations(
  obligations: { id: string; title: string; evidenceCount: number }[]
): { id: string; title: string }[] {
  return obligations.filter((o) => o.evidenceCount === 0).map((o) => ({ id: o.id, title: o.title }))
}

export function getClassificationBadgeClass(cls: EvidenceClassification) {
  switch (cls) {
    case 'Public':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'Internal':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'Confidential':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Restricted':
      return 'bg-rose-100 text-rose-800 border-rose-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function getEvidenceStatusBadgeClass(status: EvidenceStatus) {
  switch (status) {
    case 'Aktif':
      return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'İncelemede':
      return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'Onay Bekliyor':
      return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'Arşivlendi':
      return 'bg-slate-100 text-slate-800 border-slate-200'
    default:
      return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

function seedDemoEvidence(): EvidenceDocument[] {
  const baseDate = new Date().toISOString()
  return [
    {
      id: 'EVD-001',
      title: 'SPK III-37.1 Risk Değerlendirme Formu',
      description: 'Yatırım kuruluşları için yükümlülük uyum risk değerlendirmesi.',
      fileName: 'SPK_Risk_Degerlendirme_v2.pdf',
      fileType: 'PDF',
      fileSize: '1.2 MB',
      classification: 'Confidential',
      linkedEntityType: 'obligation',
      linkedEntityId: 'OBL-001',
      linkedEntityTitle: 'SPK III-37.1 Yatırım Kuruluşları Risk Değerlendirmesi',
      uploadedBy: 'Ahmet Yılmaz',
      uploadedAt: baseDate,
      version: 2,
      hash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
      status: 'Aktif',
      isDemo: true,
    },
    {
      id: 'EVD-002',
      title: 'BDDK DİSK Kredi Risk Kontrol Listesi',
      description: 'Dijital bankacılık kredi risk yönetimi kontrol listesi.',
      fileName: 'BDDK_Kredi_Kontrol_Listesi.xlsx',
      fileType: 'Excel',
      fileSize: '340 KB',
      classification: 'Internal',
      linkedEntityType: 'obligation',
      linkedEntityId: 'OBL-002',
      linkedEntityTitle: 'BDDK DİSK Kredi Risk Yönetimi',
      uploadedBy: 'Selin Kaya',
      uploadedAt: baseDate,
      version: 1,
      hash: 'b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7',
      status: 'Aktif',
      isDemo: true,
    },
    {
      id: 'EVD-003',
      title: 'MASAK Şüpheli İşlem Raporu Q1',
      description: '2026 Q1 şüpheli işlem raporu ve analizi.',
      fileName: 'MASAK_Supheli_Islem_Q1_2026.pdf',
      fileType: 'PDF',
      fileSize: '2.8 MB',
      classification: 'Restricted',
      linkedEntityType: 'obligation',
      linkedEntityId: 'OBL-003',
      linkedEntityTitle: 'MASAK Şüpheli İşlem Bildirimi',
      uploadedBy: 'Mehmet Demir',
      uploadedAt: baseDate,
      version: 1,
      hash: 'c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8',
      status: 'Onay Bekliyor',
      isDemo: true,
    },
    {
      id: 'EVD-004',
      title: 'MKK Pay Sahipleri Yapısı Raporu',
      description: 'Pay sahiplerinin yapısı ve pay oranları raporu.',
      fileName: 'MKK_Pay_Sahipleri_2026.pdf',
      fileType: 'PDF',
      fileSize: '890 KB',
      classification: 'Public',
      linkedEntityType: 'obligation',
      linkedEntityId: 'OBL-004',
      linkedEntityTitle: 'MKK Pay Sahipleri Yapısı Raporu',
      uploadedBy: 'Zeynep Arslan',
      uploadedAt: baseDate,
      version: 1,
      hash: 'd4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9',
      status: 'Aktif',
      isDemo: true,
    },
    {
      id: 'EVD-005',
      title: 'Takasbank Gün Sonu Mutabakat Kontrolü',
      description: 'Gün sonu Takasbank mutabakat kontrol belgesi.',
      fileName: 'Takasbank_Gun_Sonu_Kontrol.docx',
      fileType: 'Word',
      fileSize: '520 KB',
      classification: 'Internal',
      linkedEntityType: 'obligation',
      linkedEntityId: 'OBL-005',
      linkedEntityTitle: 'Takasbank Gün Sonu Mutabakat Kontrolü',
      uploadedBy: 'Can Özdemir',
      uploadedAt: baseDate,
      version: 1,
      hash: 'e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0',
      status: 'Aktif',
      isDemo: true,
    },
    {
      id: 'EVD-006',
      title: 'BDDK DİSK Veri İhlali Müdahale Planı',
      description: 'Veri ihlali durumunda uygulanacak müdahale planı ve süreç akış şeması.',
      fileName: 'BDDK_Veri_Ihlali_Plani_v3.pdf',
      fileType: 'PDF',
      fileSize: '1.5 MB',
      classification: 'Restricted',
      linkedEntityType: 'obligation',
      linkedEntityId: 'OBL-006',
      linkedEntityTitle: 'BDDK DİSK Veri İhlali Müdahale Planı',
      uploadedBy: 'Ayşe Korkmaz',
      uploadedAt: baseDate,
      version: 3,
      hash: 'f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1',
      status: 'İncelemede',
      isDemo: true,
    },
    {
      id: 'EVD-007',
      title: 'Case Yönetim Ekranları Çıktıları',
      description: 'Case merkezi yönetim ekranları ekran görüntüleri.',
      fileName: 'Case_Merkezi_Ekranlari.zip',
      fileType: 'ZIP',
      fileSize: '4.2 MB',
      classification: 'Internal',
      linkedEntityType: 'case',
      linkedEntityId: 'CASE-001',
      linkedEntityTitle: 'SPK III-37.1 Uyum Gap Analizi',
      uploadedBy: 'Ahmet Yılmaz',
      uploadedAt: baseDate,
      version: 1,
      hash: 'g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2',
      status: 'Aktif',
      isDemo: true,
    },
    {
      id: 'EVD-008',
      title: 'Onay Akışı Dökümanı',
      description: 'Yükümlülük onay süreci detaylı dökümanı.',
      fileName: 'Onay_Akisi_Dokumani.pdf',
      fileType: 'PDF',
      fileSize: '750 KB',
      classification: 'Confidential',
      linkedEntityType: 'approval',
      linkedEntityId: 'APR-001',
      linkedEntityTitle: 'Yükümlülük Onayı — SPK III-37.1',
      uploadedBy: 'Selin Kaya',
      uploadedAt: baseDate,
      version: 1,
      hash: 'h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3',
      status: 'Onay Bekliyor',
      isDemo: true,
    },
    {
      id: 'EVD-009',
      title: 'MKK Mutabakat Fark Raporu',
      description: 'Mutabakat farklarının detaylı analiz raporu.',
      fileName: 'MKK_Fark_Raporu_Q1.xlsx',
      fileType: 'Excel',
      fileSize: '1.1 MB',
      classification: 'Internal',
      linkedEntityType: 'reconciliation',
      linkedEntityId: 'REC-001',
      linkedEntityTitle: 'MKK Mutabakat 2026-03-15',
      uploadedBy: 'Mehmet Demir',
      uploadedAt: baseDate,
      version: 1,
      hash: 'i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4',
      status: 'Aktif',
      isDemo: true,
    },
    {
      id: 'EVD-010',
      title: 'Takasbank Uyarı Yanıt Dökümanı',
      description: 'Takasbank marj çağrısı yanıt dökümanı.',
      fileName: 'Takasbank_Yanit_Dokumani.pdf',
      fileType: 'PDF',
      fileSize: '680 KB',
      classification: 'Confidential',
      linkedEntityType: 'takasbank',
      linkedEntityId: 'TAK-001',
      linkedEntityTitle: 'Takasbank Margin Call ALERT-2026-089',
      uploadedBy: 'Can Özdemir',
      uploadedAt: baseDate,
      version: 1,
      hash: 'j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5',
      status: 'Arşivlendi',
      isDemo: true,
    },
    {
      id: 'EVD-011',
      title: 'Yönetici Onay Formu',
      description: 'SPK yükümlülüğü için yönetici onay formu.',
      fileName: 'Yonetici_Onay_Formu.pdf',
      fileType: 'PDF',
      fileSize: '420 KB',
      classification: 'Restricted',
      linkedEntityType: 'obligation',
      linkedEntityId: 'OBL-007',
      linkedEntityTitle: 'SPK III-37.1 Yatırım Kuruluşları Risk Değerlendirmesi',
      uploadedBy: 'Ahmet Yılmaz',
      uploadedAt: baseDate,
      version: 1,
      hash: 'k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6',
      status: 'Onay Bekliyor',
      isDemo: true,
    },
    {
      id: 'EVD-012',
      title: 'BDDK İç Denetim Raporu',
      description: '2026 yılı iç denetim raporu ve bulguları.',
      fileName: 'BDDK_Ic_Denetim_Raporu_2026.pdf',
      fileType: 'PDF',
      fileSize: '3.5 MB',
      classification: 'Restricted',
      linkedEntityType: 'regulation',
      linkedEntityId: 'REG-001',
      linkedEntityTitle: 'BDDK DİSK Yönetmeliği',
      uploadedBy: 'Ayşe Korkmaz',
      uploadedAt: baseDate,
      version: 1,
      hash: 'l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7',
      status: 'Aktif',
      isDemo: true,
    },
  ]
}

export function getDemoEvidence(): EvidenceDocument[] {
  return seedDemoEvidence()
}
