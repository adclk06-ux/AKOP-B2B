export interface SpkSource {
  name: string
  type: 'bulletin' | 'regulation' | 'announcement'
  url: string
  status: 'ok' | 'fallback' | 'error'
  latestTitle: string
  latestDate: string
}

export interface ComplianceUpdate {
  id: string
  source: string
  title: string
  url: string
  impact: 'low' | 'medium' | 'high' | 'critical'
  summary: string
  detectedAt: string
  requiresComplianceReview: boolean
}
