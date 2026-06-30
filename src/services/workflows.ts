export interface WorkflowStage {
  order: number
  role: string
  required: boolean
  slaHours: number
}

export interface WorkflowDefinition {
  id: string
  name: string
  sourceModule: string
  stages: WorkflowStage[]
  active: boolean
}

export interface ApprovalStageHistory {
  role: string
  user?: string
  action: 'ONAYLANDI' | 'REDDEDILDI' | 'REVIZYON_ISTENDI'
  notes?: string
  timestamp: string
}

export const WORKFLOW_DEFINITIONS: WorkflowDefinition[] = [
  {
    id: 'wf-mkk-close',
    name: 'MKK Kapanış Workflow',
    sourceModule: 'MKK_MUTABAKAT',
    stages: [
      { order: 1, role: 'Operasyon Uzmanı', required: true, slaHours: 24 },
      { order: 2, role: 'Uyum Uzmanı', required: true, slaHours: 24 },
      { order: 3, role: 'Yönetici', required: true, slaHours: 48 },
    ],
    active: true,
  },
  {
    id: 'wf-takasbank-critical',
    name: 'Takasbank Kritik Risk Workflow',
    sourceModule: 'TAKASBANK',
    stages: [
      { order: 1, role: 'Operasyon Uzmanı', required: true, slaHours: 24 },
      { order: 2, role: 'Uyum Uzmanı', required: true, slaHours: 24 },
      { order: 3, role: 'Yönetici', required: true, slaHours: 48 },
      { order: 4, role: 'Denetçi', required: true, slaHours: 72 },
    ],
    active: true,
  },
  {
    id: 'wf-regtech-approval',
    name: 'RegTech Yönetici Onayı',
    sourceModule: 'REGTECH',
    stages: [
      { order: 1, role: 'Uyum Uzmanı', required: true, slaHours: 24 },
      { order: 2, role: 'Yönetici', required: true, slaHours: 48 },
    ],
    active: true,
  },
  {
    id: 'wf-task-approval',
    name: 'Görev Onay Workflow',
    sourceModule: 'TASK',
    stages: [
      { order: 1, role: 'Uyum Uzmanı', required: true, slaHours: 24 },
      { order: 2, role: 'Yönetici', required: true, slaHours: 48 },
    ],
    active: true,
  },
  {
    id: 'wf-approval-generic',
    name: 'Genel Onay Workflow',
    sourceModule: 'APPROVAL',
    stages: [
      { order: 1, role: 'Uyum Uzmanı', required: true, slaHours: 24 },
      { order: 2, role: 'Yönetici', required: true, slaHours: 48 },
    ],
    active: true,
  },
]

export function findWorkflowForModule(sourceModule: string): WorkflowDefinition | undefined {
  return WORKFLOW_DEFINITIONS.find((w) => w.sourceModule === sourceModule && w.active)
}

export function calculateSLADeadline(stage: WorkflowStage): string {
  return new Date(Date.now() + stage.slaHours * 60 * 60 * 1000).toISOString()
}

export function isSLABreached(slaDeadline: string): boolean {
  return new Date() > new Date(slaDeadline)
}

export function calculateWorkflowProgress(currentStage: number, totalStages: number): number {
  if (totalStages <= 0) return 0
  return Math.round(((currentStage - 1) / totalStages) * 100)
}

export function getNextStage(def: WorkflowDefinition, currentOrder: number): WorkflowStage | undefined {
  return def.stages.find((s) => s.order === currentOrder + 1)
}

export function getStageByOrder(def: WorkflowDefinition, order: number): WorkflowStage | undefined {
  return def.stages.find((s) => s.order === order)
}

export function getWorkflowStats(requests: { workflowId?: string; currentStage?: number; totalStages?: number; status: string; slaDeadline?: string }[]) {
  const withWorkflow = requests.filter((r) => r.workflowId && r.totalStages && r.totalStages > 1)
  const pending = withWorkflow.filter((r) => r.status === 'Beklemede')
  const slaBreaches = pending.filter((r) => r.slaDeadline && isSLABreached(r.slaDeadline))
  const critical = pending.filter((r) => r.currentStage && r.totalStages && r.currentStage >= r.totalStages - 1)
  const avgTime = withWorkflow.filter((r) => r.status === 'Onaylandı').length

  return {
    totalWorkflows: withWorkflow.length,
    pendingWorkflows: pending.length,
    slaBreaches: slaBreaches.length,
    criticalWorkflows: critical.length,
    completedWorkflows: withWorkflow.filter((r) => r.status === 'Onaylandı').length,
    avgCompletionTime: avgTime,
  }
}

export function getWorkflowProgressColor(progress: number): string {
  if (progress >= 100) return 'bg-emerald-500'
  if (progress >= 75) return 'bg-emerald-400'
  if (progress >= 50) return 'bg-blue-500'
  if (progress >= 25) return 'bg-amber-500'
  return 'bg-slate-400'
}
