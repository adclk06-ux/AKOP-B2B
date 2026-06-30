export type PlatformPhaseStatus = 'implemented' | 'foundation-ready' | 'planned'
export type PlatformPhaseGroup = 'critical-path' | 'administration' | 'continuity' | 'search' | 'saas' | 'integration' | 'analytics-ai'

export interface PlatformPhaseManifestItem {
  phase: number | 23.5
  title: string
  group: PlatformPhaseGroup
  status: PlatformPhaseStatus
  route?: string
  architecturePattern: string
  dataWeight: number
  screenWeight: number
}

export const criticalPathPhases: Array<number | 23.5> = [23.5, 24, 25, 26, 27, 28, 30, 31, 40, 48]

export const platformPhaseManifest: PlatformPhaseManifestItem[] = [
  { phase: 23.5, title: 'Navigation & UX Refactor', group: 'critical-path', status: 'implemented', architecturePattern: 'Accordion navigation + design tokens', dataWeight: 80, screenWeight: 20 },
  { phase: 24, title: 'Control Testing Center', group: 'critical-path', status: 'implemented', route: '/control-testing', architecturePattern: 'Control > Test > Result > Evidence matrix', dataWeight: 85, screenWeight: 15 },
  { phase: 25, title: 'KRI & KPI Management', group: 'critical-path', status: 'implemented', route: '/kri-kpi', architecturePattern: 'Indicator matrix + thresholds', dataWeight: 82, screenWeight: 18 },
  { phase: 26, title: 'CAPA Center', group: 'critical-path', status: 'implemented', route: '/capa', architecturePattern: 'Finding > RCA > Corrective > Preventive > Closure', dataWeight: 84, screenWeight: 16 },
  { phase: 27, title: 'Incident Management', group: 'critical-path', status: 'implemented', route: '/incidents', architecturePattern: 'Incident + RCA + audit trail', dataWeight: 82, screenWeight: 18 },
  { phase: 28, title: 'Vendor Risk Management', group: 'critical-path', status: 'implemented', route: '/vendor-risk', architecturePattern: 'Vendor inventory + due diligence', dataWeight: 80, screenWeight: 20 },
  { phase: 30, title: 'Real Integrations Breakpoint', group: 'critical-path', status: 'foundation-ready', route: '/real-integrations', architecturePattern: 'Source registry + cron + dedupe + notification', dataWeight: 90, screenWeight: 10 },
  { phase: 31, title: 'Compliance Calendar', group: 'critical-path', status: 'implemented', route: '/compliance-calendar', architecturePattern: 'Calendar item + owner + evidence', dataWeight: 78, screenWeight: 22 },
  { phase: 32, title: 'Customer Administration', group: 'administration', status: 'foundation-ready', route: '/users', architecturePattern: 'Admin board + RBAC table', dataWeight: 88, screenWeight: 12 },
  { phase: 37, title: 'Business Continuity Management', group: 'continuity', status: 'implemented', route: '/business-continuity', architecturePattern: 'Status cards + timeline + recovery evidence', dataWeight: 82, screenWeight: 18 },
  { phase: 38, title: 'Enterprise Search', group: 'search', status: 'implemented', route: '/enterprise-search', architecturePattern: 'Universal search + category filters', dataWeight: 86, screenWeight: 14 },
  { phase: 39, title: 'Dashboard Builder', group: 'search', status: 'foundation-ready', architecturePattern: '12-column drag-safe widget grid', dataWeight: 76, screenWeight: 24 },
  { phase: 41, title: 'Multi-Tenant SaaS', group: 'saas', status: 'foundation-ready', architecturePattern: 'Tenant-aware tokens + isolation model', dataWeight: 85, screenWeight: 15 },
  { phase: 42, title: 'Billing', group: 'saas', status: 'planned', architecturePattern: 'Plan entitlement + usage ledger', dataWeight: 88, screenWeight: 12 },
  { phase: 43, title: 'White Label Engine', group: 'saas', status: 'foundation-ready', architecturePattern: 'CSS variables + tenant branding', dataWeight: 70, screenWeight: 30 },
  { phase: 44, title: 'Customer Portal', group: 'saas', status: 'planned', architecturePattern: 'Tenant admin board', dataWeight: 82, screenWeight: 18 },
  { phase: 45, title: 'API Gateway', group: 'integration', status: 'foundation-ready', architecturePattern: 'Endpoint registry + API key governance', dataWeight: 92, screenWeight: 8 },
  { phase: 46, title: 'Integration Marketplace', group: 'integration', status: 'foundation-ready', architecturePattern: 'Integration cards + flow status grid', dataWeight: 78, screenWeight: 22 },
  { phase: 47, title: 'Advanced Analytics', group: 'analytics-ai', status: 'foundation-ready', architecturePattern: 'Trend boards + risk analytics', dataWeight: 88, screenWeight: 12 },
  { phase: 48, title: 'AI Agent Layer', group: 'critical-path', status: 'foundation-ready', architecturePattern: 'AI info boxes + governed autonomous actions', dataWeight: 84, screenWeight: 16 },
  { phase: 49, title: 'Autonomous Compliance Actions', group: 'analytics-ai', status: 'foundation-ready', architecturePattern: 'Obligation > task > approval > evidence chain', dataWeight: 90, screenWeight: 10 },
  { phase: 50, title: 'AKOP Enterprise Platform 1.0', group: 'critical-path', status: 'foundation-ready', architecturePattern: 'Unified GRC/RegTech operating system', dataWeight: 88, screenWeight: 12 },
]

export function getPhaseManifestByGroup(group: PlatformPhaseGroup) {
  return platformPhaseManifest.filter((item) => item.group === group)
}

export function isCriticalPathPhase(phase: number | 23.5) {
  return criticalPathPhases.includes(phase)
}
