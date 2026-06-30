export interface ReconciliationRun {
  id: string
  name: string
  status: 'running' | 'completed' | 'failed'
  matchedCount: number
  unmatchedCount: number
  totalCount: number
  startedAt: string
  completedAt?: string
}

export interface ReconciliationResult {
  runId: string
  records: Array<{
    id: string
    leftValue: unknown
    rightValue: unknown
    difference?: string
    status: 'matched' | 'unmatched' | 'partial'
  }>
}
