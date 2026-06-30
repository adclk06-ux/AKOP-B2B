import { calculateRegulatoryRisk } from './regulatoryRisk'
import { calculateOperationalImpact } from './operationalImpact'
import type { SpkArchiveRecord } from './spkSync'
import type { ComplianceTask } from './tasks'
import type { User } from './auth'
import type { ReconciliationRecord } from './reconciliation'
import type { TakasbankAlert } from './takasbank'
import type { ApprovalRequest } from './approvals'
import type { Case } from './cases'
import type { SecuritySession, LoginRecord, MFAStatus, ApiKey } from './security'
import type { ComplianceObligation } from './obligations'
import type { EvidenceDocument } from './evidence'
import type { RegulationChange, RegulationVersion, RegulatoryImpactChain } from './regulatoryIntelligence'
import type { NotificationItem } from './notificationsCenter'
import type { DataSource } from './datasources'
import { getRiskStats, getTopRisks, getRiskLevel, type RiskScore } from './riskEngine'
import { getPolicyStats, type PolicyDocument } from './policies'
import { getControlStats, getTestStats, getFindingStats, type ControlDefinition, type ControlTest, type Finding } from './controls'

export interface CopilotMessage {
  role: 'user' | 'assistant'
  text: string
  actions?: CopilotAction[]
  timestamp: string
}

export interface CopilotAction {
  label: string
  type: 'open_task_modal' | 'open_document' | 'open_ai_analysis' | 'navigate' | 'create_task'
  payload?: { tab?: string; recordId?: string }
}

export interface CopilotContext {
  records: SpkArchiveRecord[]
  tasks: ComplianceTask[]
  reconciliations: ReconciliationRecord[]
  takasbankAlerts: TakasbankAlert[]
  approvalRequests: ApprovalRequest[]
  cases: Case[]
  securitySessions: SecuritySession[]
  loginRecords: LoginRecord[]
  mfaStatuses: MFAStatus[]
  apiKeys: ApiKey[]
  obligations: ComplianceObligation[]
  evidenceDocs: EvidenceDocument[]
  regChanges: RegulationChange[]
  regVersions: RegulationVersion[]
  regChains: RegulatoryImpactChain[]
  notifications: NotificationItem[]
  dataSources: DataSource[]
  riskScores: RiskScore[]
  policies: PolicyDocument[]
  controls: ControlDefinition[]
  tests: ControlTest[]
  findings: Finding[]
  user: User | null
}

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\s]/g, ' ').replace(/\s+/g, ' ').trim()
}

function formatDateTR(dateStr: string) {
  try { return new Date(dateStr).toLocaleDateString('tr-TR') } catch { return dateStr }
}

function last7Days(records: SpkArchiveRecord[]) {
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
  return records.filter((r) => {
    const d = new Date(r.isoDate || r.date || '')
    return !isNaN(d.getTime()) && d >= weekAgo
  })
}

