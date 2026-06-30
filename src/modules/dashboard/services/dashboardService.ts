import type { DashboardMetric, DashboardLayout } from '../types/dashboard.types'

export async function fetchDashboardMetrics(): Promise<DashboardMetric[]> {
  const res = await fetch('/api/dashboard/metrics')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchDashboardLayout(): Promise<DashboardLayout> {
  const res = await fetch('/api/dashboard/layout')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function saveDashboardLayout(layout: DashboardLayout): Promise<void> {
  const res = await fetch('/api/dashboard/layout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(layout),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}
