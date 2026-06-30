import type { ReconciliationRun, ReconciliationResult } from '../types/reconciliation.types'

export async function fetchReconciliationRuns(): Promise<ReconciliationRun[]> {
  const res = await fetch('/api/reconciliation/runs')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function startReconciliation(formData: FormData): Promise<ReconciliationRun> {
  const res = await fetch('/api/reconciliation/start', {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchReconciliationResult(runId: string): Promise<ReconciliationResult> {
  const res = await fetch(`/api/reconciliation/runs/${runId}/result`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
