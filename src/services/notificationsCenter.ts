export type NotificationType = 'SLA' | 'APPROVAL' | 'WORKFLOW' | 'CASE' | 'OBLIGATION' | 'EVIDENCE' | 'REGINTEL' | 'SECURITY' | 'MKK' | 'TAKASBANK' | 'SYSTEM' | 'DATA_SOURCE' | 'SYNC' | 'NEW_REGULATION' | 'SYNC_FAILURE' | 'RISK_ENGINE' | 'POLICY' | 'CONTROL' | 'TEST' | 'FINDING'
export type NotificationSeverity = 'info' | 'warning' | 'critical'
export type NotificationStatus = 'unread' | 'read' | 'archived'

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: NotificationType
  severity: NotificationSeverity
  status: NotificationStatus
  targetTab: string
  targetEntityType: string
  targetEntityId: string
  targetEntityTitle: string
  createdAt: string
  dueAt?: string
  assignedTo?: string
  roleVisibility: string[]
  actionLabel: string
  isDemo: boolean
}

const NOTIFICATIONS_KEY = 'akop_notifications_v1'

function load(): NotificationItem[] {
  try { const raw = localStorage.getItem(NOTIFICATIONS_KEY); return raw ? JSON.parse(raw) as NotificationItem[] : [] } catch { return [] }
}
function save(items: NotificationItem[]) { localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items)) }

function generateId() { return `NOT-${Date.now()}-${Math.floor(Math.random() * 1000)}` }

export function fetchNotifications(): NotificationItem[] {
  return load()
}

export function getNotificationStats(items: NotificationItem[]) {
  return {
    total: items.length,
    unread: items.filter((i) => i.status === 'unread').length,
    critical: items.filter((i) => i.severity === 'critical' && i.status !== 'archived').length,
    sla: items.filter((i) => i.type === 'SLA' && i.status !== 'archived').length,
    approval: items.filter((i) => i.type === 'APPROVAL' && i.status !== 'archived').length,
    today: items.filter((i) => {
      const d = new Date(i.createdAt)
      const now = new Date()
      return d.toDateString() === now.toDateString()
    }).length,
  }
}

