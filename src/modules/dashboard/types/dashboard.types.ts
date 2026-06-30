export interface DashboardMetric {
  id: string
  label: string
  value: number | string
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  period?: string
}

export interface DashboardWidget {
  id: string
  type: 'chart' | 'table' | 'summary' | 'alert'
  title: string
  module: string
  config?: Record<string, unknown>
}

export interface DashboardLayout {
  widgets: DashboardWidget[]
  columns: number
  refreshInterval?: number
}
