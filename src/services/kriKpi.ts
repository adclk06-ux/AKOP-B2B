import { fetchControls, fetchFindings, fetchTests } from '@/services/controls'
import { fetchRiskScores, getRiskStats } from '@/services/riskEngine'
import { fetchTasks, getTaskStats } from '@/services/tasks'

export type IndicatorCategory = 'Compliance' | 'Operation' | 'Risk'
export type IndicatorStatus = 'Good' | 'Watch' | 'Breach'
export type IndicatorTrend = 'up' | 'down' | 'stable'

export interface KriKpiIndicator {
  id: string
  name: string
  category: IndicatorCategory
  value: number
  target: number
  unit: '%' | 'adet' | 'skor'
  status: IndicatorStatus
  trend: IndicatorTrend
  owner: string
  description: string
}

function percent(value: number, total: number) {
  if (total === 0) return 0
  return Math.round((value / total) * 100)
}

function statusForHigherBetter(value: number, target: number): IndicatorStatus {
  if (value >= target) return 'Good'
  if (value >= target * 0.85) return 'Watch'
  return 'Breach'
}

function statusForLowerBetter(value: number, target: number): IndicatorStatus {
  if (value <= target) return 'Good'
  if (value <= target * 1.4) return 'Watch'
  return 'Breach'
}