export async function askCopilot(question: string, context: CopilotContext): Promise<{ text: string; actions?: CopilotAction[] }> {
  const q = normalize(question)
  const { records, tasks, user: _user, obligations, evidenceDocs, regChanges, regVersions, regChains, notifications, dataSources, riskScores, policies, controls, tests, findings } = context

  // ─── LOCAL INTENT ROUTER ───

  // Son 7 gün kritik düzenlemeler
  if (q.includes('son 7 gün') || q.includes('son yedi gün') || q.includes('bu hafta')) {
    const recent = last7Days(records)
    const critical = recent.filter((r) => ['high', 'critical'].includes(calculateRegulatoryRisk(r).level))
    if (critical.length === 0) {
      return { text: `Son 7 günde ${recent.length} yeni düzenleme tespit edildi, ancak bunların hiçbiri kritik risk seviyesinde değil.`, actions: [{ label: 'Genel Bakışa Git', type: 'navigate', payload: { tab: 'overview' } }] }
    }
    const list = critical.slice(0, 5).map((r) => `• ${r.title} (${r.authority || 'SPK'} – ${formatDateTR(r.isoDate || r.date || '')})`).join('\n')
    const actions1: CopilotAction[] = critical.slice(0, 3).map((r) => ({ label: `${r.title?.slice(0, 30)}... İncele`, type: 'open_document', payload: { recordId: r.id } }))
    actions1.push({ label: 'Genel Bakışa Git', type: 'navigate', payload: { tab: 'overview' } })
    return { text: `Son 7 günde ${critical.length} kritik düzenleme tespit edildi:\n${list}`, actions: actions1 }
  }

  // Açık kritik görevler
  if ((q.includes('açık') || q.includes('açik')) && q.includes('kritik') && q.includes('görev')) {
    const openCritical = tasks.filter((t) => t.riskLevel === 'Kritik' && t.status !== 'Tamamlandı' && t.status !== 'Ertelendi')
    if (openCritical.length === 0) return { text: 'Şu anda açık kritik riskli görev bulunmuyor. Tebrikler!' }
    const list = openCritical.map((t) => `• ${t.title} – ${t.assignedTo} (Son: ${t.dueDate})`).join('\n')
    const taskActions: CopilotAction[] = openCritical.slice(0, 3).map((t) => ({ label: `${t.title?.slice(0, 25)}...`, type: 'navigate', payload: { tab: 'tasks' } }))
    taskActions.push({ label: 'Tüm Görevlere Git', type: 'navigate', payload: { tab: 'tasks' } })
    return { text: `Şu anda ${openCritical.length} açık kritik görev var:\n${list}`, actions: taskActions }
  }

  // Geciken görevler
  if (q.includes('gecik') || q.includes('geciken') || q.includes('delay')) {
    const now = new Date()
    const delayed = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'Tamamlandı' || t.status === 'Ertelendi') return false
      return new Date(t.dueDate) < now
    })
    if (delayed.length === 0) return { text: 'Geciken görev bulunmuyor. Tüm görevler planlanan tarihlerinde ilerliyor.' }
    const byPerson: Record<string, number> = {}
    delayed.forEach((t) => { byPerson[t.assignedTo] = (byPerson[t.assignedTo] || 0) + 1 })
    const personList = Object.entries(byPerson).map(([name, count]) => `${name}: ${count} görev`).join(', ')
    return {
      text: `${delayed.length} gecikmiş görev var. Dağılım: ${personList}.`,
      actions: [{ label: 'Görevlere Git', type: 'navigate', payload: { tab: 'tasks' } } as CopilotAction]
    }
  }

  // Toplam kayıt / istatistik
  if (q.includes('toplam kayıt') || q.includes('kaç kayıt') || q.includes('istatistik') || q.includes('genel durum')) {
    const spkCount = records.filter((r) => r.authority !== 'BDDK').length
    const bddkCount = records.filter((r) => r.authority === 'BDDK').length
    const total = records.length
    const openTasks = tasks.filter((t) => t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length
    const criticalTasks = tasks.filter((t) => t.riskLevel === 'Kritik' && t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length
    return {
      text: `AKOP şu an toplam ${total} düzenleyici kayıt izliyor (SPK: ${spkCount}, BDDK: ${bddkCount}). Açık uyum görevi: ${openTasks}, bunlardan ${criticalTasks} tanesi kritik risk seviyesinde.`,
      actions: [{ label: 'Genel Bakışa Git', type: 'navigate', payload: { tab: 'overview' } } as CopilotAction]
    }
  }

  // BDDK kredi kartı limit
  if ((q.includes('bddk') || q.includes('bankacılık')) && (q.includes('kredi') || q.includes('kart') || q.includes('limit'))) {
    const matches = records.filter((r) => r.authority === 'BDDK' && normalize(`${r.title} ${(r as any).summary || ''}`).includes('kredi'))
    if (matches.length === 0) return { text: 'BDDK kayıtları arasında kredi kartı / limit ile ilgili doğrudan eşleşen kayıt bulunamadı. Ancak Risk Yönetimi ve Müşteri Onboarding süreçleri etkilenebilir.' }
    const list = matches.slice(0, 5).map((r) => `• ${r.title} (${formatDateTR(r.isoDate || r.date || '')})`).join('\n')
    return {
      text: `BDDK kayıtları arasında ${matches.length} kredi kartı / limit ile ilgili kayıt bulundu:\n${list}`,
      actions: matches.slice(0, 3).map((r) => ({ label: `${r.title?.slice(0, 30)}...`, type: 'open_document', payload: { recordId: r.id } } as CopilotAction))
    }
  }

  // SPK son bülten
  if ((q.includes('spk') || q.includes('sermaye')) && (q.includes('bülten') || q.includes('son') || q.includes('yeni'))) {
    const spkBulletins = records.filter((r) => r.authority !== 'BDDK' && (r.sourceType === 'bulletin' || r.category?.toLowerCase().includes('bülten')))
    const recent = spkBulletins.sort((a, b) => new Date(b.isoDate || b.date || '').getTime() - new Date(a.isoDate || a.date || '').getTime()).slice(0, 5)
    if (recent.length === 0) return { text: 'SPK bülten kaydı bulunamadı.' }
    const list = recent.map((r) => `• ${r.title} (${formatDateTR(r.isoDate || r.date || '')})`).join('\n')
    return {
      text: `Son SPK bülten kayıtları:\n${list}`,
      actions: recent.slice(0, 3).map((r) => ({ label: `${r.title?.slice(0, 30)}...`, type: 'open_document', payload: { recordId: r.id } } as CopilotAction))
    }
  }

  // Belirli bir kayıt numarası özetle (e.g. SPK 2026/38)
  const numberMatch = q.match(/(?:spk|bddk)\s*(?:\d{4})?[\/\-]?\s*(\d+)/i)
  if (numberMatch || q.includes('özetle') || q.includes('özet') || q.includes('incele')) {
    const searchNum = numberMatch?.[1]
    let match = records.find((r) => searchNum && r.number?.includes(searchNum))
    if (!match && q.length > 10) {
      const term = q.replace(/özetle|özet|incele|spk|bddk/g, '').trim()
      match = records.find((r) => r.title?.toLowerCase().includes(term))
    }
    if (match) {
      const risk = calculateRegulatoryRisk(match)
      const op = calculateOperationalImpact(match)
      const docActions: CopilotAction[] = [
        { label: 'Belgeyi İncele', type: 'open_document', payload: { recordId: match.id } },
        { label: 'AI Analiz', type: 'open_ai_analysis', payload: { recordId: match.id } },
        { label: 'Görev Oluştur', type: 'create_task', payload: { recordId: match.id } },
      ]
      return {
        text: `"${match.title}" (${match.authority || 'SPK'})\n\nRisk: ${risk.label} – ${risk.reason}\nOperasyon Etkisi: ${op.areas.join(', ') || 'Belirlenemedi'}\nTarih: ${formatDateTR(match.isoDate || match.date || '')}\nNumara: ${match.number || '—'}`,
        actions: docActions
      }
    }
  }

  // Hangi operasyonları etkiler?
  if (q.includes('operasyon') || q.includes('etkiler') || q.includes('etkile')) {
    const recent = records.slice(0, 50)
    const impactCounts: Record<string, number> = {}
    recent.forEach((r) => { calculateOperationalImpact(r).areas.forEach((a) => { impactCounts[a] = (impactCounts[a] || 0) + 1 }) })
    const top = Object.entries(impactCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
    if (top.length === 0) return { text: 'Son kayıtlar için operasyon etkisi tespit edilemedi.' }
    const list = top.map(([area, count]) => `• ${area}: ${count} kayıt`).join('\n')
    return {
      text: `Son 50 kayıt bazında en çok etkilenen operasyon alanları:\n${list}`,
      actions: [{ label: 'Operasyon Haritasına Git', type: 'navigate', payload: { tab: 'overview' } } as CopilotAction]
    }
  }

  // Mutabakat / reconciliation
  if (q.includes('mutabakat') || q.includes('mkk') || q.includes('uyuşmazlık') || q.includes('fark')) {
    const { reconciliations } = context
    if (reconciliations && reconciliations.length > 0) {
      const openRecs = reconciliations.filter((r) => r.status !== 'Kapandı')
      const criticalRecs = openRecs.filter((r) => r.risk === 'Kritik')
      const slaBreach = openRecs.filter((r) => r.slaDate && new Date(r.slaDate) < new Date()).length

      // Kritik mutabakat farkları
      if (q.includes('kritik')) {
        if (criticalRecs.length === 0) return { text: 'Şu anda kritik risk seviyesinde açık mutabakat farkı bulunmuyor.', actions: [{ label: 'Mutabakata Git', type: 'navigate', payload: { tab: 'reconciliation' } }] }
        const list = criticalRecs.slice(0, 5).map((r) => `• ${r.type}: ${r.customer || r.id} – Fark: ${r.difference.toLocaleString('tr-TR')} ${r.currency} (${r.responsible})`).join('\n')
        return { text: `${criticalRecs.length} kritik mutabakat farkı bulundu:\n${list}`, actions: [{ label: 'Mutabakata Git', type: 'navigate', payload: { tab: 'reconciliation' } }] }
      }

      // SLA aşımı
      if (q.includes('sla')) {
        if (slaBreach === 0) return { text: 'SLA aşımı olan mutabakat bulunmuyor.', actions: [{ label: 'Mutabakata Git', type: 'navigate', payload: { tab: 'reconciliation' } }] }
        return { text: `${slaBreach} mutabakat kaydında SLA aşımı var. Lütfen en kısa sürede inceleme başlatın.`, actions: [{ label: 'Mutabakata Git', type: 'navigate', payload: { tab: 'reconciliation' } }] }
      }

      // En yüksek riskli
      if (q.includes('yüksek') || q.includes('en riskli')) {
        const highRisk = openRecs.filter((r) => r.risk === 'Yüksek' || r.risk === 'Kritik')
        if (highRisk.length === 0) return { text: 'Yüksek riskli açık mutabakat bulunmuyor.', actions: [{ label: 'Mutabakata Git', type: 'navigate', payload: { tab: 'reconciliation' } }] }
        const list = highRisk.slice(0, 5).map((r) => `• ${r.type}: ${r.customer || r.id} – ${r.risk} – Fark: ${r.difference.toLocaleString('tr-TR')} ${r.currency}`).join('\n')
        return { text: `En yüksek riskli ${highRisk.length} mutabakat:\n${list}`, actions: [{ label: 'Mutabakata Git', type: 'navigate', payload: { tab: 'reconciliation' } }] }
      }

      // Genel mutabakat durumu
      const total = reconciliations.length
      const successful = reconciliations.filter((r) => r.status === 'Kapandı').length
      const successRate = total > 0 ? Math.round((successful / total) * 100) : 0
      return {
        text: `MKK Mutabakat Durumu:\n• Toplam: ${total} kayıt\n• Kapandı: ${successful} (%${successRate})\n• Açık: ${openRecs.length}\n• Kritik: ${criticalRecs.length}\n• SLA Aşımı: ${slaBreach}`,
        actions: [{ label: 'Mutabakata Git', type: 'navigate', payload: { tab: 'reconciliation' } }]
      }
    }
    return { text: 'MKK mutabakat verisi mevcut değil.', actions: [{ label: 'Mutabakata Git', type: 'navigate', payload: { tab: 'reconciliation' } }] }
  }

  // Yönetici özeti
  if (q.includes('yönetici') || q.includes('executive') || q.includes('özet hazırla')) {
    const total = records.length
    const openTasks = tasks.filter((t) => t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length
    const delayed = tasks.filter((t) => {
      if (!t.dueDate || t.status === 'Tamamlandı' || t.status === 'Ertelendi') return false
      return new Date(t.dueDate) < new Date()
    }).length
    const criticalOpen = tasks.filter((t) => t.riskLevel === 'Kritik' && t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length
    const recent7 = last7Days(records).length
    const openObl = (obligations || []).filter((o) => o.status !== 'Tamamlandı').length
    const criticalObl = (obligations || []).filter((o) => o.riskLevel === 'Kritik' && o.status !== 'Tamamlandı').length
    const upcomingObl = (obligations || []).filter((o) => {
      if (o.status === 'Tamamlandı') return false
      const dd = new Date(o.dueDate)
      const now = new Date()
      const thirtyDays = new Date(now.getTime() + 30 * 86400000)
      return dd >= now && dd <= thirtyDays
    }).length
    const overdueObl = (obligations || []).filter((o) => {
      if (o.status === 'Tamamlandı') return false
      return new Date(o.dueDate) < new Date()
    }).length
    const evTotal = (evidenceDocs || []).length
    const evRestricted = (evidenceDocs || []).filter((d) => d.classification === 'Restricted').length
    const evPending = (evidenceDocs || []).filter((d) => d.status === 'Onay Bekliyor').length
    const missingObl = (obligations || []).filter((o) => o.evidenceCount === 0).length
    const riTotal = (regChanges || []).length
    const riCritical = (regChanges || []).filter((c) => c.impactLevel === 'Kritik').length
    const riSuggested = (regChanges || []).reduce((s, c) => s + c.suggestedObligations.length, 0)
    return {
      text: `Yönetici Özeti:\n• Toplam izlenen kayıt: ${total}\n• Son 7 gün yeni düzenleme: ${recent7}\n• Açık uyum görevi: ${openTasks}\n• Kritik açık görev: ${criticalOpen}\n• Gecikmiş görev: ${delayed}\n• Açık yükümlülük: ${openObl}\n• Kritik yükümlülük: ${criticalObl}\n• Yaklaşan termin: ${upcomingObl}\n• Geciken yükümlülük: ${overdueObl}\n• Toplam kanıt: ${evTotal}\n• Restricted doküman: ${evRestricted}\n• Onay bekleyen kanıt: ${evPending}\n• Eksik kanıtlı yükümlülük: ${missingObl}\n• Tespit edilen değişiklik: ${riTotal}\n• Kritik değişiklik: ${riCritical}\n• Önerilen yükümlülük: ${riSuggested}`,
      actions: [{ label: 'Genel Bakışa Git', type: 'navigate', payload: { tab: 'overview' } } as CopilotAction]
    }
  }

  // ─── OPENAI FALLBACK ───
  const openaiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || (window as any).__OPENAI_API_KEY__
  if (openaiKey) {
    try {
      const recentContext = records.slice(0, 20).map((r) => `${r.authority || 'SPK'}: ${r.title}`).join('\n')
      const taskContext = tasks.slice(0, 10).map((t) => `${t.title} [${t.status}] (${t.riskLevel})`).join('\n')
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: `Sen AKOP RegTech'in kurumsal uyum asistanısın. SPK, BDDK, MASAK düzenlemeleri, uyum görevleri ve risk yönetimi konularında uzmanlaşmışsın. Kullanıcıya kısa, net ve profesyonel yanıtlar ver.\n\nMevcut veri bağlamı:\nSon 20 kayıt:\n${recentContext}\n\nSon 10 görev:\n${taskContext}` },
            { role: 'user', content: question }
          ],
          max_tokens: 500,
          temperature: 0.3,
        })
      })
      const data = await res.json()
      const aiText = data.choices?.[0]?.message?.content?.trim()
      if (aiText) return { text: aiText }
    } catch (e) {
      console.warn('[Copilot OpenAI]', e)
    }
  }

  // Takasbank
  if (q.includes('takasbank') || q.includes('takas') || q.includes('margin') || q.includes('limit') || q.includes('settlement') || q.includes('teminat')) {
    const { takasbankAlerts } = context
    if (takasbankAlerts && takasbankAlerts.length > 0) {
      const openAlerts = takasbankAlerts.filter((a) => a.status !== 'Kapandı')
      const criticalAlerts = openAlerts.filter((a) => a.risk === 'Kritik')
      const marginAlerts = openAlerts.filter((a) => a.type === 'Margin Çağrısı')
      const limitAlerts = openAlerts.filter((a) => a.type === 'Limit Aşımı')
      const settlementAlerts = openAlerts.filter((a) => a.type === 'Settlement Gecikmesi')
      const slaBreach = openAlerts.filter((a) => a.slaDate && new Date(a.slaDate) < new Date()).length

      if (q.includes('kritik')) {
        if (criticalAlerts.length === 0) return { text: 'Şu anda kritik Takasbank uyarısı bulunmuyor.', actions: [{ label: 'Takasbank İzlemeye Git', type: 'navigate', payload: { tab: 'takasbank' } }] }
        const list = criticalAlerts.slice(0, 5).map((a) => `• ${a.type}: ${a.member || a.account} – ${a.amount.toLocaleString('tr-TR')} ${a.currency} (${a.responsible})`).join('\n')
        return { text: `${criticalAlerts.length} kritik Takasbank uyarısı:\n${list}`, actions: [{ label: 'Takasbank İzlemeye Git', type: 'navigate', payload: { tab: 'takasbank' } }] }
      }

      if (q.includes('margin')) {
        if (marginAlerts.length === 0) return { text: 'Açık margin çağrısı bulunmuyor.', actions: [{ label: 'Takasbank İzlemeye Git', type: 'navigate', payload: { tab: 'takasbank' } }] }
        const list = marginAlerts.map((a) => `• ${a.member || a.account} – ${a.amount.toLocaleString('tr-TR')} ${a.currency} (${a.responsible})`).join('\n')
        return { text: `${marginAlerts.length} açık margin çağrısı:\n${list}`, actions: [{ label: 'Takasbank İzlemeye Git', type: 'navigate', payload: { tab: 'takasbank' } }] }
      }

      if (q.includes('limit')) {
        if (limitAlerts.length === 0) return { text: 'Limit aşımı olan hesap bulunmuyor.', actions: [{ label: 'Takasbank İzlemeye Git', type: 'navigate', payload: { tab: 'takasbank' } }] }
        const list = limitAlerts.map((a) => `• ${a.member || a.account} – Kullanım: ${a.amount.toLocaleString('tr-TR')} ${a.currency} – ${a.risk}`).join('\n')
        return { text: `${limitAlerts.length} limit aşımı uyarısı:\n${list}`, actions: [{ label: 'Takasbank İzlemeye Git', type: 'navigate', payload: { tab: 'takasbank' } }] }
      }

      if (q.includes('settlement') || q.includes('gecik')) {
        if (settlementAlerts.length === 0) return { text: 'Settlement gecikmesi bulunmuyor.', actions: [{ label: 'Takasbank İzlemeye Git', type: 'navigate', payload: { tab: 'takasbank' } }] }
        const list = settlementAlerts.map((a) => `• ${a.member || a.account} – ${a.amount.toLocaleString('tr-TR')} ${a.currency} – SLA: ${a.slaDate || '—'}`).join('\n')
        return { text: `${settlementAlerts.length} settlement gecikmesi:\n${list}`, actions: [{ label: 'Takasbank İzlemeye Git', type: 'navigate', payload: { tab: 'takasbank' } }] }
      }

      const total = takasbankAlerts.length
      const successful = takasbankAlerts.filter((a) => a.status === 'Kapandı').length
      return {
        text: `Takasbank İzleme Durumu:\n• Toplam: ${total} kayıt\n• Kapandı: ${successful}\n• Açık: ${openAlerts.length}\n• Kritik: ${criticalAlerts.length}\n• Margin Çağrısı: ${marginAlerts.length}\n• Limit Aşımı: ${limitAlerts.length}\n• Settlement Gecikmesi: ${settlementAlerts.length}\n• SLA Aşımı: ${slaBreach}`,
        actions: [{ label: 'Takasbank İzlemeye Git', type: 'navigate', payload: { tab: 'takasbank' } }]
      }
    }
    return { text: 'Takasbank verisi mevcut değil.', actions: [{ label: 'Takasbank İzlemeye Git', type: 'navigate', payload: { tab: 'takasbank' } }] }
  }

  // Onay / Approval
  if (q.includes('onay') || q.includes('approval') || q.includes('bekleyen')) {
    const { approvalRequests } = context
    if (approvalRequests && approvalRequests.length > 0) {
      const pending = approvalRequests.filter((a) => a.status === 'Beklemede')
      const criticalPending = pending.filter((a) => a.priority === 'Kritik')
      const slaBreach = pending.filter((a) => { const created = new Date(a.createdAt); const hoursPassed = (Date.now() - created.getTime()) / (1000 * 60 * 60); return hoursPassed > 24 }).length
      const myApprovals = pending.filter((a) => a.assignedApprover === 'Yönetici' && context.user?.role === 'Yönetici')

      if (q.includes('kritik')) {
        if (criticalPending.length === 0) return { text: 'Kritik öncelikli bekleyen onay talebi bulunmuyor.', actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
        const list = criticalPending.slice(0, 5).map((a) => `• ${a.sourceModule}: ${a.sourceTitle} – ${a.requestType} (${a.requestedBy})`).join('\n')
        return { text: `${criticalPending.length} kritik onay talebi:\n${list}`, actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
      }

      if (q.includes('bana') || q.includes('atanmış')) {
        if (myApprovals.length === 0) return { text: 'Size atanmış bekleyen onay talebi bulunmuyor.', actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
        const list = myApprovals.slice(0, 5).map((a) => `• ${a.sourceModule}: ${a.sourceTitle} – ${a.requestType}`).join('\n')
        return { text: `Size atanmış ${myApprovals.length} onay talebi:\n${list}`, actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
      }

      if (q.includes('sla')) {
        if (slaBreach === 0) return { text: 'SLA aşımı olan onay talebi bulunmuyor.', actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
        return { text: `${slaBreach} onay talebinde SLA aşımı var.`, actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
      }

      const total = approvalRequests.length
      const approved = approvalRequests.filter((a) => a.status === 'Onaylandı').length
      const rejected = approvalRequests.filter((a) => a.status === 'Reddedildi').length
      return {
        text: `Onay Merkezi Durumu:\n• Toplam: ${total} kayıt\n• Bekleyen: ${pending.length}\n• Onaylanan: ${approved}\n• Reddedilen: ${rejected}\n• Kritik Bekleyen: ${criticalPending.length}\n• SLA Aşımı: ${slaBreach}`,
        actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }]
      }
    }
    return { text: 'Onay talebi verisi mevcut değil.', actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
  }

  // Case / Vaka
  if (q.includes('vaka') || q.includes('case') || q.includes('cases')) {
    const { cases } = context
    if (cases && cases.length > 0) {
      const openCases = cases.filter((c) => c.status !== 'Tamamlandı' && c.status !== 'Arşivlendi')
      const criticalCases = openCases.filter((c) => c.riskLevel === 'Kritik')
      const highestRisk = [...cases].sort((a, b) => {
        const riskOrder = { 'Kritik': 4, 'Yüksek': 3, 'Orta': 2, 'Düşük': 1 }
        return (riskOrder[b.riskLevel as keyof typeof riskOrder] || 0) - (riskOrder[a.riskLevel as keyof typeof riskOrder] || 0)
      })[0]

      if (q.includes('kritik')) {
        if (criticalCases.length === 0) return { text: 'Kritik riskli açık vaka bulunmuyor.', actions: [{ label: 'Case Center\'a Git', type: 'navigate', payload: { tab: 'casecenter' } }] }
        const list = criticalCases.slice(0, 5).map((c) => `• ${c.caseNumber}: ${c.title} – ${c.sourceModule} (${c.assignedTo})`).join('\n')
        return { text: `${criticalCases.length} kritik vaka:\n${list}`, actions: [{ label: 'Case Center\'a Git', type: 'navigate', payload: { tab: 'casecenter' } }] }
      }

      if (q.includes('açık')) {
        if (openCases.length === 0) return { text: 'Açık vaka bulunmuyor.', actions: [{ label: 'Case Center\'a Git', type: 'navigate', payload: { tab: 'casecenter' } }] }
        const list = openCases.slice(0, 5).map((c) => `• ${c.caseNumber}: ${c.title} – ${c.status} (${c.assignedTo})`).join('\n')
        return { text: `${openCases.length} açık vaka:\n${list}`, actions: [{ label: 'Case Center\'a Git', type: 'navigate', payload: { tab: 'casecenter' } }] }
      }

      if (q.includes('en yüksek risk') || q.includes('riskli case')) {
        if (!highestRisk) return { text: 'Vaka verisi mevcut değil.', actions: [{ label: 'Case Center\'a Git', type: 'navigate', payload: { tab: 'casecenter' } }] }
        return { text: `En yüksek riskli vaka:\n• ${highestRisk.caseNumber}: ${highestRisk.title}\n• Risk: ${highestRisk.riskLevel}\n• Öncelik: ${highestRisk.priority}\n• Durum: ${highestRisk.status}\n• Sorumlu: ${highestRisk.assignedTo}`, actions: [{ label: 'Case Center\'a Git', type: 'navigate', payload: { tab: 'casecenter' } }] }
      }

      if (q.includes('durum')) {
        const total = cases.length
        const completed = cases.filter((c) => c.status === 'Tamamlandı').length
        const archived = cases.filter((c) => c.status === 'Arşivlendi').length
        return {
          text: `Case Center Durumu:\n• Toplam: ${total} vaka\n• Açık: ${openCases.length}\n• Tamamlandı: ${completed}\n• Arşivlendi: ${archived}\n• Kritik Açık: ${criticalCases.length}`,
          actions: [{ label: 'Case Center\'a Git', type: 'navigate', payload: { tab: 'casecenter' } }]
        }
      }

      return {
        text: `Case Center'da ${cases.length} vaka var. Açık vaka sayısı: ${openCases.length}. Kritik vaka sayısı: ${criticalCases.length}.`,
        actions: [{ label: 'Case Center\'a Git', type: 'navigate', payload: { tab: 'casecenter' } }]
      }
    }
    return { text: 'Vaka verisi mevcut değil.', actions: [{ label: 'Case Center\'a Git', type: 'navigate', payload: { tab: 'casecenter' } }] }
  }

  // Workflow
  if (q.includes('workflow') || q.includes('aşama') || q.includes('onay süreci')) {
    const { approvalRequests } = context
    if (approvalRequests && approvalRequests.length > 0) {
      const wfRequests = approvalRequests.filter((a) => a.workflowId && a.totalStages && a.totalStages > 1)
      const pendingWf = wfRequests.filter((a) => a.status === 'Beklemede')
      const slaBreaches = pendingWf.filter((a) => a.slaDeadline && new Date() > new Date(a.slaDeadline))
      const criticalWf = pendingWf.filter((a) => a.priority === 'Kritik')

      if (q.includes('bekleyen')) {
        if (pendingWf.length === 0) return { text: 'Bekleyen workflow bulunmuyor.', actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
        const list = pendingWf.slice(0, 5).map((a) => `• ${a.sourceTitle} – Aşama ${a.currentStage}/${a.totalStages} (${a.pendingRole})`).join('\n')
        return { text: `${pendingWf.length} bekleyen workflow:\n${list}`, actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
      }

      if (q.includes('sla') || q.includes('aşan')) {
        if (slaBreaches.length === 0) return { text: 'SLA aşımı olan workflow bulunmuyor.', actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
        const list = slaBreaches.slice(0, 5).map((a) => `• ${a.sourceTitle} – Aşama ${a.currentStage}/${a.totalStages} (${a.pendingRole})`).join('\n')
        return { text: `${slaBreaches.length} SLA aşımı olan workflow:\n${list}`, actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
      }

      if (q.includes('kritik')) {
        if (criticalWf.length === 0) return { text: 'Kritik workflow bulunmuyor.', actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
        const list = criticalWf.slice(0, 5).map((a) => `• ${a.sourceTitle} – Aşama ${a.currentStage}/${a.totalStages}`).join('\n')
        return { text: `${criticalWf.length} kritik workflow:\n${list}`, actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
      }

      if (q.includes('hangi aşamada') || q.includes('durumu ne')) {
        if (pendingWf.length === 0) return { text: 'Bekleyen workflow bulunmuyor.', actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
        const a = pendingWf[0]
        return { text: `${a.sourceTitle} şu an ${a.currentStage}. aşamada (${a.pendingRole}). Toplam ${a.totalStages} aşamadan oluşuyor.`, actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
      }

      return {
        text: `Workflow Durumu:\n• Toplam Workflow: ${wfRequests.length}\n• Bekleyen: ${pendingWf.length}\n• SLA Aşımı: ${slaBreaches.length}\n• Kritik: ${criticalWf.length}`,
        actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }]
      }
    }
    return { text: 'Workflow verisi mevcut değil.', actions: [{ label: 'Onay Merkezine Git', type: 'navigate', payload: { tab: 'approval' } }] }
  }

  // Security
  if (q.includes('güvenlik') || q.includes('security') || q.includes('giriş') || q.includes('mfa') || q.includes('oturum') || q.includes('rol değişikliği')) {
    const { loginRecords, mfaStatuses, securitySessions } = context
    const hasData = (loginRecords && loginRecords.length > 0) || (mfaStatuses && mfaStatuses.length > 0)
    if (hasData) {
      const failed = (loginRecords || []).filter((l) => l.status === 'Başarısız')
      const mfaInactive = (mfaStatuses || []).filter((m) => !m.mfaEnabled)
      const activeSess = (securitySessions || []).filter((s) => s.status === 'Aktif')

      if (q.includes('başarısız') || q.includes('giriş deneme')) {
        if (failed.length === 0) return { text: 'Başarısız giriş denemesi bulunmuyor.', actions: [{ label: 'Security Center\'a Git', type: 'navigate', payload: { tab: 'security' } }] }
        const list = failed.slice(0, 5).map((l) => `• ${l.userName} – ${l.device} – ${l.failureReason || 'Bilinmiyor'}`).join('\n')
        return { text: `${failed.length} başarısız giriş denemesi:\n${list}`, actions: [{ label: 'Security Center\'a Git', type: 'navigate', payload: { tab: 'security' } }] }
      }

      if (q.includes('mfa pasif') || q.includes('mfa aktif') || q.includes('mfa durumu')) {
        if (mfaInactive.length === 0) return { text: 'Tüm kullanıcılar MFA aktif.', actions: [{ label: 'Security Center\'a Git', type: 'navigate', payload: { tab: 'security' } }] }
        const list = mfaInactive.slice(0, 5).map((m) => `• ${m.userName} (${m.role})`).join('\n')
        return { text: `${mfaInactive.length} kullanıcı MFA pasif:\n${list}`, actions: [{ label: 'Security Center\'a Git', type: 'navigate', payload: { tab: 'security' } }] }
      }

      if (q.includes('rol değişikliği') || q.includes('rol değişimi')) {
        return { text: 'Son rol değişiklikleri denetim kayıtlarında görüntülenebilir. Security Center > Güvenlik Denetimi sekmesine göz atın.', actions: [{ label: 'Security Center\'a Git', type: 'navigate', payload: { tab: 'security' } }] }
      }

      if (q.includes('kritik güvenlik')) {
        if (failed.length === 0) return { text: 'Kritik güvenlik olayı bulunmuyor.', actions: [{ label: 'Security Center\'a Git', type: 'navigate', payload: { tab: 'security' } }] }
        return { text: `${failed.length} kritik güvenlik olayı (başarısız giriş) tespit edildi.`, actions: [{ label: 'Security Center\'a Git', type: 'navigate', payload: { tab: 'security' } }] }
      }

      return {
        text: `Güvenlik Durumu:\n• Aktif Oturum: ${activeSess.length}\n• Başarısız Giriş: ${failed.length}\n• MFA Pasif Kullanıcı: ${mfaInactive.length}`,
        actions: [{ label: 'Security Center\'a Git', type: 'navigate', payload: { tab: 'security' } }]
      }
    }
    return { text: 'Güvenlik verisi mevcut değil.', actions: [{ label: 'Security Center\'a Git', type: 'navigate', payload: { tab: 'security' } }] }
  }

  // Obligations
  if (q.includes('yükümlülük') || q.includes('obligation') || q.includes('yükümlü')) {
    const { obligations } = context
    if (obligations && obligations.length > 0) {
      const openObl = obligations.filter((o) => o.status !== 'Tamamlandı')
      const criticalObl = openObl.filter((o) => o.riskLevel === 'Kritik')
      const overdueObl = openObl.filter((o) => new Date(o.dueDate) < new Date())
      const upcomingObl = openObl.filter((o) => {
        const dd = new Date(o.dueDate)
        const now = new Date()
        const thirtyDays = new Date(now.getTime() + 30 * 86400000)
        return dd >= now && dd <= thirtyDays
      })

      if (q.includes('açık')) {
        if (openObl.length === 0) return { text: 'Açık yükümlülük bulunmuyor.', actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
        const list = openObl.slice(0, 5).map((o) => `• ${o.title} – ${o.authority} – ${o.status}`).join('\n')
        return { text: `${openObl.length} açık yükümlülük:\n${list}`, actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
      }

      if (q.includes('kritik')) {
        if (criticalObl.length === 0) return { text: 'Kritik yükümlülük bulunmuyor.', actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
        const list = criticalObl.slice(0, 5).map((o) => `• ${o.title} – ${o.authority} – Termin: ${formatDateTR(o.dueDate)}`).join('\n')
        return { text: `${criticalObl.length} kritik yükümlülük:\n${list}`, actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
      }

      if (q.includes('geciken') || q.includes('gecikme')) {
        if (overdueObl.length === 0) return { text: 'Geciken yükümlülük bulunmuyor.', actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
        const list = overdueObl.slice(0, 5).map((o) => `• ${o.title} – ${o.authority} – Termin: ${formatDateTR(o.dueDate)}`).join('\n')
        return { text: `${overdueObl.length} geciken yükümlülük:\n${list}`, actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
      }

      if (q.includes('bu ay') || q.includes('doluyor')) {
        if (upcomingObl.length === 0) return { text: 'Yaklaşan yükümlülük bulunmuyor.', actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
        const list = upcomingObl.slice(0, 5).map((o) => `• ${o.title} – Termin: ${formatDateTR(o.dueDate)}`).join('\n')
        return { text: `${upcomingObl.length} yaklaşan yükümlülük (30 gün):\n${list}`, actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
      }

      if (q.includes('spk')) {
        const spkObl = obligations.filter((o) => o.authority === 'SPK')
        return { text: `${spkObl.length} SPK yükümlülüğü. Açık: ${spkObl.filter((o) => o.status !== 'Tamamlandı').length}.`, actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
      }

      if (q.includes('bddk')) {
        const bddkObl = obligations.filter((o) => o.authority === 'BDDK')
        return { text: `${bddkObl.length} BDDK yükümlülüğü. Açık: ${bddkObl.filter((o) => o.status !== 'Tamamlandı').length}.`, actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
      }

      if (q.includes('en yüksek riskli') || q.includes('riskli yükümlülük')) {
        const highest = [...obligations].sort((a, b) => {
          const riskOrder = { 'Kritik': 4, 'Yüksek': 3, 'Orta': 2, 'Düşük': 1 }
          return (riskOrder[b.riskLevel as keyof typeof riskOrder] || 0) - (riskOrder[a.riskLevel as keyof typeof riskOrder] || 0)
        })[0]
        if (!highest) return { text: 'Yükümlülük verisi mevcut değil.', actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
        return { text: `En yüksek riskli yükümlülük:\n• ${highest.title}\n• Risk: ${highest.riskLevel}\n• Kurum: ${highest.authority}\n• Durum: ${highest.status}\n• Termin: ${formatDateTR(highest.dueDate)}`, actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
      }

      return {
        text: `Yükümlülük Durumu:\n• Toplam: ${obligations.length}\n• Açık: ${openObl.length}\n• Kritik: ${criticalObl.length}\n• Geciken: ${overdueObl.length}\n• Yaklaşan (30 gün): ${upcomingObl.length}`,
        actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }]
      }
    }
    return { text: 'Yükümlülük verisi mevcut değil.', actions: [{ label: 'Yükümlülük Merkezine Git', type: 'navigate', payload: { tab: 'obligations' } }] }
  }

  // Evidence
  if (q.includes('kanıt') || q.includes('evidence') || q.includes('doküman')) {
    const docs = evidenceDocs || []
    if (docs.length > 0) {
      const restricted = docs.filter((d) => d.classification === 'Restricted')
      const pending = docs.filter((d) => d.status === 'Onay Bekliyor')
      const addedThisMonth = docs.filter((d) => {
        const dDate = new Date(d.uploadedAt)
        const thirtyDays = new Date(Date.now() - 30 * 86400000)
        return dDate >= thirtyDays
      })
      const spkEvidence = docs.filter((d) => d.linkedEntityType === 'obligation' && d.linkedEntityTitle.toLowerCase().includes('spk'))

      if (q.includes('eksik') || q.includes('missing')) {
        const missingObl = (obligations || []).filter((o) => o.evidenceCount === 0)
        if (missingObl.length === 0) return { text: 'Tüm yükümlülüklerin kanıt dokümanı mevcut.', actions: [{ label: 'Kanıt Kasasına Git', type: 'navigate', payload: { tab: 'evidence' } }] }
        const list = missingObl.slice(0, 5).map((o) => `• ${o.title} – ${o.authority}`).join('\n')
        return { text: `${missingObl.length} eksik kanıtlı yükümlülük:\n${list}`, actions: [{ label: 'Kanıt Kasasına Git', type: 'navigate', payload: { tab: 'evidence' } }] }
      }

      if (q.includes('restricted')) {
        if (restricted.length === 0) return { text: 'Restricted doküman bulunmuyor.', actions: [{ label: 'Kanıt Kasasına Git', type: 'navigate', payload: { tab: 'evidence' } }] }
        const list = restricted.slice(0, 5).map((d) => `• ${d.title} – ${d.fileName} – ${d.linkedEntityType}`).join('\n')
        return { text: `${restricted.length} restricted doküman:\n${list}`, actions: [{ label: 'Kanıt Kasasına Git', type: 'navigate', payload: { tab: 'evidence' } }] }
      }

      if (q.includes('onay bekleyen')) {
        if (pending.length === 0) return { text: 'Onay bekleyen kanıt bulunmuyor.', actions: [{ label: 'Kanıt Kasasına Git', type: 'navigate', payload: { tab: 'evidence' } }] }
        const list = pending.slice(0, 5).map((d) => `• ${d.title} – ${d.classification} – ${d.linkedEntityType}`).join('\n')
        return { text: `${pending.length} onay bekleyen kanıt:\n${list}`, actions: [{ label: 'Kanıt Kasasına Git', type: 'navigate', payload: { tab: 'evidence' } }] }
      }

      if (q.includes('bu ay')) {
        if (addedThisMonth.length === 0) return { text: 'Bu ay eklenen kanıt bulunmuyor.', actions: [{ label: 'Kanıt Kasasına Git', type: 'navigate', payload: { tab: 'evidence' } }] }
        const list = addedThisMonth.slice(0, 5).map((d) => `• ${d.title} – ${formatDateTR(d.uploadedAt)}`).join('\n')
        return { text: `${addedThisMonth.length} bu ay eklenen kanıt:\n${list}`, actions: [{ label: 'Kanıt Kasasına Git', type: 'navigate', payload: { tab: 'evidence' } }] }
      }

      if (q.includes('spk')) {
        if (spkEvidence.length === 0) return { text: 'SPK yükümlülüğüne bağlı kanıt bulunmuyor.', actions: [{ label: 'Kanıt Kasasına Git', type: 'navigate', payload: { tab: 'evidence' } }] }
        const list = spkEvidence.slice(0, 5).map((d) => `• ${d.title} – ${d.fileName}`).join('\n')
        return { text: `${spkEvidence.length} SPK bağlı kanıt:\n${list}`, actions: [{ label: 'Kanıt Kasasına Git', type: 'navigate', payload: { tab: 'evidence' } }] }
      }

      return {
        text: `Kanıt Kasası Durumu:\n• Toplam kanıt: ${docs.length}\n• Restricted: ${restricted.length}\n• Onay Bekleyen: ${pending.length}\n• Bu Ay Eklenen: ${addedThisMonth.length}`,
        actions: [{ label: 'Kanıt Kasasına Git', type: 'navigate', payload: { tab: 'evidence' } }]
      }
    }
    return { text: 'Kanıt verisi mevcut değil.', actions: [{ label: 'Kanıt Kasasına Git', type: 'navigate', payload: { tab: 'evidence' } }] }
  }

  // RegIntel
  if (q.includes('mevzuat değişiklik') || q.includes('regülasyon değişiklik') || q.includes('regintel') || q.includes('değişiklik')) {
    const changes = regChanges || []
    const versions = regVersions || []
    if (changes.length > 0) {
      const critical = changes.filter((c) => c.impactLevel === 'Kritik')
      const high = changes.filter((c) => c.impactLevel === 'Yüksek')
      const spkChanges = changes.filter((c) => {
        const v = versions.find((rv) => rv.regulationId === c.regulationId)
        return v?.authority === 'SPK'
      })

      if (q.includes('kritik')) {
        if (critical.length === 0) return { text: 'Kritik değişiklik bulunmuyor.', actions: [{ label: 'RegIntel\'e Git', type: 'navigate', payload: { tab: 'regintel' } }] }
        const list = critical.slice(0, 5).map((c) => {
          const v = versions.find((rv) => rv.regulationId === c.regulationId)
          return `• ${c.articleReference} – ${v?.authority} – ${c.changeType} – ${c.impactLevel}`
        }).join('\n')
        return { text: `${critical.length} kritik değişiklik:\n${list}`, actions: [{ label: 'RegIntel\'e Git', type: 'navigate', payload: { tab: 'regintel' } }] }
      }

      if (q.includes('spk')) {
        if (spkChanges.length === 0) return { text: 'SPK değişikliği bulunmuyor.', actions: [{ label: 'RegIntel\'e Git', type: 'navigate', payload: { tab: 'regintel' } }] }
        const list = spkChanges.slice(0, 5).map((c) => `• ${c.articleReference} – ${c.changeType}`).join('\n')
        return { text: `${spkChanges.length} SPK değişikliği:\n${list}`, actions: [{ label: 'RegIntel\'e Git', type: 'navigate', payload: { tab: 'regintel' } }] }
      }

      if (q.includes('etkilenen') || q.includes('etki')) {
        const chains = regChains || []
        const totalAffected = chains.reduce((sum, ch) => sum + ch.affectedObligations.length + ch.affectedTasks.length + ch.affectedCases.length, 0)
        if (totalAffected === 0) return { text: 'Henüz etki zinciri kaydı bulunmuyor.', actions: [{ label: 'RegIntel\'e Git', type: 'navigate', payload: { tab: 'regintel' } }] }
        const list = chains.slice(0, 3).map((ch) => `• ${ch.summary} – Risk: ${ch.riskLevel}`).join('\n')
        return { text: `Etki zinciri:\n${list}`, actions: [{ label: 'RegIntel\'e Git', type: 'navigate', payload: { tab: 'regintel' } }] }
      }

      if (q.includes('önerilen') || q.includes('öneri')) {
        const allSuggested = changes.flatMap((c) => c.suggestedObligations.map((s) => `• ${s} – ${c.articleReference}`))
        if (allSuggested.length === 0) return { text: 'Henüz önerilen yükümlülük bulunmuyor.', actions: [{ label: 'RegIntel\'e Git', type: 'navigate', payload: { tab: 'regintel' } }] }
        const list = allSuggested.slice(0, 5).join('\n')
        return { text: `Önerilen yükümlülükler:\n${list}`, actions: [{ label: 'RegIntel\'e Git', type: 'navigate', payload: { tab: 'regintel' } }] }
      }

      return {
        text: `Mevzuat Değişiklik Durumu:\n• Toplam değişiklik: ${changes.length}\n• Kritik: ${critical.length}\n• Yüksek: ${high.length}\n• SPK: ${spkChanges.length}`,
        actions: [{ label: 'RegIntel\'e Git', type: 'navigate', payload: { tab: 'regintel' } }]
      }
    }
    return { text: 'RegIntel verisi mevcut değil.', actions: [{ label: 'RegIntel\'e Git', type: 'navigate', payload: { tab: 'regintel' } }] }
  }

  // Notifications
  if (q.includes('bildirim') || q.includes('notification') || q.includes('uyarı') || q.includes('alert')) {
    const notifs = notifications || []
    const roleNotifs = notifs.filter((n) => _user && n.roleVisibility.includes(_user.role) && n.status !== 'archived')
    if (roleNotifs.length === 0) return { text: 'Henüz bildirim bulunmuyor.', actions: [{ label: 'Bildirim Merkezi\'ne Git', type: 'navigate', payload: { tab: 'notifications' } }] }
    if (q.includes('kritik')) {
      const critical = roleNotifs.filter((n) => n.severity === 'critical')
      if (critical.length === 0) return { text: 'Kritik bildirim bulunmuyor.', actions: [{ label: 'Bildirim Merkezi\'ne Git', type: 'navigate', payload: { tab: 'notifications' } }] }
      const list = critical.slice(0, 5).map((n) => `• [${n.type}] ${n.title} – ${n.severity}`).join('\n')
      return { text: `${critical.length} kritik bildirim:\n${list}`, actions: [{ label: 'Bildirim Merkezi\'ne Git', type: 'navigate', payload: { tab: 'notifications' } }] }
    }
    if (q.includes('sla')) {
      const sla = roleNotifs.filter((n) => n.type === 'SLA')
      if (sla.length === 0) return { text: 'SLA uyarısı bulunmuyor.', actions: [{ label: 'Bildirim Merkezi\'ne Git', type: 'navigate', payload: { tab: 'notifications' } }] }
      const list = sla.slice(0, 5).map((n) => `• ${n.title}`).join('\n')
      return { text: `${sla.length} SLA uyarısı:\n${list}`, actions: [{ label: 'Bildirim Merkezi\'ne Git', type: 'navigate', payload: { tab: 'notifications' } }] }
    }
    if (q.includes('okunmamış') || q.includes('unread')) {
      const unread = roleNotifs.filter((n) => n.status === 'unread')
      if (unread.length === 0) return { text: 'Okunmamış bildirim bulunmuyor.', actions: [{ label: 'Bildirim Merkezi\'ne Git', type: 'navigate', payload: { tab: 'notifications' } }] }
      const list = unread.slice(0, 5).map((n) => `• [${n.type}] ${n.title}`).join('\n')
      return { text: `${unread.length} okunmamış bildirim:\n${list}`, actions: [{ label: 'Bildirim Merkezi\'ne Git', type: 'navigate', payload: { tab: 'notifications' } }] }
    }
    if (q.includes('bugün') || q.includes('today')) {
      const today = roleNotifs.filter((n) => {
        const d = new Date(n.createdAt)
        return d.toDateString() === new Date().toDateString()
      })
      if (today.length === 0) return { text: 'Bugün oluşan bildirim bulunmuyor.', actions: [{ label: 'Bildirim Merkezi\'ne Git', type: 'navigate', payload: { tab: 'notifications' } }] }
      const list = today.slice(0, 5).map((n) => `• [${n.type}] ${n.title}`).join('\n')
      return { text: `${today.length} bugünkü bildirim:\n${list}`, actions: [{ label: 'Bildirim Merkezi\'ne Git', type: 'navigate', payload: { tab: 'notifications' } }] }
    }
    if (q.includes('güvenlik') || q.includes('security')) {
      const sec = roleNotifs.filter((n) => n.type === 'SECURITY')
      if (sec.length === 0) return { text: 'Güvenlik bildirimi bulunmuyor.', actions: [{ label: 'Bildirim Merkezi\'ne Git', type: 'navigate', payload: { tab: 'notifications' } }] }
      const list = sec.slice(0, 5).map((n) => `• ${n.title}`).join('\n')
      return { text: `${sec.length} güvenlik bildirimi:\n${list}`, actions: [{ label: 'Bildirim Merkezi\'ne Git', type: 'navigate', payload: { tab: 'notifications' } }] }
    }
    return {
      text: `Bildirim Durumu:\n• Toplam: ${roleNotifs.length}\n• Kritik: ${roleNotifs.filter((n) => n.severity === 'critical').length}\n• SLA: ${roleNotifs.filter((n) => n.type === 'SLA').length}\n• Okunmamış: ${roleNotifs.filter((n) => n.status === 'unread').length}`,
      actions: [{ label: 'Bildirim Merkezi\'ne Git', type: 'navigate', payload: { tab: 'notifications' } }]
    }
  }

  // Data Sources
  if (q.includes('kaynak') || q.includes('source') || q.includes('sync') || q.includes('senkronizasyon') || q.includes('veri merkezi')) {
    const sources = dataSources || []
    if (sources.length === 0) return { text: 'Henüz veri kaynağı yapılandırılmamış.', actions: [{ label: 'Veri Merkezi\'ne Git', type: 'navigate', payload: { tab: 'datahub' } }] }
    if (q.includes('hata') || q.includes('başarısız') || q.includes('failed') || q.includes('error')) {
      const failed = sources.filter((s) => s.status === 'ERROR' || s.lastError)
      if (failed.length === 0) return { text: 'Başarısız senkronizasyon bulunmuyor. Tüm kaynaklar aktif.', actions: [{ label: 'Veri Merkezi\'ne Git', type: 'navigate', payload: { tab: 'datahub' } }] }
      const list = failed.map((s) => `• [${s.status}] ${s.name} – ${s.lastError || 'Hata'}`).join('\n')
      return { text: `${failed.length} kaynak hata veriyor:\n${list}`, actions: [{ label: 'Veri Merkezi\'ne Git', type: 'navigate', payload: { tab: 'datahub' } }] }
    }
    if (q.includes('spk')) {
      const spk = sources.filter((s) => s.authority === 'SPK')
      if (spk.length === 0) return { text: 'SPK kaynağı bulunamadı.', actions: [{ label: 'Veri Merkezi\'ne Git', type: 'navigate', payload: { tab: 'datahub' } }] }
      const s = spk[0]
      return { text: `SPK (${s.name}):\n• Durum: ${s.status}\n• Son sync: ${s.lastSync ? `${Math.ceil((Date.now() - new Date(s.lastSync).getTime()) / 60000)} dk önce` : 'Bilinmiyor'}\n• Kayıt: ${s.recordsCount.toLocaleString('tr-TR')}`, actions: [{ label: 'Veri Merkezi\'ne Git', type: 'navigate', payload: { tab: 'datahub' } }] }
    }
    if (q.includes('bugün') || q.includes('today') || q.includes('güncelleme')) {
      const today = new Date().toDateString()
      const updatedToday = sources.filter((s) => s.lastSync && new Date(s.lastSync).toDateString() === today)
      if (updatedToday.length === 0) return { text: 'Bugün güncellenen kaynak bulunmuyor.', actions: [{ label: 'Veri Merkezi\'ne Git', type: 'navigate', payload: { tab: 'datahub' } }] }
      const list = updatedToday.map((s) => `• ${s.name} – ${s.recordsCount.toLocaleString('tr-TR')} kayıt`).join('\n')
      return { text: `Bugün ${updatedToday.length} kaynak güncellendi:\n${list}`, actions: [{ label: 'Veri Merkezi\'ne Git', type: 'navigate', payload: { tab: 'datahub' } }] }
    }
    if (q.includes('güncelleme') || q.includes('update')) {
      const sorted = [...sources].sort((a, b) => new Date(b.lastSync || 0).getTime() - new Date(a.lastSync || 0).getTime()).slice(0, 5)
      const list = sorted.map((s) => `• ${s.name} – ${s.lastSync ? `${Math.ceil((Date.now() - new Date(s.lastSync).getTime()) / 60000)} dk önce` : 'Bilinmiyor'}`).join('\n')
      return { text: `Son güncellemeler:\n${list}`, actions: [{ label: 'Veri Merkezi\'ne Git', type: 'navigate', payload: { tab: 'datahub' } }] }
    }
    return {
      text: `Veri Merkezi Durumu:\n• Toplam kaynak: ${sources.length}\n• Aktif: ${sources.filter((s) => s.status === 'ACTIVE').length}\n• Uyarı: ${sources.filter((s) => s.status === 'WARNING').length}\n• Hata: ${sources.filter((s) => s.status === 'ERROR').length}\n• Toplam kayıt: ${sources.reduce((sum, s) => sum + s.recordsCount, 0).toLocaleString('tr-TR')}`,
      actions: [{ label: 'Veri Merkezi\'ne Git', type: 'navigate', payload: { tab: 'datahub' } }]
    }
  }

  // Risk Engine
  if (q.includes('risk') || q.includes('riski') || q.includes('riskli') || q.includes('risk merkezi') || q.includes('önemli') || q.includes('kritik alan') || q.includes('önçelikli')) {
    const scores = riskScores || []
    if (scores.length === 0) return { text: 'Henüz risk skoru hesaplanmamış.', actions: [{ label: 'Risk Merkezi\'ne Git', type: 'navigate', payload: { tab: 'riskcenter' } }] }
    const stats = getRiskStats(scores)
    if (q.includes('en riskli') || q.includes('en yüksek') || q.includes('top risk')) {
      const top = getTopRisks(scores, 5)
      const list = top.map((r, i) => `• #${i + 1} [${getRiskLevel(r.score)}] ${r.entityTitle} (${r.score}) – ${r.trend === 'up' ? '↑ Artıyor' : r.trend === 'down' ? '↓ Azalıyor' : '→ Sabit'}`).join('\n')
      return { text: `En riskli 5 kayıt:\n${list}`, actions: [{ label: 'Risk Merkezi\'ne Git', type: 'navigate', payload: { tab: 'riskcenter' } }] }
    }
    if (q.includes('kritik') || q.includes('critical')) {
      const critical = scores.filter((r) => getRiskLevel(r.score) === 'Kritik')
      if (critical.length === 0) return { text: 'Kritik risk bulunmuyor.', actions: [{ label: 'Risk Merkezi\'ne Git', type: 'navigate', payload: { tab: 'riskcenter' } }] }
      const list = critical.slice(0, 5).map((r) => `• [${r.score}] ${r.entityTitle} (${r.entityType})`).join('\n')
      return { text: `${critical.length} kritik risk:\n${list}`, actions: [{ label: 'Risk Merkezi\'ne Git', type: 'navigate', payload: { tab: 'riskcenter' } }] }
    }
    if (q.includes('artan') || q.includes('artıyor') || q.includes('yüksel')) {
      const up = scores.filter((r) => r.trend === 'up')
      if (up.length === 0) return { text: 'Riski artan kayıt bulunmuyor.', actions: [{ label: 'Risk Merkezi\'ne Git', type: 'navigate', payload: { tab: 'riskcenter' } }] }
      const list = up.slice(0, 5).map((r) => `• [${r.score}] ${r.entityTitle}`).join('\n')
      return { text: `${up.length} kayıtta risk artıyor:\n${list}`, actions: [{ label: 'Risk Merkezi\'ne Git', type: 'navigate', payload: { tab: 'riskcenter' } }] }
    }
    if (q.includes('azalan') || q.includes('düşüyor')) {
      const down = scores.filter((r) => r.trend === 'down')
      if (down.length === 0) return { text: 'Riski azalan kayıt bulunmuyor.', actions: [{ label: 'Risk Merkezi\'ne Git', type: 'navigate', payload: { tab: 'riskcenter' } }] }
      const list = down.slice(0, 5).map((r) => `• [${r.score}] ${r.entityTitle}`).join('\n')
      return { text: `${down.length} kayıtta risk azalıyor:\n${list}`, actions: [{ label: 'Risk Merkezi\'ne Git', type: 'navigate', payload: { tab: 'riskcenter' } }] }
    }
    if (q.includes('trend') || q.includes('bu ay') || q.includes('son dönem')) {
      return {
        text: `Risk Trendi:\n• Artan: ${stats.increasing}\n• Azalan: ${stats.decreasing}\n• Sabit: ${stats.stable}\n• Ortalama skor: ${stats.average}`,
        actions: [{ label: 'Risk Merkezi\'ne Git', type: 'navigate', payload: { tab: 'riskcenter' } }]
      }
    }
    return {
      text: `Risk Durumu:\n• Toplam kayıt: ${stats.total}\n• Kritik: ${stats.critical}\n• Yüksek: ${stats.high}\n• Orta: ${stats.medium}\n• Düşük: ${stats.low}\n• Ortalama skor: ${stats.average}\n• Artan: ${stats.increasing} · Azalan: ${stats.decreasing} · Sabit: ${stats.stable}`,
      actions: [{ label: 'Risk Merkezi\'ne Git', type: 'navigate', payload: { tab: 'riskcenter' } }]
    }
  }

  // Policy / Procedure
  if (q.includes('politika') || q.includes('prosedür') || q.includes('talimat') || q.includes('doküman') || q.includes('policy')) {
    const allPolicies = policies || []
    if (allPolicies.length === 0) return { text: 'Henüz politika/prosedür kaydı bulunmuyor.', actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
    const stats = getPolicyStats(allPolicies)
    if (q.includes('revizyon') || q.includes('güncelleme') || q.includes('güncel')) {
      const rev = allPolicies.filter((p) => p.status === 'Revizyon Gerekli')
      if (rev.length === 0) return { text: 'Revizyon gereken politika bulunmuyor.', actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
      const list = rev.map((p) => `• [${p.riskLevel}] ${p.title} (${p.documentType}) – ${p.owner}`).join('\n')
      return { text: `${rev.length} politika revizyon gerektiriyor:\n${list}`, actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
    }
    if (q.includes('onay') || q.includes('bekliyor')) {
      const pending = allPolicies.filter((p) => p.status === 'Onay Bekliyor')
      if (pending.length === 0) return { text: 'Onay bekleyen politika bulunmuyor.', actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
      const list = pending.map((p) => `• ${p.title} (${p.documentType}) – ${p.owner}`).join('\n')
      return { text: `${pending.length} politika onay bekliyor:\n${list}`, actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
    }
    if (q.includes('spk')) {
      const spk = allPolicies.filter((p) => p.linkedRegulations.some((r) => r.toLowerCase().includes('spk')) || p.title.toLowerCase().includes('spk'))
      if (spk.length === 0) return { text: 'SPK ile ilişkili politika bulunamadı.', actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
      const list = spk.map((p) => `• ${p.title} – ${p.status} – v${p.version}`).join('\n')
      return { text: `SPK ile ilişkili ${spk.length} politika:\n${list}`, actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
    }
    if (q.includes('mkk')) {
      const mkk = allPolicies.filter((p) => p.linkedRegulations.some((r) => r.toLowerCase().includes('mkk')) || p.title.toLowerCase().includes('mkk'))
      if (mkk.length === 0) return { text: 'MKK ile ilişkili politika bulunamadı.', actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
      const mkkP = mkk[0]
      return { text: `MKK Politikası: ${mkkP.title}\n• Durum: ${mkkP.status}\n• Versiyon: ${mkkP.version}\n• Risk: ${mkkP.riskLevel}\n• Sahip: ${mkkP.owner}`, actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
    }
    if (q.includes('yaklaşan') || q.includes('review') || q.includes('gözden')) {
      const now = new Date().getTime()
      const thirtyDays = 30 * 24 * 60 * 60 * 1000
      const upcoming = allPolicies.filter((p) => {
        if (!p.nextReviewDate) return false
        const d = new Date(p.nextReviewDate).getTime()
        return !isNaN(d) && d >= now && d <= now + thirtyDays
      })
      if (upcoming.length === 0) return { text: 'Yaklaşan gözden geçirme bulunmuyor.', actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
      const list = upcoming.map((p) => `• ${p.title} – ${formatDateTR(p.nextReviewDate!)} – ${p.owner}`).join('\n')
      return { text: `${upcoming.length} politikanın gözden geçirme tarihi yaklaşıyor:\n${list}`, actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
    }
    if (q.includes('kritik')) {
      const crit = allPolicies.filter((p) => p.riskLevel === 'Kritik')
      if (crit.length === 0) return { text: 'Kritik politika bulunmuyor.', actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
      const list = crit.map((p) => `• ${p.title} – ${p.status} – ${p.owner}`).join('\n')
      return { text: `${crit.length} kritik politika:\n${list}`, actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }] }
    }
    return {
      text: `Politika Durumu:\n• Toplam: ${stats.total}\n• Yayında: ${stats.published}\n• Onay Bekleyen: ${stats.pendingApproval}\n• Revizyon Gerekli: ${stats.needsRevision}\n• Kritik: ${stats.critical}\n• Yaklaşan Review: ${stats.upcomingReview}`,
      actions: [{ label: 'Politika Merkezi\'ne Git', type: 'navigate', payload: { tab: 'policies' } }]
    }
  }

  // ─── CONTROL / TEST / FINDING INTENTS ───

  // Açık bulgular
  if (q.includes('açık bulgu') || q.includes('acik bulgu')) {
    const openFindings = findings.filter((f) => f.status === 'Open')
    if (openFindings.length === 0) return { text: 'Şu anda açık bulgu bulunmuyor. Tebrikler!' }
    const list = openFindings.slice(0, 5).map((f) => `• ${f.title} – ${f.severity} – ${f.owner}`).join('\n')
    return { text: `Şu anda ${openFindings.length} açık bulgu var:\n${list}`, actions: [{ label: 'Kontrol Merkezi\'ne Git', type: 'navigate', payload: { tab: 'controls' } }] }
  }

  // Kritik bulgular
  if (q.includes('kritik bulgu')) {
    const crit = findings.filter((f) => f.severity === 'Critical' && f.status !== 'Closed' && f.status !== 'Mitigated')
    if (crit.length === 0) return { text: 'Şu anda kritik bulgu bulunmuyor.' }
    const list = crit.map((f) => `• ${f.title} – ${f.owner} (Son: ${f.dueDate || 'Belirtilmemiş'})`).join('\n')
    return { text: `Şu anda ${crit.length} kritik bulgu var:\n${list}`, actions: [{ label: 'Kontrol Merkezi\'ne Git', type: 'navigate', payload: { tab: 'controls' } }] }
  }

  // Başarısız testler
  if (q.includes('başarısız test') || q.includes('basarisiz test')) {
    const failed = tests.filter((t) => t.result === 'Failed')
    if (failed.length === 0) return { text: 'Başarısız test bulunmuyor.' }
    const list = failed.slice(0, 5).map((t) => `• ${t.controlTitle} – Skor: ${t.score} – ${t.tester}`).join('\n')
    return { text: `${failed.length} başarısız test var:\n${list}`, actions: [{ label: 'Kontrol Merkezi\'ne Git', type: 'navigate', payload: { tab: 'controls' } }] }
  }

  // En riskli kontroller
  if (q.includes('en riskli kontrol') || q.includes('riskli kontrol')) {
    const highRisk = controls.filter((c) => c.active && (c.riskLevel === 'High' || c.riskLevel === 'Critical')).sort((a, b) => (a.riskLevel === 'Critical' ? 1 : 0) - (b.riskLevel === 'Critical' ? 1 : 0))
    if (highRisk.length === 0) return { text: 'Yüksek riskli aktif kontrol bulunmuyor.' }
    const list = highRisk.slice(0, 5).map((c) => `• ${c.title} – ${c.riskLevel} – ${c.owner}`).join('\n')
    return { text: `En riskli aktif kontroller:\n${list}`, actions: [{ label: 'Kontrol Merkezi\'ne Git', type: 'navigate', payload: { tab: 'controls' } }] }
  }

  // Bu ay kaç test başarısız
  if (q.includes('bu ay') && q.includes('başarısız')) {
    const thisMonth = new Date().getMonth()
    const thisYear = new Date().getFullYear()
    const failedThisMonth = tests.filter((t) => {
      const d = new Date(t.testDate)
      return t.result === 'Failed' && d.getMonth() === thisMonth && d.getFullYear() === thisYear
    })
    return { text: `Bu ay ${failedThisMonth.length} test başarısız oldu.`, actions: [{ label: 'Kontrol Merkezi\'ne Git', type: 'navigate', payload: { tab: 'controls' } }] }
  }

  // Kontrol durumu özet
  if (q.includes('kontrol durum') || q.includes('kontrol özeti')) {
    const cStats = getControlStats(controls)
    const tStats = getTestStats(tests)
    const fStats = getFindingStats(findings)
    return {
      text: `Kontrol Durumu:\n• Toplam Kontrol: ${cStats.total}\n• Aktif: ${cStats.active}\n• Başarısız Test: ${tStats.failed}\n• Kısmen Başarılı: ${tStats.partial}\n• Ortalama Skor: ${tStats.avgScore}\n• Açık Bulgu: ${fStats.open}\n• Kritik Bulgu: ${fStats.critical}`,
      actions: [{ label: 'Kontrol Merkezi\'ne Git', type: 'navigate', payload: { tab: 'controls' } }]
    }
  }

  // Fallback
  return {
    text: `Bu soruyu tam olarak anlayamadım. Şunları deneyebilirsiniz:\n• "Son 7 günde en kritik düzenlemeler neler?"\n• "Açık kritik görevleri listele"\n• "Geciken görevler kimde?"\n• "BDDK kredi kartı limitleriyle ilgili kararları bul"\n• "Toplam kayıt sayısı nedir?"\n• "Yönetici için kısa özet hazırla"\n• "Bugünkü kritik mutabakat farkları neler?"\n• "En yüksek riskli MKK uyuşmazlıkları listele"\n• "SLA aşımı olan mutabakatları göster"\n• "Bugünkü kritik Takasbank uyarıları neler?"\n• "Margin çağrıları var mı?"\n• "Limit aşımı olan hesapları göster"\n• "Bekleyen onaylar neler?"\n• "Bana atanmış onay var mı?"\n• "Kritik onay taleplerini listele"\n• "Açık vakalar neler?"\n• "Kritik vakaları göster"\n• "En yüksek riskli case hangisi?"\n• "Bekleyen workflow'lar neler?"\n• "SLA aşan onaylar hangileri?"\n• "Bu talep hangi aşamada?"\n• "Kritik workflow'ları göster"\n• "Son güvenlik olayları neler?"\n• "MFA pasif kullanıcı var mı?"\n• "Başarısız giriş denemelerini göster"\n• "Son rol değişiklikleri neler?"\n• "Kritik güvenlik olayı var mı?"\n• "Açık yükümlülükler neler?"\n• "Kritik yükümlülükleri göster"\n• "Geciken yükümlülükler hangileri?"\n• "Bu ay hangi yükümlülükler doluyor?"\n• "SPK yükümlülüklerini göster"\n• "BDDK yükümlülüklerini göster"\n• "En yüksek riskli yükümlülük hangisi?"\n• "Genel yükümlülük durumu nedir?"\n• "Eksik kanıtlı yükümlülükler neler?"\n• "Restricted dokümanları göster"\n• "Onay bekleyen kanıtlar var mı?"\n• "Bu ay eklenen kanıtlar neler?"\n• "SPK yükümlülüklerine bağlı kanıtlar neler?"\n• "Genel kanıt durumu nedir?"\n• "Son mevzuat değişiklikleri neler?"\n• "Kritik değişiklikler hangileri?"\n• "Hangi yükümlülükler etkilenmiş?"\n• "Bu değişiklik için hangi görevler açılmalı?"\n• "Önerilen yükümlülükleri göster"\n• "SPK değişikliklerini özetle"`,
    actions: [{ label: 'Genel Bakışa Git', type: 'navigate', payload: { tab: 'overview' } } as CopilotAction]
  }
}
