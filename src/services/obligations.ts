export type ObligationAuthority = 'SPK' | 'BDDK' | 'MASAK' | 'MKK' | 'TAKASBANK'

export type ObligationRisk = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'

export type ObligationStatus =
  | 'Açık'
  | 'Devam Ediyor'
  | 'Kanıt Bekliyor'
  | 'Onay Bekliyor'
  | 'Tamamlandı'
  | 'Gecikti'

export interface ComplianceObligation {
  id: string
  title: string
  description: string
  sourceRegulationId: string
  sourceRegulationTitle: string
  authority: ObligationAuthority
  articleReference: string
  owner: string
  department: string
  riskLevel: ObligationRisk
  status: ObligationStatus
  dueDate: string
  completionRate: number
  relatedTasks: string[]
  relatedCases: string[]
  relatedApprovals: string[]
  evidenceCount: number
  createdAt: string
  updatedAt: string
  isDemo: boolean
}

const STORAGE_KEY = 'akop_obligations_v1'

function load(): ComplianceObligation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ComplianceObligation[]
  } catch {
    return []
  }
}

function save(items: ComplianceObligation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function fetchObligations(): ComplianceObligation[] {
  return load()
}

export function fetchObligationById(id: string): ComplianceObligation | undefined {
  return load().find((o) => o.id === id)
}

export function createObligation(payload: Omit<ComplianceObligation, 'id' | 'createdAt' | 'updatedAt' | 'isDemo'>): ComplianceObligation {
  const items = load()
  const now = new Date().toISOString()
  const newItem: ComplianceObligation = {
    ...payload,
    id: `obl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: now,
    updatedAt: now,
    isDemo: false,
  }
  items.unshift(newItem)
  save(items)
  return newItem
}

export function updateObligation(id: string, updates: Partial<ComplianceObligation>): ComplianceObligation | null {
  const items = load()
  const idx = items.findIndex((o) => o.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() }
  save(items)
  return items[idx]
}

export function completeObligation(id: string): ComplianceObligation | null {
  return updateObligation(id, { status: 'Tamamlandı', completionRate: 100 })
}

export function getObligationStats(obligations: ComplianceObligation[]) {
  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 86400000)
  const open = obligations.filter((o) => o.status !== 'Tamamlandı').length
  const critical = obligations.filter((o) => o.riskLevel === 'Kritik' && o.status !== 'Tamamlandı').length
  const upcoming = obligations.filter((o) => {
    if (o.status === 'Tamamlandı') return false
    const dd = new Date(o.dueDate)
    return dd >= now && dd <= thirtyDays
  }).length
  const overdue = obligations.filter((o) => {
    if (o.status === 'Tamamlandı') return false
    return new Date(o.dueDate) < now
  }).length
  const completed = obligations.filter((o) => o.status === 'Tamamlandı').length
  const completedThisMonth = obligations.filter((o) => {
    if (o.status !== 'Tamamlandı') return false
    const updated = new Date(o.updatedAt)
    return updated.getMonth() === now.getMonth() && updated.getFullYear() === now.getFullYear()
  }).length
  return { total: obligations.length, open, critical, upcoming, overdue, completed, completedThisMonth }
}

export function getObligationRiskBadgeClass(risk: ObligationRisk) {
  switch (risk) {
    case 'Kritik': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'Yüksek': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'Orta': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Düşük': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}

export function getObligationStatusBadgeClass(status: ObligationStatus) {
  switch (status) {
    case 'Açık': return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'Devam Ediyor': return 'bg-violet-50 text-violet-700 border-violet-200/60'
    case 'Kanıt Bekliyor': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Onay Bekliyor': return 'bg-sky-50 text-sky-700 border-sky-200/60'
    case 'Tamamlandı': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'Gecikti': return 'bg-rose-50 text-rose-700 border-rose-200/60'
  }
}

export function seedDemoObligations(): ComplianceObligation[] {
  const existing = load()
  if (existing.length > 0) return existing
  const now = new Date().toISOString()
  const lastMonth = new Date(Date.now() - 30 * 86400000).toISOString()
  const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString()
  const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString()
  const yesterday = new Date(Date.now() - 86400000).toISOString()

  const demos: ComplianceObligation[] = [
    {
      id: 'obl-001', title: 'Müşteri Risk Bildirim Formlarının Güncellenmesi', description: 'SPK düzenlemesi uyarınca müşteri risk bildirim formlarının yıllık revizyonunun yapılması gerekmektedir.', sourceRegulationId: 'spk-2026-038', sourceRegulationTitle: 'SPK Bülten 2026/38', authority: 'SPK', articleReference: 'Madde 7.2', owner: 'Ahmet Yılmaz', department: 'Uyum', riskLevel: 'Kritik', status: 'Devam Ediyor', dueDate: nextWeek, completionRate: 45, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 2, createdAt: lastMonth, updatedAt: now, isDemo: true,
    },
    {
      id: 'obl-002', title: 'İç Kontrol Prosedürlerinin Revizyonu', description: 'İç kontrol prosedürlerinin yıllık değerlendirmeye tabi tutulması ve gerekli güncellemelerin yapılması.', sourceRegulationId: 'spk-2026-041', sourceRegulationTitle: 'SPK İç Kontrol Tebliği', authority: 'SPK', articleReference: 'Madde 4.1', owner: 'Selin Kaya', department: 'Uyum', riskLevel: 'Yüksek', status: 'Açık', dueDate: nextMonth, completionRate: 10, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 0, createdAt: lastMonth, updatedAt: now, isDemo: true,
    },
    {
      id: 'obl-003', title: 'Kredi Limit İzleme Süreci Revizyonu', description: 'BDDK tarafından güncellenen kredi limit izleme sürecinin yürürlüğe konulması.', sourceRegulationId: 'bddk-2026-112', sourceRegulationTitle: 'BDDK Kredi Limit Yönetmeliği', authority: 'BDDK', articleReference: 'Madde 12.3', owner: 'Mehmet Demir', department: 'Risk', riskLevel: 'Kritik', status: 'Onay Bekliyor', dueDate: yesterday, completionRate: 80, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 3, createdAt: lastMonth, updatedAt: now, isDemo: true,
    },
    {
      id: 'obl-004', title: 'Operasyonel Risk Kontrol Güncellemesi', description: 'Operasyonel risk kontrol matrislerinin güncellenmesi ve raporlanması.', sourceRegulationId: 'bddk-2026-115', sourceRegulationTitle: 'BDDK Operasyonel Risk Tebliği', authority: 'BDDK', articleReference: 'Madde 5.2', owner: 'Can Özdemir', department: 'Operasyon', riskLevel: 'Orta', status: 'Kanıt Bekliyor', dueDate: nextWeek, completionRate: 65, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 1, createdAt: lastMonth, updatedAt: now, isDemo: true,
    },
    {
      id: 'obl-005', title: 'Şüpheli İşlem Bildirim Kontrolü', description: 'MASAK şüpheli işlem bildirim prosedürlerinin gözden geçirilmesi ve eksik bildirimlerin tamamlanması.', sourceRegulationId: 'masak-2026-08', sourceRegulationTitle: 'MASAK ŞİB Prosedürü', authority: 'MASAK', articleReference: 'Madde 3.1', owner: 'Ahmet Yılmaz', department: 'Uyum', riskLevel: 'Kritik', status: 'Gecikti', dueDate: yesterday, completionRate: 30, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 1, createdAt: lastMonth, updatedAt: now, isDemo: true,
    },
    {
      id: 'obl-006', title: 'Müşteri Tanıma Süreci Güncellemesi', description: 'KYC prosedürlerinin MASAK son düzenlemelerine uygun olarak güncellenmesi.', sourceRegulationId: 'masak-2026-10', sourceRegulationTitle: 'MASAK KYC Yönergesi', authority: 'MASAK', articleReference: 'Madde 2.4', owner: 'Zeynep Şahin', department: 'Operasyon', riskLevel: 'Yüksek', status: 'Devam Ediyor', dueDate: nextMonth, completionRate: 50, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 2, createdAt: lastMonth, updatedAt: now, isDemo: true,
    },
    {
      id: 'obl-007', title: 'Günlük Mutabakat Kontrolü', description: 'MKK günlük mutabakat işlemlerinin düzenli olarak kontrol edilmesi ve uyuşmazlıkların çözülmesi.', sourceRegulationId: 'mkk-mut-001', sourceRegulationTitle: 'MKK Mutabakat Prosedürü', authority: 'MKK', articleReference: 'Madde 1.1', owner: 'Can Özdemir', department: 'Operasyon', riskLevel: 'Yüksek', status: 'Açık', dueDate: nextWeek, completionRate: 0, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 0, createdAt: now, updatedAt: now, isDemo: true,
    },
    {
      id: 'obl-008', title: 'Saklama Hesap Kontrolü', description: 'Saklama hesaplarındaki bakiye ve işlem uyuşmazlıklarının haftalık kontrolü.', sourceRegulationId: 'mkk-sak-002', sourceRegulationTitle: 'MKK Saklama Kontrol Yönergesi', authority: 'MKK', articleReference: 'Madde 2.3', owner: 'Selin Kaya', department: 'Operasyon', riskLevel: 'Orta', status: 'Tamamlandı', dueDate: lastMonth, completionRate: 100, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 4, createdAt: lastMonth, updatedAt: now, isDemo: true,
    },
    {
      id: 'obl-009', title: 'Teminat Açığı İzleme Süreci', description: 'Takasbank teminat açığı uyarılarının izlenmesi ve gerekli aksiyonların alınması.', sourceRegulationId: 'tak-tem-001', sourceRegulationTitle: 'Takasbank Teminat Yönetimi', authority: 'TAKASBANK', articleReference: 'Madde 5.1', owner: 'Mehmet Demir', department: 'Risk', riskLevel: 'Kritik', status: 'Devam Ediyor', dueDate: nextWeek, completionRate: 60, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 2, createdAt: lastMonth, updatedAt: now, isDemo: true,
    },
    {
      id: 'obl-010', title: 'Settlement Gecikmesi Kontrolü', description: 'T+2 settlement süreçlerinde gecikme riskinin izlenmesi ve raporlanması.', sourceRegulationId: 'tak-set-002', sourceRegulationTitle: 'Takasbank Settlement Prosedürü', authority: 'TAKASBANK', articleReference: 'Madde 3.2', owner: 'Zeynep Şahin', department: 'Operasyon', riskLevel: 'Yüksek', status: 'Kanıt Bekliyor', dueDate: nextMonth, completionRate: 70, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 2, createdAt: lastMonth, updatedAt: now, isDemo: true,
    },
    {
      id: 'obl-011', title: 'BDDK Aylık Raporlama Kontrolü', description: 'Aylık istatistiki raporların BDDK sistemine zamanında iletilmesinin sağlanması.', sourceRegulationId: 'bddk-2026-120', sourceRegulationTitle: 'BDDK Raporlama Yönetmeliği', authority: 'BDDK', articleReference: 'Madde 8.1', owner: 'Can Özdemir', department: 'Operasyon', riskLevel: 'Orta', status: 'Açık', dueDate: nextMonth, completionRate: 20, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 0, createdAt: now, updatedAt: now, isDemo: true,
    },
    {
      id: 'obl-012', title: 'SPK Yıllık Faaliyet Raporu Hazırlığı', description: 'SPK yıllık faaliyet raporunun hazırlanması ve yönetici onayına sunulması.', sourceRegulationId: 'spk-2026-050', sourceRegulationTitle: 'SPK Faaliyet Raporu Tebliği', authority: 'SPK', articleReference: 'Madde 1.1', owner: 'Selin Kaya', department: 'Uyum', riskLevel: 'Düşük', status: 'Devam Ediyor', dueDate: nextMonth, completionRate: 40, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 1, createdAt: lastMonth, updatedAt: now, isDemo: true,
    },
  ]

  save(demos)
  return demos
}
