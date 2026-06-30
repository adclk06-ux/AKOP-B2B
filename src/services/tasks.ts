export type TaskStatus = 'Açık' | 'İncelemede' | 'Onay Bekliyor' | 'Tamamlandı' | 'Ertelendi'
export type TaskRisk = 'Düşük' | 'Orta' | 'Yüksek' | 'Kritik'
export type TaskAuthority = 'SPK' | 'BDDK' | 'MASAK' | 'MKK' | 'TAKASBANK' | 'Kontrol'

export interface ComplianceTask {
  id: string
  title: string
  authority: TaskAuthority
  regulationId?: string
  regulationTitle?: string
  riskLevel: TaskRisk
  assignedTo: string
  dueDate: string
  status: TaskStatus
  notes?: string
  evidenceFiles?: string[]
  affectedOperations?: string[]
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'akop_compliance_tasks_v1'

function loadTasks(): ComplianceTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ComplianceTask[]
  } catch {
    return []
  }
}

function saveTasks(tasks: ComplianceTask[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}

export function fetchTasks(): ComplianceTask[] {
  return loadTasks()
}

export function createTask(task: Omit<ComplianceTask, 'id' | 'createdAt' | 'updatedAt'>): ComplianceTask {
  const tasks = loadTasks()
  const now = new Date().toISOString()
  const newTask: ComplianceTask = {
    ...task,
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: now,
    updatedAt: now,
  }
  tasks.push(newTask)
  saveTasks(tasks)
  return newTask
}

export function updateTask(id: string, patch: Partial<Omit<ComplianceTask, 'id' | 'createdAt'>>): ComplianceTask | null {
  const tasks = loadTasks()
  const idx = tasks.findIndex((t) => t.id === id)
  if (idx === -1) return null
  tasks[idx] = { ...tasks[idx], ...patch, updatedAt: new Date().toISOString() }
  saveTasks(tasks)
  return tasks[idx]
}

export function deleteTask(id: string): boolean {
  const tasks = loadTasks()
  const filtered = tasks.filter((t) => t.id !== id)
  if (filtered.length === tasks.length) return false
  saveTasks(filtered)
  return true
}

export function getTaskStats(tasks: ComplianceTask[]) {
  const now = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  return {
    total: tasks.length,
    open: tasks.filter((t) => t.status === 'Açık').length,
    inReview: tasks.filter((t) => t.status === 'İncelemede').length,
    pendingApproval: tasks.filter((t) => t.status === 'Onay Bekliyor').length,
    completed: tasks.filter((t) => t.status === 'Tamamlandı').length,
    delayed: tasks.filter((t) => t.status !== 'Tamamlandı' && t.status !== 'Ertelendi' && t.dueDate < todayStr).length,
    critical: tasks.filter((t) => t.riskLevel === 'Kritik').length,
    completedThisWeek: tasks.filter((t) => {
      if (t.status !== 'Tamamlandı') return false
      const updated = new Date(t.updatedAt)
      return updated >= weekAgo
    }).length,
  }
}

export function isTaskOverdue(task: ComplianceTask): boolean {
  if (task.status === 'Tamamlandı' || task.status === 'Ertelendi') return false
  const today = new Date().toISOString().split('T')[0]
  return task.dueDate < today
}

export function getTaskStatusBadgeClass(status: TaskStatus) {
  switch (status) {
    case 'Açık': return 'bg-blue-50 text-blue-700 border-blue-200/60'
    case 'İncelemede': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Onay Bekliyor': return 'bg-violet-50 text-violet-700 border-violet-200/60'
    case 'Tamamlandı': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
    case 'Ertelendi': return 'bg-slate-50 text-slate-600 border-slate-200/60'
  }
}

export function getTaskRiskBadgeClass(risk: TaskRisk) {
  switch (risk) {
    case 'Kritik': return 'bg-rose-50 text-rose-700 border-rose-200/60'
    case 'Yüksek': return 'bg-orange-50 text-orange-700 border-orange-200/60'
    case 'Orta': return 'bg-amber-50 text-amber-700 border-amber-200/60'
    case 'Düşük': return 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
  }
}