export function getSeverityBadgeClass(severity: NotificationSeverity) {
  switch (severity) {
    case 'critical': return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'warning': return 'bg-amber-100 text-amber-800 border-amber-200'
    case 'info': return 'bg-blue-100 text-blue-800 border-blue-200'
    default: return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function getNotificationTypeBadgeClass(type: NotificationType) {
  switch (type) {
    case 'SLA': return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'APPROVAL': return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'WORKFLOW': return 'bg-violet-100 text-violet-800 border-violet-200'
    case 'CASE': return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'OBLIGATION': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'EVIDENCE': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'REGINTEL': return 'bg-purple-100 text-purple-800 border-purple-200'
    case 'SECURITY': return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'MKK': return 'bg-teal-100 text-teal-800 border-teal-200'
    case 'TAKASBANK': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
    case 'SYSTEM': return 'bg-slate-100 text-slate-800 border-slate-200'
    case 'DATA_SOURCE': return 'bg-cyan-100 text-cyan-800 border-cyan-200'
    case 'SYNC': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'NEW_REGULATION': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    case 'SYNC_FAILURE': return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'RISK_ENGINE': return 'bg-rose-100 text-rose-800 border-rose-200'
    case 'POLICY': return 'bg-sky-100 text-sky-800 border-sky-200'
    case 'CONTROL': return 'bg-indigo-100 text-indigo-800 border-indigo-200'
    case 'TEST': return 'bg-violet-100 text-violet-800 border-violet-200'
    case 'FINDING': return 'bg-rose-100 text-rose-800 border-rose-200'
    default: return 'bg-slate-100 text-slate-800 border-slate-200'
  }
}

export function markNotificationRead(id: string): NotificationItem | null {
  const items = load()
  const idx = items.findIndex((i) => i.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], status: 'read' }
  save(items)
  return items[idx]
}

export function markAllNotificationsRead(): void {
  const items = load().map((i) => i.status === 'unread' ? { ...i, status: 'read' as NotificationStatus } : i)
  save(items)
}

export function archiveNotification(id: string): NotificationItem | null {
  const items = load()
  const idx = items.findIndex((i) => i.id === id)
  if (idx === -1) return null
  items[idx] = { ...items[idx], status: 'archived' }
  save(items)
  return items[idx]
}

export function deleteNotification(id: string): boolean {
  const items = load().filter((i) => i.id !== id)
  save(items)
  return true
}

export interface NotificationContext {
  tasks: { id: string; title: string; status: string; riskLevel: string; dueDate?: string; assignedTo?: string }[]
  approvals: { id: string; sourceTitle: string; status: string; priority: string; slaDeadline?: string; assignedApprover?: string; currentStageName?: string }[]
  workflows: { id: string; name: string; status: string }[]
  cases: { id: string; title: string; status: string; riskLevel: string; priority: string }[]
  obligations: { id: string; title: string; status: string; riskLevel: string; dueDate: string; owner?: string; evidenceCount: number }[]
  evidenceDocs: { id: string; title: string; status: string; classification: string }[]
  regChanges: { id: string; articleReference: string; impactLevel: string; changeType: string }[]
  reconciliationRecords: { id: string; type: string; status: string; riskLevel: string }[]
  takasbankAlerts: { id: string; alertType: string; status: string; riskLevel: string }[]
  loginRecords: { id: string; status: string }[]
  riskScores: { id: string; entityType: string; entityTitle: string; score: number; trend?: string; responsible?: string }[]
  policies: { id: string; title: string; status: string; riskLevel: string; nextReviewDate?: string }[]
  controls: { id: string; title: string; controlType: string; riskLevel: string; active: boolean }[]
  tests: { id: string; controlId: string; controlTitle: string; result: string; score: number; findingsCount: number }[]
  findings: { id: string; title: string; severity: string; status: string; dueDate?: string }[]
}

export function generateSystemNotifications(context: NotificationContext): NotificationItem[] {
  const existing = load()
  const existingKeys = new Set(existing.map((n) => `${n.targetEntityType}:${n.targetEntityId}:${n.type}`))
  const newItems: NotificationItem[] = []

  const now = new Date()
  const oneDay = 86400000

  const addIfNew = (item: Omit<NotificationItem, 'id' | 'createdAt'>) => {
    const key = `${item.targetEntityType}:${item.targetEntityId}:${item.type}`
    if (!existingKeys.has(key)) {
      existingKeys.add(key)
      newItems.push({ ...item, id: generateId(), createdAt: now.toISOString() } as NotificationItem)
    }
  }

  // A) Workflow SLA aşımı
  context.workflows.forEach((w) => {
    if (w.status === 'active') {
      addIfNew({
        title: 'Workflow SLA Uyarısı',
        message: `Workflow "${w.name}" aktif durumda. SLA kontrolü yapılmalı.`,
        type: 'WORKFLOW',
        severity: 'warning',
        status: 'unread',
        targetTab: 'approval',
        targetEntityType: 'workflow',
        targetEntityId: w.id,
        targetEntityTitle: w.name,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici'],
        actionLabel: 'Workflow\'a Git',
        isDemo: false,
      })
    }
  })

  // B) Approval pending + SLA yakınsa
  context.approvals.forEach((a) => {
    if (a.status === 'Beklemede') {
      const isNearSLA = a.slaDeadline ? (new Date(a.slaDeadline).getTime() - now.getTime()) < oneDay : false
      addIfNew({
        title: `Onay Bekliyor: ${a.sourceTitle}`,
        message: isNearSLA
          ? `Onay talebi "${a.sourceTitle}" SLA bitişine yaklaşıyor (${a.currentStageName || 'Aşama'}).`
          : `Onay talebi "${a.sourceTitle}" bekliyor (${a.currentStageName || 'Aşama'}).`,
        type: 'APPROVAL',
        severity: isNearSLA ? 'critical' : 'warning',
        status: 'unread',
        targetTab: 'approval',
        targetEntityType: 'approval',
        targetEntityId: a.id,
        targetEntityTitle: a.sourceTitle,
        dueAt: a.slaDeadline,
        assignedTo: a.assignedApprover,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi', 'Operasyon Uzmanı'],
        actionLabel: 'Onaya Git',
        isDemo: false,
      })
    }
  })

  // C) Obligation dueDate < 7 gün
  context.obligations.forEach((o) => {
    if (o.status !== 'Tamamlandı') {
      const daysLeft = Math.ceil((new Date(o.dueDate).getTime() - now.getTime()) / oneDay)
      if (daysLeft <= 7 && daysLeft > 0) {
        addIfNew({
          title: 'Yükümlülük Termin Yaklaşıyor',
          message: `"${o.title}" yükümlülüğünün termini ${daysLeft} gün içinde doluyor.`,
          type: 'OBLIGATION',
          severity: daysLeft <= 3 ? 'critical' : 'warning',
          status: 'unread',
          targetTab: 'obligations',
          targetEntityType: 'obligation',
          targetEntityId: o.id,
          targetEntityTitle: o.title,
          dueAt: o.dueDate,
          assignedTo: o.owner,
          roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
          actionLabel: 'Yükümlülüğe Git',
          isDemo: false,
        })
      }
      // D) Obligation overdue
      if (daysLeft < 0) {
        addIfNew({
          title: 'Yükümlülük Gecikti',
          message: `"${o.title}" yükümlülüğü gecikti. Acil aksiyon alınmalı.`,
          type: 'OBLIGATION',
          severity: 'critical',
          status: 'unread',
          targetTab: 'obligations',
          targetEntityType: 'obligation',
          targetEntityId: o.id,
          targetEntityTitle: o.title,
          dueAt: o.dueDate,
          assignedTo: o.owner,
          roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
          actionLabel: 'Yükümlülüğe Git',
          isDemo: false,
        })
      }
    }
  })

  // E) Evidence approval pending
  context.evidenceDocs.forEach((e) => {
    if (e.status === 'Onay Bekliyor') {
      addIfNew({
        title: 'Kanıt Onayı Bekliyor',
        message: `"${e.title}" dokümanı onay bekliyor.`,
        type: 'EVIDENCE',
        severity: 'warning',
        status: 'unread',
        targetTab: 'evidence',
        targetEntityType: 'evidence',
        targetEntityId: e.id,
        targetEntityTitle: e.title,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
        actionLabel: 'Kanıta Git',
        isDemo: false,
      })
    }
  })

  // F) RegIntel critical change
  context.regChanges.forEach((c) => {
    if (c.impactLevel === 'Kritik') {
      addIfNew({
        title: 'Kritik Mevzuat Değişikliği',
        message: `"${c.articleReference}" kritik değişiklik tespit edildi (${c.changeType}).`,
        type: 'REGINTEL',
        severity: 'critical',
        status: 'unread',
        targetTab: 'regintel',
        targetEntityType: 'regintel',
        targetEntityId: c.id,
        targetEntityTitle: c.articleReference,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
        actionLabel: 'Değişikliğe Git',
        isDemo: false,
      })
    }
  })

  // G) MKK critical reconciliation
  context.reconciliationRecords.forEach((r) => {
    if (r.riskLevel === 'Kritik') {
      addIfNew({
        title: 'Kritik MKK Mutabakat Uyuşmazlığı',
        message: `"${r.type}" mutabakatında kritik uyuşmazlık tespit edildi.`,
        type: 'MKK',
        severity: 'critical',
        status: 'unread',
        targetTab: 'reconciliation',
        targetEntityType: 'reconciliation',
        targetEntityId: r.id,
        targetEntityTitle: r.type,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi', 'Operasyon Uzmanı'],
        actionLabel: 'Mutabakata Git',
        isDemo: false,
      })
    }
  })

  // H) Takasbank critical alert
  context.takasbankAlerts.forEach((a) => {
    if (a.riskLevel === 'Kritik' && a.status === 'Açık') {
      addIfNew({
        title: 'Kritik Takasbank Uyarısı',
        message: `"${a.alertType}" kritik uyarısı aktif.`,
        type: 'TAKASBANK',
        severity: 'critical',
        status: 'unread',
        targetTab: 'takasbank',
        targetEntityType: 'takasbank',
        targetEntityId: a.id,
        targetEntityTitle: a.alertType,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi', 'Operasyon Uzmanı'],
        actionLabel: 'Uyarıya Git',
        isDemo: false,
      })
    }
  })

  // I) Failed login / security
  const failedLogins = context.loginRecords.filter((l) => l.status === 'Başarısız')
  if (failedLogins.length > 0) {
    addIfNew({
      title: 'Başarısız Giriş Denemeleri',
      message: `${failedLogins.length} başarısız giriş denemesi tespit edildi.`,
      type: 'SECURITY',
      severity: failedLogins.length > 5 ? 'critical' : 'warning',
      status: 'unread',
      targetTab: 'security',
      targetEntityType: 'security',
      targetEntityId: 'failed-logins',
      targetEntityTitle: 'Başarısız Giriş',
      roleVisibility: ['Admin', 'Yönetici', 'Denetçi'],
      actionLabel: 'Security Center\'a Git',
      isDemo: false,
    })
  }

  // J) Case critical open
  context.cases.forEach((c) => {
    if (c.status === 'Açık' && c.riskLevel === 'Kritik') {
      addIfNew({
        title: 'Kritik Case Açık',
        message: `"${c.title}" kritik risk seviyesinde açık vaka.`,
        type: 'CASE',
        severity: 'warning',
        status: 'unread',
        targetTab: 'casecenter',
        targetEntityType: 'case',
        targetEntityId: c.id,
        targetEntityTitle: c.title,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi', 'Operasyon Uzmanı'],
        actionLabel: 'Case\'e Git',
        isDemo: false,
      })
    }
  })

  // K) Risk Engine critical/high risks
  context.riskScores.forEach((r) => {
    const level = r.score > 75 ? 'Kritik' : r.score > 50 ? 'Yüksek' : 'Orta'
    if (r.score > 50) {
      addIfNew({
        title: `${level} Risk: ${r.entityTitle}`,
        message: `${r.entityTitle} (${r.entityType}) risk skoru ${r.score}. Trend: ${r.trend === 'up' ? 'Artıyor' : r.trend === 'down' ? 'Azalıyor' : 'Sabit'}.`,
        type: 'RISK_ENGINE',
        severity: r.score > 75 ? 'critical' : 'warning',
        status: 'unread',
        targetTab: 'riskcenter',
        targetEntityType: 'riskengine',
        targetEntityId: r.id,
        targetEntityTitle: r.entityTitle,
        assignedTo: r.responsible,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
        actionLabel: 'Risk Merkezi\'ne Git',
        isDemo: false,
      })
    }
  })

  // L) Control / Test / Finding notifications
  context.tests.forEach((t) => {
    if (t.result === 'Failed') {
      addIfNew({
        title: `Test Başarısız: ${t.controlTitle}`,
        message: `"${t.controlTitle}" kontrol testi başarısız oldu (Skor: ${t.score}).`,
        type: 'TEST',
        severity: 'critical',
        status: 'unread',
        targetTab: 'controls',
        targetEntityType: 'test',
        targetEntityId: t.id,
        targetEntityTitle: t.controlTitle,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
        actionLabel: 'Kontrol Merkezi\'ne Git',
        isDemo: false,
      })
    }
    if (t.result === 'Partial') {
      addIfNew({
        title: `Test Kısmen Başarılı: ${t.controlTitle}`,
        message: `"${t.controlTitle}" kontrol testi kısmen başarılı (Skor: ${t.score}).`,
        type: 'TEST',
        severity: 'warning',
        status: 'unread',
        targetTab: 'controls',
        targetEntityType: 'test',
        targetEntityId: t.id,
        targetEntityTitle: t.controlTitle,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
        actionLabel: 'Kontrol Merkezi\'ne Git',
        isDemo: false,
      })
    }
  })

  context.findings.forEach((f) => {
    if (f.severity === 'Critical' && f.status !== 'Closed' && f.status !== 'Mitigated') {
      addIfNew({
        title: `Kritik Bulgu: ${f.title}`,
        message: `"${f.title}" bulgusu kritik seviyede ve açık.`,
        type: 'FINDING',
        severity: 'critical',
        status: 'unread',
        targetTab: 'controls',
        targetEntityType: 'finding',
        targetEntityId: f.id,
        targetEntityTitle: f.title,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
        actionLabel: 'Kontrol Merkezi\'ne Git',
        isDemo: false,
      })
    }
    if (f.status === 'Open' && f.dueDate) {
      const daysLeft = Math.ceil((new Date(f.dueDate).getTime() - now.getTime()) / oneDay)
      if (daysLeft <= 7 && daysLeft > 0) {
        addIfNew({
          title: `Bulgu SLA Yaklaşıyor: ${f.title}`,
          message: `"${f.title}" bulgusu kapanış tarihine ${daysLeft} gün kaldı.`,
          type: 'FINDING',
          severity: daysLeft <= 3 ? 'critical' : 'warning',
          status: 'unread',
          targetTab: 'controls',
          targetEntityType: 'finding',
          targetEntityId: f.id,
          targetEntityTitle: f.title,
          roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
          actionLabel: 'Kontrol Merkezi\'ne Git',
          isDemo: false,
        })
      }
      if (daysLeft <= 0) {
        addIfNew({
          title: `Bulgu SLA Aşıldı: ${f.title}`,
          message: `"${f.title}" bulgusu kapanış tarihi aşıldı.`,
          type: 'FINDING',
          severity: 'critical',
          status: 'unread',
          targetTab: 'controls',
          targetEntityType: 'finding',
          targetEntityId: f.id,
          targetEntityTitle: f.title,
          roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
          actionLabel: 'Kontrol Merkezi\'ne Git',
          isDemo: false,
        })
      }
    }
  })

  // M) Policy notifications
  context.policies.forEach((p) => {
    if (p.status === 'Onay Bekliyor') {
      addIfNew({
        title: `Politika Onay Bekliyor: ${p.title}`,
        message: `"${p.title}" politikası onay bekliyor.`,
        type: 'POLICY',
        severity: 'warning',
        status: 'unread',
        targetTab: 'policies',
        targetEntityType: 'policy',
        targetEntityId: p.id,
        targetEntityTitle: p.title,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici'],
        actionLabel: 'Politika Merkezi\'ne Git',
        isDemo: false,
      })
    }
    if (p.status === 'Revizyon Gerekli') {
      addIfNew({
        title: `Politika Revizyon Gerekli: ${p.title}`,
        message: `"${p.title}" politikası revizyon gerektiriyor.`,
        type: 'POLICY',
        severity: p.riskLevel === 'Kritik' ? 'critical' : 'warning',
        status: 'unread',
        targetTab: 'policies',
        targetEntityType: 'policy',
        targetEntityId: p.id,
        targetEntityTitle: p.title,
        roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
        actionLabel: 'Politika Merkezi\'ne Git',
        isDemo: false,
      })
    }
    if (p.nextReviewDate) {
      const daysLeft = Math.ceil((new Date(p.nextReviewDate).getTime() - now.getTime()) / oneDay)
      if (daysLeft <= 30 && daysLeft > 0) {
        addIfNew({
          title: `Politika Gözden Geçirme Yaklaşıyor: ${p.title}`,
          message: `"${p.title}" politikası gözden geçirme tarihine ${daysLeft} gün kaldı.`,
          type: 'POLICY',
          severity: daysLeft <= 7 ? 'critical' : 'warning',
          status: 'unread',
          targetTab: 'policies',
          targetEntityType: 'policy',
          targetEntityId: p.id,
          targetEntityTitle: p.title,
          roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
          actionLabel: 'Politika Merkezi\'ne Git',
          isDemo: false,
        })
      }
    }
  })

  if (newItems.length > 0) {
    save([...newItems, ...existing])
  }
  return newItems
}