export function fetchKriKpiIndicators(): KriKpiIndicator[] {
  const controls = fetchControls()
  const tests = fetchTests()
  const findings = fetchFindings()
  const tasks = fetchTasks()
  const risks = fetchRiskScores()
  const taskStats = getTaskStats(tasks)
  const riskStats = getRiskStats(risks)

  const passedTests = tests.filter((test) => test.result === 'Passed').length
  const failedOrPartialTests = tests.filter((test) => test.result !== 'Passed').length
  const activeControls = controls.filter((control) => control.active).length
  const highRiskFindings = findings.filter((finding) => finding.severity === 'High' || finding.severity === 'Critical').length
  const openFindings = findings.filter((finding) => finding.status === 'Open' || finding.status === 'In Progress').length
  const completedTasks = taskStats.completed
  const delayedTasks = taskStats.delayed
  const openTasks = taskStats.open + taskStats.inReview + taskStats.pendingApproval

  const controlEffectiveness = percent(passedTests, tests.length)
  const failedTestRate = percent(failedOrPartialTests, tests.length)
  const taskCompletionRate = percent(completedTasks, tasks.length)
  const delayedTaskRate = percent(delayedTasks, Math.max(tasks.length, 1))
  const openObligationProxy = Math.max(0, openTasks + openFindings)
  const highRiskRatio = percent(riskStats.critical + riskStats.high, riskStats.total)

  return [
    {
      id: 'KPI-COMP-001',
      name: 'Kontrol Etkinlik Oranı',
      category: 'Compliance',
      value: controlEffectiveness,
      target: 85,
      unit: '%',
      status: statusForHigherBetter(controlEffectiveness, 85),
      trend: controlEffectiveness >= 85 ? 'up' : 'down',
      owner: 'Uyum Departmanı',
      description: 'Başarılı kontrol testlerinin toplam testlere oranı.',
    },
    {
      id: 'KRI-COMP-002',
      name: 'Başarısız / Kısmi Test Oranı',
      category: 'Compliance',
      value: failedTestRate,
      target: 15,
      unit: '%',
      status: statusForLowerBetter(failedTestRate, 15),
      trend: failedTestRate > 15 ? 'up' : 'down',
      owner: 'İç Kontrol',
      description: 'Başarısız veya kısmi sonuçlanan testlerin oranı.',
    },
    {
      id: 'KPI-COMP-003',
      name: 'Aktif Kontrol Kapsamı',
      category: 'Compliance',
      value: activeControls,
      target: 8,
      unit: 'adet',
      status: statusForHigherBetter(activeControls, 8),
      trend: 'stable',
      owner: 'Kontrol Sahipleri',
      description: 'Aktif kontrol sayısı ve kontrol evreni kapsamı.',
    },
    {
      id: 'KPI-OPS-001',
      name: 'Görev Tamamlama Oranı',
      category: 'Operation',
      value: taskCompletionRate,
      target: 80,
      unit: '%',
      status: statusForHigherBetter(taskCompletionRate, 80),
      trend: taskCompletionRate >= 80 ? 'up' : 'stable',
      owner: 'Operasyon',
      description: 'Tamamlanan uyum görevlerinin toplam görevlere oranı.',
    },
    {
      id: 'KRI-OPS-002',
      name: 'Geciken Görev Oranı',
      category: 'Operation',
      value: delayedTaskRate,
      target: 10,
      unit: '%',
      status: statusForLowerBetter(delayedTaskRate, 10),
      trend: delayedTaskRate > 10 ? 'up' : 'down',
      owner: 'Operasyon',
      description: 'SLA tarihi geçmiş açık görevlerin oranı.',
    },
    {
      id: 'KRI-OPS-003',
      name: 'Açık Aksiyon Yükü',
      category: 'Operation',
      value: openObligationProxy,
      target: 12,
      unit: 'adet',
      status: statusForLowerBetter(openObligationProxy, 12),
      trend: openObligationProxy > 12 ? 'up' : 'stable',
      owner: 'Uyum Operasyon',
      description: 'Açık görev ve açık bulgu toplamı.',
    },
    {
      id: 'KRI-RISK-001',
      name: 'Ortalama Risk Skoru',
      category: 'Risk',
      value: riskStats.average,
      target: 60,
      unit: 'skor',
      status: statusForLowerBetter(riskStats.average, 60),
      trend: riskStats.increasing > riskStats.decreasing ? 'up' : 'down',
      owner: 'Risk Yönetimi',
      description: 'Tüm risk skorlarının ortalaması.',
    },
    {
      id: 'KRI-RISK-002',
      name: 'Kritik / Yüksek Risk Oranı',
      category: 'Risk',
      value: highRiskRatio,
      target: 35,
      unit: '%',
      status: statusForLowerBetter(highRiskRatio, 35),
      trend: highRiskRatio > 35 ? 'up' : 'stable',
      owner: 'Risk Yönetimi',
      description: 'Kritik ve yüksek seviyedeki risk kayıtlarının oranı.',
    },
    {
      id: 'KRI-RISK-003',
      name: 'Yüksek Öncelikli Bulgu',
      category: 'Risk',
      value: highRiskFindings,
      target: 4,
      unit: 'adet',
      status: statusForLowerBetter(highRiskFindings, 4),
      trend: highRiskFindings > 4 ? 'up' : 'stable',
      owner: 'İç Kontrol',
      description: 'Kritik ve yüksek şiddetteki kontrol bulguları.',
    },
  ]
}

export function getIndicatorStats(indicators: KriKpiIndicator[]) {
  return {
    total: indicators.length,
    good: indicators.filter((indicator) => indicator.status === 'Good').length,
    watch: indicators.filter((indicator) => indicator.status === 'Watch').length,
    breach: indicators.filter((indicator) => indicator.status === 'Breach').length,
    risingRisk: indicators.filter((indicator) => indicator.trend === 'up' && indicator.status !== 'Good').length,
  }
}

export function getIndicatorStatusBadgeClass(status: IndicatorStatus) {
  switch (status) {
    case 'Good': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'Watch': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Breach': return 'bg-rose-50 text-rose-700 border-rose-200/60'
  }
}

export function getIndicatorCategoryBadgeClass(category: IndicatorCategory) {
  switch (category) {
    case 'Compliance': return 'bg-indigo-50 text-indigo-700 border-indigo-200/60'
    case 'Operation': return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'Risk': return 'bg-rose-50 text-rose-700 border-rose-200/60'
  }
}
