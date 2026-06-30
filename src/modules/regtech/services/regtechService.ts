import type { SpkSource, ComplianceUpdate } from '../types/regtech.types'

export async function fetchSpkSources(): Promise<SpkSource[]> {
  const res = await fetch('/api/regtech/sources')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchComplianceUpdates(): Promise<ComplianceUpdate[]> {
  const res = await fetch('/api/regtech/updates')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
