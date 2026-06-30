import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  CheckCircle, AlertTriangle, Bell,
  RefreshCw, ExternalLink, Loader2, BookOpen,
  Lightbulb, FilterX, Archive, Sparkles,
  Megaphone, Scale, Landmark,
  Database, ShieldAlert, Building2, Globe2,
  FileText, MoreVertical, LayoutDashboard,
  ClipboardList, MessageSquare, BrainCircuit,
  Inbox, Lock, Check, Eye, Flag, Plus,
  Calendar, X, Users, LogOut, UserCircle,
  Clock, ShieldCheck, Shield, Activity, Flame, Grid3x3,
  GitBranch, FileBarChart, ClipboardCheck, BriefcaseBusiness, Key, FolderLock,
  ScanSearch, DatabaseZap, Plug, Server, TrendingUp, FileCheck,
  AlertOctagon, FileWarning, BarChart3, Play, Pencil, MoreHorizontal,
} from 'lucide-react'
import { fetchSpkSyncStatus, fetchSpkArchive, fetchRegulatoryArchive, type SpkSyncStatus, type SpkArchiveRecord, type RegulatoryArchiveResponse, analyzeSpkBulletin, analyzeSpkBulletinWithPdf, type SpkBulletinAnalysis } from '@/services/spkSync'
import { getCurrentUser, loginUser, logoutUser, getUsers, updateUser, getUserPermissions, getRoleBadgeClass, type User, type UserRole } from '@/services/auth'
import { Fragment } from 'react'
import { calculateRegulatoryRisk, getRiskBadgeClass } from '@/services/regulatoryRisk'
import { calculateOperationalImpact, getAreaImpactLevel, getAreaImpactBadgeClass, type OperationArea } from '@/services/operationalImpact'
import { getRegTechSuggestions } from '@/services/silentAdvisor'
import { addAuditLog, getAuditLogs, getAuditStats, getSeverityBadgeClass, getEntityBadgeClass } from '@/services/auditTrail'
import { askCopilot, type CopilotMessage, type CopilotAction } from '@/services/copilot'
import { fetchNotifications, generateSystemNotifications, markNotificationRead, markAllNotificationsRead, archiveNotification, getNotificationStats, getSeverityBadgeClass as getNotifSeverityBadgeClass, getNotificationTypeBadgeClass, type NotificationItem, type NotificationStatus } from '@/services/notificationsCenter'
import { fetchTasks as loadTasksFromStorage, createTask, updateTask, deleteTask, getTaskStats, isTaskOverdue, getTaskStatusBadgeClass, getTaskRiskBadgeClass, type ComplianceTask, type TaskStatus, type TaskRisk, type TaskAuthority } from '@/services/tasks'
import { demoReconciliations, getReconciliationStats, getRiskBadgeClass as getReconRiskBadgeClass, getStatusBadgeClass as getReconStatusBadgeClass, type ReconciliationRecord, type ReconciliationType, type ReconciliationStatus, type ReconciliationRisk } from '@/services/reconciliation'
import { demoTakasbankAlerts, getTakasbankStats, getTakasbankRiskBadgeClass, getTakasbankStatusBadgeClass, type TakasbankAlert, type TakasbankAlertType, type TakasbankAlertStatus, type TakasbankAlertRisk } from '@/services/takasbank'
import { seedDemoApprovals, createApprovalRequest, approveRequest, rejectRequest, requestRevision, approveStage, rejectStage, requestRevisionStage, getApprovalStats, getApprovalStatusBadgeClass, getApprovalPriorityBadgeClass, getWorkflowProgress, type ApprovalRequest, type ApprovalStatus, type ApprovalPriority } from '@/services/approvals'
import { findWorkflowForModule, getWorkflowStats, getWorkflowProgressColor } from '@/services/workflows'
import { seedDemoCases, createCase, closeCase, archiveCase, getCaseStats, getCaseStatusBadgeClass, getCasePriorityBadgeClass, getCaseRiskBadgeClass, type Case as CaseItem, type CaseStatus as CaseStatusType, type CasePriority as CasePriorityType, type CaseRisk as CaseRiskType } from '@/services/cases'
import { fetchSecuritySessions, fetchLoginRecords, fetchMFAStatuses, fetchApiKeys, fetchSecurityPolicies, terminateSession, requireMFA, resetMFA, rotateApiKey, revokeApiKey, getSecurityStats, getPolicyStatusBadgeClass as getSecurityPolicyStatusBadgeClass, type SecuritySession, type LoginRecord, type MFAStatus, type ApiKey, type SecurityPolicy } from '@/services/security'
import { seedDemoObligations, createObligation, completeObligation, getObligationStats, getObligationRiskBadgeClass, getObligationStatusBadgeClass, type ComplianceObligation, type ObligationAuthority, type ObligationRisk, type ObligationStatus } from '@/services/obligations'
import { fetchEvidenceDocuments, createEvidenceDocument, updateEvidenceDocument, archiveEvidenceDocument, getEvidenceStats, getClassificationBadgeClass, getEvidenceStatusBadgeClass, type EvidenceDocument, type EvidenceClassification, type EvidenceStatus as EvidenceStatusType, type EvidenceLinkedEntityType } from '@/services/evidence'
import { fetchRegulationVersions, fetchRegulationChanges, fetchImpactChains, getRegIntelStats, getChangeTypeBadgeClass, getImpactBadgeClass, type RegulationVersion, type RegulationChange, type RegulatoryImpactChain, type ChangeType, type ImpactLevel } from '@/services/regulatoryIntelligence'
import { fetchDataSources, syncDataSource, syncAllDataSources, toggleDataSource, updateDataSource, getDataSourceStats, getStatusBadgeClass, getSourceTypeBadgeClass, getNewRecordsSince, type DataSource } from '@/services/datasources'
import { fetchRiskScores, recalculateAllRisks, getRiskStats, getTopRisks, getRiskLevel, getRiskLevelBadgeClass, getTrendIndicator, getRisksByAuthority, type RiskScore } from '@/services/riskEngine'
import { fetchPolicies, getPolicyStats, getPolicyStatusBadgeClass, getPolicyTypeBadgeClass, getPolicyRiskBadgeClass, submitPolicyForApproval, markPolicyPublished, archivePolicy, startPolicyRevision, type PolicyDocument, type PolicyStatus, type PolicyDocumentType, type PolicyRiskLevel } from '@/services/policies'
import { fetchControls, fetchTests, fetchFindings, getControlStats, getTestStats, getFindingStats, getTestsForControl, getFindingsForTest, getControlRiskBadgeClass, getControlTypeBadgeClass, getTestResultBadgeClass, getFindingSeverityBadgeClass, getFindingStatusBadgeClass, getScoreColor, archiveControl, createTest, closeFinding, type ControlDefinition, type ControlTest, type Finding, type ControlType, type ControlFrequency, type ControlRiskLevel, type TestResult, type FindingSeverity, type FindingStatus } from '@/services/controls'
import { adverseMediaSignals, getIntelligenceStats, getRiskToneClass, liveTransactionSignals, riskMatrixEntities, workflowRules } from '@/services/regtechIntelligence'

type TabKey = 'overview' | 'spk' | 'bddk' | 'masak' | 'global' | 'notifications' | 'datahub' | 'riskcenter' | 'policies' | 'controls' | 'tasks' | 'ai' | 'users' | 'audit' | 'document' | 'copilot' | 'timeline' | 'reconciliation' | 'takasbank' | 'approval' | 'casecenter' | 'security' | 'obligations' | 'evidence' | 'regintel' | 'riskradar'

const allTabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: 'overview', label: 'Genel Bakış', icon: LayoutDashboard },
  { key: 'spk', label: 'SPK', icon: Landmark },
  { key: 'bddk', label: 'BDDK', icon: Building2 },
  { key: 'masak', label: 'MASAK', icon: Lock },
  { key: 'global', label: 'Global Regülatörler', icon: Globe2 },
  { key: 'notifications', label: 'Bildirim Merkezi', icon: MessageSquare },
  { key: 'datahub', label: 'Veri Merkezi', icon: DatabaseZap },
  { key: 'riskcenter', label: 'Risk Merkezi', icon: ShieldAlert },
  { key: 'policies', label: 'Politika Merkezi', icon: FileCheck },
  { key: 'controls', label: 'Kontrol Merkezi', icon: ShieldCheck },
  { key: 'tasks', label: 'Uyum Görevleri', icon: ClipboardList },
  { key: 'ai', label: 'AI Analiz', icon: BrainCircuit },
  { key: 'document', label: 'Belge İnceleme', icon: FileText },
  { key: 'timeline', label: 'Timeline', icon: GitBranch },
  { key: 'copilot', label: 'AKOP Copilot', icon: BrainCircuit },
  { key: 'reconciliation', label: 'MKK Mutabakat', icon: Database },
  { key: 'takasbank', label: 'Takasbank İzleme', icon: ShieldCheck },
  { key: 'approval', label: 'Onay Merkezi', icon: ClipboardCheck },
  { key: 'casecenter', label: 'Case Center', icon: BriefcaseBusiness },
  { key: 'obligations', label: 'Yükümlülük Merkezi', icon: ClipboardList },
  { key: 'security', label: 'Security Center', icon: Shield },
  { key: 'evidence', label: 'Kanıt Kasası', icon: FolderLock },
  { key: 'regintel', label: 'RegIntel', icon: ScanSearch },
  { key: 'riskradar', label: 'AI Risk Radar', icon: BrainCircuit },
  { key: 'users', label: 'Kullanıcı Yönetimi', icon: Users },
  { key: 'audit', label: 'Denetim Kayıtları', icon: Archive },
]

type CategoryKey = 'executive' | 'regulation' | 'operation' | 'governance' | 'ai'

const categoryConfig: { key: CategoryKey; label: string; modules: TabKey[] }[] = [
  { key: 'executive', label: 'Yönetici', modules: ['overview', 'riskcenter', 'notifications'] },
  { key: 'regulation', label: 'Regülasyon & Uyum', modules: ['spk', 'bddk', 'masak', 'global', 'regintel', 'riskradar', 'obligations', 'policies'] },
  { key: 'operation', label: 'Operasyon', modules: ['reconciliation', 'takasbank', 'controls', 'casecenter', 'tasks'] },
  { key: 'governance', label: 'Yönetişim', modules: ['approval', 'audit', 'security', 'evidence', 'datahub', 'users'] },
  { key: 'ai', label: 'AI', modules: ['copilot', 'ai', 'document', 'timeline'] },
]

const tabToCategory: Record<TabKey, CategoryKey> = {
  overview: 'executive', riskcenter: 'executive', notifications: 'executive',
  spk: 'regulation', bddk: 'regulation', masak: 'regulation', global: 'regulation', regintel: 'regulation', riskradar: 'regulation', obligations: 'regulation', policies: 'regulation',
  reconciliation: 'operation', takasbank: 'operation', controls: 'operation', casecenter: 'operation', tasks: 'operation',
  approval: 'governance', audit: 'governance', security: 'governance', evidence: 'governance', datahub: 'governance', users: 'governance',
  copilot: 'ai', ai: 'ai', document: 'ai', timeline: 'ai',
}

export default function RegTechDashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [activeCategory, setActiveCategory] = useState<CategoryKey>('executive')
  const [spkData, setSpkData] = useState<SpkSyncStatus | null>(null)
  const [spkLoading, setSpkLoading] = useState(false)
  const [analysisByRecordId, setAnalysisByRecordId] = useState<Record<string, SpkBulletinAnalysis & { loading: boolean }>>({})
  const [complianceFilter, setComplianceFilter] = useState(false)
  const [highlightedSource] = useState<string | null>(null)
  const [selectedArchiveYear, setSelectedArchiveYear] = useState<string>('all')
  const [archiveLimit, setArchiveLimit] = useState<number>(1500)
  const [selectedSourceType, setSelectedSourceType] = useState<string>('all')
  const [authorityFilter, _setAuthorityFilter] = useState<'all' | 'spk' | 'bddk'>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [regulatoryArchive, setRegulatoryArchive] = useState<RegulatoryArchiveResponse | null>(null)

  // Notifications state
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => fetchNotifications())
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'critical' | 'sla' | 'approval' | 'obligation' | 'regintel' | 'mkk' | 'takasbank' | 'security' | 'policy' | 'control' | 'test' | 'finding'>('all')

  // Data Hub state
  const [dataSources, setDataSources] = useState<DataSource[]>(() => fetchDataSources())
  const [dataHubFilter, setDataHubFilter] = useState<'all' | 'active' | 'warning' | 'error' | 'disabled'>('all')
  const [dataHubSyncing, setDataHubSyncing] = useState<string | null>(null)

  // Risk Engine state
  const [riskScores, setRiskScores] = useState<RiskScore[]>(() => fetchRiskScores())
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')
  const [riskTrendFilter, setRiskTrendFilter] = useState<'all' | 'up' | 'down' | 'stable'>('all')
  const [riskRecalculating, setRiskRecalculating] = useState(false)

  // Policy state
  const [policies, setPolicies] = useState<PolicyDocument[]>(() => fetchPolicies())
  const [policySearch, setPolicySearch] = useState('')
  const [policyTypeFilter, setPolicyTypeFilter] = useState<'all' | PolicyDocumentType>('all')
  const [policyStatusFilter, setPolicyStatusFilter] = useState<'all' | PolicyStatus>('all')
  const [policyRiskFilter, setPolicyRiskFilter] = useState<'all' | PolicyRiskLevel>('all')
  const [policyDeptFilter, setPolicyDeptFilter] = useState<string>('all')
  const [policyDetail, setPolicyDetail] = useState<PolicyDocument | null>(null)
  const [policyDropdownId, setPolicyDropdownId] = useState<string | null>(null)

  // Controls state
  const [controls, setControls] = useState<ControlDefinition[]>(() => fetchControls())
  const [controlTests, setControlTests] = useState<ControlTest[]>(() => fetchTests())
  const [findings, setFindings] = useState<Finding[]>(() => fetchFindings())
  const [controlSubTab, setControlSubTab] = useState<'controls' | 'tests' | 'findings'>('controls')
  const [controlSearch, setControlSearch] = useState('')
  const [controlTypeFilter, setControlTypeFilter] = useState<'all' | ControlType>('all')
  const [controlRiskFilter, setControlRiskFilter] = useState<'all' | ControlRiskLevel>('all')
  const [controlFreqFilter, setControlFreqFilter] = useState<'all' | ControlFrequency>('all')
  const [controlActiveFilter, setControlActiveFilter] = useState<'all' | 'active' | 'inactive'>('active')
  const [controlDetail, setControlDetail] = useState<ControlDefinition | null>(null)
  const [testDetail, setTestDetail] = useState<ControlTest | null>(null)
  const [findingDetail, setFindingDetail] = useState<Finding | null>(null)
  const [controlDropdownId, setControlDropdownId] = useState<string | null>(null)
  const [testResultFilter, setTestResultFilter] = useState<'all' | TestResult>('all')
  const [findingSeverityFilter, setFindingSeverityFilter] = useState<'all' | FindingSeverity>('all')
  const [findingStatusFilter, setFindingStatusFilter] = useState<'all' | FindingStatus>('all')

  // AI Analysis tab state
  const [aiSelectedRecord, setAiSelectedRecord] = useState<SpkArchiveRecord | null>(null)
  const [aiSelectedAuthority, setAiSelectedAuthority] = useState<'all' | 'SPK' | 'BDDK'>('all')
  const [aiAnalysisType, setAiAnalysisType] = useState<string>('summary')
  const [aiResult, setAiResult] = useState<SpkBulletinAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  // Tasks state
  const [tasks, setTasks] = useState<ComplianceTask[]>(() => loadTasksFromStorage())
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskModalRecord, setTaskModalRecord] = useState<SpkArchiveRecord | null>(null)
  const [taskFormTitle, setTaskFormTitle] = useState('')
  const [taskFormAssignedTo, setTaskFormAssignedTo] = useState('')
  const [taskFormDueDate, setTaskFormDueDate] = useState('')
  const [taskFormRisk, setTaskFormRisk] = useState<TaskRisk>('Orta')
  const [taskFormNotes, setTaskFormNotes] = useState('')
  const [taskFilter, setTaskFilter] = useState<'all' | 'open' | 'critical' | 'delayed'>('all')

  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser())
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [authToast, setAuthToast] = useState('')

  // Audit state
  const [auditFilter, setAuditFilter] = useState<'all' | 'critical' | 'user' | 'task' | 'ai' | 'system'>('all')

  // Document workspace state
  const [workspaceRecord, setWorkspaceRecord] = useState<SpkArchiveRecord | null>(null)
  const [workspaceAnalysis, setWorkspaceAnalysis] = useState<SpkBulletinAnalysis | null>(null)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)

  // Copilot state
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    { role: 'assistant', text: 'Merhaba! Ben AKOP Copilot. SPK/BDDK düzenlemeleri, uyum görevleri, risk analizi ve operasyon etkileri hakkında sorularınızı yanıtlayabilirim. Nasıl yardımcı olabilirim?', timestamp: new Date().toISOString() }
  ])
  const [copilotInput, setCopilotInput] = useState('')
  const [copilotLoading, setCopilotLoading] = useState(false)

  // Executive Mode
  const [executiveMode, setExecutiveMode] = useState(false)

  // Timeline state
  const [timelineRecord, setTimelineRecord] = useState<SpkArchiveRecord | null>(null)

  // Board Report state
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [reportPeriod, setReportPeriod] = useState<'7days' | '30days' | 'month' | 'all'>('7days')
  const [reportSections, setReportSections] = useState({
    summary: true, riskMap: true, criticalRegs: true, openTasks: true, delayedTasks: true, opImpact: true, auditSummary: true, riskSummary: true, policySummary: true, controlSummary: true,
  })

  // MKK Reconciliation state
  const [reconciliationRecords] = useState<ReconciliationRecord[]>(demoReconciliations)
  const [reconFilterType, setReconFilterType] = useState<ReconciliationType | 'all'>('all')
  const [reconFilterStatus, setReconFilterStatus] = useState<ReconciliationStatus | 'all'>('all')
  const [reconFilterRisk, setReconFilterRisk] = useState<ReconciliationRisk | 'all'>('all')
  const [reconSearch, setReconSearch] = useState('')
  const [reconDetailRecord, setReconDetailRecord] = useState<ReconciliationRecord | null>(null)
  const [reconOpenDropdownId, setReconOpenDropdownId] = useState<string | null>(null)
  const reconDropdownRef = useRef<HTMLDivElement | null>(null)

  // Takasbank state
  const [takasbankAlerts] = useState<TakasbankAlert[]>(demoTakasbankAlerts)
  const [takasFilterType, setTakasFilterType] = useState<TakasbankAlertType | 'all'>('all')
  const [takasFilterStatus, setTakasFilterStatus] = useState<TakasbankAlertStatus | 'all'>('all')
  const [takasFilterRisk, setTakasFilterRisk] = useState<TakasbankAlertRisk | 'all'>('all')
  const [takasSearch, setTakasSearch] = useState('')
  const [takasDetailAlert, setTakasDetailAlert] = useState<TakasbankAlert | null>(null)
  const [takasOpenDropdownId, setTakasOpenDropdownId] = useState<string | null>(null)

  // Approval state
  const [approvalRequests, setApprovalRequests] = useState<ApprovalRequest[]>(() => seedDemoApprovals())
  const [approvalFilterStatus, setApprovalFilterStatus] = useState<ApprovalStatus | 'all'>('all')
  const [approvalFilterPriority, setApprovalFilterPriority] = useState<ApprovalPriority | 'all'>('all')
  const [approvalFilterMine, setApprovalFilterMine] = useState(false)
  const [approvalSearch, setApprovalSearch] = useState('')
  const [approvalDetail, setApprovalDetail] = useState<ApprovalRequest | null>(null)
  const [approvalOpenDropdownId, setApprovalOpenDropdownId] = useState<string | null>(null)
  const [approvalActionNote, setApprovalActionNote] = useState('')

  // Case state
  const [cases, setCases] = useState<CaseItem[]>(() => seedDemoCases())
  const [caseFilterStatus, setCaseFilterStatus] = useState<CaseStatusType | 'all'>('all')
  const [caseFilterPriority, setCaseFilterPriority] = useState<CasePriorityType | 'all'>('all')
  const [caseFilterRisk, setCaseFilterRisk] = useState<CaseRiskType | 'all'>('all')
  const [caseSearch, setCaseSearch] = useState('')
  const [caseDetail, setCaseDetail] = useState<CaseItem | null>(null)
  const [caseOpenDropdownId, setCaseOpenDropdownId] = useState<string | null>(null)

  // Security state
  const [securitySessions, setSecuritySessions] = useState<SecuritySession[]>(() => fetchSecuritySessions())
  const [loginRecords] = useState<LoginRecord[]>(() => fetchLoginRecords())
  const [mfaStatuses, setMFAStatuses] = useState<MFAStatus[]>(() => fetchMFAStatuses())
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(() => fetchApiKeys())
  const [securityPolicies] = useState<SecurityPolicy[]>(() => fetchSecurityPolicies())
  const [securitySearch, setSecuritySearch] = useState('')
  const [securitySubTab, setSecuritySubTab] = useState<'sessions' | 'login' | 'mfa' | 'apikeys' | 'audit' | 'policies'>('sessions')

  // Obligations state
  const [obligations, setObligations] = useState<ComplianceObligation[]>(() => seedDemoObligations())
  const [obligationSearch, setObligationSearch] = useState('')
  const [obligationFilterAuthority, setObligationFilterAuthority] = useState<ObligationAuthority | 'all'>('all')
  const [obligationFilterRisk, setObligationFilterRisk] = useState<ObligationRisk | 'all'>('all')
  const [obligationFilterStatus, setObligationFilterStatus] = useState<ObligationStatus | 'all'>('all')
  const [obligationDetail, setObligationDetail] = useState<ComplianceObligation | null>(null)
  const [obligationOpenDropdownId, setObligationOpenDropdownId] = useState<string | null>(null)

  // Evidence state
  const [evidenceDocs, setEvidenceDocs] = useState<EvidenceDocument[]>(() => fetchEvidenceDocuments())
  const [evidenceSearch, setEvidenceSearch] = useState('')
  const [evidenceFilterClassification, setEvidenceFilterClassification] = useState<EvidenceClassification | 'all'>('all')
  const [evidenceFilterStatus, setEvidenceFilterStatus] = useState<EvidenceStatusType | 'all'>('all')
  const [evidenceFilterEntityType, setEvidenceFilterEntityType] = useState<EvidenceLinkedEntityType | 'all'>('all')
  const [evidenceDetail, setEvidenceDetail] = useState<EvidenceDocument | null>(null)
  const [evidenceOpenDropdownId, setEvidenceOpenDropdownId] = useState<string | null>(null)
  const [evidenceAddModalOpen, setEvidenceAddModalOpen] = useState(false)
  const [evidenceAddLinkedEntityType, setEvidenceAddLinkedEntityType] = useState<EvidenceLinkedEntityType>('obligation')
  const [evidenceAddLinkedEntityId, setEvidenceAddLinkedEntityId] = useState('')
  const [evidenceAddLinkedEntityTitle, setEvidenceAddLinkedEntityTitle] = useState('')
  const [evidenceAddTitle, setEvidenceAddTitle] = useState('')
  const [evidenceAddDescription, setEvidenceAddDescription] = useState('')
  const [evidenceAddClassification, setEvidenceAddClassification] = useState<EvidenceClassification>('Internal')
  const [evidenceAddFileName, setEvidenceAddFileName] = useState('')
  const [evidenceAddFileType, setEvidenceAddFileType] = useState('PDF')
  const [evidenceAddFileSize, setEvidenceAddFileSize] = useState('1 MB')

  // Regulatory Intelligence state
  const [regVersions] = useState<RegulationVersion[]>(() => fetchRegulationVersions())
  const [regChanges] = useState<RegulationChange[]>(() => fetchRegulationChanges())
  const [regChains] = useState<RegulatoryImpactChain[]>(() => fetchImpactChains())
  const [regIntelDetail, setRegIntelDetail] = useState<RegulationChange | null>(null)
  const [regIntelFilterAuthority, setRegIntelFilterAuthority] = useState<string>('all')
  const [regIntelFilterImpact, setRegIntelFilterImpact] = useState<ImpactLevel | 'all'>('all')
  const [regIntelFilterType, setRegIntelFilterType] = useState<ChangeType | 'all'>('all')
  const [regIntelSearch, setRegIntelSearch] = useState('')
  const [regIntelSelectedChange, setRegIntelSelectedChange] = useState<RegulationChange | null>(null)

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const getAutoKey = (id: string) => `${id}:auto`
  const getUploadKey = (id: string) => `${id}:uploaded`

  const sourceIconMap: Record<string, React.ElementType> = {
    bulletin: BookOpen,
    'press-release': Megaphone,
    legislation: Scale,
    Takasbank: Landmark,
    MKK: Database,
    MASAK: ShieldAlert,
    BDDK: Building2,
    SEC: Globe2,
    FCA: Globe2,
    ESMA: Globe2,
  }

  const categoryColorMap: Record<string, string> = {
    Bülten: 'bg-[#DBEAFE] text-[#1D4ED8] border-[#BFDBFE]',
    Duyuru: 'bg-[#FEF3C7] text-[#D97706] border-[#FDE68A]',
    Mevzuat: 'bg-[#F5F3FF] text-[#6D28D9] border-[#DDD6FE]',
    Kanun: 'bg-[#EDE9FE] text-[#7C3AED] border-[#C4B5FD]',
    Tebliğ: 'bg-[#E0F2FE] text-[#0284C7] border-[#BAE6FD]',
    Yönetmelik: 'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0]',
    'Kurul Kararı': 'bg-[#FCE7F3] text-[#BE185D] border-[#FBCFE8]',
    'İlke Kararı': 'bg-[#FFF7ED] text-[#EA580C] border-[#FED7AA]',
    Rehber: 'bg-[#F0FDFA] text-[#0F766E] border-[#99F6E4]',
  }

  function getSourceIcon(sourceType?: string) {
    if (!sourceType) return BookOpen
    return sourceIconMap[sourceType] || BookOpen
  }

  function getCategoryBadgeClass(label?: string) {
    if (!label) return 'text-slate-600 border-slate-200/60'
    return categoryColorMap[label] || 'text-slate-600 border-slate-200/60'
  }

  function getRecordSortTimestamp(record: SpkArchiveRecord): number {
    if (record.effectiveDate && /^\d{4}-\d{2}-\d{2}$/.test(record.effectiveDate)) {
      const ts = new Date(record.effectiveDate).getTime()
      if (!isNaN(ts)) return ts
    }
    if (record.isoDate && /^\d{4}-\d{2}-\d{2}$/.test(record.isoDate)) {
      const ts = new Date(record.isoDate).getTime()
      if (!isNaN(ts)) return ts
    }
    if (typeof record.effectiveYear === 'number' && record.effectiveYear > 1900) {
      return new Date(`${record.effectiveYear}-01-01`).getTime()
    }
    if (typeof record.year === 'number' && record.year > 1900) {
      return new Date(`${record.year}-06-15`).getTime()
    }
    return 0
  }

  const handleAnalyze = async (record: SpkArchiveRecord) => {
    const key = getAutoKey(record.id)
    setAnalysisByRecordId((prev) => ({ ...prev, [key]: { ...prev[key], loading: true } as any }))
    try {
      const result = await analyzeSpkBulletin(record)
      setAnalysisByRecordId((prev) => ({ ...prev, [key]: { ...result, loading: false } }))
    } catch {
      setAnalysisByRecordId((prev) => ({ ...prev, [key]: { summary: 'Analiz alınamadı.', keyDecisions: [], affectedAreas: [], recommendedAction: 'Lütfen tekrar deneyin.', impactLevel: 'low', complianceChecklist: [], possibleOperationalImpact: 'Bilinmiyor.', sourceBasis: 'fallback', reliability: 'low', errorNote: 'Frontend hatası', disclaimer: '', loading: false } }))
    }
  }

  const handlePdfUpload = async (record: SpkArchiveRecord, file: File) => {
    const key = getUploadKey(record.id)
    setAnalysisByRecordId((prev) => ({ ...prev, [key]: { ...prev[key], loading: true } as any }))
    try {
      const result = await analyzeSpkBulletinWithPdf(record, file)
      setAnalysisByRecordId((prev) => ({ ...prev, [key]: { ...result, loading: false } }))
    } catch {
      setAnalysisByRecordId((prev) => ({ ...prev, [key]: { summary: 'Analiz alınamadı.', keyDecisions: [], affectedAreas: [], recommendedAction: 'Lütfen tekrar deneyin.', impactLevel: 'low', complianceChecklist: [], possibleOperationalImpact: 'Bilinmiyor.', sourceBasis: 'fallback', reliability: 'low', errorNote: 'Frontend hatası', disclaimer: '', loading: false } }))
    }
  }

  const handleFetchArchive = async (refresh = false) => {
    setSpkLoading(true)
    if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Arşiv yenileme başlatıldı', entityType: 'system', severity: 'info' })
    try {
      const effectiveLimit = archiveLimit >= 5000 ? 5000 : archiveLimit

      // 1. Legacy SPK archive endpoint (guaranteed to work in production)
      try {
        const spkArchive = await fetchSpkArchive({ sourceType: 'all' as any, limit: effectiveLimit, refresh })
        if (spkArchive && spkArchive.archive) {
          setSpkData((prev) => prev ? {
            ...prev,
            archive: spkArchive.archive,
          } : null)
        }
      } catch (e) {
        console.warn('[SPK Archive Fetch]', e)
      }

      // 2. Unified regulatory archive (BDDK + SPK) – best effort
      try {
        const data = await fetchRegulatoryArchive({
          authority: authorityFilter,
          limit: effectiveLimit,
          refresh,
        })
        console.log('[Regulatory Archive Counts]', data.counts)
        setRegulatoryArchive(data)
      } catch (e) {
        console.warn('[Regulatory Archive Fetch]', e)
      }
    } catch (err) {
      console.warn('[Archive Fetch]', err)
    } finally {
      setSpkLoading(false)
    }
  }

  const handleCheckSpk = async () => {
    setSpkLoading(true)
    if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'SPK senkronizasyonu başlatıldı', entityType: 'system', severity: 'info' })
    try {
      const data = await fetchSpkSyncStatus()
      setSpkData(data)
    } finally {
      setSpkLoading(false)
    }
  }

  useEffect(() => {
    const init = async () => {
      await handleCheckSpk()
      await handleFetchArchive()
    }
    init()
  }, [])

  useEffect(() => {
    if (import.meta.env.DEV && spkData) {
      // eslint-disable-next-line no-console
      console.debug('[RegTech SPK Data]', spkData)
    }
  }, [spkData])

  // Sync active category when tab changes programmatically
  useEffect(() => {
    const cat = tabToCategory[activeTab]
    if (cat && cat !== activeCategory) {
      setActiveCategory(cat)
    }
  }, [activeTab])

  // Generate system notifications from context
  useEffect(() => {
    const newNotifs = generateSystemNotifications({
      tasks: tasks.map((t) => ({ id: t.id, title: t.title, status: t.status, riskLevel: t.riskLevel, dueDate: t.dueDate, assignedTo: t.assignedTo })),
      approvals: approvalRequests.map((a) => ({ id: a.id, sourceTitle: a.sourceTitle, status: a.status, priority: a.priority, slaDeadline: (a as any).slaDeadline, assignedApprover: a.assignedApprover, currentStageName: a.currentStage ? `Aşama ${a.currentStage}` : undefined })),
      workflows: [{ id: 'wf-1', name: 'Onay Workflow', status: 'active' }],
      cases: cases.map((c) => ({ id: c.id, title: c.title, status: c.status, riskLevel: c.riskLevel, priority: c.priority })),
      obligations: obligations.map((o) => ({ id: o.id, title: o.title, status: o.status, riskLevel: o.riskLevel, dueDate: o.dueDate, owner: o.owner, evidenceCount: o.evidenceCount })),
      evidenceDocs: evidenceDocs.map((e) => ({ id: e.id, title: e.title, status: e.status, classification: e.classification })),
      regChanges: regChanges.map((c) => ({ id: c.id, articleReference: c.articleReference, impactLevel: c.impactLevel, changeType: c.changeType })),
      reconciliationRecords: reconciliationRecords.map((r) => ({ id: r.id, type: r.type, status: r.status, riskLevel: (r as any).risk })),
      takasbankAlerts: takasbankAlerts.map((a) => ({ id: a.id, alertType: (a as any).type, status: a.status, riskLevel: (a as any).risk })),
      loginRecords: loginRecords.map((l) => ({ id: l.id, status: l.status })),
      riskScores: riskScores.map((r) => ({ id: r.id, entityType: r.entityType, entityTitle: r.entityTitle, score: r.score, trend: r.trend, responsible: r.responsible })),
      policies: policies.map((p) => ({ id: p.id, title: p.title, status: p.status, riskLevel: p.riskLevel, nextReviewDate: p.nextReviewDate })),
      controls: controls.map((c) => ({ id: c.id, title: c.title, controlType: c.controlType, riskLevel: c.riskLevel, active: c.active })),
      tests: controlTests.map((t) => ({ id: t.id, controlId: t.controlId, controlTitle: t.controlTitle, result: t.result, score: t.score, findingsCount: t.findingsCount })),
      findings: findings.map((f) => ({ id: f.id, title: f.title, severity: f.severity, status: f.status, dueDate: f.dueDate })),
    })
    if (newNotifs.length > 0) {
      setNotifications((prev) => [...newNotifs, ...prev])
    }
  }, [tasks, approvalRequests, cases, obligations, evidenceDocs, regChanges, reconciliationRecords, takasbankAlerts, loginRecords, riskScores, policies, controls, controlTests, findings])

  // Task helpers
  const openTaskModal = (record?: SpkArchiveRecord, presetTitle?: string, presetRisk?: TaskRisk, presetNotes?: string) => {
    setTaskModalRecord(record || null)
    setTaskFormTitle(presetTitle || record?.title?.slice(0, 120) || '')
    setTaskFormAssignedTo('')
    const nextWeek = new Date()
    nextWeek.setDate(nextWeek.getDate() + 7)
    setTaskFormDueDate(nextWeek.toISOString().split('T')[0])
    setTaskFormRisk(presetRisk || 'Orta')
    setTaskFormNotes(presetNotes || '')
    setTaskModalOpen(true)
  }

  const handleSaveTask = () => {
    if (!taskFormTitle.trim()) return
    const authority: TaskAuthority = (taskModalRecord?.authority === 'BDDK' ? 'BDDK' : 'SPK') as TaskAuthority
    const opImpact = taskModalRecord ? calculateOperationalImpact(taskModalRecord) : null
    const payload = {
      title: taskFormTitle.trim(),
      authority,
      regulationId: taskModalRecord?.id,
      regulationTitle: taskModalRecord?.title,
      riskLevel: taskFormRisk,
      assignedTo: taskFormAssignedTo.trim() || 'Atanmadı',
      dueDate: taskFormDueDate,
      status: 'Açık' as TaskStatus,
      notes: taskFormNotes.trim(),
      affectedOperations: opImpact?.areas || [],
    }
    const newTask = createTask(payload)
    setTasks(loadTasksFromStorage())
    setTaskModalOpen(false)
    if (currentUser) {
      addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Görev oluşturuldu', entityType: 'task', entityId: newTask.id, entityTitle: newTask.title, severity: 'info' })
    }
  }

  const handleCreateTaskFromAi = () => {
    if (!aiSelectedRecord || !aiResult) return
    if (currentUser) {
      addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'AI analizden görev oluşturuldu', entityType: 'ai-analysis', entityId: aiSelectedRecord.id, entityTitle: aiSelectedRecord.title, severity: 'warning' })
    }
    const risk = calculateRegulatoryRisk(aiSelectedRecord)
    openTaskModal(
      aiSelectedRecord,
      `AI Analiz: ${aiSelectedRecord.title?.slice(0, 80)}`,
      (risk.level === 'critical' ? 'Kritik' : risk.level === 'high' ? 'Yüksek' : risk.level === 'medium' ? 'Orta' : 'Düşük') as TaskRisk,
      aiResult.recommendedAction || aiResult.summary || ''
    )
  }

  // AI Analysis handler
  const handleAiAnalyze = async (record: SpkArchiveRecord) => {
    setAiLoading(true)
    setAiResult(null)
    if (currentUser) {
      addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'AI analiz çalıştırıldı', entityType: 'ai-analysis', entityId: record.id, entityTitle: record.title, severity: 'info' })
    }
    try {
      const result = await analyzeSpkBulletin(record)
      setAiResult(result)
    } catch {
      setAiResult({ summary: 'Analiz alınamadı.', keyDecisions: [], affectedAreas: [], recommendedAction: 'Lütfen tekrar deneyin.', impactLevel: 'low', complianceChecklist: [], possibleOperationalImpact: 'Bilinmiyor.', sourceBasis: 'fallback', reliability: 'low', errorNote: 'Frontend hatası', disclaimer: '' })
    } finally {
      setAiLoading(false)
    }
  }

  // Copilot handler
  const handleCopilotAsk = async () => {
    if (!copilotInput.trim()) return
    const userMsg: CopilotMessage = { role: 'user', text: copilotInput.trim(), timestamp: new Date().toISOString() }
    setCopilotMessages((prev) => [...prev, userMsg])
    setCopilotInput('')
    setCopilotLoading(true)
    if (currentUser) {
      addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: `Copilot soru: ${userMsg.text.slice(0, 60)}`, entityType: 'ai-analysis', severity: 'info' })
    }
    try {
      const result = await askCopilot(userMsg.text, { records: allArchiveRecords, tasks, reconciliations: reconciliationRecords, takasbankAlerts, approvalRequests, cases, securitySessions, loginRecords, mfaStatuses, apiKeys, obligations, evidenceDocs, regChanges, regVersions, regChains, notifications, dataSources, riskScores, policies, controls, tests: controlTests, findings, user: currentUser })
      const assistantMsg: CopilotMessage = { role: 'assistant', text: result.text, actions: result.actions, timestamp: new Date().toISOString() }
      setCopilotMessages((prev) => [...prev, assistantMsg])
      if (currentUser) {
        addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Copilot yanıt üretildi', entityType: 'ai-analysis', severity: 'info' })
      }
    } catch {
      const fallback: CopilotMessage = { role: 'assistant', text: 'Üzgünüm, şu anda yanıt üretilemiyor. Lütfen tekrar deneyin.', timestamp: new Date().toISOString() }
      setCopilotMessages((prev) => [...prev, fallback])
    } finally {
      setCopilotLoading(false)
    }
  }

  const handleCopilotAction = (action: CopilotAction) => {
    if (currentUser) {
      addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: `Copilot aksiyon: ${action.label}`, entityType: 'ai-analysis', severity: 'info' })
    }
    switch (action.type) {
      case 'navigate':
        if (action.payload?.tab) setActiveTab(action.payload.tab as TabKey)
        break
      case 'open_document': {
        const rec = allArchiveRecords.find((r) => r.id === action.payload?.recordId)
        if (rec) { setWorkspaceRecord(rec); setWorkspaceAnalysis(null); setActiveTab('document') }
        break
      }
      case 'open_ai_analysis': {
        const rec = allArchiveRecords.find((r) => r.id === action.payload?.recordId)
        if (rec) { setAiSelectedRecord(rec); setActiveTab('ai') }
        break
      }
      case 'create_task': {
        const rec = allArchiveRecords.find((r) => r.id === action.payload?.recordId)
        if (rec) openTaskModal(rec)
        break
      }
    }
  }

  const allArchiveRecords = regulatoryArchive?.records ?? spkData?.archive?.records ?? []
  const spkRecords = allArchiveRecords.filter((r) => r.authority !== 'BDDK')
  const bddkRecords = allArchiveRecords.filter((r) => r.authority === 'BDDK')

  const filteredDisplayRecords = (records: SpkArchiveRecord[]) => {
    return records.filter((r) => {
      const matchesYear = selectedArchiveYear === 'all' || String(r.year) === selectedArchiveYear
      const matchesSource = selectedSourceType === 'all' || r.sourceType === selectedSourceType
      const term = searchTerm.toLowerCase()
      const matchesSearch = !term || (r.title || '').toLowerCase().includes(term) || (r.number || '').includes(term)
      return matchesYear && matchesSource && matchesSearch
    }).sort((a, b) => getRecordSortTimestamp(b) - getRecordSortTimestamp(a)).slice(0, archiveLimit)
  }

  // Render a compact archive table for a given record set
  const renderArchiveTable = (records: SpkArchiveRecord[], showAuthority = false, showRisk = false) => {
    const display = filteredDisplayRecords(records)
    if (display.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
          <Archive size={32} className="text-slate-300" />
          <p className="text-sm text-center">Kayıt bulunamadı.</p>
        </div>
      )
    }
    return (
      <div className="overflow-x-auto border-t border-slate-100">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/60">
              {showAuthority && <TableHead className="text-xs font-medium text-slate-500 w-[70px]">Kurum</TableHead>}
              {showRisk && <TableHead className="text-xs font-medium text-slate-500 w-[70px]">Karar No</TableHead>}
              <TableHead className="text-xs font-medium text-slate-500 w-[160px]">Kaynak</TableHead>
              <TableHead className="text-xs font-medium text-slate-500">Başlık</TableHead>
              {showRisk && <TableHead className="text-xs font-medium text-slate-500 w-[80px]">Yayın Tarihi</TableHead>}
              {!showRisk && <TableHead className="text-xs font-medium text-slate-500 w-[100px]">Tarih</TableHead>}
              {showRisk && <TableHead className="text-xs font-medium text-slate-500 w-[70px]">Risk</TableHead>}
              {showRisk && <TableHead className="text-xs font-medium text-slate-500 w-[130px]">Uyum Etkisi</TableHead>}
              {!showRisk && <TableHead className="text-xs font-medium text-slate-500 w-[100px]">Tür</TableHead>}
              <TableHead className="text-xs font-medium text-slate-500 text-right w-[80px]">İşlem</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {display.map((r) => {
              const autoKey = getAutoKey(r.id)
              const uploadKey = getUploadKey(r.id)
              const analysis = analysisByRecordId[uploadKey] || analysisByRecordId[autoKey]
              const isExpanded = !!analysis?.summary
              const isBddk = r.authority === 'BDDK'
              const risk = showRisk && isBddk ? calculateRegulatoryRisk(r) : null
              return (
                <>
                  <TableRow key={r.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition-all duration-150">
                    {showAuthority && (
                      <TableCell className="text-xs whitespace-nowrap">
                        <Badge className={`text-[10px] ${isBddk ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' : 'bg-blue-50 text-blue-700 border-blue-200/60'}`}>
                          {isBddk ? 'BDDK' : 'SPK'}
                        </Badge>
                      </TableCell>
                    )}
                    {showRisk && (
                      <TableCell className="text-xs whitespace-nowrap text-slate-600">{r.number || '—'}</TableCell>
                    )}
                    <TableCell className="text-xs whitespace-nowrap">
                      <span className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 text-slate-600">
                          {(() => { const Icon = getSourceIcon(r.sourceType); return <Icon size={14} /> })()}
                        </span>
                        <span className="text-slate-700">{isBddk ? 'BDDK' : r.sourceType === 'legislation' ? 'Mevzuat' : (r.source || 'Bülten')}</span>
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[320px]">
                      <p className="text-xs font-medium text-slate-800 truncate" title={r.title}>{r.title}</p>
                      {r.number && !showRisk && <p className="text-[10px] text-slate-400 truncate mt-0.5">{r.number} · {r.isoDate || r.date || '—'}</p>}
                    </TableCell>
                    {showRisk ? (
                      <TableCell className="text-xs whitespace-nowrap">{r.isoDate || r.date || '—'}</TableCell>
                    ) : (
                      <TableCell className="text-xs whitespace-nowrap">{r.effectiveDate || r.isoDate || (typeof r.effectiveYear === 'number' ? String(r.effectiveYear) : '—')}</TableCell>
                    )}
                    {showRisk && risk && (
                      <TableCell className="text-xs whitespace-nowrap">
                        <Badge className={`text-[10px] ${getRiskBadgeClass(risk.level)}`} title={risk.reason}>
                          {risk.label}
                        </Badge>
                      </TableCell>
                    )}
                    {showRisk && risk && (
                      <TableCell className="text-xs whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {risk.affectedAreas.slice(0, 2).map((area) => (
                            <Badge key={area} variant="outline" className="text-[9px] text-slate-600 border-slate-200/60">{area}</Badge>
                          ))}
                        </div>
                      </TableCell>
                    )}
                    {!showRisk && (
                      <TableCell className="text-xs whitespace-nowrap">
                        <Badge variant="outline" className={`text-[10px] px-2 py-0.5 rounded-full ${getCategoryBadgeClass(r.sourceType === 'bulletin' ? 'Bülten' : r.sourceType === 'press-release' ? 'Duyuru' : r.category || 'Mevzuat')}`}>
                          {r.sourceType === 'bulletin' ? 'Bülten' : r.sourceType === 'legislation' ? (r.category || 'Mevzuat') : r.sourceType === 'bddk-announcement' ? 'Duyuru' : r.sourceType === 'bddk-press-release' ? 'Basın' : r.sourceType === 'bddk-decision' ? 'Karar' : r.sourceType === 'bddk-regulation' ? 'Mevzuat' : 'Duyuru'}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="relative inline-block text-left">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(openDropdownId === r.id ? null : r.id) }} className="inline-flex h-[28px] items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-medium text-slate-600 hover:bg-slate-50">
                          <MoreVertical size={14} /> İşlem
                        </button>
                        {openDropdownId === r.id && (
                          <div className="absolute right-0 z-50 mt-1 w-48 rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                            {!userPerms?.readOnly && (
                              <button type="button" onClick={() => { setOpenDropdownId(null); handleAnalyze(r) }} disabled={analysisByRecordId[autoKey]?.loading} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                {analysisByRecordId[autoKey]?.loading ? <Loader2 size={13} className="animate-spin text-indigo-500" /> : <Sparkles size={13} className="text-indigo-500" />} AI ile Analiz Et
                              </button>
                            )}
                            <button type="button" onClick={() => { setOpenDropdownId(null); setAiSelectedRecord(r); setActiveTab('ai'); setOpenDropdownId(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                              <Eye size={13} className="text-blue-500" /> Kararı İncele
                            </button>
                            <button type="button" onClick={() => { setOpenDropdownId(null); setWorkspaceRecord(r); setWorkspaceAnalysis(null); setActiveTab('document'); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Belge workspace açıldı', entityType: 'regulation', entityId: r.id, entityTitle: r.title, severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                              <FileText size={13} className="text-cyan-600" /> Belge Workspace’te Aç
                            </button>
                            <button type="button" onClick={() => { setOpenDropdownId(null); setTimelineRecord(r); setActiveTab('timeline'); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Timeline görüntülendi', entityType: 'regulation', entityId: r.id, entityTitle: r.title, severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                              <GitBranch size={13} className="text-violet-500" /> Timeline Görüntüle
                            </button>
                            {r.url && r.url !== '#' && (
                              <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={() => { setOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'PDF kaynağı açıldı', entityType: 'regulation', entityId: r.id, entityTitle: r.title, severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                                <ExternalLink size={13} className="text-slate-400" /> Kaynağı Aç
                              </a>
                            )}
                            {userPerms?.canCreateTask && (
                              <button type="button" onClick={() => { setOpenDropdownId(null); openTaskModal(r) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                                <Plus size={13} className="text-violet-500" /> Uyum Görevi Oluştur
                              </button>
                            )}
                            {!userPerms?.readOnly && (
                              <button type="button" onClick={() => { setOpenDropdownId(null); const risk = calculateRegulatoryRisk(r); const newReq = createApprovalRequest({ sourceModule: 'REGTECH', sourceId: r.id, sourceTitle: r.title, requestType: 'Yönetici Onayı', requestedBy: currentUser?.name || 'Sistem', requestedByRole: currentUser?.role || 'Sistem', assignedApprover: 'Yönetici', approverRole: 'Yönetici', riskLevel: risk.level === 'critical' ? 'Kritik' : risk.level === 'high' ? 'Yüksek' : 'Orta', priority: risk.level === 'critical' ? 'Kritik' : risk.level === 'high' ? 'Yüksek' : 'Orta', notes: risk.reason || '' }); if (newReq) setApprovalRequests((prev) => [newReq, ...prev]); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Onay talebi oluşturuldu', entityType: 'regulation', entityId: r.id, entityTitle: r.title, severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                                <ClipboardCheck size={13} className="text-blue-500" /> Yönetici Onayına Gönder
                              </button>
                            )}
                            {!userPerms?.readOnly && (
                              <button type="button" onClick={() => { setOpenDropdownId(null); const risk = calculateRegulatoryRisk(r); createCase({ title: r.title, description: r.title, sourceModule: 'REGTECH', sourceId: r.id, status: 'Açık', priority: risk.level === 'critical' ? 'Kritik' : risk.level === 'high' ? 'Yüksek' : 'Orta', riskLevel: risk.level === 'critical' ? 'Kritik' : risk.level === 'high' ? 'Yüksek' : 'Orta', assignedTo: currentUser?.name || 'Sistem', owner: currentUser?.name || 'Sistem', tags: [r.authority || 'SPK'], relatedTasks: [], relatedApprovals: [], relatedDocuments: [] }); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Case oluşturuldu', entityType: 'regulation', entityId: r.id, entityTitle: r.title, severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                                <BriefcaseBusiness size={13} className="text-indigo-500" /> Case Oluştur
                              </button>
                            )}
                            {!userPerms?.readOnly && (
                              <button type="button" onClick={() => { setOpenDropdownId(null) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50">
                                <Flag size={13} className="text-amber-500" /> Mesaj Olarak İşaretle
                              </button>
                            )}
                            {!userPerms?.readOnly && (
                              <button type="button" onClick={() => { setOpenDropdownId(null); fileInputRefs.current[r.id]?.click() }} disabled={analysisByRecordId[uploadKey]?.loading} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                                {analysisByRecordId[uploadKey]?.loading ? <Loader2 size={13} className="animate-spin text-emerald-500" /> : <FileText size={13} className="text-emerald-500" />} PDF Analiz
                              </button>
                            )}
                            <input ref={(el) => { fileInputRefs.current[r.id] = el }} type="file" accept=".pdf" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) handlePdfUpload(r, file); e.target.value = '' }} />
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <TableRow key={`${r.id}-ai`} className="bg-slate-50/50">
                      <TableCell colSpan={(showAuthority ? 1 : 0) + (showRisk ? 4 : 3) + 1 + 1} className="p-0">
                        <div className="m-3 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 space-y-4 max-h-[400px] overflow-y-auto">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Sparkles size={14} className="text-violet-600" />
                            <p className="text-xs font-semibold text-slate-800">AKOP AI Yorumu</p>
                            <Badge className={analysis.impactLevel === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200/60 text-[10px]' : analysis.impactLevel === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200/60 text-[10px]' : 'bg-emerald-50 text-emerald-700 border-emerald-200/60 text-[10px]'}>
                              {analysis.impactLevel === 'high' ? 'Yüksek Etki' : analysis.impactLevel === 'medium' ? 'Orta Etki' : 'Düşük Etki'}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200/60">{analysis.sourceBasis === 'openai' ? 'OpenAI' : analysis.sourceBasis === 'uploaded_pdf' ? 'PDF' : analysis.sourceBasis === 'pdf_content' ? 'PDF' : analysis.sourceBasis === 'metadata_only' ? 'Metadata' : 'Fallback'}</Badge>
                            {(analysis.sourceBasis !== 'openai' && analysis.sourceBasis !== 'pdf_content') && (
                              <Badge className={analysis.reliability === 'high' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60 text-[10px]' : analysis.reliability === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200/60 text-[10px]' : 'bg-rose-50 text-rose-700 border-rose-200/60 text-[10px]'}>{analysis.reliability === 'high' ? 'Yüksek' : analysis.reliability === 'medium' ? 'Orta' : 'Düşük'} Güvenilirlik</Badge>
                            )}
                          </div>
                          {(analysis.sourceBasis === 'fallback' || analysis.sourceBasis === 'metadata_only') && (
                            <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-2.5">
                              <p className="text-[11px] text-amber-700">{analysis.sourceBasis === 'fallback' ? (analysis.errorNote || 'AI analizi yapılamadı.') : 'İçerik okunamadı, analiz sadece kayıt bilgisine göre.'}</p>
                            </div>
                          )}
                          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5"><p className="text-[10px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Yönetici Özeti</p><p className="text-[12px] text-slate-700 leading-relaxed">{analysis.summary}</p></div>
                          {Array.isArray(analysis.keyDecisions) && analysis.keyDecisions.length > 0 && (
                            <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Anahtar Kararlar</p>
                              <ul className="list-disc list-inside space-y-1">{analysis.keyDecisions.map((kd, idx) => (<li key={idx} className="text-[12px] text-slate-700">{kd}</li>))}</ul>
                            </div>
                          )}
                          {Array.isArray(analysis.affectedAreas) && analysis.affectedAreas.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 items-center">
                              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Uyum Etkisi</p>
                              {analysis.affectedAreas.map((area) => (<Badge key={area} variant="outline" className="text-[10px] text-slate-600 border-slate-200/60">{area}</Badge>))}
                            </div>
                          )}
                          {Array.isArray(analysis.complianceChecklist) && analysis.complianceChecklist.length > 0 && (
                            <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Önerilen Kontrol Maddeleri</p>
                              <ul className="list-disc list-inside space-y-1">{analysis.complianceChecklist.map((item, idx) => (<li key={idx} className="text-[12px] text-slate-700">{item}</li>))}</ul>
                            </div>
                          )}
                          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5"><p className="text-[10px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Aksiyon Planı</p><p className="text-[12px] text-slate-700">{analysis.recommendedAction}</p></div>
                          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5"><p className="text-[10px] font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Operasyonel Etki</p><p className="text-[12px] text-slate-700">{analysis.possibleOperationalImpact}</p></div>
                          {(() => {
                            const opImpact = calculateOperationalImpact(r)
                            return opImpact.areas.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 items-center">
                                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Etkilenen Operasyonlar</p>
                                {opImpact.areas.map((area) => (<Badge key={area} className="text-[10px] bg-slate-50 text-slate-700 border-slate-200/60">{area}</Badge>))}
                              </div>
                            )
                          })()}
                          <p className="text-[10px] text-slate-400 italic">{analysis.disclaimer}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )
            })}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Compute visible tabs based on role
  const userPerms = currentUser ? getUserPermissions(currentUser) : null
  const visibleTabs = userPerms ? allTabs.filter((t) => userPerms.tabs.includes(t.key)) : []

  // Login handler
  const handleLogin = () => {
    const user = loginUser(loginEmail, loginPassword)
    if (user) {
      setCurrentUser(user)
      setLoginError('')
      setAuthToast(`Hoş geldiniz, ${user.name}`)
      setTimeout(() => setAuthToast(''), 3000)
      addAuditLog({ userId: user.id, userName: user.name, role: user.role, action: 'Kullanıcı giriş yaptı', entityType: 'user', severity: 'info' })
    } else {
      setLoginError('E-posta veya şifre hatalı.')
    }
  }

  const handleLogout = () => {
    if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Kullanıcı çıkış yaptı', entityType: 'user', severity: 'info' })
    logoutUser()
    setCurrentUser(null)
    setActiveTab('overview')
    setLoginEmail('')
    setLoginPassword('')
  }

  // Login screen
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-5">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">AKOP RegTech</h1>
            <p className="text-xs text-slate-500 leading-relaxed">
              Aracı kurumların uyum operasyonlarını tek merkezde yönetir.
              Regülasyondan operasyona uzanan karar destek sistemi.
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">E-posta</label>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="w-full text-[12px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500" placeholder="ornek@akop.com.tr" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 mb-1 block">Şifre</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="w-full text-[12px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500" placeholder="••••••" onKeyDown={(e) => { if (e.key === 'Enter') handleLogin() }} />
            </div>
            {loginError && <p className="text-[11px] text-rose-600">{loginError}</p>}
            <button onClick={handleLogin} className="w-full rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-all">
              Giriş Yap
            </button>
          </div>
          <div className="border-t border-slate-100 pt-3">
            <p className="text-[10px] text-slate-400 text-center mb-2">Demo giriş için:</p>
            <div className="flex flex-wrap gap-1 justify-center">
              {['admin@akop.com.tr', 'uyum@akop.com.tr', 'operasyon@akop.com.tr', 'yonetici@akop.com.tr', 'denetci@akop.com.tr'].map((email) => (
                <button key={email} onClick={() => { setLoginEmail(email); setLoginPassword(''); setLoginError('') }} className="text-[9px] px-2 py-1 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                  {email.split('@')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-0 bg-[#F8FAFC]">
      <div className="max-w-[1280px] mx-auto px-6 py-6 space-y-8 pb-12">
        {/* Hero Header */}
        <div className="shrink-0 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">AKOP RegTech</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setExecutiveMode(!executiveMode) }} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-[11px] font-semibold text-white hover:bg-slate-800 transition-all">
              <LayoutDashboard size={14} /> Executive Mode
            </button>
            <button onClick={() => { setActiveTab('notifications') }} className="relative inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-all">
              <Bell size={14} />
              {(() => {
                const unreadCount = notifications.filter((n) => n.status === 'unread' && currentUser && n.roleVisibility.includes(currentUser.role)).length
                return unreadCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>
                ) : null
              })()}
            </button>
            <div className="flex items-center gap-2 bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm px-3 py-2">
              <UserCircle size={16} className="text-slate-500" />
              <div>
                <p className="text-[11px] font-semibold text-slate-800">{currentUser.name}</p>
                <Badge className={`text-[9px] ${getRoleBadgeClass(currentUser.role)}`}>{currentUser.role}</Badge>
              </div>
            </div>
            <button onClick={handleLogout} className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-medium text-slate-600 hover:bg-slate-50 transition-all">
              <LogOut size={13} /> Çıkış
            </button>
          </div>
        </div>

        {/* Auth Toast */}
        {authToast && (
          <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg animate-in slide-in-from-top-2">
            {authToast}
          </div>
        )}

        {/* Category Navigation */}
        <div className="shrink-0 space-y-3">
          {/* Primary categories — desktop */}
          <div className="hidden md:flex items-center gap-1.5 bg-white border border-slate-200/70 rounded-2xl p-1.5 shadow-sm">
            {categoryConfig.map((cat) => {
              const isActive = activeCategory === cat.key
              return (
                <button
                  key={cat.key}
                  onClick={() => { setActiveCategory(cat.key); if (!cat.modules.includes(activeTab)) { setActiveTab(cat.modules[0]) } }}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-[11px] font-semibold transition-all ${isActive ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
          {/* Primary categories — mobile dropdown */}
          <div className="md:hidden">
            <select
              value={activeCategory}
              onChange={(e) => {
                const cat = e.target.value as CategoryKey
                setActiveCategory(cat)
                const firstMod = categoryConfig.find((c) => c.key === cat)?.modules[0]
                if (firstMod) setActiveTab(firstMod)
              }}
              className="w-full text-[13px] rounded-xl border border-slate-200/70 bg-white px-3 py-2.5 text-slate-700 outline-none focus:border-slate-400 shadow-sm"
            >
              {categoryConfig.map((cat) => (
                <option key={cat.key} value={cat.key}>{cat.label}</option>
              ))}
            </select>
          </div>
          {/* Secondary module nav */}
          <div className="flex flex-wrap md:flex-wrap gap-2 overflow-x-auto md:overflow-visible pb-1 md:pb-0 scrollbar-hide">
            {categoryConfig.find((c) => c.key === activeCategory)?.modules
              .filter((m) => visibleTabs.some((t) => t.key === m))
              .map((modKey) => {
                const tab = allTabs.find((t) => t.key === modKey)!
                const isActive = activeTab === modKey
                return (
                  <button
                    key={modKey}
                    onClick={() => setActiveTab(modKey)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-medium transition-all border whitespace-nowrap ${isActive ? 'bg-slate-800 text-white border-slate-800 shadow-sm' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
                  >
                    <tab.icon size={13} />
                    {tab.label}
                  </button>
                )
              })}
          </div>
        </div>

        {/* Executive Mode Full Screen Dashboard */}
        {executiveMode && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Executive Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight">AKOP REGTECH COMMAND CENTER</h1>
                  <Badge className="text-[9px] bg-white/20 text-white border-white/20">EXECUTIVE</Badge>
                </div>
                <p className="text-sm text-slate-300">Kurumsal Uyum ve Regülasyon Kontrol Merkezi</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">Son Güncelleme</p>
                  <p className="text-[11px] font-mono text-slate-200">{new Date().toLocaleString('tr-TR')}</p>
                </div>
                <button onClick={() => setExecutiveMode(false)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-medium text-white hover:bg-white/20 transition-all">
                  <X size={13} /> Çık
                </button>
              </div>
            </div>

            {/* Executive KPI Strip */}
            {(() => {
              const totalRecords = allArchiveRecords.length
              const criticalRecords = allArchiveRecords.filter((r) => calculateRegulatoryRisk(r).level === 'critical').length
              const openTasks = tasks.filter((t) => t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length
              const delayedTasks = tasks.filter((t) => { if (!t.dueDate || t.status === 'Tamamlandı' || t.status === 'Ertelendi') return false; return new Date(t.dueDate) < new Date() }).length
              const complianceScore = Math.max(0, Math.min(100, 100 - (criticalRecords * 3) - (delayedTasks * 5)))
              const opImpactAll = allArchiveRecords.slice(0, 300).map((r) => calculateOperationalImpact(r))
              const areaCounts: Record<string, number> = {}
              opImpactAll.forEach((op) => op.areas.forEach((a) => areaCounts[a] = (areaCounts[a] || 0) + 1))
              const topArea = Object.entries(areaCounts).sort((a, b) => b[1] - a[1])[0]
              const kpiData = [
                { label: 'Toplam İzlenen Kayıt', value: totalRecords.toLocaleString('tr-TR'), icon: Database, color: 'text-slate-800', bg: 'bg-slate-50' },
                { label: 'Kritik Risk', value: criticalRecords.toString(), icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                { label: 'Açık Uyum Görevi', value: openTasks.toString(), icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Geciken Görev', value: delayedTasks.toString(), icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                { label: 'Uyum Skoru', value: `${complianceScore}`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'En Çok Etkilenen', value: topArea ? topArea[0] : '—', sub: topArea ? `${topArea[1]} kayıt` : '', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
              ]
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {kpiData.map((kpi) => (
                    <div key={kpi.label} className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-5 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${kpi.bg} ${kpi.color}`}><kpi.icon size={18} /></div>
                      </div>
                      <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                      {kpi.sub && <p className="text-[10px] text-slate-500">{kpi.sub}</p>}
                      <p className="text-[10px] text-slate-500 mt-1 leading-tight">{kpi.label}</p>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* MKK Reconciliation KPI Strip */}
            {(() => {
              const reconStats = getReconciliationStats(reconciliationRecords)
              const openRecon = reconciliationRecords.filter((r) => r.status !== 'Kapandı').length
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600"><Database size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{openRecon}</p>
                    <p className="text-[10px] text-slate-500">Açık MKK Uyuşmazlığı</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{reconStats.critical}</p>
                    <p className="text-[10px] text-slate-500">Kritik MKK Farkı</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-violet-50 text-violet-600"><Clock size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{reconStats.slaBreach}</p>
                    <p className="text-[10px] text-slate-500">SLA Aşımı</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{reconStats.total > 0 ? Math.round((reconStats.successful / reconStats.total) * 100) : 0}%</p>
                    <p className="text-[10px] text-slate-500">Bugünkü Başarı Oranı</p>
                  </div>
                </div>
              )
            })()}

            {/* Takasbank KPI Strip */}
            {(() => {
              const takasStats = getTakasbankStats(takasbankAlerts)
              const openTakas = takasbankAlerts.filter((a) => a.status !== 'Kapandı').length
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600"><ShieldCheck size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{openTakas}</p>
                    <p className="text-[10px] text-slate-500">Açık Takasbank Uyarısı</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{takasStats.critical}</p>
                    <p className="text-[10px] text-slate-500">Kritik Takasbank Riski</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 text-amber-600"><Bell size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{takasStats.marginCalls}</p>
                    <p className="text-[10px] text-slate-500">Margin Çağrısı</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 text-orange-600"><Activity size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{takasStats.limitBreach}</p>
                    <p className="text-[10px] text-slate-500">Limit Aşımı</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-violet-50 text-violet-600"><Clock size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{takasStats.slaBreach}</p>
                    <p className="text-[10px] text-slate-500">Settlement Gecikmesi</p>
                  </div>
                </div>
              )
            })()}

            {/* Approval KPI Strip */}
            {(() => {
              const appStats = getApprovalStats(approvalRequests)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600"><ClipboardCheck size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{appStats.pending}</p>
                    <p className="text-[10px] text-slate-500">Bekleyen Onay</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{appStats.critical}</p>
                    <p className="text-[10px] text-slate-500">Kritik Onay</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-violet-50 text-violet-600"><Clock size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{appStats.slaBreach}</p>
                    <p className="text-[10px] text-slate-500">SLA Aşımı Onay</p>
                  </div>
                </div>
              )
            })()}

            {/* Workflow KPI Strip */}
            {(() => {
              const wfStats = getWorkflowStats(approvalRequests)
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600"><GitBranch size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{wfStats.pendingWorkflows}</p>
                    <p className="text-[10px] text-slate-500">Workflow Bekleyen</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{wfStats.slaBreaches}</p>
                    <p className="text-[10px] text-slate-500">SLA İhlali</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 text-orange-600"><Flame size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{wfStats.criticalWorkflows}</p>
                    <p className="text-[10px] text-slate-500">Kritik Workflow</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600"><Clock size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{wfStats.completedWorkflows}</p>
                    <p className="text-[10px] text-slate-500">Tamamlanan</p>
                  </div>
                </div>
              )
            })()}

            {/* Case KPI Strip */}
            {(() => {
              const caseStats = getCaseStats(cases)
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600"><BriefcaseBusiness size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{caseStats.open}</p>
                    <p className="text-[10px] text-slate-500">Açık Vaka</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{caseStats.critical}</p>
                    <p className="text-[10px] text-slate-500">Kritik Vaka</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{caseStats.todayOpened}</p>
                    <p className="text-[10px] text-slate-500">Bugün Açılan</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 text-slate-600"><Archive size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{caseStats.todayClosed}</p>
                    <p className="text-[10px] text-slate-500">Bugün Kapanan</p>
                  </div>
                </div>
              )
            })()}

            {/* Security KPI Strip */}
            {(() => {
              const secStats = getSecurityStats(securitySessions, loginRecords, mfaStatuses, apiKeys)
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><ShieldAlert size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{secStats.criticalEvents}</p>
                    <p className="text-[10px] text-slate-500">Kritik Güvenlik Olayı</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 text-orange-600"><AlertTriangle size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{secStats.failedLogins}</p>
                    <p className="text-[10px] text-slate-500">Başarısız Giriş</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600"><Lock size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{Math.round((secStats.mfaActiveUsers / (secStats.totalUsers || 1)) * 100)}%</p>
                    <p className="text-[10px] text-slate-500">MFA Kapsamı</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600"><Users size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{secStats.activeSessions}</p>
                    <p className="text-[10px] text-slate-500">Aktif Oturum</p>
                  </div>
                </div>
              )
            })()}

            {/* Obligations KPI Strip */}
            {(() => {
              const oblStats = getObligationStats(obligations)
              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600"><ClipboardList size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{oblStats.open}</p>
                    <p className="text-[10px] text-slate-500">Açık Yükümlülük</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{oblStats.critical}</p>
                    <p className="text-[10px] text-slate-500">Kritik Yükümlülük</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 text-amber-600"><Clock size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{oblStats.upcoming}</p>
                    <p className="text-[10px] text-slate-500">Yaklaşan Termin</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 text-orange-600"><Flame size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{oblStats.overdue}</p>
                    <p className="text-[10px] text-slate-500">Geciken</p>
                  </div>
                </div>
              )
            })()}

            {/* Evidence KPI Strip */}
            {(() => {
              const evStats = getEvidenceStats(evidenceDocs)
              const missingObl = obligations.filter((o) => o.evidenceCount === 0).length
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600"><FolderLock size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{evStats.total}</p>
                    <p className="text-[10px] text-slate-500">Toplam Kanıt</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><Lock size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{evStats.restricted}</p>
                    <p className="text-[10px] text-slate-500">Restricted Doküman</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-sky-50 text-sky-600"><ClipboardCheck size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{evStats.pendingApproval}</p>
                    <p className="text-[10px] text-slate-500">Onay Bekleyen Kanıt</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 text-orange-600"><AlertTriangle size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{missingObl}</p>
                    <p className="text-[10px] text-slate-500">Eksik Kanıt</p>
                  </div>
                </div>
              )
            })()}

            {/* RegIntel KPI Strip */}
            {(() => {
              const riStats = getRegIntelStats(regChanges, regVersions)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><ScanSearch size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{riStats.criticalChanges}</p>
                    <p className="text-[10px] text-slate-500">Kritik Değişiklik</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-violet-50 text-violet-600"><Lightbulb size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{riStats.suggestedObligations}</p>
                    <p className="text-[10px] text-slate-500">Önerilen Yükümlülük</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 text-amber-600"><Activity size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{riStats.affectedTasks}</p>
                    <p className="text-[10px] text-slate-500">Etkilenen Süreç</p>
                  </div>
                </div>
              )
            })()}

            {/* Notification KPI Strip */}
            {(() => {
              const roleNotifications = notifications.filter((n) => currentUser && n.roleVisibility.includes(currentUser.role) && n.status !== 'archived')
              const unread = roleNotifications.filter((n) => n.status === 'unread').length
              const critical = roleNotifications.filter((n) => n.severity === 'critical').length
              const sla = roleNotifications.filter((n) => n.type === 'SLA').length
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{critical}</p>
                    <p className="text-[10px] text-slate-500">Kritik Bildirim</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 text-amber-600"><Clock size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{sla}</p>
                    <p className="text-[10px] text-slate-500">SLA Uyarısı</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600"><Bell size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{unread}</p>
                    <p className="text-[10px] text-slate-500">Okunmamış Bildirim</p>
                  </div>
                </div>
              )
            })()}

            {/* Data Hub KPI Strip */}
            {(() => {
              const dhStats = getDataSourceStats(dataSources)
              const newRegs = getNewRecordsSince(dataSources, 24)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600"><DatabaseZap size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{dhStats.active}</p>
                    <p className="text-[10px] text-slate-500">Canlı Veri Kaynağı</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600"><RefreshCw size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{newRegs}</p>
                    <p className="text-[10px] text-slate-500">Son 24 Saat Düzenleme</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{dhStats.failedSync}</p>
                    <p className="text-[10px] text-slate-500">Başarısız Senkronizasyon</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 text-amber-600"><ShieldAlert size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{dhStats.error}</p>
                    <p className="text-[10px] text-slate-500">Kritik Veri Hatası</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600"><Server size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{dhStats.totalRecords.toLocaleString('tr-TR')}</p>
                    <p className="text-[10px] text-slate-500">Toplam Kayıt</p>
                  </div>
                </div>
              )
            })()}

            {/* Risk Center KPI Strip */}
            {(() => {
              const rStats = getRiskStats(riskScores)
              const topRisk = getTopRisks(riskScores, 1)[0]
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><ShieldAlert size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{rStats.average}</p>
                    <p className="text-[10px] text-slate-500">Ortalama Risk Skoru</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><Flame size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{rStats.critical}</p>
                    <p className="text-[10px] text-slate-500">Kritik Risk Sayısı</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 text-orange-600"><Activity size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{topRisk ? topRisk.entityTitle.slice(0, 20) : '-'}</p>
                    <p className="text-[10px] text-slate-500">En Riskli Süreç</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600"><ShieldCheck size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{Math.round(riskScores.reduce((s, r) => s + r.complianceScore, 0) / (riskScores.length || 1))}</p>
                    <p className="text-[10px] text-slate-500">Compliance Skoru</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-600"><TrendingUp size={16} /></div>
                    </div>
                    <p className="text-xl font-bold text-slate-900">{rStats.increasing}</p>
                    <p className="text-[10px] text-slate-500">Risk Trendi (Artan)</p>
                  </div>
                </div>
              )
            })()}

            {/* Control & Test KPI Strip */}
            {(() => {
              const cStats = getControlStats(controls)
              const tStats = getTestStats(controlTests)
              const fStats = getFindingStats(findings)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2"><div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600"><ShieldCheck size={16} /></div></div>
                    <p className="text-xl font-bold text-slate-900">{cStats.total}</p>
                    <p className="text-[10px] text-slate-500">Toplam Kontrol</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2"><div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={16} /></div></div>
                    <p className="text-xl font-bold text-slate-900">{tStats.failed}</p>
                    <p className="text-[10px] text-slate-500">Başarısız Test</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2"><div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-rose-50 text-rose-600"><AlertOctagon size={16} /></div></div>
                    <p className="text-xl font-bold text-slate-900">{fStats.critical}</p>
                    <p className="text-[10px] text-slate-500">Kritik Bulgu</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2"><div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-amber-50 text-amber-600"><FileWarning size={16} /></div></div>
                    <p className="text-xl font-bold text-slate-900">{fStats.open}</p>
                    <p className="text-[10px] text-slate-500">Açık Bulgu</p>
                  </div>
                  <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-2"><div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 text-slate-600"><BarChart3 size={16} /></div></div>
                    <p className="text-xl font-bold text-slate-900">{tStats.avgScore}</p>
                    <p className="text-[10px] text-slate-500">Ortalama Skor</p>
                  </div>
                </div>
              )
            })()}

            {/* Three Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: Risk Heat Map */}
              <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={18} className="text-rose-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Risk Isı Haritası</h3>
                </div>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-[minmax(80px,1fr)_repeat(4,minmax(50px,1fr))] gap-1 text-center">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide py-2"></div>
                    {['Düşük', 'Orta', 'Yüksek', 'Kritik'].map((l) => (<div key={l} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide py-2">{l}</div>))}
                    {(['SPK', 'BDDK', 'MASAK', 'Global'] as string[]).map((inst) => {
                      const counts = { low: 0, medium: 0, high: 0, critical: 0 } as Record<string, number>
                      allArchiveRecords.forEach((r) => {
                        const authRaw = r.authority as string || 'SPK'
                        const auth = authRaw === 'BDDK' ? 'BDDK' : authRaw === 'MASAK' ? 'MASAK' : ['SEC','FCA','ESMA'].includes(authRaw) ? 'Global' : 'SPK'
                        if (auth === inst) { const lvl = calculateRegulatoryRisk(r).level; counts[lvl] = (counts[lvl] || 0) + 1 }
                      })
                      return (
                        <Fragment key={inst}>
                          <div className="text-[11px] font-medium text-slate-700 text-left pl-2 py-2 border-t border-slate-50">{inst}</div>
                          {(['low', 'medium', 'high', 'critical'] as const).map((lvl) => {
                            const count = counts[lvl]
                            const bg = count === 0 ? 'text-slate-300' : lvl === 'low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : lvl === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200/60' : lvl === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200/60' : 'bg-rose-50 text-rose-700 border-rose-200/60'
                            return <div key={`${inst}-${lvl}`} className={`text-[11px] font-semibold py-2 rounded-lg border-t border-slate-50 ${count > 0 ? `${bg}` : 'text-slate-300'}`}>{count > 0 ? count : '—'}</div>
                          })}
                        </Fragment>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Center: Operation Impact Matrix */}
              <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Grid3x3 size={18} className="text-violet-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Operasyon Etki Matrisi</h3>
                </div>
                <div className="overflow-x-auto">
                  {(() => {
                    const areas: OperationArea[] = ['MKK Mutabakat', 'Takasbank İşlemleri', 'Müşteri Onboarding', 'KYC / AML', 'Emir ve İşlem Gözetimi', 'Raporlama', 'Risk Yönetimi', 'Sermaye Yeterliliği', 'Veri Gizliliği / KVKK', 'İç Kontrol']
                    const institutions = ['SPK', 'BDDK', 'MASAK', 'Global']
                    const matrix: Record<string, Record<string, number>> = {}
                    areas.forEach((a) => { matrix[a] = { SPK: 0, BDDK: 0, MASAK: 0, Global: 0 } })
                    allArchiveRecords.slice(0, 300).forEach((r) => {
                      const a = r.authority as string || 'SPK'
                      const inst = a === 'BDDK' ? 'BDDK' : a === 'MASAK' ? 'MASAK' : ['SEC','FCA','ESMA'].includes(a) ? 'Global' : 'SPK'
                      const impact = calculateOperationalImpact(r)
                      impact.areas.forEach((area) => { if (matrix[area]) matrix[area][inst]++ })
                    })
                    return (
                      <div className="grid grid-cols-[minmax(100px,1fr)_repeat(4,minmax(40px,1fr))] gap-1 text-center">
                        <div className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide text-left pl-1 py-1">Alan</div>
                        {institutions.map((i) => (<div key={i} className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide py-1">{i.slice(0, 4)}</div>))}
                        {areas.map((area) => (
                          <Fragment key={area}>
                            <div className="text-[9px] font-medium text-slate-700 text-left pl-1 py-1 border-t border-slate-50 truncate" title={area}>{area}</div>
                            {institutions.map((inst) => {
                              const count = matrix[area][inst]
                              const lvl = getAreaImpactLevel(count)
                              return <div key={`${area}-${inst}`} className={`text-[9px] font-semibold py-1 rounded border-t border-slate-50 ${count > 0 ? getAreaImpactBadgeClass(lvl) : 'text-slate-300'}`}>{count > 0 ? count : '—'}</div>
                            })}
                          </Fragment>
                        ))}
                      </div>
                    )
                  })()}
                </div>
              </div>

              {/* Right: Recent Critical Developments */}
              <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Bell size={18} className="text-amber-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Son Kritik Gelişmeler</h3>
                </div>
                <div className="space-y-3">
                  {(() => {
                    const criticalRecent = allArchiveRecords
                      .filter((r) => ['high', 'critical'].includes(calculateRegulatoryRisk(r).level))
                      .sort((a, b) => new Date(b.isoDate || b.date || '').getTime() - new Date(a.isoDate || a.date || '').getTime())
                      .slice(0, 5)
                    if (criticalRecent.length === 0) return <p className="text-[11px] text-slate-400 py-4">Kritik gelişme bulunmuyor.</p>
                    return criticalRecent.map((r) => {
                      const risk = calculateRegulatoryRisk(r)
                      return (
                        <div key={r.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all">
                          <div className="mt-0.5 shrink-0">
                            {risk.level === 'critical' ? <AlertTriangle size={14} className="text-rose-600" /> : <Flag size={14} className="text-orange-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <Badge className={`text-[9px] ${risk.level === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-orange-50 text-orange-700 border-orange-200/60'}`}>{risk.label}</Badge>
                              <Badge variant="outline" className={`text-[9px] ${r.authority === 'BDDK' ? 'border-indigo-200/60 text-indigo-700' : 'border-blue-200/60 text-blue-700'}`}>{r.authority || 'SPK'}</Badge>
                            </div>
                            <p className="text-[11px] font-medium text-slate-800 truncate" title={r.title}>{r.title}</p>
                            <p className="text-[10px] text-slate-400">{r.isoDate || r.date || '—'}</p>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            </div>

            {/* Management Briefing */}
            <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <FileText size={18} className="text-slate-600" />
                <h3 className="text-sm font-semibold text-slate-800">Yönetici Brifingi</h3>
              </div>
              {(() => {
                const total = allArchiveRecords.length
                const critical = allArchiveRecords.filter((r) => calculateRegulatoryRisk(r).level === 'critical').length
                const openTasksCount = tasks.filter((t) => t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length
                const delayed = tasks.filter((t) => { if (!t.dueDate || t.status === 'Tamamlandı' || t.status === 'Ertelendi') return false; return new Date(t.dueDate) < new Date() }).length
                const opAreas = allArchiveRecords.slice(0, 300).map((r) => calculateOperationalImpact(r))
                const areaCounts: Record<string, number> = {}
                opAreas.forEach((op) => op.areas.forEach((a) => areaCounts[a] = (areaCounts[a] || 0) + 1))
                const top3Areas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name).join(', ')
                return (
                  <div className="rounded-xl border border-slate-200/70 bg-slate-50/50 p-4 space-y-2">
                    <p className="text-[13px] text-slate-700 leading-relaxed">
                      AKOP RegTech bugün SPK ve BDDK kaynaklarından <strong>{total.toLocaleString('tr-TR')}</strong> düzenleyici kaydı izlemektedir.
                      Son incelemelerde <strong>{top3Areas || 'Belirlenemedi'}</strong> alanlarında yoğunlaşan düzenlemeler tespit edilmiştir.
                      Şu anda <strong>{openTasksCount}</strong> açık görev ve <strong>{delayed}</strong> gecikmiş görev bulunmaktadır.
                      Kritik risk seviyesinde <strong>{critical}</strong> kayıt değerlendirme beklemektedir.
                    </p>
                  </div>
                )
              })()}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <button onClick={() => { setExecutiveMode(false); setActiveTab('copilot') }} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 transition-all">
                <BrainCircuit size={14} /> AKOP Copilot Aç
              </button>
              <button onClick={() => { setReportModalOpen(true); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Yönetim kurulu raporu oluşturuldu', entityType: 'system', severity: 'info' }) }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all">
                <FileBarChart size={14} /> Yönetim Kurulu Raporu Oluştur
              </button>
              <button onClick={() => { setExecutiveMode(false); setActiveTab('tasks') }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all">
                <ClipboardList size={14} /> Kritik Görevleri Gör
              </button>
              <button onClick={() => { setExecutiveMode(false); setActiveTab('spk') }} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all">
                <Landmark size={14} /> Son Düzenlemeleri Aç
              </button>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Executive Summary Banner */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <LayoutDashboard size={18} className="text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-800">AKOP RegTech Yönetici Uyum Özeti</h2>
                </div>
                {(currentUser?.role === 'Admin' || currentUser?.role === 'Yönetici' || currentUser?.role === 'Denetçi' || currentUser?.role === 'Uyum Uzmanı') && (
                  <button onClick={() => { setReportModalOpen(true); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Yönetim kurulu raporu oluşturuldu', entityType: 'system', severity: 'info' }) }} className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">
                    <FileBarChart size={13} /> Rapor Oluştur
                  </button>
                )}
              </div>
              {spkLoading ? (
                <div className="space-y-2">
                  <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                  <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
                </div>
              ) : (
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  AKOP RegTech bugün <span className="font-semibold text-slate-800">SPK</span> ve <span className="font-semibold text-slate-800">BDDK</span> kaynaklarından <span className="font-semibold text-slate-800">{regulatoryArchive?.counts.total ?? spkData?.archive?.total ?? 0}</span> düzenleyici kaydı izliyor. <span className="font-semibold text-slate-800">{tasks.filter((t) => t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length}</span> açık uyum görevi, <span className="font-semibold text-slate-800">{tasks.filter((t) => isTaskOverdue(t)).length}</span> gecikmiş aksiyon bulunuyor.
                </p>
              )}
            </div>

            {/* C-Level KPIs — max 6 */}
            {(() => {
              const opCounts: Record<string, number> = {}
              allArchiveRecords.slice(0, 200).forEach((r) => {
                calculateOperationalImpact(r).areas.forEach((a) => { opCounts[a] = (opCounts[a] || 0) + 1 })
              })
              const topOp = Object.entries(opCounts).sort((a, b) => b[1] - a[1])[0]
              const kpis = [
                { label: 'İzlenen Kayıt', value: regulatoryArchive?.counts.total ?? spkData?.archive?.total ?? 0, icon: Database, color: 'text-slate-700', bg: 'bg-slate-50', tab: 'spk' as TabKey },
                { label: 'Kritik Risk', value: tasks.filter((t) => t.riskLevel === 'Kritik').length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', tab: 'riskcenter' as TabKey },
                { label: 'Açık Görev', value: tasks.filter((t) => t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length, icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-50', tab: 'tasks' as TabKey },
                { label: 'Geciken Görev', value: tasks.filter((t) => isTaskOverdue(t)).length, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50', tab: 'tasks' as TabKey },
                { label: 'Yeni Düzenleme (7g)', value: spkData?.updates.filter((u) => { const d = new Date(u.detectedAt); const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); return d >= weekAgo }).length ?? 0, icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50', tab: 'spk' as TabKey },
                { label: 'Etkilenen Alan', value: topOp ? `${topOp[0]} (${topOp[1]})` : '—', icon: Eye, color: 'text-cyan-600', bg: 'bg-cyan-50', tab: 'spk' as TabKey },
              ]
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {kpis.map((kpi) => (
                    <div key={kpi.label} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all relative group">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${kpi.bg} ${kpi.color}`}><kpi.icon size={18} /></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-1 leading-tight uppercase tracking-wide">{kpi.label}</p>
                      {spkLoading ? (
                        <div className="h-7 w-10 bg-slate-200 rounded animate-pulse mt-1" />
                      ) : (
                        <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                      )}
                      <button onClick={() => setActiveTab(kpi.tab)} className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-slate-400 hover:text-slate-700 underline">Detay</button>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Compliance Score */}
            {(() => {
              const delayedCount = tasks.filter((t) => isTaskOverdue(t)).length
              const criticalOpenCount = tasks.filter((t) => t.riskLevel === 'Kritik' && t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length
              const completedCount = tasks.filter((t) => t.status === 'Tamamlandı').length
              let score = 100
              score -= delayedCount * 8
              score -= criticalOpenCount * 12
              score += Math.min(completedCount * 3, 15)
              score = Math.max(0, Math.min(100, score))
              const scoreColor = score >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200/60' : score >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200/60' : 'text-rose-700 bg-rose-50 border-rose-200/60'
              const scoreLabel = score >= 80 ? 'İyi' : score >= 60 ? 'Dikkat' : 'Kritik'
              const barColor = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-rose-500'
              return (
                <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Scale size={18} className="text-slate-700" />
                      <h3 className="text-sm font-semibold text-slate-800">Uyum Skoru</h3>
                    </div>
                    <Badge className={`text-[10px] ${scoreColor}`}>{scoreLabel} — {score}/100</Badge>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" />Gecikmiş: -{delayedCount * 8}p</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" />Kritik açık: -{criticalOpenCount * 12}p</span>
                    <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />Tamamlanan: +{Math.min(completedCount * 3, 15)}p</span>
                  </div>
                </div>
              )
            })()}

            {/* Risk Heatmap + Institution Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Risk Heatmap */}
              <div className="lg:col-span-2 bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldAlert size={18} className="text-rose-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Kurum Bazlı Risk Isı Haritası</h3>
                </div>
                <p className="text-[11px] text-slate-500">Son 50 kayıt bazında risk seviyesi dağılımı</p>
                {(() => {
                  const institutions = [
                    { key: 'SPK', records: spkRecords.slice(0, 50) },
                    { key: 'BDDK', records: bddkRecords.slice(0, 50) },
                    { key: 'MASAK', records: [] as SpkArchiveRecord[] },
                    { key: 'Global', records: [] as SpkArchiveRecord[] },
                  ]
                  const levels: Array<{ key: 'low' | 'medium' | 'high' | 'critical'; label: string; color: string; text: string }> = [
                    { key: 'low', label: 'Düşük', color: 'bg-emerald-100', text: 'text-emerald-700' },
                    { key: 'medium', label: 'Orta', color: 'bg-amber-100', text: 'text-amber-700' },
                    { key: 'high', label: 'Yüksek', color: 'bg-orange-100', text: 'text-orange-700' },
                    { key: 'critical', label: 'Kritik', color: 'bg-rose-100', text: 'text-rose-700' },
                  ]
                  return (
                    <div className="space-y-2">
                      <div className="grid grid-cols-5 gap-2 text-center">
                        <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left pl-2">Kurum</div>
                        {levels.map((l) => (<div key={l.key} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{l.label}</div>))}
                      </div>
                      {institutions.map((inst) => {
                        const counts = { low: 0, medium: 0, high: 0, critical: 0 }
                        inst.records.forEach((r) => { const risk = calculateRegulatoryRisk(r); counts[risk.level]++ })
                        return (
                          <div key={inst.key} className="grid grid-cols-5 gap-2 items-center">
                            <div className="text-xs font-medium text-slate-700 pl-2">{inst.key}</div>
                            {levels.map((l) => (
                              <div key={l.key} className={`rounded-xl py-2 text-center text-xs font-semibold ${counts[l.key] > 0 ? `${l.color} ${l.text}` : 'bg-slate-50 text-slate-400'}`}>
                                {counts[l.key]}
                              </div>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>

              {/* Institution Summary Cards */}
              <div className="space-y-3">
                {[
                  { name: 'SPK', icon: Landmark, iconColor: 'text-blue-600', status: 'Aktif', statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/60', records: spkData?.archive?.total ?? 0, last: spkData ? new Date(spkData.lastCheckedAt).toLocaleDateString('tr-TR') : '—', tab: 'spk' as TabKey },
                  { name: 'BDDK', icon: Building2, iconColor: 'text-indigo-600', status: (regulatoryArchive?.counts?.bddk ?? 0) > 0 ? 'Build Cache' : 'Bekliyor', statusClass: (regulatoryArchive?.counts?.bddk ?? 0) > 0 ? 'bg-amber-50 text-amber-700 border-amber-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/60', records: regulatoryArchive?.counts?.bddk ?? 0, last: regulatoryArchive?.cacheInfo?.bddk?.lastRefreshedAt ? new Date(regulatoryArchive.cacheInfo.bddk.lastRefreshedAt).toLocaleDateString('tr-TR') : '—', tab: 'bddk' as TabKey },
                  { name: 'MASAK', icon: Lock, iconColor: 'text-rose-600', status: 'Bekliyor', statusClass: 'bg-slate-50 text-slate-500 border-slate-200/60', records: 0, last: '—', tab: 'masak' as TabKey },
                ].map((inst) => (
                  <div key={inst.name} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 space-y-2 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2"><inst.icon size={16} className={inst.iconColor} /><span className="text-xs font-semibold text-slate-800">{inst.name}</span></div>
                      <Badge className={`text-[10px] ${inst.statusClass}`}>{inst.status}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                      <div><span className="text-slate-400">Kayıt:</span> {inst.records}</div>
                      <div><span className="text-slate-400">Açık:</span> {tasks.filter((t) => t.authority === inst.name && t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length}</div>
                      <div><span className="text-slate-400">Kritik:</span> {tasks.filter((t) => t.authority === inst.name && t.riskLevel === 'Kritik').length}</div>
                      <div><span className="text-slate-400">Son:</span> {inst.last}</div>
                    </div>
                    <button onClick={() => setActiveTab(inst.tab)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-all">Detaya Git</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Critical Developments + Executive Action List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Son Kritik Gelişmeler */}
              <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle size={18} className="text-rose-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Son Kritik Gelişmeler</h3>
                </div>
                <p className="text-[11px] text-slate-500">En yüksek riskli son 5 düzenleyici kayıt</p>
                {(() => {
                  const topRisk = allArchiveRecords
                    .map((r) => ({ record: r, risk: calculateRegulatoryRisk(r) }))
                    .filter((x) => x.risk.level !== 'low')
                    .sort((a, b) => {
                      const order = { critical: 3, high: 2, medium: 1, low: 0 }
                      return order[b.risk.level] - order[a.risk.level]
                    })
                    .slice(0, 5)
                  if (topRisk.length === 0) {
                    return <p className="text-[11px] text-slate-400 py-4">Yüksek riskli kayıt bulunmuyor.</p>
                  }
                  return (
                    <div className="space-y-2">
                      {topRisk.map((x) => (
                        <div key={x.record.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all">
                          <div className="mt-0.5 shrink-0">
                            {x.risk.level === 'critical' && <AlertTriangle size={14} className="text-rose-600" />}
                            {x.risk.level === 'high' && <AlertTriangle size={14} className="text-orange-600" />}
                            {x.risk.level === 'medium' && <Bell size={14} className="text-amber-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <Badge className={`text-[10px] ${x.record.authority === 'BDDK' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' : 'bg-blue-50 text-blue-700 border-blue-200/60'}`}>{x.record.authority || 'SPK'}</Badge>
                              <Badge className={`text-[10px] ${getRiskBadgeClass(x.risk.level)}`}>{x.risk.label}</Badge>
                              <p className="text-xs font-semibold text-slate-800 truncate">{x.record.title}</p>
                            </div>
                            <p className="text-[10px] text-slate-500 truncate">{x.risk.reason}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{x.record.isoDate || x.record.date || '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>

              {/* Yönetici Aksiyon Listesi */}
              <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList size={18} className="text-violet-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Yönetici Aksiyon Listesi</h3>
                </div>
                <p className="text-[11px] text-slate-500">Geciken ve kritik açık görevler</p>
                {(() => {
                  const actionItems = tasks
                    .filter((t) => isTaskOverdue(t) || (t.riskLevel === 'Kritik' && t.status !== 'Tamamlandı' && t.status !== 'Ertelendi'))
                    .sort((a, b) => {
                      const aOverdue = isTaskOverdue(a) ? 1 : 0
                      const bOverdue = isTaskOverdue(b) ? 1 : 0
                      if (aOverdue !== bOverdue) return bOverdue - aOverdue
                      const riskOrder = { Kritik: 3, Yüksek: 2, Orta: 1, Düşük: 0 }
                      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel]
                    })
                    .slice(0, 6)
                  if (actionItems.length === 0) {
                    return <p className="text-[11px] text-slate-400 py-4">Aksiyon gerektiren görev bulunmuyor.</p>
                  }
                  return (
                    <div className="space-y-2">
                      {actionItems.map((t) => {
                        const overdue = isTaskOverdue(t)
                        return (
                          <div key={t.id} className={`flex items-start gap-3 rounded-xl border p-3 hover:shadow-sm transition-all ${overdue ? 'border-rose-200 bg-rose-50/40' : 'border-slate-100'}`}>
                            <div className="mt-0.5 shrink-0">
                              {overdue ? <AlertTriangle size={14} className="text-rose-600" /> : <Flag size={14} className="text-violet-600" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                <Badge variant="outline" className={`text-[10px] ${t.authority === 'BDDK' ? 'border-indigo-200/60 text-indigo-700' : t.authority === 'MASAK' ? 'border-rose-200/60 text-rose-700' : 'border-blue-200/60 text-blue-700'}`}>{t.authority}</Badge>
                                <Badge className={`text-[10px] ${getTaskRiskBadgeClass(t.riskLevel)}`}>{t.riskLevel}</Badge>
                                <p className="text-xs font-semibold text-slate-800 truncate">{t.title}</p>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span>Sorumlu: {t.assignedTo}</span>
                                <span className={overdue ? 'text-rose-600 font-semibold' : ''}>Son: {t.dueDate}</span>
                                {overdue && <Badge className="text-[9px] bg-rose-50 text-rose-700 border-rose-200/60">Gecikmiş</Badge>}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
                <button onClick={() => setActiveTab('tasks')} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 hover:bg-slate-50 transition-all">Tüm Görevlere Git</button>
              </div>
            </div>

            {/* Operasyon Etki Matrisi */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <Eye size={18} className="text-cyan-600" />
                <h3 className="text-sm font-semibold text-slate-800">Operasyon Etki Matrisi</h3>
              </div>
              <p className="text-[11px] text-slate-500">Regülasyon kayıtlarının iç operasyon süreçlerine etki dağılımı</p>
              {(() => {
                const areas: OperationArea[] = ['MKK Mutabakat', 'Takasbank İşlemleri', 'Müşteri Onboarding', 'KYC / AML', 'Emir ve İşlem Gözetimi', 'Raporlama', 'Risk Yönetimi', 'Sermaye Yeterliliği', 'Veri Gizliliği / KVKK', 'İç Kontrol']
                const institutions = ['SPK', 'BDDK', 'MASAK', 'Global']
                const matrix: Record<string, Record<string, number>> = {}
                areas.forEach((a) => { matrix[a] = { SPK: 0, BDDK: 0, MASAK: 0, Global: 0 } })
                allArchiveRecords.slice(0, 300).forEach((r) => {
                  const inst = r.authority === 'BDDK' ? 'BDDK' : 'SPK'
                  const impact = calculateOperationalImpact(r)
                  impact.areas.forEach((area) => { if (matrix[area]) matrix[area][inst]++ })
                })
                return (
                  <div className="overflow-x-auto">
                    <div className="grid grid-cols-[minmax(140px,1fr)_repeat(4,minmax(60px,1fr))] gap-1 text-center">
                      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide text-left pl-2 py-2">Operasyon Alanı</div>
                      {institutions.map((i) => (<div key={i} className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide py-2">{i}</div>))}
                      {areas.map((area) => (
                        <>
                          <div key={`${area}-label`} className="text-[11px] font-medium text-slate-700 text-left pl-2 py-2 border-t border-slate-50">{area}</div>
                          {institutions.map((inst) => {
                            const count = matrix[area][inst]
                            const level = getAreaImpactLevel(count)
                            return (
                              <div key={`${area}-${inst}`} className={`text-[11px] font-semibold py-2 rounded-lg border-t border-slate-50 ${count > 0 ? `${getAreaImpactBadgeClass(level)}` : 'text-slate-300'}`}>
                                {count > 0 ? count : '—'}
                              </div>
                            )
                          })}
                        </>
                      ))}
                    </div>
                  </div>
                )
              })()}
            </div>

            {/* Etkilenen Süreç Kartları */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <ClipboardList size={18} className="text-violet-600" />
                <h3 className="text-sm font-semibold text-slate-800">Etkilenen Süreç Kartları</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(() => {
                  const areas: OperationArea[] = ['MKK Mutabakat', 'Takasbank İşlemleri', 'Müşteri Onboarding', 'KYC / AML', 'Emir ve İşlem Gözetimi', 'Raporlama', 'Risk Yönetimi', 'Sermaye Yeterliliği', 'Veri Gizliliği / KVKK', 'İç Kontrol']
                  const areaData = areas.map((area) => {
                    const affectedRecords = allArchiveRecords.slice(0, 300).filter((r) => calculateOperationalImpact(r).areas.includes(area))
                    const count = affectedRecords.length
                    const highestRisk = affectedRecords.length > 0
                      ? affectedRecords.map((r) => calculateRegulatoryRisk(r).level).sort((a, b) => { const order = { critical: 3, high: 2, medium: 1, low: 0 }; return order[b] - order[a] })[0]
                      : 'low'
                    const openTasks = tasks.filter((t) => calculateOperationalImpact({ title: t.regulationTitle || t.title, authority: t.authority }).areas.includes(area) && t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length
                    const latestDate = affectedRecords.length > 0
                      ? affectedRecords.map((r) => r.isoDate || r.date).filter(Boolean).sort().reverse()[0]
                      : null
                    return { area, count, highestRisk, openTasks, latestDate }
                  }).filter((d) => d.count > 0).sort((a, b) => b.count - a.count).slice(0, 6)

                  if (areaData.length === 0) {
                    return <div className="col-span-full text-[11px] text-slate-400 py-4">Operasyon etkisi tespit edilen kayıt bulunmuyor.</div>
                  }
                  return areaData.map((d) => (
                    <div key={d.area} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 space-y-2 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-800">{d.area}</p>
                        <Badge className={`text-[10px] ${getRiskBadgeClass(d.highestRisk as any)}`}>{d.highestRisk === 'critical' ? 'Kritik' : d.highestRisk === 'high' ? 'Yüksek' : d.highestRisk === 'medium' ? 'Orta' : 'Düşük'}</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-600">
                        <div><span className="text-slate-400">Kayıt:</span> {d.count}</div>
                        <div><span className="text-slate-400">Açık:</span> {d.openTasks}</div>
                        <div><span className="text-slate-400">Son:</span> {d.latestDate || '—'}</div>
                      </div>
                    </div>
                  ))
                })()}
              </div>
            </div>

            {/* Son İzlenen Yaşam Döngüleri */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <GitBranch size={18} className="text-violet-600" />
                <h3 className="text-sm font-semibold text-slate-800">Son İzlenen Yaşam Döngüleri</h3>
              </div>
              <p className="text-[11px] text-slate-500">Son kayıtların yaşam döngüsü özetleri</p>
              {(() => {
                const recent = allArchiveRecords
                  .filter((r) => calculateRegulatoryRisk(r).level === 'critical' || calculateRegulatoryRisk(r).level === 'high')
                  .sort((a, b) => new Date(b.isoDate || b.date || '').getTime() - new Date(a.isoDate || a.date || '').getTime())
                  .slice(0, 3)
                if (recent.length === 0) return <p className="text-[11px] text-slate-400 py-4">Son yaşam döngüsü kaydı bulunmuyor.</p>
                return (
                  <div className="space-y-3">
                    {recent.map((r) => {
                      const risk = calculateRegulatoryRisk(r)
                      const related = tasks.filter((t) => t.regulationId === r.id)
                      const completed = related.filter((t) => t.status === 'Tamamlandı').length
                      const rate = related.length > 0 ? Math.round((completed / related.length) * 100) : 0
                      return (
                        <div key={r.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setTimelineRecord(r); setActiveTab('timeline') }}>
                          <div className="mt-0.5 shrink-0">
                            {risk.level === 'critical' ? <AlertTriangle size={14} className="text-rose-600" /> : <Flag size={14} className="text-orange-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <Badge className={`text-[10px] ${risk.level === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-orange-50 text-orange-700 border-orange-200/60'}`}>{risk.label}</Badge>
                              <Badge variant="outline" className={`text-[9px] ${r.authority === 'BDDK' ? 'border-indigo-200/60 text-indigo-700' : 'border-blue-200/60 text-blue-700'}`}>{r.authority || 'SPK'}</Badge>
                            </div>
                            <p className="text-[11px] font-medium text-slate-800 truncate">{r.title}</p>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500 mt-1">
                              <span>{r.isoDate || r.date || '—'}</span>
                              <span className={rate === 100 && related.length > 0 ? 'text-emerald-600 font-semibold' : related.length > 0 ? 'text-amber-600' : 'text-slate-400'}>
                                {related.length > 0 ? `%${rate} tamamlandı` : 'Görev yok'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* MKK Mutabakat Özeti */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-800">MKK Mutabakat Özeti</h3>
                </div>
                <Badge variant="outline" className="text-[9px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              {(() => {
                const reconStats = getReconciliationStats(reconciliationRecords)
                const openRecon = reconciliationRecords.filter((r) => r.status !== 'Kapandı')
                const criticalRecon = reconciliationRecords.filter((r) => r.risk === 'Kritik' && r.status !== 'Kapandı')
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-blue-500 uppercase">Açık Uyuşmazlık</p>
                      <p className="text-xl font-bold text-blue-700">{openRecon.length}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-rose-500 uppercase">Kritik Fark</p>
                      <p className="text-xl font-bold text-rose-700">{criticalRecon.length}</p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-violet-500 uppercase">SLA Aşımı</p>
                      <p className="text-xl font-bold text-violet-700">{reconStats.slaBreach}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase">Başarı Oranı</p>
                      <p className="text-xl font-bold text-emerald-700">{reconStats.total > 0 ? Math.round((reconStats.successful / reconStats.total) * 100) : 0}%</p>
                    </div>
                    {openRecon.slice(0, 3).map((r) => (
                      <div key={r.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setReconDetailRecord(r); setActiveTab('reconciliation') }}>
                        <div className="mt-0.5 shrink-0">
                          {r.risk === 'Kritik' ? <AlertTriangle size={14} className="text-rose-600" /> : r.risk === 'Yüksek' ? <Flag size={14} className="text-orange-600" /> : <Check size={14} className="text-emerald-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[9px] ${getReconRiskBadgeClass(r.risk)}`}>{r.risk}</Badge>
                            <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{r.type}</Badge>
                          </div>
                          <p className="text-[11px] font-medium text-slate-800 truncate">{r.customer}</p>
                          <p className="text-[10px] text-slate-500">{r.account} · Fark: {r.difference.toLocaleString('tr-TR')} {r.currency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Takasbank İzleme Özeti */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Takasbank İzleme Özeti</h3>
                </div>
                <Badge variant="outline" className="text-[9px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              {(() => {
                const takasStats = getTakasbankStats(takasbankAlerts)
                const openAlerts = takasbankAlerts.filter((a) => a.status !== 'Kapandı')
                const criticalAlerts = takasbankAlerts.filter((a) => a.risk === 'Kritik' && a.status !== 'Kapandı')
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-blue-500 uppercase">Açık Uyarı</p>
                      <p className="text-xl font-bold text-blue-700">{openAlerts.length}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-rose-500 uppercase">Kritik Risk</p>
                      <p className="text-xl font-bold text-rose-700">{criticalAlerts.length}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-amber-500 uppercase">Margin Çağrısı</p>
                      <p className="text-xl font-bold text-amber-700">{takasStats.marginCalls}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase">Başarı Oranı</p>
                      <p className="text-xl font-bold text-emerald-700">{takasStats.total > 0 ? Math.round((takasStats.successful / takasStats.total) * 100) : 0}%</p>
                    </div>
                    {openAlerts.slice(0, 3).map((a) => (
                      <div key={a.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setTakasDetailAlert(a); setActiveTab('takasbank') }}>
                        <div className="mt-0.5 shrink-0">
                          {a.risk === 'Kritik' ? <AlertTriangle size={14} className="text-rose-600" /> : a.risk === 'Yüksek' ? <Flag size={14} className="text-orange-600" /> : <Check size={14} className="text-emerald-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[9px] ${getTakasbankRiskBadgeClass(a.risk)}`}>{a.risk}</Badge>
                            <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{a.type}</Badge>
                          </div>
                          <p className="text-[11px] font-medium text-slate-800 truncate">{a.member}</p>
                          <p className="text-[10px] text-slate-500">{a.account} · Tutar: {a.amount.toLocaleString('tr-TR')} {a.currency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Onay Merkezi Özeti */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Onay Merkezi Özeti</h3>
                </div>
                <Badge variant="outline" className="text-[9px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              {(() => {
                const appStats = getApprovalStats(approvalRequests)
                const pendingApprovals = approvalRequests.filter((a) => a.status === 'Beklemede')
                const criticalApprovals = pendingApprovals.filter((a) => a.priority === 'Kritik')
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-blue-500 uppercase">Bekleyen</p>
                      <p className="text-xl font-bold text-blue-700">{appStats.pending}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-rose-500 uppercase">Kritik</p>
                      <p className="text-xl font-bold text-rose-700">{criticalApprovals.length}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase">Onaylanan</p>
                      <p className="text-xl font-bold text-emerald-700">{appStats.approved}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-amber-500 uppercase">Revizyon</p>
                      <p className="text-xl font-bold text-amber-700">{appStats.revision}</p>
                    </div>
                    {pendingApprovals.slice(0, 3).map((a) => (
                      <div key={a.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setApprovalDetail(a); setActiveTab('approval') }}>
                        <div className="mt-0.5 shrink-0">
                          {a.priority === 'Kritik' ? <AlertTriangle size={14} className="text-rose-600" /> : <ClipboardCheck size={14} className="text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[9px] ${getApprovalPriorityBadgeClass(a.priority)}`}>{a.priority}</Badge>
                            <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{a.sourceModule}</Badge>
                          </div>
                          <p className="text-[11px] font-medium text-slate-800 truncate">{a.sourceTitle}</p>
                          <p className="text-[10px] text-slate-500">{a.requestType} · {a.requestedBy}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Workflow Özeti */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <GitBranch size={18} className="text-violet-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Workflow Özeti</h3>
                </div>
                <Badge variant="outline" className="text-[9px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              {(() => {
                const wfStats = getWorkflowStats(approvalRequests)
                const pendingWf = approvalRequests.filter((a) => a.workflowId && a.status === 'Beklemede')
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-blue-500 uppercase">Bekleyen</p>
                      <p className="text-xl font-bold text-blue-700">{wfStats.pendingWorkflows}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-rose-500 uppercase">SLA İhlali</p>
                      <p className="text-xl font-bold text-rose-700">{wfStats.slaBreaches}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-orange-500 uppercase">Kritik</p>
                      <p className="text-xl font-bold text-orange-700">{wfStats.criticalWorkflows}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase">Tamamlanan</p>
                      <p className="text-xl font-bold text-emerald-700">{wfStats.completedWorkflows}</p>
                    </div>
                    {pendingWf.slice(0, 3).map((a) => (
                      <div key={a.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setApprovalDetail(a); setActiveTab('approval') }}>
                        <div className="mt-0.5 shrink-0">
                          <GitBranch size={14} className="text-violet-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[9px] ${getApprovalPriorityBadgeClass(a.priority)}`}>{a.priority}</Badge>
                            <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{a.sourceModule}</Badge>
                            {a.slaDeadline && new Date() > new Date(a.slaDeadline) && <Badge className="text-[8px] bg-rose-50 text-rose-700 border-rose-200/60">SLA Aşımı</Badge>}
                          </div>
                          <p className="text-[11px] font-medium text-slate-800 truncate">{a.sourceTitle}</p>
                          <p className="text-[10px] text-slate-500">{a.currentStage} / {a.totalStages} · {a.pendingRole}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Yükümlülük Özeti */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ClipboardList size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Yükümlülük Özeti</h3>
                </div>
                <Badge variant="outline" className="text-[9px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              {(() => {
                const oblStats = getObligationStats(obligations)
                const criticalObligations = obligations.filter((o) => o.riskLevel === 'Kritik' && o.status !== 'Tamamlandı')
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-blue-500 uppercase">Açık</p>
                      <p className="text-xl font-bold text-blue-700">{oblStats.open}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-rose-500 uppercase">Kritik</p>
                      <p className="text-xl font-bold text-rose-700">{oblStats.critical}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-orange-500 uppercase">Geciken</p>
                      <p className="text-xl font-bold text-orange-700">{oblStats.overdue}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase">Bu Ay Tamamlanan</p>
                      <p className="text-xl font-bold text-emerald-700">{oblStats.completedThisMonth}</p>
                    </div>
                    {criticalObligations.slice(0, 5).map((o) => (
                      <div key={o.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setObligationDetail(o); setActiveTab('obligations') }}>
                        <div className="mt-0.5 shrink-0">
                          <AlertTriangle size={14} className="text-rose-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[9px] ${getObligationRiskBadgeClass(o.riskLevel)}`}>{o.riskLevel}</Badge>
                            <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{o.authority}</Badge>
                          </div>
                          <p className="text-[11px] font-medium text-slate-800 truncate">{o.title}</p>
                          <p className="text-[10px] text-slate-500">{o.articleReference} · {o.owner} · Termin: {new Date(o.dueDate).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Kanıt Kasası Özeti */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FolderLock size={18} className="text-emerald-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Kanıt Kasası Özeti</h3>
                </div>
                <Badge variant="outline" className="text-[9px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              {(() => {
                const evStats = getEvidenceStats(evidenceDocs)
                const missingObl = obligations.filter((o) => o.evidenceCount === 0).length
                const criticalRestricted = evidenceDocs.filter((d) => d.classification === 'Restricted' && d.status !== 'Arşivlendi')
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase">Toplam</p>
                      <p className="text-xl font-bold text-emerald-700">{evStats.total}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-rose-500 uppercase">Restricted</p>
                      <p className="text-xl font-bold text-rose-700">{evStats.restricted}</p>
                    </div>
                    <div className="bg-sky-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-sky-500 uppercase">Onay Bekleyen</p>
                      <p className="text-xl font-bold text-sky-700">{evStats.pendingApproval}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-orange-500 uppercase">Eksik Kanıt</p>
                      <p className="text-xl font-bold text-orange-700">{missingObl}</p>
                    </div>
                    {criticalRestricted.slice(0, 5).map((d) => (
                      <div key={d.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setEvidenceDetail(d); setActiveTab('evidence') }}>
                        <div className="mt-0.5 shrink-0">
                          <Lock size={14} className="text-rose-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[9px] ${getClassificationBadgeClass(d.classification)}`}>{d.classification}</Badge>
                            <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{d.linkedEntityType}</Badge>
                          </div>
                          <p className="text-[11px] font-medium text-slate-800 truncate">{d.title}</p>
                          <p className="text-[10px] text-slate-500">{d.fileName} · {d.uploadedBy} · {d.linkedEntityTitle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Regulatory Intelligence Özeti */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ScanSearch size={18} className="text-violet-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Regulatory Intelligence Özeti</h3>
                </div>
                <Badge variant="outline" className="text-[9px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              {(() => {
                const riStats = getRegIntelStats(regChanges, regVersions)
                const recentChanges = regChanges.filter((c) => {
                  const d = new Date(c.detectedAt)
                  const now = new Date()
                  const thirtyDays = new Date(now.getTime() - 30 * 86400000)
                  return d >= thirtyDays
                }).sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime())
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-violet-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-violet-500 uppercase">Değişiklik</p>
                      <p className="text-xl font-bold text-violet-700">{riStats.totalChanges}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-rose-500 uppercase">Kritik Etki</p>
                      <p className="text-xl font-bold text-rose-700">{riStats.criticalChanges}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-amber-500 uppercase">Önerilen Yükümlülük</p>
                      <p className="text-xl font-bold text-amber-700">{riStats.suggestedObligations}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-blue-500 uppercase">Etkilenen Görev</p>
                      <p className="text-xl font-bold text-blue-700">{riStats.affectedTasks}</p>
                    </div>
                    {recentChanges.slice(0, 5).map((c) => {
                      const version = regVersions.find((v) => v.regulationId === c.regulationId)
                      return (
                        <div key={c.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setRegIntelDetail(c); setActiveTab('regintel') }}>
                          <div className="mt-0.5 shrink-0">
                            <ScanSearch size={14} className="text-violet-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-[9px] ${getChangeTypeBadgeClass(c.changeType)}`}>{c.changeType}</Badge>
                              <Badge className={`text-[9px] ${getImpactBadgeClass(c.impactLevel)}`}>{c.impactLevel}</Badge>
                            </div>
                            <p className="text-[11px] font-medium text-slate-800 truncate">{c.articleReference}</p>
                            <p className="text-[10px] text-slate-500">{version?.authority} · {c.fromVersion} → {c.toVersion} · {new Date(c.detectedAt).toLocaleDateString('tr-TR')}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Bildirim Merkezi Özeti */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-pink-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Bildirim Merkezi Özeti</h3>
                </div>
                <Badge variant="outline" className="text-[9px] border-amber-200/60 text-amber-700 bg-amber-50">Sistem Üretimi</Badge>
              </div>
              {(() => {
                const nStats = getNotificationStats(notifications)
                const recent = notifications.filter((n) => {
                  if (currentUser && !n.roleVisibility.includes(currentUser.role)) return false
                  return n.status !== 'archived' && (n.severity === 'critical' || n.status === 'unread')
                }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-pink-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-pink-500 uppercase">Kritik</p>
                      <p className="text-xl font-bold text-pink-700">{nStats.critical}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-amber-500 uppercase">SLA Uyarısı</p>
                      <p className="text-xl font-bold text-amber-700">{nStats.sla}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-blue-500 uppercase">Okunmamış</p>
                      <p className="text-xl font-bold text-blue-700">{nStats.unread}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase">Bugün</p>
                      <p className="text-xl font-bold text-emerald-700">{nStats.today}</p>
                    </div>
                    {recent.slice(0, 5).map((n) => (
                      <div key={n.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setActiveTab(n.targetTab as TabKey) }}>
                        <div className="mt-0.5 shrink-0">
                          {n.severity === 'critical' && <AlertTriangle size={14} className="text-rose-600" />}
                          {n.severity === 'warning' && <AlertTriangle size={14} className="text-amber-600" />}
                          {n.severity === 'info' && <Bell size={14} className="text-blue-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[9px] ${getNotificationTypeBadgeClass(n.type)}`}>{n.type}</Badge>
                            <Badge className={`text-[9px] ${getNotifSeverityBadgeClass(n.severity)}`}>{n.severity}</Badge>
                          </div>
                          <p className="text-[11px] font-medium text-slate-800 truncate">{n.title}</p>
                          <p className="text-[10px] text-slate-500">{n.targetEntityTitle} · {new Date(n.createdAt).toLocaleDateString('tr-TR')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Veri Merkezi Özeti */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <DatabaseZap size={18} className="text-cyan-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Veri Merkezi Özeti</h3>
                </div>
                <Badge variant="outline" className="text-[9px] border-emerald-200/60 text-emerald-700 bg-emerald-50">Canlı Veri</Badge>
              </div>
              {(() => {
                const dhStats = getDataSourceStats(dataSources)
                const recent = dataSources.filter((s) => s.lastSync).sort((a, b) => new Date(b.lastSync!).getTime() - new Date(a.lastSync!).getTime()).slice(0, 5)
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase">Aktif Kaynak</p>
                      <p className="text-xl font-bold text-emerald-700">{dhStats.active}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-rose-500 uppercase">Başarısız Sync</p>
                      <p className="text-xl font-bold text-rose-700">{dhStats.failedSync}</p>
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-blue-500 uppercase">Son 24 Saat</p>
                      <p className="text-xl font-bold text-blue-700">{dhStats.syncedLast24h}</p>
                    </div>
                    <div className="bg-cyan-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-cyan-500 uppercase">Toplam Kayıt</p>
                      <p className="text-xl font-bold text-cyan-700">{dhStats.totalRecords.toLocaleString('tr-TR')}</p>
                    </div>
                    {recent.map((s) => (
                      <div key={s.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setActiveTab('datahub') }}>
                        <div className="mt-0.5 shrink-0">
                          {s.status === 'ACTIVE' && <CheckCircle size={14} className="text-emerald-600" />}
                          {s.status === 'WARNING' && <AlertTriangle size={14} className="text-amber-600" />}
                          {s.status === 'ERROR' && <AlertTriangle size={14} className="text-rose-600" />}
                          {s.status === 'DISABLED' && <Plug size={14} className="text-slate-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[9px] ${getSourceTypeBadgeClass(s.sourceType)}`}>{s.sourceType}</Badge>
                            <Badge className={`text-[9px] ${getStatusBadgeClass(s.status)}`}>{s.status}</Badge>
                          </div>
                          <p className="text-[11px] font-medium text-slate-800 truncate">{s.name}</p>
                          <p className="text-[10px] text-slate-500">{s.authority} · {s.recordsCount.toLocaleString('tr-TR')} kayıt · {s.lastSync ? `${Math.ceil((Date.now() - new Date(s.lastSync).getTime()) / 60000)} dk önce` : '-'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Risk Center Özeti */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Risk Merkezi Özeti</h3>
                </div>
                <Badge variant="outline" className="text-[9px] border-rose-200/60 text-rose-700 bg-rose-50">AI Risk Scoring</Badge>
              </div>
              {(() => {
                const rStats = getRiskStats(riskScores)
                const top3 = getTopRisks(riskScores, 3)
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-rose-500 uppercase">Kritik Risk</p>
                      <p className="text-xl font-bold text-rose-700">{rStats.critical}</p>
                    </div>
                    <div className="bg-orange-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-orange-500 uppercase">Yüksek Risk</p>
                      <p className="text-xl font-bold text-orange-700">{rStats.high}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-amber-500 uppercase">Ortalama</p>
                      <p className="text-xl font-bold text-amber-700">{rStats.average}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase">Compliance</p>
                      <p className="text-xl font-bold text-emerald-700">{Math.round(riskScores.reduce((s, r) => s + r.complianceScore, 0) / (riskScores.length || 1))}</p>
                    </div>
                    {top3.map((r) => {
                      const trend = getTrendIndicator(r.trend)
                      const level = getRiskLevel(r.score)
                      return (
                        <div key={r.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setActiveTab('riskcenter') }}>
                          <div className="mt-0.5 shrink-0">
                            <ShieldAlert size={14} className={level === 'Kritik' ? 'text-rose-600' : level === 'Yüksek' ? 'text-orange-600' : level === 'Orta' ? 'text-amber-600' : 'text-emerald-600'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-[9px] ${getRiskLevelBadgeClass(level)}`}>{level}</Badge>
                              <Badge variant="outline" className="text-[9px] text-slate-500 border-slate-200">{r.entityType}</Badge>
                              <span className={`text-[10px] font-semibold ${trend.color}`}>{trend.icon} {trend.label}</span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-800 truncate">{r.entityTitle}</p>
                            <p className="text-[10px] text-slate-500">Skor: {r.score} · Etki: {r.impactScore} · Aciliyet: {r.urgencyScore}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>

            {/* Politika Merkezi Özeti */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileCheck size={18} className="text-sky-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Politika Merkezi Özeti</h3>
                </div>
                <Badge variant="outline" className="text-[9px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              {(() => {
                const pStats = getPolicyStats(policies)
                const pending = policies.filter((p) => p.status === 'Onay Bekliyor').slice(0, 3)
                const revision = policies.filter((p) => p.status === 'Revizyon Gerekli').slice(0, 3)
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-sky-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-sky-500 uppercase">Toplam Politika</p>
                      <p className="text-xl font-bold text-sky-700">{pStats.total}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase">Yayında</p>
                      <p className="text-xl font-bold text-emerald-700">{pStats.published}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-amber-500 uppercase">Onay Bekleyen</p>
                      <p className="text-xl font-bold text-amber-700">{pStats.pendingApproval}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-rose-500 uppercase">Revizyon Gerekli</p>
                      <p className="text-xl font-bold text-rose-700">{pStats.needsRevision}</p>
                    </div>
                    {pending.map((p) => (
                      <div key={p.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setActiveTab('policies'); setPolicyDetail(p) }}>
                        <div className="mt-0.5 shrink-0"><Clock size={14} className="text-amber-600" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[9px] ${getPolicyStatusBadgeClass(p.status)}`}>{p.status}</Badge>
                            <Badge className={`text-[9px] ${getPolicyRiskBadgeClass(p.riskLevel)}`}>{p.riskLevel}</Badge>
                          </div>
                          <p className="text-[11px] font-medium text-slate-800 truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-500">{p.documentType} · {p.owner} · v{p.version}</p>
                        </div>
                      </div>
                    ))}
                    {revision.map((p) => (
                      <div key={p.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setActiveTab('policies'); setPolicyDetail(p) }}>
                        <div className="mt-0.5 shrink-0"><AlertTriangle size={14} className="text-rose-600" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[9px] ${getPolicyStatusBadgeClass(p.status)}`}>{p.status}</Badge>
                            <Badge className={`text-[9px] ${getPolicyRiskBadgeClass(p.riskLevel)}`}>{p.riskLevel}</Badge>
                          </div>
                          <p className="text-[11px] font-medium text-slate-800 truncate">{p.title}</p>
                          <p className="text-[10px] text-slate-500">{p.documentType} · {p.owner} · v{p.version}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Case Center Özeti */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness size={18} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Case Center Özeti</h3>
                </div>
                <Badge variant="outline" className="text-[9px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              {(() => {
                const caseStats = getCaseStats(cases)
                const criticalCases = cases.filter((c) => c.riskLevel === 'Kritik' && c.status !== 'Tamamlandı' && c.status !== 'Arşivlendi')
                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-blue-500 uppercase">Açık Vaka</p>
                      <p className="text-xl font-bold text-blue-700">{caseStats.open}</p>
                    </div>
                    <div className="bg-rose-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-rose-500 uppercase">Kritik</p>
                      <p className="text-xl font-bold text-rose-700">{criticalCases.length}</p>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-emerald-500 uppercase">Bu Ay Kapanan</p>
                      <p className="text-xl font-bold text-emerald-700">{caseStats.closedThisMonth}</p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-3 text-center">
                      <p className="text-[10px] text-violet-500 uppercase">SLA Riski</p>
                      <p className="text-xl font-bold text-violet-700">{caseStats.slaRisk}</p>
                    </div>
                    {criticalCases.slice(0, 5).map((c) => (
                      <div key={c.id} className="col-span-2 md:col-span-4 flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => { setCaseDetail(c); setActiveTab('casecenter') }}>
                        <div className="mt-0.5 shrink-0">
                          <AlertTriangle size={14} className="text-rose-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={`text-[9px] ${getCaseRiskBadgeClass(c.riskLevel)}`}>{c.riskLevel}</Badge>
                            <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{c.sourceModule}</Badge>
                          </div>
                          <p className="text-[11px] font-medium text-slate-800 truncate">{c.title}</p>
                          <p className="text-[10px] text-slate-500">{c.caseNumber} · {c.status} · {c.assignedTo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>

            {/* Son Denetim Olayları */}
            {userPerms?.canViewAudit && (
              <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <Archive size={18} className="text-slate-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Son Denetim Olayları</h3>
                </div>
                <p className="text-[11px] text-slate-500">Son kritik sistem ve kullanıcı işlemleri</p>
                {(() => {
                  const auditLogs = getAuditLogs()
                  const criticalLogs = auditLogs.filter((l) => l.severity === 'critical' || l.severity === 'warning').slice(0, 5)
                  if (criticalLogs.length === 0) {
                    return <p className="text-[11px] text-slate-400 py-4">Henüz kritik denetim olayı bulunmuyor.</p>
                  }
                  return (
                    <div className="space-y-2">
                      {criticalLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-all">
                          <div className="mt-0.5 shrink-0">
                            {log.severity === 'critical' ? <AlertTriangle size={14} className="text-rose-600" /> : <Bell size={14} className="text-amber-600" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <Badge className={`text-[10px] ${getSeverityBadgeClass(log.severity)}`}>{log.severity === 'critical' ? 'Kritik' : 'Uyarı'}</Badge>
                              <Badge variant="outline" className={`text-[10px] ${getEntityBadgeClass(log.entityType)}`}>{log.entityType}</Badge>
                              <p className="text-xs font-semibold text-slate-800 truncate">{log.action}</p>
                            </div>
                            <p className="text-[10px] text-slate-500">{log.userName} • {log.role}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{new Date(log.timestamp).toLocaleString('tr-TR')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === 'spk' && (
          <div className="space-y-6">
            {/* SPK Header Description */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <Landmark size={18} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-slate-800">Sermaye Piyasası Kurulu (SPK)</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                SPK kaynakları, bültenleri, basın duyuruları ve mevzuat kayıtları canlı olarak izlenir.
                Kurumsal yatırım hizmetleri, aracılık faaliyetleri ve piyasa düzenlemeleri açısından kritik öneme sahip.
              </p>
            </div>
            {/* SPK Mevzuat Senkronizasyonu */}
        <Card className="shrink-0 bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between py-3 pb-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <BookOpen size={18} className="text-blue-600" />
                <CardTitle className="text-sm font-semibold">SPK Mevzuat Senkronizasyonu</CardTitle>
              </div>
              <p className="text-[11px] text-slate-400">Canlı SPK kaynaklarının durumu ve son güncellemeler</p>
            </div>
            <Button onClick={handleCheckSpk} disabled={spkLoading} variant="outline" size="sm" className="rounded-xl border-slate-200/70">
              {spkLoading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <RefreshCw size={14} className="mr-1.5" />}
              Kontrol Et
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {spkData && (
              <>
                {/* Sources */}
                <div>
                  <div className="grid gap-3 md:grid-cols-4">
                    {spkData.sources.map((s) => (
                      <div key={s.name} className={`rounded-2xl border border-slate-200/70 bg-white p-5 space-y-3 shadow-sm hover:shadow-md transition-all duration-300 ${highlightedSource === s.name ? 'ring-2 ring-blue-400' : ''}`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-800">{s.name}</span>
                          <Badge className={`text-[10px] ${s.status === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60'}`}>
                            {s.status === 'ok' ? 'Aktif' : s.type === 'regulation' ? 'API Tespiti Gerekli' : 'Hata'}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-500 truncate" title={s.latestTitle}>{s.latestTitle}</p>
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] text-slate-400">{s.latestDate}</p>
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                            <ExternalLink size={10} /> Kaynağı Aç
                          </a>
                        </div>
                      </div>
                    ))}
                    {/* BDDK Source Card */}
                    <div className="rounded-2xl border border-slate-200/70 bg-white p-5 space-y-3 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-slate-800">BDDK Kaynakları</span>
                        <Badge className={`text-[10px] ${regulatoryArchive?.source.bddk === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60'}`}>
                          {regulatoryArchive?.source.bddk === 'ok' ? 'Aktif' : regulatoryArchive?.source.bddk === 'api_discovery_required' ? 'API Tespiti Gerekli' : 'Bağlantı Bekliyor'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 truncate">
                        {regulatoryArchive?.counts.bddk
                          ? `Son kayıt: ${regulatoryArchive.counts.bddk} adet`
                          : 'BDDK kaynakları keşfediliyor...'}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-slate-400">
                          {regulatoryArchive?.lastRefreshedAt
                            ? new Date(regulatoryArchive.lastRefreshedAt).toLocaleString('tr-TR')
                            : '—'}
                        </p>
                        <a href="https://www.bddk.org.tr" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                          <ExternalLink size={10} /> Kaynağı Aç
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

              </>
            )}
            {spkLoading && !spkData && (
              <div className="flex items-center justify-center py-12 text-slate-400">
                <Loader2 size={20} className="mr-2 animate-spin" />
                SPK kaynakları kontrol ediliyor...
              </div>
            )}
          </CardContent>
        </Card>

        {/* Son Güncellemeler */}
        {spkData && (spkData.updates.length > 0 || (spkData.archive?.records?.length ?? 0) > 0) && (
          <Card className="shrink-0 bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Bell size={18} className="text-amber-600" />
                  <CardTitle className="text-sm font-semibold">Son Güncellemeler</CardTitle>
                </div>
                <p className="text-[11px] text-slate-400">Son tespit edilen düzenleyici kaynak değişiklikleri</p>
              </div>
            </CardHeader>
            <CardContent>
              {complianceFilter && (
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200/60">
                    Sadece uyum incelemesi gereken kayıtlar gösteriliyor
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-[11px] text-slate-600 hover:text-slate-900"
                    onClick={() => setComplianceFilter(false)}
                  >
                    <FilterX size={12} className="mr-1" />
                    Filtreyi Temizle
                  </Button>
                </div>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                      <TableHead className="text-xs font-medium text-slate-500">Kaynak</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Başlık</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Etki</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Özet</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Tespit Zamanı</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500">Uyum İncelemesi</TableHead>
                      <TableHead className="text-xs font-medium text-slate-500 text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(() => {
                      const updates = spkData.updates.length > 0
                        ? spkData.updates
                        : (spkData.archive?.records || [])
                            .slice()
                            .sort((a, b) => getRecordSortTimestamp(b) - getRecordSortTimestamp(a))
                            .slice(0, 5)
                            .map((r) => ({
                              id: r.id,
                              source: r.sourceType === 'bulletin' ? 'SPK Bültenleri' : r.sourceType === 'press-release' ? 'SPK Basın Duyuruları' : 'SPK Mevzuat Sistemi',
                              title: r.title || '—',
                              url: r.url,
                              impact: 'low',
                              summary: r.number || r.title || '—',
                              detectedAt: r.isoDate || r.effectiveDate || new Date().toISOString(),
                              requiresComplianceReview: false,
                            }))
                      const filtered = complianceFilter
                        ? updates.filter((u) => u.requiresComplianceReview)
                        : updates
                      return filtered.map((u) => (
                      <TableRow key={u.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                        <TableCell className="text-xs whitespace-nowrap">
                          <span className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600">
                              {(() => {
                                const SourceIcon = getSourceIcon(u.source?.toLowerCase().includes('bülten') ? 'bulletin' : u.source?.toLowerCase().includes('basın') ? 'press-release' : u.source?.toLowerCase().includes('mevzuat') ? 'legislation' : undefined)
                                return <SourceIcon size={14} />
                              })()}
                            </span>
                            {u.source}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs max-w-[200px] truncate" title={u.title}>{u.title}</TableCell>
                        <TableCell>
                          <Badge className={
                            u.impact === 'high' || u.impact === 'critical'
                              ? 'bg-rose-50 text-rose-700 border-rose-200/60'
                              : u.impact === 'medium'
                                ? 'bg-amber-50 text-amber-700 border-amber-200/60'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                          }>
                            {u.impact === 'high' ? 'Yüksek' : u.impact === 'medium' ? 'Orta' : u.impact === 'critical' ? 'Kritik' : 'Düşük'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[250px] truncate" title={u.summary}>{u.summary}</TableCell>
                        <TableCell className="text-xs whitespace-nowrap">{new Date(u.detectedAt).toLocaleString('tr-TR')}</TableCell>
                        <TableCell>
                          {u.requiresComplianceReview ? (
                            <Badge className="bg-rose-50 text-rose-700 border-rose-200/60">Gerekli</Badge>
                          ) : (
                            <Badge variant="outline" className="text-emerald-600 border-emerald-200/60">Gerekmez</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <a
                            href={u.url || '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"
                            onClick={(e) => { if (!u.url || u.url === '#') e.preventDefault() }}
                          >
                            <ExternalLink size={12} />
                            Kaynağı Aç
                          </a>
                        </TableCell>
                      </TableRow>
                    ))
                    })()}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Regulatory Archive */}
        {(spkData || regulatoryArchive) && (
          <Card className="flex-1 min-h-0 bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden flex flex-col">
            <CardHeader className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Archive size={18} className="text-slate-600" />
                  <CardTitle className="text-sm font-semibold">SPK Veri Arşivi</CardTitle>
                  {regulatoryArchive?.source.spk === 'live' && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60 text-[10px]">Canlı SPK</Badge>
                  )}
                  {(!regulatoryArchive || regulatoryArchive.source.spk !== 'live') && (
                    <Badge className="bg-amber-50 text-amber-700 border-amber-200/60 text-[10px]">Demo/Fallback</Badge>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">SPK bülten, basın duyurusu ve mevzuat kayıtları.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {regulatoryArchive?.counts && (
                  <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200/60">SPK: {spkRecords.length}</Badge>
                )}
                {spkData?.archive?.stats && (() => {
                  const stats = spkData.archive.stats
                  return (
                    <>
                      {stats.duplicateTotal > 0 && (
                        <Badge className="text-[10px] bg-rose-50 text-rose-700 border-rose-200/60">
                          Dup: {stats.duplicateTotal}
                        </Badge>
                      )}
                      {(stats.missingDates || 0) > 0 && (
                        <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200/60" title="Tarihi eksik kayıtlar">
                          Eksik Tarih: {stats.missingDates}
                        </Badge>
                      )}
                    </>
                  )
                })()}
                {(() => {
                  const allRecs = regulatoryArchive?.records || spkData?.archive?.records || []
                  const years = allRecs.map((r) => r.year).filter((y): y is number => typeof y === 'number' && y > 1900)
                  const minYear = years.length > 0 ? Math.min(...years) : 2012
                  const maxYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear()
                  return (
                    <Badge variant="outline" className="text-[10px] text-slate-400 border-slate-200/60">
                      {minYear}–{maxYear}
                    </Badge>
                  )
                })()}
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
              {/* Filter Bar */}
              <div className="shrink-0 flex flex-wrap items-center gap-2 p-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                <label className="text-[11px] text-slate-500">Yıl:</label>
                <select
                  className="text-[11px] rounded-xl border border-slate-200 px-2.5 py-1.5 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={selectedArchiveYear}
                  onChange={(e) => setSelectedArchiveYear(e.target.value)}
                >
                  <option value="all">Tüm Yıllar</option>
                  {(() => {
                    const currentYear = new Date().getFullYear()
                    const years: number[] = []
                    for (let y = currentYear; y >= 2012; y--) { years.push(y) }
                    return years.map((y) => (
                      <option key={y} value={String(y)}>{y}</option>
                    ))
                  })()}
                </select>
                <label className="text-[11px] text-slate-500 ml-2">Limit:</label>
                <select
                  className="text-[11px] rounded-xl border border-slate-200 px-2.5 py-1.5 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={archiveLimit}
                  onChange={(e) => setArchiveLimit(Number(e.target.value))}
                >
                  <option value={100}>100</option>
                  <option value={250}>250</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                  <option value={1500}>1500</option>
                  <option value={5000}>Tümü</option>
                </select>
                <label className="text-[11px] text-slate-500 ml-2">Tür:</label>
                <select
                  className="text-[11px] rounded-xl border border-slate-200 px-2.5 py-1.5 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={selectedSourceType}
                  onChange={(e) => setSelectedSourceType(e.target.value)}
                >
                  <option value="all">Tümü</option>
                  <option value="bulletin">Bültenler</option>
                  <option value="press-release">Basın Duyuruları</option>
                  <option value="legislation">Mevzuat Sistemi</option>
                </select>
                <input
                  type="text"
                  placeholder="Ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="text-[11px] rounded-xl border border-slate-200 px-2.5 py-1.5 bg-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 w-32"
                />
                <button
                  onClick={() => handleFetchArchive()}
                  disabled={spkLoading}
                  className="inline-flex items-center gap-1 ml-auto rounded-xl border border-slate-200/70 bg-white px-3 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all disabled:opacity-50"
                >
                  {spkLoading ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                  Yenile
                </button>
              </div>

            {regulatoryArchive?.source.spk === 'fallback' && (
              <div className="mb-2 rounded-md bg-amber-50 border border-amber-200/60 p-2.5">
                <p className="text-[11px] text-amber-700">
                  SPK canlı arşiv erişimi geçici olarak alınamadı, demo/fallback kayıtlar gösteriliyor.
                </p>
              </div>
            )}
            {(() => {
              const stats = spkData?.archive?.stats
              if (!stats || stats.duplicateTotal === 0) return null
              return (
                <div className="rounded-md bg-rose-50 border border-rose-200/60 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={14} className="text-rose-600" />
                    <p className="text-xs font-semibold text-rose-700">Duplicate Kayıt Raporu</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded bg-white border border-rose-100 p-2">
                      <p className="text-[10px] text-slate-500">Toplam</p>
                      <p className="text-sm font-bold text-slate-700">{stats.rawTotal}</p>
                    </div>
                    <div className="rounded bg-white border border-emerald-100 p-2">
                      <p className="text-[10px] text-slate-500">Benzersiz</p>
                      <p className="text-sm font-bold text-emerald-700">{stats.uniqueTotal}</p>
                    </div>
                    <div className="rounded bg-white border border-rose-100 p-2">
                      <p className="text-[10px] text-slate-500">Tekrar</p>
                      <p className="text-sm font-bold text-rose-700">{stats.duplicateTotal}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-medium text-rose-700">Örnek Duplicate'ler:</p>
                    {stats.duplicateExamples.slice(0, 5).map((d) => (
                      <div key={d.key} className="flex items-center justify-between rounded bg-white border border-rose-100 px-2 py-1">
                        <div className="min-w-0">
                          <p className="text-[10px] text-slate-700 truncate" title={d.title}>{d.number || '—'} — {d.title}</p>
                          <p className="text-[9px] text-slate-400">{d.sourceType}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded bg-white border border-rose-100 p-2">
                    <p className="text-[10px] font-medium text-rose-700 mb-0.5">Neden oluşuyor?</p>
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      Kayıtlar key-based deduplication ile normalize edilmektedir. Aktif duplicate tespit edilmiştir.
                    </p>
                  </div>
                </div>
              )
            })()}

            {renderArchiveTable(spkRecords, false)}
          </CardContent>
        </Card>
      )}

        {/* AKOP Insight */}
        <Card className="shrink-0 bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
          <CardHeader className="pb-2">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <Lightbulb className="text-indigo-600" size={18} />
                <CardTitle className="text-sm font-semibold">AKOP Insight</CardTitle>
              </div>
              <p className="text-[11px] text-slate-400">Regülasyon değişiklikleri ve operasyonel riskler için otomatik öneriler.</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {getRegTechSuggestions().slice(0, 2).map((s) => (
              <div key={s.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:shadow-sm transition-shadow">
                <div className="mt-0.5 shrink-0">
                  {s.severity === 'critical' && <AlertTriangle size={14} className="text-rose-600" />}
                  {s.severity === 'warning' && <AlertTriangle size={14} className="text-amber-600" />}
                  {s.severity === 'info' && <CheckCircle size={14} className="text-blue-600" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-xs font-semibold text-slate-800">{s.title}</p>
                    <Badge className={
                      s.severity === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-200/60 text-[10px]' :
                      s.severity === 'warning' ? 'bg-amber-50 text-amber-700 border-amber-200/60 text-[10px]' :
                      'bg-blue-50 text-blue-700 border-blue-200/60 text-[10px]'
                    }>
                      {s.severity === 'critical' ? 'Kritik' : s.severity === 'warning' ? 'Uyarı' : 'Bilgi'}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">{s.description}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
          </div>
        )}

        {activeTab === 'bddk' && (
          <div className="space-y-6">
            {/* BDDK Header Description */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <Building2 size={18} className="text-indigo-600" />
                <h3 className="text-sm font-semibold text-slate-800">Bankacılık Düzenleme ve Denetleme Kurumu (BDDK)</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                BDDK kurul kararları ve bankacılık düzenleme kayıtları uyum riskleri açısından takip edilir.
                Kredi, sermaye yeterliliği ve risk yönetimi düzenlemeleri için kritik kaynak.
              </p>
            </div>

            {/* BDDK KPI Cards */}
            {!spkLoading && bddkRecords.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {(() => {
                  const now = new Date()
                  const thisMonth = now.getMonth()
                  const thisYear = now.getFullYear()
                  const highRiskCount = bddkRecords.filter((r) => {
                    const risk = calculateRegulatoryRisk(r)
                    return risk.level === 'high' || risk.level === 'critical'
                  }).length
                  const thisMonthCount = bddkRecords.filter((r) => {
                    const d = new Date(r.isoDate || r.date || '')
                    return d.getMonth() === thisMonth && d.getFullYear() === thisYear
                  }).length
                  return [
                    { label: 'Toplam Kurul Kararı', value: bddkRecords.length, icon: Scale, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Son Güncelleme', value: regulatoryArchive?.cacheInfo?.bddk?.lastRefreshedAt ? new Date(regulatoryArchive.cacheInfo.bddk.lastRefreshedAt).toLocaleDateString('tr-TR') : '—', icon: RefreshCw, color: 'text-slate-600', bg: 'bg-slate-50' },
                    { label: 'Bu Ay Yayınlanan', value: thisMonthCount, icon: Megaphone, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Yüksek Etki', value: highRiskCount, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'İnceleme Bekleyen', value: 0, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Cache Durumu', value: 'Build Cache', icon: Database, color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color}`}><kpi.icon size={16} /></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-0.5 leading-tight">{kpi.label}</p>
                      <p className="text-lg font-bold text-slate-900">{kpi.value}</p>
                    </div>
                  ))
                })()}
              </div>
            )}

            <Card className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Building2 size={18} className="text-indigo-600" />
                      <CardTitle className="text-sm font-semibold">BDDK Kaynak Durumu</CardTitle>
                    </div>
                    <p className="text-[11px] text-slate-400">BDDK düzenleyici kaynakları</p>
                  </div>
                  <Badge className={`text-[10px] ${regulatoryArchive?.source.bddk === 'live' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : bddkRecords.length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/60'}`}>
                    {regulatoryArchive?.source.bddk === 'live' ? 'Canlı' : bddkRecords.length > 0 ? 'Build Cache Aktif' : 'API Tespiti Gerekli'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {spkLoading ? (
                  <div className="space-y-4">
                    <div className="rounded-xl bg-slate-50 border border-slate-200/60 p-4 space-y-2">
                      <div className="h-4 w-48 bg-slate-200 rounded animate-pulse" />
                      <div className="h-3 w-72 bg-slate-200 rounded animate-pulse" />
                    </div>
                    <div className="rounded-xl border border-slate-200/70 overflow-hidden">
                      <div className="bg-slate-50 p-3 space-y-2">
                        <div className="h-3 w-full bg-slate-200 rounded animate-pulse" />
                        <div className="h-3 w-full bg-slate-200 rounded animate-pulse" />
                        <div className="h-3 w-full bg-slate-200 rounded animate-pulse" />
                        <div className="h-3 w-2/3 bg-slate-200 rounded animate-pulse" />
                      </div>
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className="border-t border-slate-100 p-3 space-y-2">
                          <div className="h-3 w-3/4 bg-slate-200 rounded animate-pulse" />
                          <div className="h-3 w-1/2 bg-slate-200 rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 text-center">BDDK cache kayıtları hazırlanıyor...</p>
                  </div>
                ) : bddkRecords.length > 0 ? (
                  <div className="space-y-4">
                    {regulatoryArchive?.source.bddk !== 'live' && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3 space-y-1.5">
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                          <span className="font-semibold">Build Cache Aktif.</span> BDDK canlı erişimi Vercel ortamında kullanılamıyor.
                          Son build sırasında alınan gerçek BDDK kayıtları gösteriliyor.
                        </p>
                        <p className="text-[10px] text-amber-600">
                          Son güncelleme: {regulatoryArchive?.cacheInfo?.bddk?.lastRefreshedAt ? new Date(regulatoryArchive.cacheInfo.bddk.lastRefreshedAt).toLocaleString('tr-TR') : '—'}
                        </p>
                      </div>
                    )}
                    {renderArchiveTable(bddkRecords, false, true)}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-3">
                    <AlertTriangle size={32} className="text-amber-400" />
                    <p className="text-sm font-medium text-slate-600">Bu kaynak için kayıt bulunamadı.</p>
                    <p className="text-xs text-center max-w-sm">BDDK cache kayıtları mevcut değil. Build sırasında cache oluşturulmadıysa bu durum oluşabilir.</p>
                    <a href="https://www.bddk.org.tr" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"><ExternalLink size={10} /> Kaynağı Aç</a>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'masak' && (
          <div className="space-y-6">
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <Lock size={18} className="text-rose-600" />
                <h3 className="text-sm font-semibold text-slate-800">Mali Suçları Araştırma Kurulu (MASAK)</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                AML, KYC, şüpheli işlem ve yaptırım kaynakları için izleme alanı.
                Kara para aklama ve terör finansmanı önleme düzenlemeleri açısından zorunlu kaynak.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'AML / KYC İzleme', icon: ShieldAlert, desc: 'Müşteri tanıma ve izleme süreçleri' },
                { title: 'Şüpheli İşlem Bildirimi', icon: AlertTriangle, desc: 'SUİB raporlama ve takip' },
                { title: 'Yaptırım / Tarama', icon: Lock, desc: 'Yaptırım listesi tarama ve kontrol' },
                { title: 'Rehber ve Mevzuat', icon: BookOpen, desc: 'AML mevzuat ve uygulama rehberleri' },
              ].map((card) => (
                <div key={card.title} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3 opacity-60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <card.icon size={18} className="text-rose-600" />
                      <span className="text-sm font-semibold text-slate-800">{card.title}</span>
                    </div>
                    <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200/60">API Tespiti Gerekli</Badge>
                  </div>
                  <p className="text-xs text-slate-500">{card.desc}</p>
                </div>
              ))}
            </div>
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center text-slate-400 gap-3">
              <AlertTriangle size={32} className="text-amber-400" />
              <p className="text-sm font-medium text-slate-600">MASAK kaynak bağlantısı henüz doğrulanmadı.</p>
              <p className="text-xs text-center max-w-sm">Fake veya demo veri gösterilmemektedir. API tespiti tamamlandığında kayıtlar otomatik olarak listelenecek.</p>
            </div>
          </div>
        )}

        {activeTab === 'global' && (
          <div className="space-y-6">
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5">
              <div className="flex items-center gap-2 mb-1">
                <Globe2 size={18} className="text-cyan-600" />
                <h3 className="text-sm font-semibold text-slate-800">Global Regülatörler</h3>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                SEC, FCA, ESMA, IOSCO ve diğer uluslararası düzenleyici otoritelerin kararları ve düzenlemeleri.
                Küresel yatırım hizmetleri ve cross-border operasyonlar için referans kaynak.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'SEC', country: 'ABD', scope: 'Menkul Kıymetler Düzenlemeleri', url: 'https://www.sec.gov' },
                { name: 'FCA', country: 'Birleşik Krallık', scope: 'Finansal Davranış ve Tüketici Koruması', url: 'https://www.fca.org.uk' },
                { name: 'ESMA', country: 'Avrupa Birliği', scope: 'Avrupa Piyasalar Altyapısı', url: 'https://www.esma.europa.eu' },
                { name: 'IOSCO', country: 'Uluslararası', scope: 'Sermaye Piyasası Standartları', url: 'https://www.iosco.org' },
              ].map((g) => (
                <div key={g.name} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe2 size={18} className="text-cyan-600" />
                      <span className="text-sm font-semibold text-slate-800">{g.name}</span>
                    </div>
                    <Badge className="text-[10px] bg-amber-50 text-amber-700 border-amber-200/60">API Tespiti Gerekli</Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-slate-500"><span className="font-medium text-slate-700">Ülke/Bölge:</span> {g.country}</p>
                    <p className="text-xs text-slate-500"><span className="font-medium text-slate-700">Kapsam:</span> {g.scope}</p>
                  </div>
                  <a href={g.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline"><ExternalLink size={10} /> Kaynağı Aç</a>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-800">Bildirim Merkezi</h2>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-200/60 text-amber-700 bg-amber-50">Sistem Üretimi</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Tüm kritik olaylar, SLA uyarıları, gecikmeler ve onay bekleyenler burada toplanır.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const stats = getNotificationStats(notifications)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Toplam</p>
                    <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Okunmamış</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Kritik</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.critical}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">SLA Uyarısı</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.sla}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Onay Bekleyen</p>
                    <p className="text-2xl font-bold text-sky-600">{stats.approval}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Bugün Oluşan</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.today}</p>
                  </div>
                </div>
              )
            })()}

            {/* Filters + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'Tümü' },
                  { key: 'unread', label: 'Okunmamış' },
                  { key: 'critical', label: 'Kritik' },
                  { key: 'sla', label: 'SLA' },
                  { key: 'approval', label: 'Onay' },
                  { key: 'obligation', label: 'Yükümlülük' },
                  { key: 'regintel', label: 'RegIntel' },
                  { key: 'mkk', label: 'MKK' },
                  { key: 'takasbank', label: 'Takasbank' },
                  { key: 'security', label: 'Güvenlik' },
                  { key: 'risk_engine', label: 'Risk' },
                  { key: 'policy', label: 'Politika' },
                  { key: 'control', label: 'Kontrol' },
                  { key: 'test', label: 'Test' },
                  { key: 'finding', label: 'Bulgu' },
                ].map((f) => (
                  <button key={f.key} onClick={() => setNotifFilter(f.key as typeof notifFilter)} className={`text-[11px] px-3 py-1.5 rounded-full border ${notifFilter === f.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{f.label}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { markAllNotificationsRead(); setNotifications((prev) => prev.map((n) => n.status === 'unread' ? { ...n, status: 'read' as NotificationStatus } : n)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Tüm bildirimler okundu işaretlendi', entityType: 'notificationcenter', severity: 'info' }) }} className="text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">Tümünü Okundu İşaretle</button>
              </div>
            </div>

            {/* Notification List */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 space-y-3">
              {(() => {
                const visible = userPerms?.tabs?.includes('notifications') ? notifications : []
                const roleVisible = visible.filter((n) => {
                  if (!currentUser) return false
                  return n.roleVisibility.includes(currentUser.role)
                })
                let filtered = roleVisible
                if (notifFilter === 'unread') filtered = filtered.filter((n) => n.status === 'unread')
                if (notifFilter === 'critical') filtered = filtered.filter((n) => n.severity === 'critical')
                if (notifFilter !== 'all' && notifFilter !== 'unread' && notifFilter !== 'critical') filtered = filtered.filter((n) => n.type.toLowerCase() === notifFilter)
                if (filtered.length === 0) return <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2"><Inbox size={32} className="text-slate-300" /><p className="text-sm">Bildirim bulunmuyor.</p></div>
                return filtered.map((n) => {
                  const dueRemaining = n.dueAt ? Math.ceil((new Date(n.dueAt).getTime() - Date.now()) / 86400000) : null
                  return (
                    <div key={n.id} className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${n.status === 'unread' ? 'bg-white border-slate-200/70' : n.status === 'read' ? 'bg-slate-50/50 border-slate-100 opacity-70' : 'bg-slate-50 border-slate-100 opacity-40'}`}>
                      <div className="mt-0.5 shrink-0">
                        {n.severity === 'critical' && <AlertTriangle size={14} className="text-rose-600" />}
                        {n.severity === 'warning' && <AlertTriangle size={14} className="text-amber-600" />}
                        {n.severity === 'info' && <Bell size={14} className="text-blue-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <Badge className={`text-[9px] ${getNotificationTypeBadgeClass(n.type)}`}>{n.type}</Badge>
                          <Badge className={`text-[9px] ${getNotifSeverityBadgeClass(n.severity)}`}>{n.severity}</Badge>
                          <p className="text-[11px] font-semibold text-slate-800">{n.title}</p>
                          {n.status === 'unread' && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                        </div>
                        <p className="text-[11px] text-slate-500">{n.message}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{n.targetEntityTitle}</Badge>
                          {dueRemaining !== null && dueRemaining < 3 && (
                            <Badge className={`text-[9px] ${dueRemaining < 0 ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-amber-100 text-amber-800 border-amber-200'}`}>{dueRemaining < 0 ? `${Math.abs(dueRemaining)} gün gecikti` : `${dueRemaining} gün kaldı`}</Badge>
                          )}
                          <p className="text-[10px] text-slate-400">{new Date(n.createdAt).toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        {n.status === 'unread' && (
                          <button onClick={() => { markNotificationRead(n.id); setNotifications((prev) => prev.map((p) => p.id === n.id ? { ...p, status: 'read' as NotificationStatus } : p)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Bildirim okundu', entityType: 'notificationcenter', entityId: n.id, severity: 'info' }) }} className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" title="Okundu">Okundu</button>
                        )}
                        <button onClick={() => {
                          setActiveTab(n.targetTab as TabKey)
                          if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Bildirim aksiyonu açıldı', entityType: 'notificationcenter', entityId: n.id, entityTitle: n.title, severity: 'info' })
                        }} className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800">{n.actionLabel}</button>
                        <button onClick={() => { archiveNotification(n.id); setNotifications((prev) => prev.map((p) => p.id === n.id ? { ...p, status: 'archived' as NotificationStatus } : p)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Bildirim arşivlendi', entityType: 'notificationcenter', entityId: n.id, severity: 'info' }) }} className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50" title="Arşivle"><Archive size={12} /></button>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </div>
        )}

        {activeTab === 'datahub' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <DatabaseZap size={18} className="text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-800">Veri Merkezi</h2>
                </div>
                <Badge variant="outline" className="text-[10px] border-emerald-200/60 text-emerald-700 bg-emerald-50">Canlı Veri</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Tüm regülasyon ve operasyonel veri kaynaklarının merkezi yönetimi, senkronizasyon ve sağlık izleme.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const stats = getDataSourceStats(dataSources)
              const lastSync = dataSources.filter((s) => s.lastSync).sort((a, b) => new Date(b.lastSync!).getTime() - new Date(a.lastSync!).getTime())[0]?.lastSync
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Aktif Kaynak</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.active}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Son 24 Saat Sync</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.syncedLast24h}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Başarısız Sync</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.failedSync}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Toplam Kaynak</p>
                    <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Son Güncelleme</p>
                    <p className="text-sm font-bold text-slate-700">{lastSync ? `${Math.ceil((Date.now() - new Date(lastSync).getTime()) / 60000)} dk önce` : '-'}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Veri Sağlığı</p>
                    <p className="text-2xl font-bold text-amber-600">{Math.round((stats.active / stats.total) * 100)}%</p>
                  </div>
                </div>
              )
            })()}

            {/* Filters + Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'Tümü' },
                  { key: 'active', label: 'Aktif' },
                  { key: 'warning', label: 'Uyarı' },
                  { key: 'error', label: 'Hata' },
                  { key: 'disabled', label: 'Devre Dışı' },
                ].map((f) => (
                  <button key={f.key} onClick={() => setDataHubFilter(f.key as typeof dataHubFilter)} className={`text-[11px] px-3 py-1.5 rounded-full border ${dataHubFilter === f.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{f.label}</button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => { setDataHubSyncing('all'); const updated = syncAllDataSources(); setDataSources(updated); setDataHubSyncing(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Tüm veri kaynakları senkronize edildi', entityType: 'datasource', severity: 'info' }) }} className="text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"><RefreshCw size={12} className={dataHubSyncing === 'all' ? 'animate-spin' : ''} /> Tümünü Senkronize Et</button>
              </div>
            </div>

            {/* Source Health Table */}
            <Card className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
              <CardHeader className="py-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <Server size={18} className="text-cyan-600" />
                  <CardTitle className="text-sm font-semibold">Kaynak Sağlık Monitörü</CardTitle>
                  <Badge className="text-[10px] bg-cyan-50 text-cyan-700 border-cyan-200/60">Operasyonel</Badge>
                </div>
                <p className="text-[11px] text-slate-400">Canlı veri kaynaklarının durumu, son senkronizasyon ve kayıt sayıları</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  let filtered = dataSources
                  if (dataHubFilter !== 'all') filtered = filtered.filter((s) => s.status.toLowerCase() === dataHubFilter)
                  if (filtered.length === 0) return <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2"><Server size={32} className="text-slate-300" /><p className="text-sm">Veri kaynağı bulunmuyor.</p></div>
                  return filtered.map((s) => (
                    <div key={s.id} className="flex flex-col md:flex-row md:items-center gap-3 rounded-xl border border-slate-100 p-3 bg-white hover:shadow-sm transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <Badge className={`text-[9px] ${getSourceTypeBadgeClass(s.sourceType)}`}>{s.sourceType}</Badge>
                          <p className="text-[11px] font-semibold text-slate-800">{s.name}</p>
                          <Badge className={`text-[9px] ${getStatusBadgeClass(s.status)}`}>{s.status}</Badge>
                          {!s.enabled && <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-200">Devre Dışı</Badge>}
                        </div>
                        <p className="text-[10px] text-slate-500">{s.authority} · {s.baseUrl} · {s.recordsCount.toLocaleString('tr-TR')} kayıt</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {s.lastSync && (
                            <span className="text-[10px] text-slate-400">Son sync: {s.lastSuccess ? `${Math.ceil((Date.now() - new Date(s.lastSuccess).getTime()) / 60000)} dk önce` : 'Başarısız'}</span>
                          )}
                          {s.lastError && (
                            <span className="text-[10px] text-rose-500">Hata: {s.lastError}</span>
                          )}
                          <span className="text-[10px] text-slate-400">Periyot: {s.syncInterval} dk</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => { setDataHubSyncing(s.id); const updated = syncDataSource(s.id); if (updated) { setDataSources((prev) => prev.map((p) => p.id === updated.id ? updated : p)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: `${s.name} senkronize edildi`, entityType: 'datasource', entityId: s.id, severity: 'info' }) } setDataHubSyncing(null) }} className="text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1" disabled={dataHubSyncing === s.id}><RefreshCw size={10} className={dataHubSyncing === s.id ? 'animate-spin' : ''} /> Senkronize Et</button>
                        <button onClick={() => { const updated = toggleDataSource(s.id); if (updated) { setDataSources((prev) => prev.map((p) => p.id === updated.id ? updated : p)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: `${s.name} ${updated.enabled ? 'aktifleştirildi' : 'devre dışı bırakıldı'}`, entityType: 'datasource', entityId: s.id, severity: updated.enabled ? 'info' : 'warning' }) } }} className="text-[10px] px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:bg-slate-50 inline-flex items-center gap-1"><Plug size={10} /> {s.enabled ? 'Durdur' : 'Aktifleştir'}</button>
                      </div>
                    </div>
                  ))
                })()}
              </CardContent>
            </Card>

            {/* Sync Schedule Configuration */}
            <Card className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold">Senkronizasyon Periyot Yapılandırması</CardTitle>
                <p className="text-[11px] text-slate-400">Kaynak bazlı senkronizasyon sıklığı ayarları</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {dataSources.map((s) => (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-3 bg-white">
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[9px] ${getStatusBadgeClass(s.status)}`}>{s.status}</Badge>
                      <p className="text-[11px] font-medium text-slate-800">{s.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {[15, 30, 60, 360, 720, 1440].map((interval) => (
                        <button key={interval} onClick={() => { const updated = updateDataSource(s.id, { syncInterval: interval }); if (updated) { setDataSources((prev) => prev.map((p) => p.id === updated.id ? updated : p)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: `${s.name} sync periyodu ${interval} dk olarak güncellendi`, entityType: 'datasource', entityId: s.id, severity: 'info' }) } }} className={`text-[10px] px-2 py-1 rounded-lg border ${s.syncInterval === interval ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{interval < 60 ? `${interval} dk` : interval === 60 ? '1 saat' : `${interval / 60} saat`}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'riskcenter' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={18} className="text-rose-600" />
                  <h2 className="text-sm font-semibold text-slate-800">Risk Merkezi</h2>
                </div>
                <Badge variant="outline" className="text-[10px] border-rose-200/60 text-rose-700 bg-rose-50">AI Risk Scoring</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Kurumsal risk skorlama, önceliklendirme ve erken uyarı sistemi. Tüm kayıtlar AI formülü ile analiz edilir.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const stats = getRiskStats(riskScores)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Toplam Riskli</p>
                    <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Kritik Risk</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.critical}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Yüksek Risk</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.high}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Ortalama Risk</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.average}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Risk Artan</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.increasing}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Risk Azalan</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.decreasing}</p>
                  </div>
                </div>
              )
            })()}

            {/* Filters + Recalculate */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'Tümü' },
                  { key: 'critical', label: 'Kritik' },
                  { key: 'high', label: 'Yüksek' },
                  { key: 'medium', label: 'Orta' },
                  { key: 'low', label: 'Düşük' },
                ].map((f) => (
                  <button key={f.key} onClick={() => setRiskFilter(f.key as typeof riskFilter)} className={`text-[11px] px-3 py-1.5 rounded-full border ${riskFilter === f.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{f.label}</button>
                ))}
                <div className="w-px h-5 bg-slate-200 mx-1" />
                {[
                  { key: 'all', label: 'Tüm Trend' },
                  { key: 'up', label: '↑ Artıyor' },
                  { key: 'down', label: '↓ Azalıyor' },
                  { key: 'stable', label: '→ Sabit' },
                ].map((f) => (
                  <button key={f.key} onClick={() => setRiskTrendFilter(f.key as typeof riskTrendFilter)} className={`text-[11px] px-3 py-1.5 rounded-full border ${riskTrendFilter === f.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{f.label}</button>
                ))}
              </div>
              <button onClick={() => { setRiskRecalculating(true); const updated = recalculateAllRisks(); setRiskScores(updated); setRiskRecalculating(false); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Tüm risk skorları yeniden hesaplandı', entityType: 'riskengine', severity: 'info' }) }} className="text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 inline-flex items-center gap-1"><RefreshCw size={12} className={riskRecalculating ? 'animate-spin' : ''} /> Yeniden Hesapla</button>
            </div>

            {/* Risk Heat Map */}
            <Card className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
              <CardHeader className="py-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <Flame size={18} className="text-rose-600" />
                  <CardTitle className="text-sm font-semibold">Risk Isı Haritası</CardTitle>
                  <Badge className="text-[10px] bg-rose-50 text-rose-700 border-rose-200/60">AI Analiz</Badge>
                </div>
                <p className="text-[11px] text-slate-400">Kurumlar x Risk seviyesi matrisi</p>
              </CardHeader>
              <CardContent>
                {(() => {
                  const authorities = ['SPK', 'BDDK', 'MASAK', 'MKK', 'TAKASBANK']
                  const levels = ['Kritik', 'Yüksek', 'Orta', 'Düşük']
                  return (
                    <div className="overflow-x-auto">
                      <div className="grid grid-cols-[minmax(80px,1fr)_repeat(4,minmax(50px,1fr))] gap-1 text-center">
                        <div className="text-[9px] font-semibold text-slate-400 uppercase p-1.5">Kurum</div>
                        {levels.map((l) => <div key={l} className={`text-[9px] font-semibold p-1.5 rounded-lg ${l === 'Kritik' ? 'text-rose-600 bg-rose-50' : l === 'Yüksek' ? 'text-orange-600 bg-orange-50' : l === 'Orta' ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'}`}>{l}</div>)}
                        {authorities.map((auth) => {
                          const authRisks = getRisksByAuthority(riskScores, auth)
                          return (
                            <Fragment key={auth}>
                              <div className="text-[10px] font-semibold text-slate-700 p-1.5 flex items-center justify-center bg-slate-50 rounded-lg">{auth}</div>
                              {levels.map((level) => {
                                const count = authRisks.filter((r) => getRiskLevel(r.score) === level).length
                                const avgScore = count > 0 ? Math.round(authRisks.filter((r) => getRiskLevel(r.score) === level).reduce((s, r) => s + r.score, 0) / count) : 0
                                const bgClass = avgScore > 75 ? 'bg-rose-500/20' : avgScore > 50 ? 'bg-orange-500/20' : avgScore > 25 ? 'bg-amber-500/20' : 'bg-emerald-500/20'
                                const textClass = avgScore > 75 ? 'text-rose-700' : avgScore > 50 ? 'text-orange-700' : avgScore > 25 ? 'text-amber-700' : 'text-emerald-700'
                                return (
                                  <div key={level} className={`text-[10px] font-semibold p-1.5 rounded-lg ${bgClass} ${textClass} flex flex-col items-center justify-center min-h-[40px]`}>
                                    {count > 0 ? <><span>{count}</span><span className="text-[8px] opacity-70">{avgScore}</span></> : <span className="text-slate-300">-</span>}
                                  </div>
                                )
                              })}
                            </Fragment>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Top Risk List */}
            <Card className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
              <CardHeader className="py-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <ShieldAlert size={18} className="text-rose-600" />
                  <CardTitle className="text-sm font-semibold">En Riskli 20 Kayıt</CardTitle>
                  <Badge className="text-[10px] bg-rose-50 text-rose-700 border-rose-200/60">Öncelikli</Badge>
                </div>
                <p className="text-[11px] text-slate-400">AI formülü ile hesaplanan en yüksek risk skorlu kayıtlar</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {(() => {
                  let filtered = getTopRisks(riskScores, 20)
                  if (riskFilter !== 'all') {
                    const levelMap: Record<string, string> = { critical: 'Kritik', high: 'Yüksek', medium: 'Orta', low: 'Düşük' }
                    filtered = filtered.filter((r) => getRiskLevel(r.score) === levelMap[riskFilter])
                  }
                  if (riskTrendFilter !== 'all') filtered = filtered.filter((r) => r.trend === riskTrendFilter)
                  if (filtered.length === 0) return <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2"><ShieldAlert size={32} className="text-slate-300" /><p className="text-sm">Risk kaydı bulunmuyor.</p></div>
                  return filtered.map((r, i) => {
                    const trend = getTrendIndicator(r.trend)
                    const level = getRiskLevel(r.score)
                    return (
                      <div key={r.id} className="flex flex-col md:flex-row md:items-center gap-3 rounded-xl border border-slate-100 p-3 bg-white hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 shrink-0 w-8">
                          <span className="text-[10px] font-bold text-slate-400">#{i + 1}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className={`text-[9px] ${getRiskLevelBadgeClass(level)}`}>{level}</Badge>
                            <Badge variant="outline" className="text-[9px] text-slate-500 border-slate-200">{r.entityType}</Badge>
                            <span className={`text-[10px] font-semibold ${trend.color}`}>{trend.icon} {trend.label}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-800">{r.entityTitle}</p>
                          <p className="text-[10px] text-slate-500">Etki: {r.impactScore} · Aciliyet: {r.urgencyScore} · Uyum: {r.complianceScore} · Olasılık: {r.probabilityScore} · Öneri: {r.recommendationScore}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-center">
                            <p className="text-xl font-bold text-slate-900">{r.score}</p>
                            <p className="text-[9px] text-slate-400">Risk Skoru</p>
                          </div>
                          {r.responsible && (
                            <div className="text-right">
                              <p className="text-[10px] text-slate-500">Sorumlu</p>
                              <p className="text-[11px] font-medium text-slate-700">{r.responsible}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                })()}
              </CardContent>
            </Card>

            {/* Risk Trend Analysis */}
            <Card className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
              <CardHeader className="py-4">
                <CardTitle className="text-sm font-semibold">Risk Trend Analizi</CardTitle>
                <p className="text-[11px] text-slate-400">Son dönem risk skoru değişimleri</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { period: '7 Gün', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { period: '30 Gün', icon: FileBarChart, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { period: '90 Gün', icon: FileBarChart, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  ].map((p) => {
                    const trendCount = riskScores.filter((r) => r.trend === 'up').length
                    const trendPct = riskScores.length > 0 ? Math.round((trendCount / riskScores.length) * 100) : 0
                    return (
                      <div key={p.period} className={`${p.bg} rounded-xl p-3 text-center`}>
                        <p.icon size={16} className={`${p.color} mx-auto mb-1`} />
                        <p className="text-[10px] text-slate-500">{p.period}</p>
                        <p className="text-lg font-bold text-slate-800">{trendPct}%</p>
                        <p className="text-[9px] text-slate-400">Risk Artan</p>
                      </div>
                    )
                  })}
                  <div className="bg-slate-50 rounded-xl p-3 text-center">
                    <ShieldAlert size={16} className="text-rose-600 mx-auto mb-1" />
                    <p className="text-[10px] text-slate-500">Ortalama</p>
                    <p className="text-lg font-bold text-slate-800">{getRiskStats(riskScores).average}</p>
                    <p className="text-[9px] text-slate-400">Risk Skoru</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FileCheck size={18} className="text-sky-600" />
                  <h2 className="text-sm font-semibold text-slate-800">Politika ve Prosedür Merkezi</h2>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Kurum içi politika, prosedür, talimat ve yönetmeliklerin merkezi yönetimi.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const stats = getPolicyStats(policies)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { label: 'Toplam Doküman', value: stats.total, icon: FileCheck, color: 'text-slate-700', bg: 'bg-slate-50' },
                    { label: 'Yayında', value: stats.published, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Onay Bekleyen', value: stats.pendingApproval, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Revizyon Gerekli', value: stats.needsRevision, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Kritik Politika', value: stats.critical, icon: ShieldAlert, color: 'text-rose-700', bg: 'bg-rose-50' },
                    { label: 'Yaklaşan Review', value: stats.upcomingReview, icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color}`}><kpi.icon size={16} /></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-0.5 leading-tight">{kpi.label}</p>
                      <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input type="text" value={policySearch} onChange={(e) => setPolicySearch(e.target.value)} placeholder="Politika ara..." className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full md:w-64" />
              <select value={policyTypeFilter} onChange={(e) => setPolicyTypeFilter(e.target.value as 'all' | PolicyDocumentType)} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Tipler</option>
                <option value="Politika">Politika</option>
                <option value="Prosedür">Prosedür</option>
                <option value="Talimat">Talimat</option>
                <option value="Kontrol Dokümanı">Kontrol Dokümanı</option>
                <option value="Yönetmelik">Yönetmelik</option>
              </select>
              <select value={policyStatusFilter} onChange={(e) => setPolicyStatusFilter(e.target.value as 'all' | PolicyStatus)} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Durumlar</option>
                <option value="Taslak">Taslak</option>
                <option value="İncelemede">İncelemede</option>
                <option value="Onay Bekliyor">Onay Bekliyor</option>
                <option value="Yayında">Yayında</option>
                <option value="Revizyon Gerekli">Revizyon Gerekli</option>
                <option value="Arşivlendi">Arşivlendi</option>
              </select>
              <select value={policyRiskFilter} onChange={(e) => setPolicyRiskFilter(e.target.value as 'all' | PolicyRiskLevel)} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Riskler</option>
                <option value="Kritik">Kritik</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Orta">Orta</option>
                <option value="Düşük">Düşük</option>
              </select>
              <select value={policyDeptFilter} onChange={(e) => setPolicyDeptFilter(e.target.value)} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Departmanlar</option>
                {Array.from(new Set(policies.map((p) => p.department))).map((d) => (<option key={d} value={d}>{d}</option>))}
              </select>
              <button onClick={() => { setPolicySearch(''); setPolicyTypeFilter('all'); setPolicyStatusFilter('all'); setPolicyRiskFilter('all'); setPolicyDeptFilter('all'); }} className="text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50">
                <FilterX size={13} />
              </button>
            </div>

            {/* Policy Table */}
            <Card className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
              <CardHeader className="py-4"><CardTitle className="text-sm font-semibold">Politika ve Prosedür Listesi</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                        <TableHead className="text-xs font-medium text-slate-500">Politika No</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Doküman</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Tip</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Durum</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Risk</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Versiyon</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Sahip</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Gözden Geçirme</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const filtered = policies.filter((p) => {
                          const matchesSearch = !policySearch || p.title.toLowerCase().includes(policySearch.toLowerCase()) || p.policyNumber.toLowerCase().includes(policySearch.toLowerCase())
                          const matchesType = policyTypeFilter === 'all' || p.documentType === policyTypeFilter
                          const matchesStatus = policyStatusFilter === 'all' || p.status === policyStatusFilter
                          const matchesRisk = policyRiskFilter === 'all' || p.riskLevel === policyRiskFilter
                          const matchesDept = policyDeptFilter === 'all' || p.department === policyDeptFilter
                          return matchesSearch && matchesType && matchesStatus && matchesRisk && matchesDept
                        })
                        if (filtered.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={9} className="text-center py-10 text-slate-400">
                                <div className="flex flex-col items-center gap-2"><FileCheck size={32} className="text-slate-300" /><p className="text-sm">Politika bulunmuyor.</p></div>
                              </TableCell>
                            </TableRow>
                          )
                        }
                        return filtered.map((p) => (
                          <TableRow key={p.id} className="border-b border-slate-50 hover:bg-slate-50/70">
                            <TableCell className="text-xs text-slate-600 whitespace-nowrap">{p.policyNumber}</TableCell>
                            <TableCell className="text-xs font-medium text-slate-800 max-w-[200px] truncate" title={p.title}>{p.title}</TableCell>
                            <TableCell><Badge className={`text-[9px] ${getPolicyTypeBadgeClass(p.documentType)}`}>{p.documentType}</Badge></TableCell>
                            <TableCell><Badge className={`text-[9px] ${getPolicyStatusBadgeClass(p.status)}`}>{p.status}</Badge></TableCell>
                            <TableCell><Badge className={`text-[9px] ${getPolicyRiskBadgeClass(p.riskLevel)}`}>{p.riskLevel}</Badge></TableCell>
                            <TableCell className="text-xs text-slate-600">v{p.version}</TableCell>
                            <TableCell className="text-xs text-slate-600">{p.owner}</TableCell>
                            <TableCell className="text-xs text-slate-600">{p.nextReviewDate ? new Date(p.nextReviewDate).toLocaleDateString('tr-TR') : '—'}</TableCell>
                            <TableCell className="relative">
                              <button onClick={() => setPolicyDropdownId(policyDropdownId === p.id ? null : p.id)} className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><MoreVertical size={13} /></button>
                              {policyDropdownId === p.id && (
                                <div className="absolute right-0 z-20 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg p-1">
                                  <button onClick={() => { setPolicyDetail(p); setPolicyDropdownId(null); }} className="w-full text-left text-[11px] px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">Detay Gör</button>
                                  <button onClick={() => { const updated = startPolicyRevision(p.id, 'Kullanıcı başlatılan revizyon'); if (updated) { setPolicies((prev) => prev.map((x) => x.id === p.id ? updated : x)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: `Politika revizyon başlatıldı: ${p.title}`, entityType: 'policy', entityId: p.id, entityTitle: p.title, severity: 'warning' }) } setPolicyDropdownId(null); }} className="w-full text-left text-[11px] px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">Revizyon Başlat</button>
                                  <button onClick={() => { const updated = submitPolicyForApproval(p.id); if (updated) { setPolicies((prev) => prev.map((x) => x.id === p.id ? updated : x)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: `Politika onaya gönderildi: ${p.title}`, entityType: 'policy', entityId: p.id, entityTitle: p.title, severity: 'warning' }) } setPolicyDropdownId(null); }} className="w-full text-left text-[11px] px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">Onaya Gönder</button>
                                  <button onClick={() => { const updated = markPolicyPublished(p.id); if (updated) { setPolicies((prev) => prev.map((x) => x.id === p.id ? updated : x)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: `Politika yayına alındı: ${p.title}`, entityType: 'policy', entityId: p.id, entityTitle: p.title, severity: 'info' }) } setPolicyDropdownId(null); }} className="w-full text-left text-[11px] px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">Yayına Al</button>
                                  <button onClick={() => { setActiveTab('evidence'); setPolicyDropdownId(null); }} className="w-full text-left text-[11px] px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">Kanıt Bağla</button>
                                  <button onClick={() => { const updated = archivePolicy(p.id); if (updated) { setPolicies((prev) => prev.map((x) => x.id === p.id ? updated : x)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: `Politika arşivlendi: ${p.title}`, entityType: 'policy', entityId: p.id, entityTitle: p.title, severity: 'info' }) } setPolicyDropdownId(null); }} className="w-full text-left text-[11px] px-3 py-2 rounded-lg hover:bg-slate-50 text-rose-700">Arşivle</button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'controls' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-600" />
                  <h2 className="text-sm font-semibold text-slate-800">Kontrol ve Test Merkezi</h2>
                </div>
                <Badge variant="outline" className="text-[9px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Politika, prosedür ve yükümlülüklerden türetilen kontrollerin tanımlanması, test edilmesi ve bulguların yönetilmesi.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const cStats = getControlStats(controls)
              const tStats = getTestStats(controlTests)
              const fStats = getFindingStats(findings)
              const kpis = [
                { label: 'Toplam Kontrol', value: cStats.total, icon: ShieldCheck, color: 'text-indigo-700', bg: 'bg-indigo-50' },
                { label: 'Aktif Kontrol', value: cStats.active, icon: Shield, color: 'text-emerald-700', bg: 'bg-emerald-50' },
                { label: 'Başarısız Test', value: tStats.failed, icon: AlertTriangle, color: 'text-rose-700', bg: 'bg-rose-50' },
                { label: 'Açık Bulgu', value: fStats.open, icon: FileWarning, color: 'text-amber-700', bg: 'bg-amber-50' },
                { label: 'Kritik Bulgu', value: fStats.critical, icon: AlertOctagon, color: 'text-rose-700', bg: 'bg-rose-50' },
                { label: 'Ortalama Skor', value: `${tStats.avgScore}`, icon: BarChart3, color: 'text-slate-700', bg: 'bg-slate-50' },
              ]
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {kpis.map((k) => (
                    <Card key={k.label} className="border-slate-200/70 shadow-sm hover:shadow-md transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`inline-flex items-center justify-center w-9 h-9 rounded-xl ${k.bg}`}><k.icon size={18} className={k.color} /></div>
                          <div>
                            <p className="text-[10px] text-slate-500">{k.label}</p>
                            <p className="text-lg font-bold text-slate-800">{k.value}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
            })()}

            {/* Sub Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'controls' as const, label: 'Kontroller', icon: ShieldCheck },
                { key: 'tests' as const, label: 'Testler', icon: ClipboardCheck },
                { key: 'findings' as const, label: 'Bulgular', icon: FileWarning },
              ].map((t) => (
                <button key={t.key} onClick={() => setControlSubTab(t.key)} className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl border transition-all font-medium ${controlSubTab === t.key ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  <t.icon size={14} />{t.label}
                </button>
              ))}
            </div>

            {/* Kontroller Tab */}
            {controlSubTab === 'controls' && (
              <div className="space-y-4">
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <input type="text" placeholder="Kontrol ara..." value={controlSearch} onChange={(e) => setControlSearch(e.target.value)} className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white w-full md:w-64" />
                  <select value={controlTypeFilter} onChange={(e) => setControlTypeFilter(e.target.value as any)} className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option value="all">Tüm Tipler</option><option value="Preventive">Preventive</option><option value="Detective">Detective</option><option value="Corrective">Corrective</option>
                  </select>
                  <select value={controlRiskFilter} onChange={(e) => setControlRiskFilter(e.target.value as any)} className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option value="all">Tüm Riskler</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                  </select>
                  <select value={controlFreqFilter} onChange={(e) => setControlFreqFilter(e.target.value as any)} className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option value="all">Tüm Frekanslar</option><option value="Daily">Daily</option><option value="Weekly">Weekly</option><option value="Monthly">Monthly</option><option value="Quarterly">Quarterly</option><option value="SemiAnnual">SemiAnnual</option><option value="Annual">Annual</option>
                  </select>
                  <select value={controlActiveFilter} onChange={(e) => setControlActiveFilter(e.target.value as any)} className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option value="active">Aktif</option><option value="inactive">Pasif</option><option value="all">Tümü</option>
                  </select>
                </div>
                {/* Table */}
                <Card className="border-slate-200/70 shadow-sm">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Kontrol No</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Başlık</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Tip</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Risk</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Frekans</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Sahip</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Durum</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const filtered = controls.filter((c) => {
                              if (controlSearch && !`${c.controlNumber} ${c.title} ${c.owner} ${c.department}`.toLowerCase().includes(controlSearch.toLowerCase())) return false
                              if (controlTypeFilter !== 'all' && c.controlType !== controlTypeFilter) return false
                              if (controlRiskFilter !== 'all' && c.riskLevel !== controlRiskFilter) return false
                              if (controlFreqFilter !== 'all' && c.frequency !== controlFreqFilter) return false
                              if (controlActiveFilter === 'active' && !c.active) return false
                              if (controlActiveFilter === 'inactive' && c.active) return false
                              return true
                            })
                            if (filtered.length === 0) return (<TableRow><TableCell colSpan={8} className="text-center text-xs text-slate-500 py-8">Kontrol bulunamadı.</TableCell></TableRow>)
                            return filtered.map((c) => (
                              <TableRow key={c.id} className="hover:bg-slate-50/40 transition-colors">
                                <TableCell className="text-xs text-slate-600 whitespace-nowrap">{c.controlNumber}</TableCell>
                                <TableCell className="text-xs font-medium text-slate-800 max-w-[200px] truncate" title={c.title}>{c.title}</TableCell>
                                <TableCell><Badge className={`text-[9px] ${getControlTypeBadgeClass(c.controlType)}`}>{c.controlType}</Badge></TableCell>
                                <TableCell><Badge className={`text-[9px] ${getControlRiskBadgeClass(c.riskLevel)}`}>{c.riskLevel}</Badge></TableCell>
                                <TableCell className="text-xs text-slate-600">{c.frequency}</TableCell>
                                <TableCell className="text-xs text-slate-600">{c.owner}</TableCell>
                                <TableCell><Badge variant="outline" className={`text-[9px] ${c.active ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-600 bg-slate-50'}`}>{c.active ? 'Aktif' : 'Pasif'}</Badge></TableCell>
                                <TableCell>
                                  <div className="relative">
                                    <button onClick={() => setControlDropdownId(controlDropdownId === c.id ? null : c.id)} className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><MoreHorizontal size={14} /></button>
                                    {controlDropdownId === c.id && (
                                      <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white/95 border border-slate-200/70 rounded-xl shadow-lg p-1.5 space-y-0.5">
                                        <button onClick={() => { setControlDetail(c); setControlDropdownId(null); }} className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"><Eye size={12} />Detay Gör</button>
                                        <button onClick={() => { const t = createTest({ controlId: c.id, controlTitle: c.title, tester: currentUser?.name || 'Sistem', testDate: new Date().toISOString().split('T')[0], result: 'Passed', score: 100, findingsCount: 0, notes: '', evidenceIds: [] }); setControlTests((prev) => [...prev, t]); setControlDropdownId(null); addAuditLog({ userId: currentUser?.id || 'system', userName: currentUser?.name || 'Sistem', role: currentUser?.role || 'Sistem', action: `Kontrol test başlatıldı: ${c.title}`, entityType: 'test', entityId: t.id, entityTitle: c.title, severity: 'info' }); }} className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"><Play size={12} />Test Başlat</button>
                                        <button onClick={() => { setControlDropdownId(null); }} className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"><Pencil size={12} />Düzenle</button>
                                        <button onClick={() => { archiveControl(c.id); setControls((prev) => prev.map((x) => x.id === c.id ? { ...x, active: false } : x)); setControlDropdownId(null); addAuditLog({ userId: currentUser?.id || 'system', userName: currentUser?.name || 'Sistem', role: currentUser?.role || 'Sistem', action: `Kontrol arşivlendi: ${c.title}`, entityType: 'control', entityId: c.id, entityTitle: c.title, severity: 'warning' }); }} className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg hover:bg-rose-50 text-rose-700 flex items-center gap-2"><Archive size={12} />Arşivle</button>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Testler Tab */}
            {controlSubTab === 'tests' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <input type="text" placeholder="Test ara..." value={controlSearch} onChange={(e) => setControlSearch(e.target.value)} className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white w-full md:w-64" />
                  <select value={testResultFilter} onChange={(e) => setTestResultFilter(e.target.value as any)} className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option value="all">Tüm Sonuçlar</option><option value="Passed">Passed</option><option value="Failed">Failed</option><option value="Partial">Partial</option>
                  </select>
                </div>
                <Card className="border-slate-200/70 shadow-sm">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Test</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Kontrol</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Tarih</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Sonuç</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Skor</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Bulgu</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const filtered = controlTests.filter((t) => {
                              if (controlSearch && !`${t.controlTitle} ${t.tester}`.toLowerCase().includes(controlSearch.toLowerCase())) return false
                              if (testResultFilter !== 'all' && t.result !== testResultFilter) return false
                              return true
                            }).sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
                            if (filtered.length === 0) return (<TableRow><TableCell colSpan={7} className="text-center text-xs text-slate-500 py-8">Test bulunamadı.</TableCell></TableRow>)
                            return filtered.map((t) => (
                              <TableRow key={t.id} className="hover:bg-slate-50/40 transition-colors">
                                <TableCell className="text-xs font-medium text-slate-800">{t.id}</TableCell>
                                <TableCell className="text-xs text-slate-600 max-w-[200px] truncate">{t.controlTitle}</TableCell>
                                <TableCell className="text-xs text-slate-600 whitespace-nowrap">{new Date(t.testDate).toLocaleDateString('tr-TR')}</TableCell>
                                <TableCell><Badge className={`text-[9px] ${getTestResultBadgeClass(t.result)}`}>{t.result}</Badge></TableCell>
                                <TableCell className={`text-xs font-semibold ${getScoreColor(t.score)}`}>{t.score}</TableCell>
                                <TableCell className="text-xs text-slate-600">{t.findingsCount}</TableCell>
                                <TableCell>
                                  <button onClick={() => setTestDetail(t)} className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><Eye size={14} /></button>
                                </TableCell>
                              </TableRow>
                            ))
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Bulgular Tab */}
            {controlSubTab === 'findings' && (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <input type="text" placeholder="Bulgu ara..." value={controlSearch} onChange={(e) => setControlSearch(e.target.value)} className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white w-full md:w-64" />
                  <select value={findingSeverityFilter} onChange={(e) => setFindingSeverityFilter(e.target.value as any)} className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option value="all">Tüm Şiddetler</option><option value="Low">Low</option><option value="Medium">Medium</option><option value="High">High</option><option value="Critical">Critical</option>
                  </select>
                  <select value={findingStatusFilter} onChange={(e) => setFindingStatusFilter(e.target.value as any)} className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white">
                    <option value="all">Tüm Durumlar</option><option value="Open">Open</option><option value="In Progress">In Progress</option><option value="Mitigated">Mitigated</option><option value="Closed">Closed</option>
                  </select>
                </div>
                <Card className="border-slate-200/70 shadow-sm">
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Bulgu No</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Başlık</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Şiddet</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Durum</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Sorumlu</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase">Son Tarih</TableHead>
                            <TableHead className="text-[10px] font-semibold text-slate-600 uppercase w-10"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const filtered = findings.filter((f) => {
                              if (controlSearch && !`${f.findingNumber} ${f.title} ${f.owner}`.toLowerCase().includes(controlSearch.toLowerCase())) return false
                              if (findingSeverityFilter !== 'all' && f.severity !== findingSeverityFilter) return false
                              if (findingStatusFilter !== 'all' && f.status !== findingStatusFilter) return false
                              return true
                            })
                            if (filtered.length === 0) return (<TableRow><TableCell colSpan={7} className="text-center text-xs text-slate-500 py-8">Bulgu bulunamadı.</TableCell></TableRow>)
                            return filtered.map((f) => (
                              <TableRow key={f.id} className="hover:bg-slate-50/40 transition-colors">
                                <TableCell className="text-xs text-slate-600 whitespace-nowrap">{f.findingNumber}</TableCell>
                                <TableCell className="text-xs font-medium text-slate-800 max-w-[200px] truncate" title={f.title}>{f.title}</TableCell>
                                <TableCell><Badge className={`text-[9px] ${getFindingSeverityBadgeClass(f.severity)}`}>{f.severity}</Badge></TableCell>
                                <TableCell><Badge className={`text-[9px] ${getFindingStatusBadgeClass(f.status)}`}>{f.status}</Badge></TableCell>
                                <TableCell className="text-xs text-slate-600">{f.owner}</TableCell>
                                <TableCell className="text-xs text-slate-600">{f.dueDate ? new Date(f.dueDate).toLocaleDateString('tr-TR') : '—'}</TableCell>
                                <TableCell>
                                  <div className="relative">
                                    <button onClick={() => setControlDropdownId(controlDropdownId === f.id ? null : f.id)} className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><MoreHorizontal size={14} /></button>
                                    {controlDropdownId === f.id && (
                                      <div className="absolute right-0 top-full mt-1 z-20 w-44 bg-white/95 border border-slate-200/70 rounded-xl shadow-lg p-1.5 space-y-0.5">
                                        <button onClick={() => { setFindingDetail(f); setControlDropdownId(null); }} className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"><Eye size={12} />Detay Gör</button>
                                        <button onClick={() => { const newCase = createCase({ title: `Bulgu: ${f.title}`, description: f.description, status: 'Açık', priority: f.severity === 'Critical' ? 'Kritik' : f.severity === 'High' ? 'Yüksek' : 'Orta', riskLevel: f.severity === 'Critical' ? 'Kritik' : f.severity === 'High' ? 'Yüksek' : 'Orta', tags: ['Kontrol'], owner: f.owner, assignedTo: f.owner, sourceModule: 'CONTROL', sourceId: f.id, relatedTasks: [], relatedApprovals: [], relatedDocuments: [] }); setCases((prev) => [...prev, newCase]); setFindings((prev) => prev.map((x) => x.id === f.id ? { ...x, linkedCaseId: newCase.id, status: 'In Progress' } : x)); setControlDropdownId(null); addAuditLog({ userId: currentUser?.id || 'system', userName: currentUser?.name || 'Sistem', role: currentUser?.role || 'Sistem', action: `Bulgudan case oluşturuldu: ${f.title}`, entityType: 'finding', entityId: f.id, entityTitle: f.title, severity: 'warning' }); }} className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"><BriefcaseBusiness size={12} />Case Oluştur</button>
                                        <button onClick={() => { const newTask = createTask({ title: `Bulgu Aksiyon: ${f.title}`, notes: f.description, authority: 'Kontrol', status: 'Açık', riskLevel: f.severity === 'Critical' ? 'Kritik' : f.severity === 'High' ? 'Yüksek' : 'Orta', assignedTo: f.owner, dueDate: f.dueDate || new Date().toISOString().split('T')[0] }); setTasks((prev) => [...prev, newTask]); setFindings((prev) => prev.map((x) => x.id === f.id ? { ...x, linkedTaskId: newTask.id, status: 'In Progress' } : x)); setControlDropdownId(null); addAuditLog({ userId: currentUser?.id || 'system', userName: currentUser?.name || 'Sistem', role: currentUser?.role || 'Sistem', action: `Bulgudan görev oluşturuldu: ${f.title}`, entityType: 'finding', entityId: f.id, entityTitle: f.title, severity: 'warning' }); }} className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg hover:bg-slate-50 text-slate-700 flex items-center gap-2"><ClipboardList size={12} />Görev Oluştur</button>
                                        <button onClick={() => { closeFinding(f.id); setFindings((prev) => prev.map((x) => x.id === f.id ? { ...x, status: 'Closed' } : x)); setControlDropdownId(null); addAuditLog({ userId: currentUser?.id || 'system', userName: currentUser?.name || 'Sistem', role: currentUser?.role || 'Sistem', action: `Bulgu kapatıldı: ${f.title}`, entityType: 'finding', entityId: f.id, entityTitle: f.title, severity: 'info' }); }} className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-emerald-700 flex items-center gap-2"><Check size={12} />Kapat</button>
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Executive Summary KPIs */}
            {(() => {
              const stats = getTaskStats(tasks)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { label: 'Toplam Görev', value: stats.total, icon: ClipboardList, color: 'text-slate-700', bg: 'bg-slate-50' },
                    { label: 'Açık Görev', value: stats.open, icon: AlertTriangle, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Kritik Görev', value: stats.critical, icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Bu Hafta Tamamlanan', value: stats.completedThisWeek, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Geciken Görev', value: stats.delayed, icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-50' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color}`}><kpi.icon size={16} /></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-0.5 leading-tight">{kpi.label}</p>
                      <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Filters + Add */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'Tümü' },
                  { key: 'open', label: 'Açık' },
                  { key: 'critical', label: 'Kritik' },
                  { key: 'delayed', label: 'Geciken' },
                ].map((f) => (
                  <button key={f.key} onClick={() => setTaskFilter(f.key as typeof taskFilter)} className={`text-[11px] px-3 py-1.5 rounded-full border ${taskFilter === f.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{f.label}</button>
                ))}
              </div>
              {userPerms?.canCreateTask && (
                <button onClick={() => openTaskModal()} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 transition-all">
                  <Plus size={13} /> Yeni Görev
                </button>
              )}
            </div>

            {/* Task Table */}
            <Card className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
              <CardHeader className="py-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <ClipboardList size={18} className="text-violet-600" />
                  <CardTitle className="text-sm font-semibold">Uyum Görevleri</CardTitle>
                  <Badge className="text-[10px] bg-violet-50 text-violet-700 border-violet-200/60">Operasyonel</Badge>
                </div>
                <p className="text-[11px] text-slate-400">Regülasyon odaklı uyum takip ve aksiyon tablosu</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                        <TableHead className="text-xs font-medium text-slate-500">Görev</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Kurum</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Operasyon</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Risk</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Sorumlu</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Durum</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Son Tarih</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500 text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        let filtered = tasks
                        if (taskFilter === 'open') filtered = tasks.filter((t) => t.status === 'Açık')
                        if (taskFilter === 'critical') filtered = tasks.filter((t) => t.riskLevel === 'Kritik')
                        if (taskFilter === 'delayed') filtered = tasks.filter((t) => isTaskOverdue(t))
                        if (filtered.length === 0) {
                          return (
                            <TableRow>
                              <TableCell colSpan={8} className="text-center py-10 text-slate-400">
                                <div className="flex flex-col items-center gap-2">
                                  <ClipboardList size={32} className="text-slate-300" />
                                  <p className="text-sm">Henüz görev bulunmuyor.</p>
                                  <p className="text-xs">SPK veya BDDK tablosundan "Uyum Görevi Oluştur" ile yeni görev ekleyebilirsiniz.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        }
                        return filtered.map((t) => {
                          const overdue = isTaskOverdue(t)
                          return (
                            <TableRow key={t.id} className={`border-b border-slate-50 hover:bg-slate-50/70 ${overdue ? 'bg-rose-50/40' : ''}`}>
                              <TableCell className="text-xs font-medium text-slate-800 max-w-[200px] truncate" title={t.title}>{t.title}</TableCell>
                              <TableCell className="text-xs">
                                <Badge variant="outline" className={`text-[10px] ${t.authority === 'BDDK' ? 'border-indigo-200/60 text-indigo-700' : t.authority === 'MASAK' ? 'border-rose-200/60 text-rose-700' : 'border-blue-200/60 text-blue-700'}`}>{t.authority}</Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                <div className="flex flex-wrap gap-1 max-w-[180px]">
                                  {(t.affectedOperations || []).slice(0, 2).map((op) => (
                                    <Badge key={op} variant="outline" className="text-[9px] text-slate-600 border-slate-200/60">{op}</Badge>
                                  ))}
                                  {(t.affectedOperations || []).length > 2 && (
                                    <Badge variant="outline" className="text-[9px] text-slate-400 border-slate-200/60">+{(t.affectedOperations || []).length - 2}</Badge>
                                  )}
                                  {(t.affectedOperations || []).length === 0 && <span className="text-slate-400">—</span>}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs">
                                <Badge className={`text-[10px] ${getTaskRiskBadgeClass(t.riskLevel)}`}>{t.riskLevel}</Badge>
                              </TableCell>
                              <TableCell className="text-xs text-slate-600">{t.assignedTo}</TableCell>
                              <TableCell className="text-xs">
                                <Badge className={`text-[10px] ${getTaskStatusBadgeClass(t.status)}`}>{t.status}</Badge>
                              </TableCell>
                              <TableCell className="text-xs">
                                <div className="flex items-center gap-1.5">
                                  {overdue && <span className="inline-flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />}
                                  <span className={overdue ? 'text-rose-600 font-semibold' : 'text-slate-600'}>{t.dueDate}</span>
                                  {overdue && <Badge className="text-[9px] bg-rose-50 text-rose-700 border-rose-200/60">Gecikmiş</Badge>}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {userPerms?.canUpdateAnyTask && (
                                    <button title="Tamamlandı Yap" onClick={() => { updateTask(t.id, { status: 'Tamamlandı' }); setTasks(loadTasksFromStorage()); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Görev tamamlandı', entityType: 'task', entityId: t.id, entityTitle: t.title, severity: 'info' }) }} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-600 hover:bg-emerald-50"><Check size={13} /></button>
                                  )}
                                  {userPerms?.canUpdateAnyTask && (
                                    <button title="İncelemede Yap" onClick={() => { updateTask(t.id, { status: 'İncelemede' }); setTasks(loadTasksFromStorage()); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Görev güncellendi', entityType: 'task', entityId: t.id, entityTitle: t.title, severity: 'info' }) }} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-amber-600 hover:bg-amber-50"><Eye size={13} /></button>
                                  )}
                                  {userPerms?.canDeleteTask && (
                                    <button title="Sil" onClick={() => { deleteTask(t.id); setTasks(loadTasksFromStorage()); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Görev silindi', entityType: 'task', entityId: t.id, entityTitle: t.title, severity: 'critical' }) }} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-rose-600 hover:bg-rose-50"><X size={13} /></button>
                                  )}
                                  {!userPerms?.readOnly && (
                                    <button title="Onaya Gönder" onClick={() => { const newReq = createApprovalRequest({ sourceModule: 'TASK', sourceId: t.id, sourceTitle: t.title, requestType: 'Görev Onayı', requestedBy: currentUser?.name || 'Sistem', requestedByRole: currentUser?.role || 'Sistem', assignedApprover: 'Yönetici', approverRole: 'Yönetici', riskLevel: t.riskLevel, priority: t.riskLevel === 'Kritik' ? 'Kritik' : t.riskLevel === 'Yüksek' ? 'Yüksek' : 'Orta', notes: t.notes || '' }); if (newReq) setApprovalRequests((prev) => [newReq, ...prev]); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Onay talebi oluşturuldu', entityType: 'task', entityId: t.id, entityTitle: t.title, severity: 'info' }) }} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-blue-600 hover:bg-blue-50"><ClipboardCheck size={13} /></button>
                                  )}
                                  {userPerms?.readOnly && (
                                    <span className="text-[9px] text-slate-400">Sadece görüntüleme</span>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <Card className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
              <CardHeader className="py-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <BrainCircuit size={18} className="text-violet-600" />
                  <CardTitle className="text-sm font-semibold">AKOP RegTech AI Analiz</CardTitle>
                </div>
                <p className="text-[11px] text-slate-400">Kurum, kayıt ve analiz tipi seçerek AI destekli regülasyon analizi başlatın</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-slate-50/70 border border-slate-200/70">
                  <select className="text-[11px] rounded-xl border border-slate-200 px-2.5 py-1.5 bg-white outline-none focus:border-blue-500" value={aiSelectedAuthority} onChange={(e) => { setAiSelectedAuthority(e.target.value as any); setAiSelectedRecord(null); setAiResult(null) }}>
                    <option value="all">Tüm Kurumlar</option>
                    <option value="SPK">SPK</option>
                    <option value="BDDK">BDDK</option>
                  </select>
                  <select className="text-[11px] rounded-xl border border-slate-200 px-2.5 py-1.5 bg-white outline-none focus:border-blue-500 max-w-[300px]" value={aiSelectedRecord?.id || ''} onChange={(e) => { const r = allArchiveRecords.find((x) => x.id === e.target.value); setAiSelectedRecord(r || null); setAiResult(null) }}>
                    <option value="">Regülasyon kaydı seçin...</option>
                    {allArchiveRecords.filter((r) => aiSelectedAuthority === 'all' || r.authority === aiSelectedAuthority).slice(0, 200).map((r) => (
                      <option key={r.id} value={r.id}>{r.authority === 'BDDK' ? '[BDDK]' : '[SPK]'} {r.title?.slice(0, 80)}</option>
                    ))}
                  </select>
                  <select className="text-[11px] rounded-xl border border-slate-200 px-2.5 py-1.5 bg-white outline-none focus:border-blue-500" value={aiAnalysisType} onChange={(e) => setAiAnalysisType(e.target.value)}>
                    <option value="summary">Yönetici Özeti</option>
                    <option value="compliance">Uyum Etkisi</option>
                    <option value="operational">Operasyonel Etki</option>
                    <option value="risk">Risk Skoru</option>
                    <option value="checklist">Kontrol Listesi</option>
                  </select>
                  <button onClick={() => { if (aiSelectedRecord) handleAiAnalyze(aiSelectedRecord) }} disabled={!aiSelectedRecord || aiLoading} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition-all">
                    {aiLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Analiz Başlat
                  </button>
                </div>

                {aiResult?.sourceBasis !== 'openai' && aiResult?.sourceBasis !== 'pdf_content' && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200/60 p-3">
                    <p className="text-[11px] text-amber-700">
                      OpenAI API anahtarı eklenmediği için analiz simüle edildi. Gerçek AI analizi için OPENAI_API_KEY ortam değişkeni eklenmelidir.
                    </p>
                  </div>
                )}

                {aiResult && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 flex-wrap justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Sparkles size={14} className="text-violet-600" />
                        <p className="text-xs font-semibold text-slate-800">AKOP AI Analiz Sonuçları</p>
                        <Badge className={aiResult.impactLevel === 'high' ? 'bg-rose-50 text-rose-700 border-rose-200/60 text-[10px]' : aiResult.impactLevel === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200/60 text-[10px]' : 'bg-emerald-50 text-emerald-700 border-emerald-200/60 text-[10px]'}>{aiResult.impactLevel === 'high' ? 'Yüksek Etki' : aiResult.impactLevel === 'medium' ? 'Orta Etki' : 'Düşük Etki'}</Badge>
                        <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-200/60">{aiResult.sourceBasis === 'openai' ? 'OpenAI' : aiResult.sourceBasis === 'uploaded_pdf' ? 'PDF' : aiResult.sourceBasis === 'pdf_content' ? 'PDF' : aiResult.sourceBasis === 'metadata_only' ? 'Metadata' : 'Simülasyon'}</Badge>
                      </div>
                      {userPerms?.canCreateTask && (
                        <button onClick={handleCreateTaskFromAi} className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800 transition-all">
                          <Plus size={13} /> Bu Analizden Görev Oluştur
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Yönetici Özeti</p>
                        <p className="text-[12px] text-slate-700 leading-relaxed">{aiResult.summary}</p>
                      </div>

                      {Array.isArray(aiResult.affectedAreas) && aiResult.affectedAreas.length > 0 && (
                        <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Uyum Etkisi</p>
                          <div className="flex flex-wrap gap-1.5">{aiResult.affectedAreas.map((area) => (<Badge key={area} variant="outline" className="text-[10px] text-slate-600 border-slate-200/60">{area}</Badge>))}</div>
                        </div>
                      )}

                      <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Operasyonel Etki</p>
                        <p className="text-[12px] text-slate-700 leading-relaxed">{aiResult.possibleOperationalImpact}</p>
                      </div>

                      {(() => {
                        const opImpact = aiSelectedRecord ? calculateOperationalImpact(aiSelectedRecord) : null
                        return opImpact && opImpact.areas.length > 0 && (
                          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Operasyon Etki Haritası</p>
                            <div className="flex flex-wrap gap-1.5">
                              {opImpact.areas.map((area) => (<Badge key={area} className="text-[10px] bg-slate-50 text-slate-700 border-slate-200/60">{area}</Badge>))}
                            </div>
                          </div>
                        )
                      })()}

                      {(() => {
                        const risk = aiSelectedRecord ? calculateRegulatoryRisk(aiSelectedRecord) : null
                        return risk && (
                          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Risk Seviyesi</p>
                            <Badge className={`text-[10px] ${getRiskBadgeClass(risk.level)}`}>{risk.label}</Badge>
                            <p className="text-[11px] text-slate-600">{risk.reason}</p>
                            <div className="flex flex-wrap gap-1">
                              {risk.affectedAreas.map((area) => (<Badge key={area} variant="outline" className="text-[9px] text-slate-600 border-slate-200/60">{area}</Badge>))}
                            </div>
                          </div>
                        )
                      })()}

                      {Array.isArray(aiResult.keyDecisions) && aiResult.keyDecisions.length > 0 && (
                        <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Anahtar Kararlar</p>
                          <ul className="list-disc list-inside space-y-1">{aiResult.keyDecisions.map((kd, idx) => (<li key={idx} className="text-[12px] text-slate-700">{kd}</li>))}</ul>
                        </div>
                      )}

                      {Array.isArray(aiResult.complianceChecklist) && aiResult.complianceChecklist.length > 0 && (
                        <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                          <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Önerilen Kontrol Maddeleri</p>
                          <ul className="list-disc list-inside space-y-1">{aiResult.complianceChecklist.map((item, idx) => (<li key={idx} className="text-[12px] text-slate-700">{item}</li>))}</ul>
                        </div>
                      )}

                      <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Aksiyon Planı</p>
                        <p className="text-[12px] text-slate-700 leading-relaxed">{aiResult.recommendedAction}</p>
                      </div>

                      <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">MKK / Takasbank Bağlantısı</p>
                        <p className="text-[11px] text-slate-500">Bu regülasyon kaydının MKK ve Takasbank sistemleri ile entegrasyon kontrolü yapılmalıdır. Uyum süreçleri merkezi kayıt kuruluşları ile senkronize edilmelidir.</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 italic">{aiResult.disclaimer}</p>
                  </div>
                )}
                {!aiResult && !aiLoading && (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2"><BrainCircuit size={32} className="text-slate-300" /><p className="text-sm">Analiz başlatmak için bir regülasyon kaydı seçin.</p></div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Users size={18} className="text-slate-700" />
                <h2 className="text-sm font-semibold text-slate-800">Kullanıcı Yönetimi</h2>
                <Badge className="text-[10px] bg-slate-900 text-white border-slate-900">Sadece Admin</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Sistem kullanıcıları, roller ve erişim durumları.</p>
            </div>
            <Card className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
              <CardHeader className="py-4">
                <div className="flex items-center gap-2 mb-0.5">
                  <Users size={18} className="text-slate-600" />
                  <CardTitle className="text-sm font-semibold">Kullanıcı Listesi</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                        <TableHead className="text-xs font-medium text-slate-500">İsim</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">E-posta</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Rol</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Departman</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Durum</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500">Son Giriş</TableHead>
                        <TableHead className="text-xs font-medium text-slate-500 text-right">İşlem</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        const userList = getUsers()
                        return userList.map((u) => (
                          <TableRow key={u.id} className="border-b border-slate-50 hover:bg-slate-50/70">
                            <TableCell className="text-xs font-medium text-slate-800">{u.name}</TableCell>
                            <TableCell className="text-xs text-slate-600">{u.email}</TableCell>
                            <TableCell className="text-xs">
                              <Badge className={`text-[10px] ${getRoleBadgeClass(u.role)}`}>{u.role}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">{u.department}</TableCell>
                            <TableCell className="text-xs">
                              <Badge className={u.status === 'Aktif' ? 'text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'text-[10px] bg-slate-50 text-slate-500 border-slate-200/60'}>{u.status}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-slate-600">{u.lastLogin ? new Date(u.lastLogin).toLocaleString('tr-TR') : '—'}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {['Admin', 'Uyum Uzmanı', 'Operasyon Uzmanı', 'Yönetici', 'Denetçi'].map((role) => (
                                  <button
                                    key={role}
                                    title={`Rolü ${role} yap`}
                                    onClick={() => { updateUser({ ...u, role: role as UserRole }); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: `Rol değiştirildi: ${u.name} → ${role}`, entityType: 'user', entityId: u.id, entityTitle: u.name, severity: 'warning' }); setAuthToast(`${u.name} → ${role}`); setTimeout(() => setAuthToast(''), 2000) }}
                                    className={`text-[9px] px-2 py-1 rounded-full border ${u.role === role ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                                  >
                                    {role.slice(0, 3)}
                                  </button>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <FolderLock size={18} className="text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-800">Kanıt Kasası</h2>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Yükümlülük, görev, case, onay ve uyarılara bağlı kanıt dokümanlarını merkezi olarak yönetin.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const stats = getEvidenceStats(evidenceDocs)
              const missingObl = obligations.filter((o) => o.evidenceCount === 0).length
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Toplam Kanıt</p>
                    <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Restricted</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.restricted}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Onay Bekleyen</p>
                    <p className="text-2xl font-bold text-sky-600">{stats.pendingApproval}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Bu Ay Eklenen</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.addedThisMonth}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Arşivlenen</p>
                    <p className="text-2xl font-bold text-slate-600">{stats.archived}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Eksik Kanıtlı Yükümlülük</p>
                    <p className="text-2xl font-bold text-orange-600">{missingObl}</p>
                  </div>
                </div>
              )
            })()}

            {/* Filters */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input type="text" value={evidenceSearch} onChange={(e) => setEvidenceSearch(e.target.value)} placeholder="Ara..." className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full md:w-64" />
                <select value={evidenceFilterClassification} onChange={(e) => setEvidenceFilterClassification(e.target.value as EvidenceClassification | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500">
                  <option value="all">Tüm Sınıflandırma</option>
                  {['Public','Internal','Confidential','Restricted'].map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <select value={evidenceFilterStatus} onChange={(e) => setEvidenceFilterStatus(e.target.value as EvidenceStatusType | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500">
                  <option value="all">Tüm Durumlar</option>
                  {['Aktif','İncelemede','Onay Bekliyor','Arşivlendi'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={evidenceFilterEntityType} onChange={(e) => setEvidenceFilterEntityType(e.target.value as EvidenceLinkedEntityType | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500">
                  <option value="all">Tüm Bağlı Kayıt</option>
                  {['obligation','task','case','approval','reconciliation','takasbank','regulation','control','test','finding'].map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button onClick={() => { setEvidenceSearch(''); setEvidenceFilterClassification('all'); setEvidenceFilterStatus('all'); setEvidenceFilterEntityType('all') }} className="inline-flex items-center gap-1 text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><FilterX size={12} /> Sıfırla</button>
                {!userPerms?.readOnly && (
                  <button onClick={() => { setEvidenceAddModalOpen(true); setEvidenceAddTitle(''); setEvidenceAddDescription(''); setEvidenceAddFileName(''); setEvidenceAddClassification('Internal'); setEvidenceAddLinkedEntityType('obligation'); setEvidenceAddLinkedEntityId(''); setEvidenceAddLinkedEntityTitle('') }} className="inline-flex items-center gap-1 text-[11px] px-3 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium"><Plus size={12} /> Kanıt Ekle</button>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-slate-100">
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Doküman</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Sınıflandırma</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Bağlı Kayıt</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Versiyon</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Durum</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Yükleyen</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Tarih</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-10"></th>
                </tr></thead>
                <tbody>
                  {(() => {
                    let filtered = evidenceDocs.filter((d) => {
                      if (evidenceFilterClassification !== 'all' && d.classification !== evidenceFilterClassification) return false
                      if (evidenceFilterStatus !== 'all' && d.status !== evidenceFilterStatus) return false
                      if (evidenceFilterEntityType !== 'all' && d.linkedEntityType !== evidenceFilterEntityType) return false
                      if (!evidenceSearch) return true
                      const q = evidenceSearch.toLowerCase()
                      return `${d.title} ${d.fileName} ${d.uploadedBy} ${d.linkedEntityTitle}`.toLowerCase().includes(q)
                    })
                    // Operasyon Uzmanı: sadece kendisine atanmış task/case evidence'ları
                    if (currentUser?.role === 'Operasyon Uzmanı') {
                      const myTaskIds = tasks.filter((t) => t.assignedTo === currentUser.name).map((t) => t.id)
                      const myCaseIds = cases.filter((c) => c.assignedTo === currentUser.name).map((c) => c.id)
                      filtered = filtered.filter((d) => {
                        if (d.linkedEntityType === 'task' && myTaskIds.includes(d.linkedEntityId)) return true
                        if (d.linkedEntityType === 'case' && myCaseIds.includes(d.linkedEntityId)) return true
                        return false
                      })
                    }
                    if (filtered.length === 0) return <tr><td colSpan={8} className="px-4 py-8 text-center text-[11px] text-slate-400">Doküman bulunmuyor.</td></tr>
                    return filtered.map((d) => (
                      <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <FileText size={14} className="text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-slate-700 truncate" title={d.title}>{d.title}</p>
                              <p className="text-[10px] text-slate-500">{d.fileName} · {d.fileType} · {d.fileSize}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><Badge className={`text-[9px] ${getClassificationBadgeClass(d.classification)}`}>{d.classification}</Badge></td>
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="text-[11px] text-slate-700 truncate">{d.linkedEntityTitle}</p>
                            <p className="text-[10px] text-slate-500">{d.linkedEntityType}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-700 font-mono">v{d.version}</td>
                        <td className="px-4 py-3"><Badge className={`text-[9px] ${getEvidenceStatusBadgeClass(d.status)}`}>{d.status}</Badge></td>
                        <td className="px-4 py-3 text-[11px] text-slate-700">{d.uploadedBy}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">{new Date(d.uploadedAt).toLocaleDateString('tr-TR')}</td>
                        <td className="px-4 py-3 relative">
                          <button onClick={() => setEvidenceOpenDropdownId(evidenceOpenDropdownId === d.id ? null : d.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><MoreVertical size={13} /></button>
                          {evidenceOpenDropdownId === d.id && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                              <button onClick={() => { setEvidenceDetail(d); setEvidenceOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Kanıt görüntülendi', entityType: 'evidence', entityId: d.id, entityTitle: d.title, severity: 'info' }) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"><Eye size={12} /> Detay Gör</button>
                              {!userPerms?.readOnly && (
                                <>
                                  <button onClick={() => { const updated = updateEvidenceDocument(d.id, { version: d.version + 1 }); if (updated) { setEvidenceDocs((prev) => prev.map((x) => x.id === d.id ? updated : x)); } setEvidenceOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Kanıta yeni versiyon eklendi', entityType: 'evidence', entityId: d.id, entityTitle: d.title, severity: 'info' }) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"><RefreshCw size={12} /> Yeni Versiyon Ekle</button>
                                  <button onClick={() => { createApprovalRequest({ sourceModule: 'EVIDENCE', sourceId: d.id, sourceTitle: d.title, requestType: 'Kanıt Onayı', requestedBy: currentUser?.name || 'Sistem', requestedByRole: currentUser?.role || 'Sistem', assignedApprover: d.uploadedBy, approverRole: 'Yönetici', priority: d.classification === 'Restricted' ? 'Kritik' : 'Yüksek', riskLevel: d.classification === 'Restricted' ? 'Kritik' : 'Yüksek', notes: d.description }); setEvidenceDocs((prev) => prev.map((x) => x.id === d.id ? { ...x, status: 'Onay Bekliyor' as EvidenceStatusType } : x)); setEvidenceOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Kanıt onaya gönderildi', entityType: 'evidence', entityId: d.id, entityTitle: d.title, severity: 'warning' }) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"><ClipboardCheck size={12} /> Onaya Gönder</button>
                                  <button onClick={() => { const updated = archiveEvidenceDocument(d.id); if (updated) { setEvidenceDocs((prev) => prev.map((x) => x.id === d.id ? updated : x)); } setEvidenceOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Kanıt arşivlendi', entityType: 'evidence', entityId: d.id, entityTitle: d.title, severity: 'info' }) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"><Archive size={12} /> Arşivle</button>
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>

            {/* Evidence Detail Drawer */}
            {evidenceDetail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
                <div className="w-full max-w-xl bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{evidenceDetail.title}</h3>
                      <p className="text-[11px] text-slate-500 font-mono">{evidenceDetail.id}</p>
                    </div>
                    <button onClick={() => setEvidenceDetail(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{evidenceDetail.fileName}</Badge>
                    <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{evidenceDetail.fileType} · {evidenceDetail.fileSize}</Badge>
                    <Badge className={`text-[9px] ${getClassificationBadgeClass(evidenceDetail.classification)}`}>{evidenceDetail.classification}</Badge>
                    <Badge className={`text-[9px] ${getEvidenceStatusBadgeClass(evidenceDetail.status)}`}>{evidenceDetail.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-[10px] text-blue-500 uppercase">Yükleyen</p>
                      <p className="text-[11px] font-semibold text-blue-700">{evidenceDetail.uploadedBy}</p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-3">
                      <p className="text-[10px] text-violet-500 uppercase">Versiyon</p>
                      <p className="text-[11px] font-semibold text-violet-700">v{evidenceDetail.version}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3">
                      <p className="text-[10px] text-amber-500 uppercase">Tarih</p>
                      <p className="text-[11px] font-semibold text-amber-700">{new Date(evidenceDetail.uploadedAt).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Açıklama</p>
                    <p className="text-[11px] text-slate-700 leading-relaxed">{evidenceDetail.description}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Hash</p>
                    <p className="text-[11px] font-mono text-slate-700 break-all">{evidenceDetail.hash}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Bağlı Kayıt</p>
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-3">
                      <FileText size={14} className="text-slate-400" />
                      <div>
                        <p className="text-[11px] font-medium text-slate-700">{evidenceDetail.linkedEntityTitle}</p>
                        <p className="text-[10px] text-slate-500">{evidenceDetail.linkedEntityType} · {evidenceDetail.linkedEntityId}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => setEvidenceDetail(null)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">Kapat</button>
                    {!userPerms?.readOnly && evidenceDetail.status !== 'Arşivlendi' && (
                      <button onClick={() => { const updated = archiveEvidenceDocument(evidenceDetail.id); if (updated) { setEvidenceDocs((prev) => prev.map((x) => x.id === evidenceDetail.id ? updated : x)); setEvidenceDetail(null); } if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Kanıt arşivlendi', entityType: 'evidence', entityId: evidenceDetail.id, entityTitle: evidenceDetail.title, severity: 'info' }) }} className="inline-flex items-center gap-1 text-[11px] px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium"><Archive size={13} /> Arşivle</button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Evidence Add Modal */}
            {evidenceAddModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
                <div className="w-full max-w-lg bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">Yeni Kanıt Ekle</h3>
                    <button onClick={() => setEvidenceAddModalOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Başlık</label>
                      <input type="text" value={evidenceAddTitle} onChange={(e) => setEvidenceAddTitle(e.target.value)} className="mt-1 text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full" />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Açıklama</label>
                      <textarea value={evidenceAddDescription} onChange={(e) => setEvidenceAddDescription(e.target.value)} rows={2} className="mt-1 text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full resize-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Bağlı Kayıt Tipi</label>
                        <select value={evidenceAddLinkedEntityType} onChange={(e) => setEvidenceAddLinkedEntityType(e.target.value as EvidenceLinkedEntityType)} className="mt-1 text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full">
                          {['obligation','task','case','approval','reconciliation','takasbank','regulation','control','test','finding'].map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Bağlı Kayıt ID</label>
                        <input type="text" value={evidenceAddLinkedEntityId} onChange={(e) => setEvidenceAddLinkedEntityId(e.target.value)} placeholder="Örn: OBL-001" className="mt-1 text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 uppercase">Bağlı Kayıt Başlığı</label>
                      <input type="text" value={evidenceAddLinkedEntityTitle} onChange={(e) => setEvidenceAddLinkedEntityTitle(e.target.value)} className="mt-1 text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Sınıflandırma</label>
                        <select value={evidenceAddClassification} onChange={(e) => setEvidenceAddClassification(e.target.value as EvidenceClassification)} className="mt-1 text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full">
                          {['Public','Internal','Confidential','Restricted'].map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Dosya Adı</label>
                        <input type="text" value={evidenceAddFileName} onChange={(e) => setEvidenceAddFileName(e.target.value)} placeholder="örn: dokuman.pdf" className="mt-1 text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Dosya Tipi</label>
                        <select value={evidenceAddFileType} onChange={(e) => setEvidenceAddFileType(e.target.value)} className="mt-1 text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full">
                          {['PDF','Excel','Word','ZIP','JPEG','PNG'].map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-semibold text-slate-500 uppercase">Dosya Boyutu</label>
                        <input type="text" value={evidenceAddFileSize} onChange={(e) => setEvidenceAddFileSize(e.target.value)} placeholder="örn: 1.2 MB" className="mt-1 text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => setEvidenceAddModalOpen(false)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">İptal</button>
                    <button onClick={() => {
                      if (!evidenceAddTitle || !evidenceAddLinkedEntityId || !evidenceAddLinkedEntityTitle) return
                      const newDoc = createEvidenceDocument({
                        title: evidenceAddTitle,
                        description: evidenceAddDescription,
                        fileName: evidenceAddFileName || 'dokuman.pdf',
                        fileType: evidenceAddFileType,
                        fileSize: evidenceAddFileSize,
                        classification: evidenceAddClassification,
                        linkedEntityType: evidenceAddLinkedEntityType,
                        linkedEntityId: evidenceAddLinkedEntityId,
                        linkedEntityTitle: evidenceAddLinkedEntityTitle,
                        uploadedBy: currentUser?.name || 'Sistem',
                        status: 'Aktif',
                      })
                      setEvidenceDocs((prev) => [newDoc, ...prev])
                      // Update obligation evidenceCount if linked to obligation
                      if (evidenceAddLinkedEntityType === 'obligation') {
                        setObligations((prev) => prev.map((o) => o.id === evidenceAddLinkedEntityId ? { ...o, evidenceCount: o.evidenceCount + 1, updatedAt: new Date().toISOString() } : o))
                      }
                      setEvidenceAddModalOpen(false)
                      if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Kanıt eklendi', entityType: 'evidence', entityId: newDoc.id, entityTitle: newDoc.title, severity: 'info' })
                    }} className="inline-flex items-center gap-1 text-[11px] px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium"><Plus size={13} /> Ekle</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'regintel' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ScanSearch size={18} className="text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-800">Regulatory Intelligence</h2>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Mevzuat değişikliklerini takip edin, etki zincirini analiz edin ve yeni yükümlülükleri önerin.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const stats = getRegIntelStats(regChanges, regVersions)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Versiyon</p>
                    <p className="text-2xl font-bold text-slate-700">{stats.totalVersions}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Değişiklik</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.totalChanges}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Kritik Etki</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.criticalChanges}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Önerilen Yükümlülük</p>
                    <p className="text-2xl font-bold text-violet-600">{stats.suggestedObligations}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Etkilenen Görev</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.affectedTasks}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Etkilenen Case</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.affectedCases}</p>
                  </div>
                </div>
              )
            })()}

            {/* Change Feed & Impact Chain */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left: Change Feed */}
              <div className="lg:col-span-2 bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Activity size={16} className="text-blue-600" />
                    <h3 className="text-sm font-semibold text-slate-800">Değişiklik Akışı</h3>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <input type="text" value={regIntelSearch} onChange={(e) => setRegIntelSearch(e.target.value)} placeholder="Ara..." className="text-[11px] rounded-xl border border-slate-200 px-3 py-1.5 bg-white outline-none focus:border-blue-500 w-40" />
                    <select value={regIntelFilterAuthority} onChange={(e) => setRegIntelFilterAuthority(e.target.value)} className="text-[11px] rounded-xl border border-slate-200 px-3 py-1.5 bg-white outline-none focus:border-blue-500">
                      <option value="all">Tüm Kurumlar</option>
                      {['SPK','BDDK','MASAK','MKK','TAKASBANK'].map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select value={regIntelFilterImpact} onChange={(e) => setRegIntelFilterImpact(e.target.value as ImpactLevel | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-1.5 bg-white outline-none focus:border-blue-500">
                      <option value="all">Tüm Etki</option>
                      {['Düşük','Orta','Yüksek','Kritik'].map((i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <select value={regIntelFilterType} onChange={(e) => setRegIntelFilterType(e.target.value as ChangeType | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-1.5 bg-white outline-none focus:border-blue-500">
                      <option value="all">Tüm Tip</option>
                      {['Yeni Düzenleme','Madde Değişikliği','Yürürlük Değişikliği','Kaldırıldı','Ek Yükümlülük'].map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button onClick={() => { setRegIntelSearch(''); setRegIntelFilterAuthority('all'); setRegIntelFilterImpact('all'); setRegIntelFilterType('all') }} className="text-[11px] px-2 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><FilterX size={12} /></button>
                  </div>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                  {(() => {
                    const filtered = regChanges.filter((c) => {
                      if (regIntelFilterAuthority !== 'all') {
                        const v = regVersions.find((rv) => rv.regulationId === c.regulationId)
                        if (!v || v.authority !== regIntelFilterAuthority) return false
                      }
                      if (regIntelFilterImpact !== 'all' && c.impactLevel !== regIntelFilterImpact) return false
                      if (regIntelFilterType !== 'all' && c.changeType !== regIntelFilterType) return false
                      if (!regIntelSearch) return true
                      const q = regIntelSearch.toLowerCase()
                      return `${c.articleReference} ${c.changeType} ${c.oldText} ${c.newText}`.toLowerCase().includes(q)
                    })
                    if (filtered.length === 0) return <p className="text-[11px] text-slate-400 text-center py-8">Değişiklik bulunmuyor.</p>
                    return filtered.map((c) => {
                      const version = regVersions.find((v) => v.regulationId === c.regulationId)
                      return (
                        <div key={c.id} className={`rounded-xl border p-3 space-y-2 cursor-pointer transition-all hover:shadow-sm ${regIntelSelectedChange?.id === c.id ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200/70 bg-white'}`} onClick={() => setRegIntelSelectedChange(c)}>
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <Badge className={`text-[9px] ${getChangeTypeBadgeClass(c.changeType)}`}>{c.changeType}</Badge>
                              <Badge className={`text-[9px] ${getImpactBadgeClass(c.impactLevel)}`}>{c.impactLevel}</Badge>
                            </div>
                            <span className="text-[10px] text-slate-400">{version?.authority} · {c.fromVersion} → {c.toVersion}</span>
                          </div>
                          <p className="text-[11px] font-medium text-slate-800">{c.articleReference}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-2">{c.newText}</p>
                          <div className="flex items-center gap-2 pt-1">
                            <button onClick={(e) => { e.stopPropagation(); setRegIntelDetail(c) }} className="text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">Detay</button>
                            {!userPerms?.readOnly && (
                              <button onClick={(e) => { e.stopPropagation(); setRegIntelSelectedChange(c) }} className="text-[10px] px-2 py-1 rounded-lg bg-slate-900 text-white hover:bg-slate-800">Etki Zinciri</button>
                            )}
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>

              {/* Right: Impact Chain & Suggested Obligations */}
              <div className="space-y-4">
                {/* Impact Chain */}
                {regIntelSelectedChange && (() => {
                  const chain = regChains.find((ch) => ch.changeId === regIntelSelectedChange.id)
                  const version = regVersions.find((v) => v.regulationId === regIntelSelectedChange.regulationId)
                  if (!chain) return null
                  return (
                    <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <GitBranch size={16} className="text-violet-600" />
                        <h3 className="text-sm font-semibold text-slate-800">Etki Zinciri</h3>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Regülasyon Değişikliği</p>
                        <div className="flex items-start gap-2 rounded-xl border border-violet-200/60 bg-violet-50 p-3">
                          <div className="mt-0.5 shrink-0 w-2 h-2 rounded-full bg-violet-500" />
                          <div>
                            <p className="text-[11px] font-medium text-violet-800">{version?.title}</p>
                            <p className="text-[9px] text-violet-600">{regIntelSelectedChange.articleReference} · {regIntelSelectedChange.changeType}</p>
                          </div>
                        </div>
                        {chain.affectedObligations.length > 0 && (
                          <div className="pl-4 border-l-2 border-violet-200 ml-1 space-y-1">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase">Yükümlülük</p>
                            {chain.affectedObligations.map((oId) => {
                              const o = obligations.find((obl) => obl.id === oId)
                              return o ? (
                                <div key={oId} className="flex items-start gap-2 rounded-xl border border-blue-200/60 bg-blue-50 p-2">
                                  <div className="mt-0.5 shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  <div>
                                    <p className="text-[11px] font-medium text-blue-800">{o.title}</p>
                                    <p className="text-[9px] text-blue-600">{o.authority} · {o.riskLevel}</p>
                                  </div>
                                </div>
                              ) : <div key={oId} className="text-[10px] text-slate-400 pl-3">{oId}</div>
                            })}
                          </div>
                        )}
                        {chain.affectedTasks.length > 0 && (
                          <div className="pl-4 border-l-2 border-emerald-200 ml-1 space-y-1">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase">Görev</p>
                            {chain.affectedTasks.map((tId) => <div key={tId} className="text-[10px] text-slate-500 pl-3">{tId}</div>)}
                          </div>
                        )}
                        {chain.affectedCases.length > 0 && (
                          <div className="pl-4 border-l-2 border-amber-200 ml-1 space-y-1">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase">Case</p>
                            {chain.affectedCases.map((cId) => <div key={cId} className="text-[10px] text-slate-500 pl-3">{cId}</div>)}
                          </div>
                        )}
                        {chain.affectedApprovals.length > 0 && (
                          <div className="pl-4 border-l-2 border-sky-200 ml-1 space-y-1">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase">Approval</p>
                            {chain.affectedApprovals.map((aId) => <div key={aId} className="text-[10px] text-slate-500 pl-3">{aId}</div>)}
                          </div>
                        )}
                        {chain.affectedEvidence.length > 0 && (
                          <div className="pl-4 border-l-2 border-teal-200 ml-1 space-y-1">
                            <p className="text-[10px] font-semibold text-slate-500 uppercase">Evidence</p>
                            {chain.affectedEvidence.map((eId) => {
                              const ev = evidenceDocs.find((d) => d.id === eId)
                              return ev ? (
                                <div key={eId} className="text-[10px] text-slate-500 pl-3 cursor-pointer hover:text-teal-600" onClick={() => setEvidenceDetail(ev)}>{ev.fileName}</div>
                              ) : <div key={eId} className="text-[10px] text-slate-500 pl-3">{eId}</div>
                            })}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500 pt-1">{chain.summary}</p>
                      </div>
                    </div>
                  )
                })()}

                {/* Suggested Obligations */}
                {regIntelSelectedChange && regIntelSelectedChange.suggestedObligations.length > 0 && (
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Lightbulb size={16} className="text-amber-600" />
                      <h3 className="text-sm font-semibold text-slate-800">Önerilen Yükümlülükler</h3>
                    </div>
                    <div className="space-y-2">
                      {regIntelSelectedChange.suggestedObligations.map((oblTitle, idx) => {
                        const version = regVersions.find((v) => v.regulationId === regIntelSelectedChange.regulationId)
                        return (
                          <div key={idx} className="rounded-xl border border-slate-200/70 bg-slate-50 p-3 space-y-1">
                            <p className="text-[11px] font-medium text-slate-800">{oblTitle}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{version?.authority}</Badge>
                              <Badge className={`text-[9px] ${getImpactBadgeClass(regIntelSelectedChange.impactLevel)}`}>{regIntelSelectedChange.impactLevel}</Badge>
                            </div>
                            {!userPerms?.readOnly && (
                              <button onClick={() => {
                                const newObl = createObligation({ title: `[RegIntel] ${oblTitle}`, description: `RegIntel önerisi: ${regIntelSelectedChange.articleReference} değişikliğinden doğan yükümlülük.`, sourceRegulationId: regIntelSelectedChange.regulationId, sourceRegulationTitle: version?.title || 'Regülasyon', authority: (version?.authority || 'SPK') as ObligationAuthority, articleReference: regIntelSelectedChange.articleReference, owner: currentUser?.name || 'Sistem', department: 'Uyum', riskLevel: regIntelSelectedChange.impactLevel as ObligationRisk, status: 'Açık', dueDate: new Date(Date.now() + 90 * 86400000).toISOString(), completionRate: 0, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 0 })
                                setObligations((prev) => [newObl, ...prev])
                                if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'RegIntel önerisinden yükümlülük oluşturuldu', entityType: 'regintel', entityId: regIntelSelectedChange.id, entityTitle: oblTitle, severity: 'info' })
                              }} className="mt-1 inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700"><Plus size={10} /> Yükümlülük Oluştur</button>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {!userPerms?.readOnly && regIntelSelectedChange.impactLevel === 'Kritik' && (
                      <button onClick={() => {
                        const version = regVersions.find((v) => v.regulationId === regIntelSelectedChange.regulationId)
                        const newCase = createCase({ title: `RegIntel: ${regIntelSelectedChange.articleReference}`, description: `Kritik mevzuat değişikliği: ${regIntelSelectedChange.newText}\n\nEski metin: ${regIntelSelectedChange.oldText}`, sourceModule: 'REGTECH', sourceId: regIntelSelectedChange.id, status: 'Açık', riskLevel: regIntelSelectedChange.impactLevel, priority: 'Kritik', assignedTo: currentUser?.name || 'Sistem', owner: currentUser?.name || 'Sistem', tags: [version?.authority || 'SPK', regIntelSelectedChange.changeType], relatedTasks: [], relatedApprovals: [], relatedDocuments: [] })
                        setCases((prev) => [newCase, ...prev])
                        if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'RegIntel kritik değişikliğinden case oluşturuldu', entityType: 'regintel', entityId: regIntelSelectedChange.id, entityTitle: regIntelSelectedChange.articleReference, severity: 'warning' })
                      }} className="w-full inline-flex items-center justify-center gap-1 text-[11px] px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-medium"><BriefcaseBusiness size={13} /> Case Oluştur (Kritik)</button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* RegIntel Detail Drawer */}
            {regIntelDetail && (() => {
              const version = regVersions.find((v) => v.regulationId === regIntelDetail.regulationId)
              const chain = regChains.find((ch) => ch.changeId === regIntelDetail.id)
              return (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
                  <div className="w-full max-w-2xl bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-800">{regIntelDetail.articleReference}</h3>
                        <p className="text-[11px] text-slate-500 font-mono">{regIntelDetail.id} · {version?.authority} · {regIntelDetail.fromVersion} → {regIntelDetail.toVersion}</p>
                      </div>
                      <button onClick={() => setRegIntelDetail(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`text-[10px] ${getChangeTypeBadgeClass(regIntelDetail.changeType)}`}>{regIntelDetail.changeType}</Badge>
                      <Badge className={`text-[10px] ${getImpactBadgeClass(regIntelDetail.impactLevel)}`}>{regIntelDetail.impactLevel}</Badge>
                      <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{version?.authority}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Eski Metin</p>
                        <p className="text-[11px] text-slate-700 leading-relaxed">{regIntelDetail.oldText}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-emerald-500 uppercase mb-1">Yeni Metin</p>
                        <p className="text-[11px] text-emerald-700 leading-relaxed">{regIntelDetail.newText}</p>
                      </div>
                    </div>
                    {version && (
                      <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-blue-500 uppercase mb-1">Regülasyon Özeti</p>
                        <p className="text-[11px] text-blue-700">{version.summary}</p>
                        <p className="text-[10px] text-blue-600 mt-1">Yürürlük: {new Date(version.effectiveAt).toLocaleDateString('tr-TR')}</p>
                      </div>
                    )}
                    <div className="bg-amber-50 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-amber-500 uppercase mb-1">Etkilenen Operasyonlar</p>
                      <div className="flex flex-wrap gap-1.5">
                        {regIntelDetail.affectedOperations.map((op) => <Badge key={op} variant="outline" className="text-[9px] border-amber-200/60 text-amber-700">{op}</Badge>)}
                      </div>
                    </div>
                    {chain && (
                      <div className="bg-violet-50 rounded-xl p-3">
                        <p className="text-[10px] font-semibold text-violet-500 uppercase mb-1">Etki Zinciri Özeti</p>
                        <p className="text-[11px] text-violet-700">{chain.summary}</p>
                        <div className="flex flex-wrap gap-3 mt-2">
                          <span className="text-[10px] text-violet-600">Yükümlülük: {chain.affectedObligations.length}</span>
                          <span className="text-[10px] text-violet-600">Görev: {chain.affectedTasks.length}</span>
                          <span className="text-[10px] text-violet-600">Case: {chain.affectedCases.length}</span>
                          <span className="text-[10px] text-violet-600">Onay: {chain.affectedApprovals.length}</span>
                          <span className="text-[10px] text-violet-600">Kanıt: {chain.affectedEvidence.length}</span>
                        </div>
                      </div>
                    )}
                    {regIntelDetail.suggestedObligations.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Önerilen Yükümlülükler</p>
                        {regIntelDetail.suggestedObligations.map((obl, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-xl border border-slate-200/70 bg-white p-3">
                            <span className="text-[11px] text-slate-700">{obl}</span>
                            {!userPerms?.readOnly && (
                              <button onClick={() => {
                                const newObl = createObligation({ title: `[RegIntel] ${obl}`, description: `RegIntel önerisi: ${regIntelDetail.articleReference} değişikliğinden doğan yükümlülük.`, sourceRegulationId: regIntelDetail.regulationId, sourceRegulationTitle: version?.title || 'Regülasyon', authority: (version?.authority || 'SPK') as ObligationAuthority, articleReference: regIntelDetail.articleReference, owner: currentUser?.name || 'Sistem', department: 'Uyum', riskLevel: regIntelDetail.impactLevel as ObligationRisk, status: 'Açık', dueDate: new Date(Date.now() + 90 * 86400000).toISOString(), completionRate: 0, relatedTasks: [], relatedCases: [], relatedApprovals: [], evidenceCount: 0 })
                                setObligations((prev) => [newObl, ...prev])
                                if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'RegIntel önerisinden yükümlülük oluşturuldu', entityType: 'regintel', entityId: regIntelDetail.id, entityTitle: obl, severity: 'info' })
                              }} className="text-[10px] px-2 py-1 rounded-lg bg-violet-600 text-white hover:bg-violet-700">Oluştur</button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button onClick={() => setRegIntelDetail(null)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">Kapat</button>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        )}

        {activeTab === 'riskradar' && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BrainCircuit size={18} className="text-slate-800" />
                    <h2 className="text-sm font-semibold text-slate-900">AI Risk Radar</h2>
                    <Badge className="border-slate-300 bg-slate-100 text-[10px] text-slate-700">Smart RegTech Layer</Badge>
                  </div>
                  <p className="max-w-3xl text-[11px] leading-relaxed text-slate-500">
                    Adverse media, mevzuat etkisi, no-code kural motoru, canlı işlem sinyalleri ve ağırlıklı risk matrix tek istihbarat katmanında toplanır.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  {(() => {
                    const stats = getIntelligenceStats()
                    return [
                      { label: 'Kritik Sinyal', value: stats.criticalSignals, tone: 'text-rose-600' },
                      { label: 'Aktif Kural', value: stats.activeRules, tone: 'text-slate-900' },
                      { label: 'Canlı Alarm', value: stats.liveAlerts, tone: 'text-blue-700' },
                      { label: 'Ortalama Risk', value: stats.averageRisk, tone: 'text-amber-700' },
                    ].map((item) => (
                      <div key={item.label} className="min-w-[118px] rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-center">
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
                        <p className={`text-xl font-bold ${item.tone}`}>{item.value}</p>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            </div>

            <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
              <Card className="akop-surface overflow-hidden rounded-2xl">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ScanSearch size={16} className="text-slate-700" />
                      <CardTitle className="text-sm font-semibold">Adverse Media & Mevzuat Tarama</CardTitle>
                    </div>
                    <Badge className="border-blue-200 bg-blue-50 text-[10px] text-blue-800">LLM ön analiz</Badge>
                  </div>
                  <p className="text-[11px] text-slate-500">Şirket, yatırımcı ve vendor isimleri global haberler ve resmi kaynaklarla eşleştirilir.</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {adverseMediaSignals.map((signal) => (
                    <div key={signal.id} className="rounded-xl border border-slate-200/70 bg-white p-3 transition-all hover:shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[12px] font-semibold text-slate-900">{signal.entityName}</p>
                            <Badge variant="outline" className="border-slate-200 text-[9px] text-slate-600">{signal.entityType}</Badge>
                            <Badge className={`text-[9px] ${signal.severity === 'high' || signal.severity === 'critical' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                              {signal.confidence}% güven
                            </Badge>
                          </div>
                          <p className="mt-1 text-[11px] font-medium text-slate-700">{signal.headline}</p>
                          <p className="mt-1 text-[10px] leading-relaxed text-slate-500">{signal.aiSummary}</p>
                        </div>
                        <span className="whitespace-nowrap text-[10px] text-slate-400">{new Date(signal.detectedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          {signal.riskKeywords.map((keyword) => (
                            <span key={keyword} className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[9px] font-medium text-slate-600">{keyword}</span>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'AI adverse media sinyali incelendi', entityType: 'riskengine', entityId: signal.id, entityTitle: signal.entityName, severity: signal.severity === 'high' || signal.severity === 'critical' ? 'warning' : 'info' })
                          }}
                          className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-[10px] font-semibold text-white hover:bg-slate-800"
                        >
                          İncelemeye Al
                        </button>
                      </div>
                      <p className="mt-2 rounded-lg border border-blue-100 bg-blue-50/70 px-2 py-1.5 text-[10px] text-blue-900">{signal.suggestedAction}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="akop-surface overflow-hidden rounded-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <GitBranch size={16} className="text-slate-700" />
                        <CardTitle className="text-sm font-semibold">Akıllı Kural Motoru</CardTitle>
                      </div>
                      <Badge className="border-slate-300 bg-slate-100 text-[10px] text-slate-700">No-code hazır</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">Uyum ekibi kuralı koda dokunmadan yönetir; aksiyonlar case, risk artışı veya onay olabilir.</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {workflowRules.map((rule) => (
                      <div key={rule.id} className="rounded-xl border border-slate-200/70 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[12px] font-semibold text-slate-900">{rule.name}</p>
                            <p className="mt-1 text-[10px] text-slate-500">{rule.description}</p>
                          </div>
                          <Badge className={rule.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-[9px] text-emerald-700' : rule.status === 'draft' ? 'border-amber-200 bg-amber-50 text-[9px] text-amber-700' : 'border-slate-200 bg-slate-50 text-[9px] text-slate-600'}>
                            {rule.status === 'active' ? 'Aktif' : rule.status === 'draft' ? 'Taslak' : 'Duraklatıldı'}
                          </Badge>
                        </div>
                        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 font-mono text-[9px] text-slate-600">{rule.condition}</div>
                        <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500">
                          <span>{rule.owner} · 30g tetik: {rule.hitsLast30Days}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const item: NotificationItem = {
                                id: `NOT-RADAR-${Date.now()}`,
                                title: `Kural tetiklendi: ${rule.name}`,
                                message: `${rule.description} Aksiyon: ${rule.action}`,
                                type: 'RISK_ENGINE',
                                severity: rule.action === 'create_case' || rule.action === 'raise_risk' ? 'warning' : 'info',
                                status: 'unread',
                                targetTab: 'riskradar',
                                targetEntityType: 'workflow-rule',
                                targetEntityId: rule.id,
                                targetEntityTitle: rule.name,
                                createdAt: new Date().toISOString(),
                                roleVisibility: ['Admin', 'Uyum Uzmanı', 'Yönetici', 'Denetçi'],
                                actionLabel: 'Radara Git',
                                isDemo: false,
                              }
                              setNotifications((prev) => [item, ...prev])
                              if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'AI kural motoru simülasyonu çalıştırıldı', entityType: 'riskengine', entityId: rule.id, entityTitle: rule.name, severity: 'info' })
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Play size={10} /> Simüle Et
                          </button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="akop-surface overflow-hidden rounded-2xl">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Activity size={16} className="text-slate-700" />
                      <CardTitle className="text-sm font-semibold">Canlı İşlem İzleme</CardTitle>
                    </div>
                    <p className="text-[11px] text-slate-500">WebSocket/SSE katmanına hazır stream görünümü; sinyal düştüğünde audit log’a yazılır.</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {liveTransactionSignals.map((signal) => (
                      <div key={signal.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-slate-200/70 bg-white p-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[12px] font-semibold text-slate-900">{signal.entityName}</p>
                            <Badge className={getRiskToneClass(signal.riskScore)}>{signal.riskScore}</Badge>
                          </div>
                          <p className="mt-1 text-[10px] text-slate-500">{signal.stream} · {signal.scenario}</p>
                          <p className="mt-1 font-mono text-[10px] text-slate-700">{signal.amount.toLocaleString('tr-TR')} {signal.currency}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={signal.status === 'Bloke' ? 'border-rose-200 bg-rose-50 text-[9px] text-rose-700' : 'border-amber-200 bg-amber-50 text-[9px] text-amber-700'}>{signal.status}</Badge>
                          <p className="mt-2 text-[9px] text-slate-400">{new Date(signal.detectedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                          <p className="mt-1 text-[9px] text-emerald-700">Audit: {signal.auditStatus}</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card className="akop-surface overflow-hidden rounded-2xl">
              <CardHeader className="pb-3">
                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 size={16} className="text-slate-700" />
                    <CardTitle className="text-sm font-semibold">Dinamik Risk Scoring Matrix</CardTitle>
                  </div>
                  <Badge className="border-slate-300 bg-slate-100 text-[10px] text-slate-700">Ağırlıklı 1-100 skor</Badge>
                </div>
                <p className="text-[11px] text-slate-500">Ülke, işlem tipi, davranış, regülasyon etkisi ve gecikme riski tek skora bağlanır.</p>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-100 bg-slate-50/80 hover:bg-transparent">
                        <TableHead>Entity</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Ülke</TableHead>
                        <TableHead>İşlem</TableHead>
                        <TableHead>Davranış</TableHead>
                        <TableHead>Regülasyon</TableHead>
                        <TableHead>Gecikme</TableHead>
                        <TableHead>Skor</TableHead>
                        <TableHead>Sahip</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {riskMatrixEntities.map((entity) => (
                        <TableRow key={entity.id} className="border-b border-slate-100 hover:bg-slate-50/70">
                          <TableCell className="text-xs font-semibold text-slate-800">{entity.entityName}</TableCell>
                          <TableCell><Badge variant="outline" className="border-slate-200 text-[9px] text-slate-600">{entity.entityType}</Badge></TableCell>
                          <TableCell className="text-xs">{entity.countryRisk}</TableCell>
                          <TableCell className="text-xs">{entity.transactionRisk}</TableCell>
                          <TableCell className="text-xs">{entity.behaviorRisk}</TableCell>
                          <TableCell className="text-xs">{entity.regulatoryRisk}</TableCell>
                          <TableCell className="text-xs">{entity.delayRisk}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge className={getRiskToneClass(entity.score)}>{entity.score}</Badge>
                              <span className={`text-[10px] ${entity.trend === 'up' ? 'text-rose-600' : entity.trend === 'down' ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {entity.trend === 'up' ? 'Yükseliyor' : entity.trend === 'down' ? 'Düşüyor' : 'Stabil'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">{entity.owner}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-6">
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <Archive size={18} className="text-slate-700" />
                <h2 className="text-sm font-semibold text-slate-800">Denetim Kayıtları</h2>
                <Badge className="text-[10px] bg-slate-900 text-white border-slate-900">Admin / Denetçi / Yönetici</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Sistem ve kullanıcı işlemlerinin kurumsal denetim kaydı.</p>
            </div>

            {/* Audit KPIs */}
            {(() => {
              const logs = getAuditLogs()
              const stats = getAuditStats(logs)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { label: 'Toplam Kayıt', value: stats.total, icon: Database, color: 'text-slate-700', bg: 'bg-slate-50' },
                    { label: 'Son 24 Saat', value: stats.last24h, icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Kritik Olay', value: stats.critical, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Kullanıcı İşlemleri', value: stats.userOps, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Sistem Olayları', value: stats.systemOps, icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50' },
                  ].map((kpi) => (
                    <div key={kpi.label} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`inline-flex items-center justify-center w-8 h-8 rounded-xl ${kpi.bg} ${kpi.color}`}><kpi.icon size={16} /></div>
                      </div>
                      <p className="text-[10px] text-slate-500 mb-0.5 leading-tight">{kpi.label}</p>
                      <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
                    </div>
                  ))}
                </div>
              )
            })()}

            {/* Filters + Table */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: 'all', label: 'Tümü' },
                  { key: 'critical', label: 'Kritik' },
                  { key: 'user', label: 'Kullanıcı İşlemleri' },
                  { key: 'task', label: 'Görevler' },
                  { key: 'ai', label: 'AI Analiz' },
                  { key: 'system', label: 'Sistem' },
                ].map((f) => (
                  <button key={f.key} onClick={() => setAuditFilter(f.key as typeof auditFilter)} className={`text-[11px] px-3 py-1.5 rounded-full border ${auditFilter === f.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'}`}>{f.label}</button>
                ))}
              </div>
              <Card className="bg-white/90 rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
                <CardHeader className="py-4">
                  <div className="flex items-center gap-2 mb-0.5">
                    <ClipboardList size={18} className="text-slate-600" />
                    <CardTitle className="text-sm font-semibold">Denetim Kayıt Listesi</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-slate-100 hover:bg-transparent bg-slate-50/80">
                          <TableHead className="text-xs font-medium text-slate-500">Tarih</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">Kullanıcı</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">Rol</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">İşlem</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">Varlık</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">Açıklama</TableHead>
                          <TableHead className="text-xs font-medium text-slate-500">Seviye</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(() => {
                          const logs = getAuditLogs()
                          let filtered = logs
                          if (auditFilter === 'critical') filtered = logs.filter((l) => l.severity === 'critical')
                          if (auditFilter === 'user') filtered = logs.filter((l) => l.entityType === 'user')
                          if (auditFilter === 'task') filtered = logs.filter((l) => l.entityType === 'task')
                          if (auditFilter === 'ai') filtered = logs.filter((l) => l.entityType === 'ai-analysis')
                          if (auditFilter === 'system') filtered = logs.filter((l) => l.entityType === 'system')
                          if (filtered.length === 0) {
                            return (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                                  <div className="flex flex-col items-center gap-2">
                                    <ClipboardList size={32} className="text-slate-300" />
                                    <p className="text-sm">Henüz denetim kaydı bulunmuyor.</p>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )
                          }
                          return filtered.slice(0, 100).map((log) => (
                            <TableRow key={log.id} className="border-b border-slate-50 hover:bg-slate-50/70">
                              <TableCell className="text-xs text-slate-600 whitespace-nowrap">{new Date(log.timestamp).toLocaleString('tr-TR')}</TableCell>
                              <TableCell className="text-xs font-medium text-slate-800">{log.userName}</TableCell>
                              <TableCell className="text-xs">
                                <Badge className={`text-[10px] ${getRoleBadgeClass(log.role as UserRole)}`}>{log.role}</Badge>
                              </TableCell>
                              <TableCell className="text-xs text-slate-700 max-w-[200px] truncate" title={log.action}>{log.action}</TableCell>
                              <TableCell className="text-xs">
                                <Badge variant="outline" className={`text-[10px] ${getEntityBadgeClass(log.entityType)}`}>{log.entityType}</Badge>
                              </TableCell>
                              <TableCell className="text-xs text-slate-600 max-w-[200px] truncate" title={log.entityTitle}>{log.entityTitle || log.details || '—'}</TableCell>
                              <TableCell className="text-xs">
                                <Badge className={`text-[10px] ${getSeverityBadgeClass(log.severity)}`}>{log.severity === 'critical' ? 'Kritik' : log.severity === 'warning' ? 'Uyarı' : 'Bilgi'}</Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        })()}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'document' && (
          <div className="space-y-6">
            {!workspaceRecord ? (
              <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-10 text-center space-y-3">
                <FileText size={40} className="text-slate-300 mx-auto" />
                <p className="text-sm text-slate-800 font-semibold">Belge seçilmedi</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">SPK veya BDDK tablosundan "Belge Workspace’te Aç" ile bir kayıt seçin.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge className={`text-[10px] ${workspaceRecord.authority === 'BDDK' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' : 'bg-blue-50 text-blue-700 border-blue-200/60'}`}>{workspaceRecord.authority || 'SPK'}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${getCategoryBadgeClass(workspaceRecord.sourceType === 'bulletin' ? 'Bülten' : workspaceRecord.sourceType === 'press-release' ? 'Duyuru' : workspaceRecord.category || 'Mevzuat')}`}>
                      {workspaceRecord.sourceType === 'bulletin' ? 'Bülten' : workspaceRecord.sourceType === 'legislation' ? (workspaceRecord.category || 'Mevzuat') : workspaceRecord.sourceType === 'bddk-announcement' ? 'Duyuru' : workspaceRecord.sourceType === 'bddk-press-release' ? 'Basın' : workspaceRecord.sourceType === 'bddk-decision' ? 'Karar' : workspaceRecord.sourceType === 'bddk-regulation' ? 'Mevzuat' : 'Duyuru'}
                    </Badge>
                    <Badge className={`text-[10px] ${getRiskBadgeClass(calculateRegulatoryRisk(workspaceRecord).level)}`}>{calculateRegulatoryRisk(workspaceRecord).label}</Badge>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{workspaceRecord.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span>{workspaceRecord.isoDate || workspaceRecord.date || '—'}</span>
                    <span>Numara: {workspaceRecord.number || '—'}</span>
                    {workspaceRecord.url && workspaceRecord.url !== '#' && (
                      <a href={workspaceRecord.url} target="_blank" rel="noopener noreferrer" onClick={() => { if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'PDF kaynağı açıldı', entityType: 'regulation', entityId: workspaceRecord.id, entityTitle: workspaceRecord.title, severity: 'info' }) }} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        <ExternalLink size={12} /> Kaynağı Aç
                      </a>
                    )}
                  </div>
                </div>

                {/* Split Layout: Document + AI Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Left: Document Preview */}
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3 min-h-[500px]">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={18} className="text-slate-600" />
                      <h3 className="text-sm font-semibold text-slate-800">Belge Önizlemesi</h3>
                    </div>
                    {workspaceRecord.url && workspaceRecord.url !== '#' ? (
                      <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 h-[500px]">
                        <iframe src={workspaceRecord.url} className="w-full h-full" title="Belge" />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-3">
                        <FileText size={40} className="text-slate-300" />
                        <p className="text-sm text-slate-800 font-semibold">Belge önizlemesi yüklenemedi</p>
                        <p className="text-[11px] text-slate-500 max-w-sm">Bu kayıt için doğrudan PDF bağlantısı bulunamadı. Kaynağı yeni sekmede açabilirsiniz.</p>
                      </div>
                    )}
                  </div>

                  {/* Right: AI & Compliance Summary */}
                  <div className="space-y-4">
                    {/* AI Analysis */}
                    <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <Sparkles size={18} className="text-violet-600" />
                          <h3 className="text-sm font-semibold text-slate-800">AI ve Uyum Özeti</h3>
                        </div>
                        {!workspaceAnalysis && !workspaceLoading && !userPerms?.readOnly && (
                          <button onClick={async () => { setWorkspaceLoading(true); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Belge AI analiz edildi', entityType: 'ai-analysis', entityId: workspaceRecord.id, entityTitle: workspaceRecord.title, severity: 'info' }); try { const result = await analyzeSpkBulletin(workspaceRecord); setWorkspaceAnalysis(result) } catch { setWorkspaceAnalysis({ summary: 'Analiz alınamadı.', keyDecisions: [], affectedAreas: [], recommendedAction: 'Lütfen tekrar deneyin.', impactLevel: 'low', complianceChecklist: [], possibleOperationalImpact: 'Bilinmiyor.', sourceBasis: 'fallback', reliability: 'low', errorNote: 'Frontend hatası', disclaimer: '' }) } finally { setWorkspaceLoading(false) } }} className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium">
                            <BrainCircuit size={13} /> AI Analiz Başlat
                          </button>
                        )}
                        {workspaceLoading && <Loader2 size={16} className="animate-spin text-violet-500" />}
                      </div>

                      {workspaceAnalysis && (
                        <div className="space-y-3">
                          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Yönetici Özeti</p>
                            <p className="text-[12px] text-slate-700 leading-relaxed">{workspaceAnalysis.summary}</p>
                          </div>
                          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Risk Seviyesi</p>
                            <Badge className={`text-[10px] ${getRiskBadgeClass(calculateRegulatoryRisk(workspaceRecord).level)}`}>{calculateRegulatoryRisk(workspaceRecord).label}</Badge>
                            <p className="text-[11px] text-slate-600">{calculateRegulatoryRisk(workspaceRecord).reason}</p>
                          </div>
                          {(() => {
                            const opImpact = calculateOperationalImpact(workspaceRecord)
                            return opImpact.areas.length > 0 && (
                              <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                                <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Etkilenen Operasyonlar</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {opImpact.areas.map((area) => (<Badge key={area} className="text-[10px] bg-slate-50 text-slate-700 border-slate-200/60">{area}</Badge>))}
                                </div>
                              </div>
                            )
                          })()}
                          {Array.isArray(workspaceAnalysis.keyDecisions) && workspaceAnalysis.keyDecisions.length > 0 && (
                            <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Anahtar Kararlar</p>
                              <ul className="list-disc list-inside space-y-1">{workspaceAnalysis.keyDecisions.map((kd, idx) => (<li key={idx} className="text-[12px] text-slate-700">{kd}</li>))}</ul>
                            </div>
                          )}
                          {Array.isArray(workspaceAnalysis.complianceChecklist) && workspaceAnalysis.complianceChecklist.length > 0 && (
                            <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                              <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Önerilen Kontrol Maddeleri</p>
                              <ul className="list-disc list-inside space-y-1">{workspaceAnalysis.complianceChecklist.map((item, idx) => (<li key={idx} className="text-[12px] text-slate-700">{item}</li>))}</ul>
                            </div>
                          )}
                          <div className="rounded-xl border border-slate-200/70 bg-white p-3.5 space-y-2">
                            <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">Aksiyon Planı</p>
                            <p className="text-[12px] text-slate-700 leading-relaxed">{workspaceAnalysis.recommendedAction}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom: Tasks + Audit Trail */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Related Tasks */}
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <ClipboardList size={18} className="text-violet-600" />
                        <h3 className="text-sm font-semibold text-slate-800">Belgeye Bağlı Görevler</h3>
                      </div>
                      {userPerms?.canCreateTask && (
                        <button onClick={() => { setWorkspaceRecord(workspaceRecord); openTaskModal(workspaceRecord) }} className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium">
                          <Plus size={13} /> Bu Belgeden Görev Oluştur
                        </button>
                      )}
                    </div>
                    {(() => {
                      const related = tasks.filter((t) => t.regulationId === workspaceRecord.id)
                      if (related.length === 0) {
                        return <p className="text-[11px] text-slate-400 py-4">Bu belgeye bağlı görev bulunmuyor.</p>
                      }
                      return (
                        <div className="space-y-2">
                          {related.map((t) => {
                            const overdue = isTaskOverdue(t)
                            return (
                              <div key={t.id} className={`flex items-start gap-3 rounded-xl border p-3 ${overdue ? 'border-rose-200 bg-rose-50/40' : 'border-slate-100'}`}>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                                    <Badge className={`text-[10px] ${getTaskRiskBadgeClass(t.riskLevel)}`}>{t.riskLevel}</Badge>
                                    <p className="text-xs font-semibold text-slate-800 truncate">{t.title}</p>
                                  </div>
                                  <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                    <span>Sorumlu: {t.assignedTo}</span>
                                    <span className={overdue ? 'text-rose-600 font-semibold' : ''}>Son: {t.dueDate}</span>
                                    <Badge className={`text-[9px] ${getTaskStatusBadgeClass(t.status)}`}>{t.status}</Badge>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </div>

                  {/* Audit Trail for this document */}
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Archive size={18} className="text-slate-600" />
                      <h3 className="text-sm font-semibold text-slate-800">Denetim İzi</h3>
                    </div>
                    {(() => {
                      const docLogs = getAuditLogs().filter((l) => l.entityId === workspaceRecord.id).slice(0, 8)
                      if (docLogs.length === 0) {
                        return <p className="text-[11px] text-slate-400 py-4">Bu belge için denetim kaydı bulunmuyor.</p>
                      }
                      return (
                        <div className="space-y-2">
                          {docLogs.map((log) => (
                            <div key={log.id} className="flex items-start gap-2 rounded-xl border border-slate-100 p-2.5">
                              <div className="mt-0.5 shrink-0">
                                {log.severity === 'critical' ? <AlertTriangle size={12} className="text-rose-600" /> : log.severity === 'warning' ? <Bell size={12} className="text-amber-600" /> : <Check size={12} className="text-blue-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium text-slate-800 truncate">{log.action}</p>
                                <p className="text-[10px] text-slate-500">{log.userName} • {new Date(log.timestamp).toLocaleString('tr-TR')}</p>
                              </div>
                              <Badge className={`text-[9px] ${getSeverityBadgeClass(log.severity)}`}>{log.severity === 'critical' ? 'Kritik' : log.severity === 'warning' ? 'Uyarı' : 'Bilgi'}</Badge>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Task Creation Modal */}
        {taskModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
            <div className="w-full max-w-lg bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Uyum Görevi Oluştur</h3>
                  {taskModalRecord && <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[320px]">Kaynak: {taskModalRecord.title?.slice(0, 60)}</p>}
                </div>
                <button onClick={() => setTaskModalOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">Görev Başlığı</label>
                  <input type="text" value={taskFormTitle} onChange={(e) => setTaskFormTitle(e.target.value)} className="w-full text-[12px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500" placeholder="Görev başlığı girin..." />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-1 block">Sorumlu</label>
                    <input type="text" value={taskFormAssignedTo} onChange={(e) => setTaskFormAssignedTo(e.target.value)} className="w-full text-[12px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500" placeholder="Kişi veya ekip" />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-1 block">Son Tarih</label>
                    <input type="date" value={taskFormDueDate} onChange={(e) => setTaskFormDueDate(e.target.value)} className="w-full text-[12px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">Risk Seviyesi</label>
                  <div className="flex items-center gap-2">
                    {(['Düşük', 'Orta', 'Yüksek', 'Kritik'] as TaskRisk[]).map((r) => (
                      <button key={r} onClick={() => setTaskFormRisk(r)} className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${taskFormRisk === r ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{r}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">Not</label>
                  <textarea value={taskFormNotes} onChange={(e) => setTaskFormNotes(e.target.value)} rows={3} className="w-full text-[12px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 resize-none" placeholder="Görev notu veya açıklama..." />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setTaskModalOpen(false)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">İptal</button>
                <button onClick={handleSaveTask} disabled={!taskFormTitle.trim()} className="inline-flex items-center gap-1 text-[11px] px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 font-medium">
                  <Check size={13} /> Kaydet
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Policy Detail Modal */}
        {policyDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
            <div className="w-full max-w-2xl bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck size={18} className="text-sky-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Politika Detayı</h3>
                </div>
                <button onClick={() => setPolicyDetail(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`text-[10px] ${getPolicyStatusBadgeClass(policyDetail.status)}`}>{policyDetail.status}</Badge>
                  <Badge className={`text-[10px] ${getPolicyTypeBadgeClass(policyDetail.documentType)}`}>{policyDetail.documentType}</Badge>
                  <Badge className={`text-[10px] ${getPolicyRiskBadgeClass(policyDetail.riskLevel)}`}>{policyDetail.riskLevel}</Badge>
                  <Badge variant="outline" className="text-[10px] border-slate-200/60 text-slate-600">v{policyDetail.version}</Badge>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Politika No</p>
                  <p className="text-sm font-semibold text-slate-800">{policyDetail.policyNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide">Başlık</p>
                  <p className="text-sm font-semibold text-slate-800">{policyDetail.title}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Sahip</p>
                    <p className="text-[12px] text-slate-700">{policyDetail.owner}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Departman</p>
                    <p className="text-[12px] text-slate-700">{policyDetail.department}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">İlgili Otorite</p>
                    <p className="text-[12px] text-slate-700">{policyDetail.authority}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Gözden Geçirme Sıklığı</p>
                    <p className="text-[12px] text-slate-700">{policyDetail.reviewFrequency}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Sonraki Review</p>
                    <p className="text-[12px] text-slate-700">{policyDetail.nextReviewDate ? new Date(policyDetail.nextReviewDate).toLocaleDateString('tr-TR') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Yayın Tarihi</p>
                    <p className="text-[12px] text-slate-700">{policyDetail.publishedAt ? new Date(policyDetail.publishedAt).toLocaleDateString('tr-TR') : '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Oluşturan</p>
                    <p className="text-[12px] text-slate-700">{policyDetail.createdBy}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide">Oluşturma Tarihi</p>
                    <p className="text-[12px] text-slate-700">{new Date(policyDetail.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                {policyDetail.linkedRegulations.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">İlgili Regülasyonlar</p>
                    <div className="flex flex-wrap gap-1.5">
                      {policyDetail.linkedRegulations.map((reg, i) => (<Badge key={i} variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{reg}</Badge>))}
                    </div>
                  </div>
                )}
                {policyDetail.approvers && policyDetail.approvers.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Onaycılar</p>
                    <div className="flex flex-wrap gap-1.5">
                      {policyDetail.approvers.map((app, i) => (<Badge key={i} className="text-[9px] bg-slate-50 text-slate-700 border-slate-200/60">{app}</Badge>))}
                    </div>
                  </div>
                )}
                {policyDetail.linkedObligations.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Bağlı Yükümlülükler</p>
                    <div className="flex flex-wrap gap-1.5">
                      {policyDetail.linkedObligations.map((id, i) => (<Badge key={i} className="text-[9px] bg-amber-50 text-amber-700 border-amber-200/60">{id}</Badge>))}
                    </div>
                  </div>
                )}
                {policyDetail.linkedEvidence.length > 0 && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Bağlı Kanıtlar</p>
                    <div className="flex flex-wrap gap-1.5">
                      {policyDetail.linkedEvidence.map((id, i) => (<Badge key={i} className="text-[9px] bg-emerald-50 text-emerald-700 border-emerald-200/60">{id}</Badge>))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Özet</p>
                  <p className="text-[12px] text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">{policyDetail.summary || policyDetail.description}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Değişiklik Geçmişi</p>
                  <div className="space-y-2">
                    {policyDetail.versionHistory.map((rev, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-xl border border-slate-100 p-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">v{rev.version}</Badge>
                            <span className="text-[10px] text-slate-500">{new Date(rev.effectiveDate).toLocaleDateString('tr-TR')} · {rev.changeLog}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {policyDetail.notes && (
                  <div>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Notlar</p>
                    <p className="text-[12px] text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">{policyDetail.notes}</p>
                  </div>
                )}
                {(() => {
                  const linkedCtrls = controls.filter((c) => c.linkedPolicyIds.includes(policyDetail.id))
                  if (linkedCtrls.length === 0) return null
                  return (
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Bağlı Kontroller</p>
                      <div className="space-y-1.5">
                        {linkedCtrls.map((c) => (
                          <div key={c.id} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                            <ShieldCheck size={12} className="text-indigo-600" />
                            <span className="text-[11px] text-slate-700">{c.controlNumber} · {c.title}</span>
                            <Badge className={`text-[9px] ${getControlTypeBadgeClass(c.controlType)}`}>{c.controlType}</Badge>
                            <Badge className={`text-[9px] ${getControlRiskBadgeClass(c.riskLevel)}`}>{c.riskLevel}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setPolicyDetail(null)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">Kapat</button>
                  <button onClick={() => { setActiveTab('evidence'); setPolicyDetail(null); }} className="text-[11px] px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium">Kanıt Bağla</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Control Detail Modal */}
        {controlDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
            <div className="w-full max-w-2xl bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Kontrol Detayı</h3>
                </div>
                <button onClick={() => setControlDetail(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`text-[10px] ${getControlTypeBadgeClass(controlDetail.controlType)}`}>{controlDetail.controlType}</Badge>
                  <Badge className={`text-[10px] ${getControlRiskBadgeClass(controlDetail.riskLevel)}`}>{controlDetail.riskLevel}</Badge>
                  <Badge variant="outline" className={`text-[9px] ${controlDetail.active ? 'border-emerald-200 text-emerald-700 bg-emerald-50' : 'border-slate-200 text-slate-600 bg-slate-50'}`}>{controlDetail.active ? 'Aktif' : 'Pasif'}</Badge>
                </div>
                <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Kontrol No</p><p className="text-sm font-semibold text-slate-800">{controlDetail.controlNumber}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Başlık</p><p className="text-sm font-semibold text-slate-800">{controlDetail.title}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Açıklama</p><p className="text-[12px] text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">{controlDetail.description}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Sahip</p><p className="text-[12px] text-slate-700">{controlDetail.owner}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Departman</p><p className="text-[12px] text-slate-700">{controlDetail.department}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Frekans</p><p className="text-[12px] text-slate-700">{controlDetail.frequency}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Oluşturma</p><p className="text-[12px] text-slate-700">{new Date(controlDetail.createdAt).toLocaleDateString('tr-TR')}</p></div>
                </div>
                {controlDetail.linkedPolicyIds.length > 0 && (
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Bağlı Politikalar</p><div className="flex flex-wrap gap-1.5">{controlDetail.linkedPolicyIds.map((id, i) => (<Badge key={i} variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{id}</Badge>))}</div></div>
                )}
                {controlDetail.linkedObligationIds.length > 0 && (
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Bağlı Yükümlülükler</p><div className="flex flex-wrap gap-1.5">{controlDetail.linkedObligationIds.map((id, i) => (<Badge key={i} className="text-[9px] bg-amber-50 text-amber-700 border-amber-200/60">{id}</Badge>))}</div></div>
                )}
                {controlDetail.linkedRegulationIds.length > 0 && (
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Bağlı Regülasyonlar</p><div className="flex flex-wrap gap-1.5">{controlDetail.linkedRegulationIds.map((id, i) => (<Badge key={i} className="text-[9px] bg-indigo-50 text-indigo-700 border-indigo-200/60">{id}</Badge>))}</div></div>
                )}
                {(() => {
                  const ctrlTests = getTestsForControl(controlDetail.id, controlTests)
                  if (ctrlTests.length === 0) return null
                  return (
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Son Testler</p>
                      <div className="space-y-1.5">
                        {ctrlTests.slice(0, 3).map((t) => (
                          <div key={t.id} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                            <span className="text-[11px] text-slate-700">{new Date(t.testDate).toLocaleDateString('tr-TR')} · {t.tester}</span>
                            <Badge className={`text-[9px] ${getTestResultBadgeClass(t.result)}`}>{t.result}</Badge>
                            <span className={`text-[11px] font-semibold ${getScoreColor(t.score)}`}>{t.score}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setControlDetail(null)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">Kapat</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Detail Modal */}
        {testDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
            <div className="w-full max-w-lg bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-violet-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Test Detayı</h3>
                </div>
                <button onClick={() => setTestDetail(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`text-[10px] ${getTestResultBadgeClass(testDetail.result)}`}>{testDetail.result}</Badge>
                  <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">Skor: {testDetail.score}</Badge>
                </div>
                <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Kontrol</p><p className="text-sm font-semibold text-slate-800">{testDetail.controlTitle}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Test Tarihi</p><p className="text-[12px] text-slate-700">{new Date(testDetail.testDate).toLocaleDateString('tr-TR')}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Tester</p><p className="text-[12px] text-slate-700">{testDetail.tester}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Bulgu Sayısı</p><p className="text-[12px] text-slate-700">{testDetail.findingsCount}</p></div>
                </div>
                <div><p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Notlar</p><p className="text-[12px] text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">{testDetail.notes || 'Not bulunmuyor.'}</p></div>
                {(() => {
                  const testFindings = getFindingsForTest(testDetail.id, findings)
                  if (testFindings.length === 0) return null
                  return (
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Bağlı Bulgular</p>
                      <div className="space-y-1.5">
                        {testFindings.map((f) => (
                          <div key={f.id} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                            <span className="text-[11px] text-slate-700">{f.findingNumber} · {f.title}</span>
                            <Badge className={`text-[9px] ${getFindingSeverityBadgeClass(f.severity)}`}>{f.severity}</Badge>
                            <Badge className={`text-[9px] ${getFindingStatusBadgeClass(f.status)}`}>{f.status}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setTestDetail(null)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">Kapat</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Finding Detail Modal */}
        {findingDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
            <div className="w-full max-w-lg bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileWarning size={18} className="text-rose-600" />
                  <h3 className="text-sm font-semibold text-slate-800">Bulgu Detayı</h3>
                </div>
                <button onClick={() => setFindingDetail(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={`text-[10px] ${getFindingSeverityBadgeClass(findingDetail.severity)}`}>{findingDetail.severity}</Badge>
                  <Badge className={`text-[10px] ${getFindingStatusBadgeClass(findingDetail.status)}`}>{findingDetail.status}</Badge>
                </div>
                <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Bulgu No</p><p className="text-sm font-semibold text-slate-800">{findingDetail.findingNumber}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Başlık</p><p className="text-sm font-semibold text-slate-800">{findingDetail.title}</p></div>
                <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Açıklama</p><p className="text-[12px] text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-3 border border-slate-100">{findingDetail.description}</p></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Sorumlu</p><p className="text-[12px] text-slate-700">{findingDetail.owner}</p></div>
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide">Son Tarih</p><p className="text-[12px] text-slate-700">{findingDetail.dueDate ? new Date(findingDetail.dueDate).toLocaleDateString('tr-TR') : '—'}</p></div>
                </div>
                {findingDetail.linkedCaseId && (
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Bağlı Case</p><Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{findingDetail.linkedCaseId}</Badge></div>
                )}
                {findingDetail.linkedTaskId && (
                  <div><p className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Bağlı Görev</p><Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{findingDetail.linkedTaskId}</Badge></div>
                )}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setFindingDetail(null)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">Kapat</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Board Report Modal */}
        {reportModalOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-950/20 p-4 overflow-y-auto">
            <div className="w-full max-w-4xl bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl my-8">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <FileBarChart size={18} className="text-slate-700" />
                  <h3 className="text-sm font-semibold text-slate-800">Yönetim Kurulu Raporu</h3>
                </div>
                <button onClick={() => setReportModalOpen(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
              </div>

              {/* Settings */}
              <div className="p-5 border-b border-slate-100 space-y-4">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Rapor Dönemi</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: '7days', label: 'Son 7 gün' },
                        { key: '30days', label: 'Son 30 gün' },
                        { key: 'month', label: 'Bu ay' },
                        { key: 'all', label: 'Tüm dönem' },
                      ].map((p) => (
                        <button key={p.key} onClick={() => setReportPeriod(p.key as any)} className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${reportPeriod === p.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{p.label}</button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold text-slate-700 uppercase tracking-wide">Dahil Edilecek Bölümler</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { key: 'summary', label: 'Özet' },
                        { key: 'riskMap', label: 'Risk Haritası' },
                        { key: 'criticalRegs', label: 'Kritik Düzenlemeler' },
                        { key: 'openTasks', label: 'Açık Görevler' },
                        { key: 'delayedTasks', label: 'Geciken Görevler' },
                        { key: 'opImpact', label: 'Operasyon Etkileri' },
                        { key: 'auditSummary', label: 'Denetim Özeti' },
                        { key: 'riskSummary', label: 'Kurumsal Risk' },
                        { key: 'policySummary', label: 'Politika Durumu' },
                        { key: 'controlSummary', label: 'Kontrol ve Test' },
                      ].map((s) => (
                        <button key={s.key} onClick={() => setReportSections((prev) => ({ ...prev, [s.key]: !prev[s.key as keyof typeof prev] }))} className={`text-[11px] px-3 py-1.5 rounded-full border transition-all ${reportSections[s.key as keyof typeof reportSections] ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}>{s.label}</button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { window.print(); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Rapor PDF olarak dışa aktarıldı', entityType: 'system', severity: 'info' }) }} className="inline-flex items-center gap-1 text-[11px] px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium">
                    <FileText size={13} /> Yazdır / PDF Kaydet
                  </button>
                  <p className="text-[10px] text-slate-400">PDF olarak kaydetmek için yazdır → PDF olarak kaydet seçin.</p>
                </div>
              </div>

              {/* HTML Preview */}
              <div id="board-report-preview" className="p-8 bg-white space-y-8 print:p-0">
                {(() => {
                  // Period filter
                  const now = new Date()
                  const periodStart = reportPeriod === '7days' ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) : reportPeriod === '30days' ? new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) : reportPeriod === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date('2000-01-01')
                  const filteredRecords = allArchiveRecords.filter((r) => { const d = new Date(r.isoDate || r.date || ''); return !isNaN(d.getTime()) && d >= periodStart })
                  const filteredTasks = tasks.filter((t) => { const d = new Date(t.createdAt || t.dueDate || ''); return !isNaN(d.getTime()) && d >= periodStart })
                  const totalRecords = filteredRecords.length
                  const spkCount = filteredRecords.filter((r) => r.authority !== 'BDDK').length
                  const bddkCount = filteredRecords.filter((r) => r.authority === 'BDDK').length
                  const openTasksCount = filteredTasks.filter((t) => t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length
                  const criticalRecords = filteredRecords.filter((r) => calculateRegulatoryRisk(r).level === 'critical').length
                  const delayedTasks = tasks.filter((t) => { if (!t.dueDate || t.status === 'Tamamlandı' || t.status === 'Ertelendi') return false; return new Date(t.dueDate) < new Date() })
                  const complianceScore = Math.max(0, Math.min(100, 100 - (criticalRecords * 3) - (delayedTasks.length * 5)))
                  const topRiskRecords = filteredRecords.filter((r) => ['high', 'critical'].includes(calculateRegulatoryRisk(r).level)).sort((a, b) => new Date(b.isoDate || b.date || '').getTime() - new Date(a.isoDate || a.date || '').getTime()).slice(0, 5)
                  const opAreas = filteredRecords.slice(0, 300).map((r) => calculateOperationalImpact(r))
                  const areaCounts: Record<string, number> = {}
                  opAreas.forEach((op) => op.areas.forEach((a) => areaCounts[a] = (areaCounts[a] || 0) + 1))
                  const top5Areas = Object.entries(areaCounts).sort((a, b) => b[1] - a[1]).slice(0, 5)
                  const auditLogs = getAuditLogs()
                  const recentLogs = auditLogs.filter((l) => { const d = new Date(l.timestamp); return !isNaN(d.getTime()) && d >= periodStart }).slice(0, 10)
                  const criticalLogs = recentLogs.filter((l) => l.severity === 'critical').length
                  const userLogs = recentLogs.filter((l) => l.entityType === 'user').length
                  const systemLogs = recentLogs.filter((l) => l.entityType === 'system').length

                  return (
                    <>
                      {/* A) Cover */}
                      <div className="text-center space-y-3 pb-8 border-b-2 border-slate-200">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-900 text-white mb-2">
                          <LayoutDashboard size={24} />
                        </div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">AKOP RegTech</h1>
                        <h2 className="text-xl font-semibold text-slate-600">Yönetim Kurulu Uyum Raporu</h2>
                        <div className="pt-2 space-y-1">
                          <p className="text-sm text-slate-500">Dönem: {reportPeriod === '7days' ? 'Son 7 Gün' : reportPeriod === '30days' ? 'Son 30 Gün' : reportPeriod === 'month' ? 'Bu Ay' : 'Tüm Dönem'}</p>
                          <p className="text-sm text-slate-500">Oluşturma Tarihi: {new Date().toLocaleDateString('tr-TR')}</p>
                          <p className="text-sm text-slate-500">Oluşturan: {currentUser?.name || '—'} ({currentUser?.role || '—'})</p>
                        </div>
                      </div>

                      {/* B) Executive Summary */}
                      {reportSections.summary && (
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-3">Yönetici Özeti</h3>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-slate-50 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase">Toplam Kayıt</p><p className="text-xl font-bold text-slate-900">{totalRecords.toLocaleString('tr-TR')}</p></div>
                            <div className="bg-slate-50 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase">SPK</p><p className="text-xl font-bold text-slate-900">{spkCount}</p></div>
                            <div className="bg-slate-50 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase">BDDK</p><p className="text-xl font-bold text-slate-900">{bddkCount}</p></div>
                            <div className="bg-slate-50 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase">Açık Görev</p><p className="text-xl font-bold text-slate-900">{openTasksCount}</p></div>
                            <div className="bg-slate-50 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase">Kritik Risk</p><p className="text-xl font-bold text-rose-600">{criticalRecords}</p></div>
                            <div className="bg-slate-50 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase">Geciken Görev</p><p className="text-xl font-bold text-amber-600">{delayedTasks.length}</p></div>
                            <div className="bg-slate-50 rounded-xl p-4"><p className="text-[10px] text-slate-500 uppercase">Uyum Skoru</p><p className="text-xl font-bold text-emerald-600">{complianceScore}</p></div>
                          </div>
                        </div>
                      )}

                      {/* C) Risk Map */}
                      {reportSections.riskMap && (
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-3">Risk Haritası</h3>
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead><tr className="border-b border-slate-200"><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Kurum</th><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Düşük</th><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Orta</th><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Yüksek</th><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Kritik</th></tr></thead>
                              <tbody>
                                {['SPK', 'BDDK', 'MASAK', 'Global'].map((inst) => {
                                  const counts = { low: 0, medium: 0, high: 0, critical: 0 } as Record<string, number>
                                  filteredRecords.forEach((r) => { const a = r.authority as string || 'SPK'; const auth = a === 'BDDK' ? 'BDDK' : a === 'MASAK' ? 'MASAK' : ['SEC','FCA','ESMA'].includes(a) ? 'Global' : 'SPK'; if (auth === inst) { const lvl = calculateRegulatoryRisk(r).level; counts[lvl] = (counts[lvl] || 0) + 1 } })
                                  return <tr key={inst} className="border-b border-slate-100"><td className="py-2 text-[11px] font-medium text-slate-700">{inst}</td><td className="py-2 text-[11px] text-emerald-600">{counts.low || '—'}</td><td className="py-2 text-[11px] text-amber-600">{counts.medium || '—'}</td><td className="py-2 text-[11px] text-orange-600">{counts.high || '—'}</td><td className="py-2 text-[11px] text-rose-600 font-semibold">{counts.critical || '—'}</td></tr>
                                })}
                              </tbody>
                            </table>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-2">* MASAK ve Global kayıtlar mevcut veri setinde sınırlı olabilir.</p>
                        </div>
                      )}

                      {/* D) Critical Regulations */}
                      {reportSections.criticalRegs && (
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-3">Kritik Düzenlemeler</h3>
                          {topRiskRecords.length === 0 ? <p className="text-[11px] text-slate-400">Kritik düzenleme bulunmuyor.</p> : (
                            <div className="space-y-2">
                              {topRiskRecords.map((r) => {
                                const risk = calculateRegulatoryRisk(r)
                                const op = calculateOperationalImpact(r)
                                return (
                                  <div key={r.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                                    <div className="mt-0.5 shrink-0"><AlertTriangle size={14} className={risk.level === 'critical' ? 'text-rose-600' : 'text-orange-600'} /></div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap"><Badge className={`text-[9px] ${getRiskBadgeClass(risk.level)}`}>{risk.label}</Badge><Badge variant="outline" className="text-[9px]">{r.authority || 'SPK'}</Badge></div>
                                      <p className="text-[11px] font-medium text-slate-800">{r.title}</p>
                                      <p className="text-[10px] text-slate-500">{r.isoDate || r.date || '—'} · {r.number || '—'}</p>
                                      {op.areas.length > 0 && <p className="text-[10px] text-slate-500">Etki: {op.areas.join(', ')}</p>}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* E) Open Tasks */}
                      {reportSections.openTasks && (
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-3">Açık Uyum Görevleri</h3>
                          {filteredTasks.filter((t) => t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').length === 0 ? <p className="text-[11px] text-slate-400">Açık görev bulunmuyor.</p> : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead><tr className="border-b border-slate-200"><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Görev</th><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Kurum</th><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Risk</th><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Sorumlu</th><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Durum</th><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Son Tarih</th></tr></thead>
                                <tbody>
                                  {filteredTasks.filter((t) => t.status !== 'Tamamlandı' && t.status !== 'Ertelendi').map((t) => (
                                    <tr key={t.id} className="border-b border-slate-100"><td className="py-2 text-[11px] font-medium text-slate-800">{t.title}</td><td className="py-2 text-[11px] text-slate-600">{t.authority || 'SPK'}</td><td className="py-2 text-[11px]"><span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ${t.riskLevel === 'Kritik' ? 'bg-rose-50 text-rose-700' : t.riskLevel === 'Yüksek' ? 'bg-orange-50 text-orange-700' : t.riskLevel === 'Orta' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>{t.riskLevel}</span></td><td className="py-2 text-[11px] text-slate-600">{t.assignedTo}</td><td className="py-2 text-[11px] text-slate-600">{t.status}</td><td className="py-2 text-[11px] text-slate-600">{t.dueDate}</td></tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* F) Delayed Tasks */}
                      {reportSections.delayedTasks && (
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-3">Geciken Görevler</h3>
                          {delayedTasks.length === 0 ? <p className="text-[11px] text-slate-400">Geciken görev bulunmuyor.</p> : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse">
                                <thead><tr className="border-b border-slate-200"><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Görev</th><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Sorumlu</th><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Son Tarih</th><th className="text-[10px] font-semibold text-slate-500 uppercase py-2">Gecikme</th></tr></thead>
                                <tbody>
                                  {delayedTasks.map((t) => {
                                    const overdueDays = Math.ceil((new Date().getTime() - new Date(t.dueDate!).getTime()) / (1000 * 60 * 60 * 24))
                                    return <tr key={t.id} className="border-b border-rose-100"><td className="py-2 text-[11px] font-medium text-rose-700">{t.title}</td><td className="py-2 text-[11px] text-slate-600">{t.assignedTo}</td><td className="py-2 text-[11px] text-slate-600">{t.dueDate}</td><td className="py-2 text-[11px] font-semibold text-rose-600">{overdueDays} gün</td></tr>
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* G) Operation Impact */}
                      {reportSections.opImpact && (
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-3">Operasyon Etkileri</h3>
                          {top5Areas.length === 0 ? <p className="text-[11px] text-slate-400">Operasyon etkisi bulunmuyor.</p> : (
                            <div className="space-y-2">
                              {top5Areas.map(([area, count]) => (
                                <div key={area} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                                  <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center text-violet-600"><Grid3x3 size={14} /></div>
                                  <div className="flex-1"><p className="text-[11px] font-medium text-slate-800">{area}</p><p className="text-[10px] text-slate-500">{count} kayıt etkisi</p></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* H) Audit Summary */}
                      {reportSections.auditSummary && (
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-3">Denetim Özeti</h3>
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-[10px] text-slate-500 uppercase">Kritik Olay</p><p className="text-lg font-bold text-rose-600">{criticalLogs}</p></div>
                            <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-[10px] text-slate-500 uppercase">Kullanıcı İşlemi</p><p className="text-lg font-bold text-blue-600">{userLogs}</p></div>
                            <div className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-[10px] text-slate-500 uppercase">Sistem Olayı</p><p className="text-lg font-bold text-slate-600">{systemLogs}</p></div>
                          </div>
                          {recentLogs.length === 0 ? <p className="text-[11px] text-slate-400">Denetim kaydı bulunmuyor.</p> : (
                            <div className="space-y-2">
                              {recentLogs.map((log) => (
                                <div key={log.id} className="flex items-start gap-2 rounded-lg border border-slate-100 p-2">
                                  <div className="mt-0.5 shrink-0">{log.severity === 'critical' ? <AlertTriangle size={12} className="text-rose-600" /> : log.severity === 'warning' ? <Bell size={12} className="text-amber-600" /> : <Check size={12} className="text-blue-600" />}</div>
                                  <div className="flex-1 min-w-0"><p className="text-[11px] text-slate-700">{log.action}</p><p className="text-[9px] text-slate-400">{log.userName} · {new Date(log.timestamp).toLocaleString('tr-TR')}</p></div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* I) Corporate Risk Summary */}
                      {reportSections.riskSummary && (
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-3">Kurumsal Risk Özeti</h3>
                          {(() => {
                            const rStats = getRiskStats(riskScores)
                            const topRisks = getTopRisks(riskScores, 5)
                            return (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="bg-rose-50 rounded-xl p-3 text-center"><p className="text-[10px] text-rose-500 uppercase">Kritik Risk</p><p className="text-xl font-bold text-rose-700">{rStats.critical}</p></div>
                                  <div className="bg-orange-50 rounded-xl p-3 text-center"><p className="text-[10px] text-orange-500 uppercase">Yüksek Risk</p><p className="text-xl font-bold text-orange-700">{rStats.high}</p></div>
                                  <div className="bg-amber-50 rounded-xl p-3 text-center"><p className="text-[10px] text-amber-500 uppercase">Ortalama Skor</p><p className="text-xl font-bold text-amber-700">{rStats.average}</p></div>
                                  <div className="bg-emerald-50 rounded-xl p-3 text-center"><p className="text-[10px] text-emerald-500 uppercase">Compliance</p><p className="text-xl font-bold text-emerald-700">{Math.round(riskScores.reduce((s, r) => s + r.complianceScore, 0) / (riskScores.length || 1))}</p></div>
                                </div>
                                <div className="space-y-2">
                                  {topRisks.map((r) => {
                                    const trend = getTrendIndicator(r.trend)
                                    const level = getRiskLevel(r.score)
                                    return (
                                      <div key={r.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                                        <div className="mt-0.5 shrink-0"><ShieldAlert size={14} className={level === 'Kritik' ? 'text-rose-600' : level === 'Yüksek' ? 'text-orange-600' : 'text-amber-600'} /></div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2 flex-wrap"><Badge className={`text-[9px] ${getRiskLevelBadgeClass(level)}`}>{level}</Badge><Badge variant="outline" className="text-[9px] text-slate-500 border-slate-200">{r.entityType}</Badge><span className={`text-[10px] font-semibold ${trend.color}`}>{trend.icon} {trend.label}</span></div>
                                          <p className="text-[11px] font-medium text-slate-800">{r.entityTitle}</p>
                                          <p className="text-[10px] text-slate-500">Skor: {r.score} · Etki: {r.impactScore} · Aciliyet: {r.urgencyScore} · Sorumlu: {r.responsible || '—'}</p>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {/* J) Policy Summary */}
                      {reportSections.policySummary && (
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-3">Politika ve Prosedür Durumu</h3>
                          {(() => {
                            const pStats = getPolicyStats(policies)
                            const pending = policies.filter((p) => p.status === 'Onay Bekliyor')
                            const revision = policies.filter((p) => p.status === 'Revizyon Gerekli')
                            const criticalPolicies = policies.filter((p) => p.riskLevel === 'Kritik')
                            return (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="bg-sky-50 rounded-xl p-3 text-center"><p className="text-[10px] text-sky-500 uppercase">Toplam Politika</p><p className="text-xl font-bold text-sky-700">{pStats.total}</p></div>
                                  <div className="bg-amber-50 rounded-xl p-3 text-center"><p className="text-[10px] text-amber-500 uppercase">Onay Bekleyen</p><p className="text-xl font-bold text-amber-700">{pStats.pendingApproval}</p></div>
                                  <div className="bg-rose-50 rounded-xl p-3 text-center"><p className="text-[10px] text-rose-500 uppercase">Revizyon Gereken</p><p className="text-xl font-bold text-rose-700">{pStats.needsRevision}</p></div>
                                  <div className="bg-violet-50 rounded-xl p-3 text-center"><p className="text-[10px] text-violet-500 uppercase">Yaklaşan Review</p><p className="text-xl font-bold text-violet-700">{pStats.upcomingReview}</p></div>
                                </div>
                                <div className="space-y-2">
                                  {pending.slice(0, 3).map((p) => (
                                    <div key={p.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                                      <div className="mt-0.5 shrink-0"><FileCheck size={14} className="text-amber-600" /></div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap"><Badge className={`text-[9px] ${getPolicyStatusBadgeClass(p.status)}`}>{p.status}</Badge><Badge className={`text-[9px] ${getPolicyRiskBadgeClass(p.riskLevel)}`}>{p.riskLevel}</Badge></div>
                                        <p className="text-[11px] font-medium text-slate-800">{p.title}</p>
                                        <p className="text-[10px] text-slate-500">{p.documentType} · {p.owner} · v{p.version}</p>
                                      </div>
                                    </div>
                                  ))}
                                  {revision.slice(0, 3).map((p) => (
                                    <div key={p.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                                      <div className="mt-0.5 shrink-0"><AlertTriangle size={14} className="text-rose-600" /></div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap"><Badge className={`text-[9px] ${getPolicyStatusBadgeClass(p.status)}`}>{p.status}</Badge><Badge className={`text-[9px] ${getPolicyRiskBadgeClass(p.riskLevel)}`}>{p.riskLevel}</Badge></div>
                                        <p className="text-[11px] font-medium text-slate-800">{p.title}</p>
                                        <p className="text-[10px] text-slate-500">{p.documentType} · {p.owner} · v{p.version}</p>
                                      </div>
                                    </div>
                                  ))}
                                  {criticalPolicies.slice(0, 2).map((p) => (
                                    <div key={p.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                                      <div className="mt-0.5 shrink-0"><ShieldAlert size={14} className="text-rose-600" /></div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap"><Badge className={`text-[9px] ${getPolicyStatusBadgeClass(p.status)}`}>{p.status}</Badge><Badge className={`text-[9px] ${getPolicyRiskBadgeClass(p.riskLevel)}`}>{p.riskLevel}</Badge></div>
                                        <p className="text-[11px] font-medium text-slate-800">{p.title}</p>
                                        <p className="text-[10px] text-slate-500">{p.documentType} · {p.owner} · v{p.version}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      {/* K) Control Summary */}
                      {reportSections.controlSummary && (
                        <div>
                          <h3 className="text-base font-bold text-slate-900 mb-3">Kontrol ve Test Durumu</h3>
                          {(() => {
                            const cStats = getControlStats(controls)
                            const tStats = getTestStats(controlTests)
                            const fStats = getFindingStats(findings)
                            const failedTests = controlTests.filter((t) => t.result === 'Failed')
                            const criticalFindings = findings.filter((f) => f.severity === 'Critical' && f.status !== 'Closed')
                            return (
                              <div className="space-y-3">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                  <div className="bg-indigo-50 rounded-xl p-3 text-center"><p className="text-[10px] text-indigo-500 uppercase">Toplam Kontrol</p><p className="text-xl font-bold text-indigo-700">{cStats.total}</p></div>
                                  <div className="bg-emerald-50 rounded-xl p-3 text-center"><p className="text-[10px] text-emerald-500 uppercase">Aktif Kontrol</p><p className="text-xl font-bold text-emerald-700">{cStats.active}</p></div>
                                  <div className="bg-rose-50 rounded-xl p-3 text-center"><p className="text-[10px] text-rose-500 uppercase">Başarısız Test</p><p className="text-xl font-bold text-rose-700">{tStats.failed}</p></div>
                                  <div className="bg-amber-50 rounded-xl p-3 text-center"><p className="text-[10px] text-amber-500 uppercase">Açık Bulgu</p><p className="text-xl font-bold text-amber-700">{fStats.open}</p></div>
                                </div>
                                <div className="space-y-2">
                                  {failedTests.slice(0, 3).map((t) => (
                                    <div key={t.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                                      <div className="mt-0.5 shrink-0"><AlertTriangle size={14} className="text-rose-600" /></div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap"><Badge className={`text-[9px] ${getTestResultBadgeClass(t.result)}`}>{t.result}</Badge><Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">Skor: {t.score}</Badge></div>
                                        <p className="text-[11px] font-medium text-slate-800">{t.controlTitle}</p>
                                        <p className="text-[10px] text-slate-500">{t.tester} · {new Date(t.testDate).toLocaleDateString('tr-TR')}</p>
                                      </div>
                                    </div>
                                  ))}
                                  {criticalFindings.slice(0, 3).map((f) => (
                                    <div key={f.id} className="flex items-start gap-3 rounded-xl border border-slate-100 p-3">
                                      <div className="mt-0.5 shrink-0"><AlertOctagon size={14} className="text-rose-600" /></div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap"><Badge className={`text-[9px] ${getFindingSeverityBadgeClass(f.severity)}`}>{f.severity}</Badge><Badge className={`text-[9px] ${getFindingStatusBadgeClass(f.status)}`}>{f.status}</Badge></div>
                                        <p className="text-[11px] font-medium text-slate-800">{f.title}</p>
                                        <p className="text-[10px] text-slate-500">{f.owner} · {f.dueDate ? new Date(f.dueDate).toLocaleDateString('tr-TR') : '—'}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })()}
                        </div>
                      )}

                      <div className="text-center text-[10px] text-slate-400 pt-6 border-t border-slate-200">
                        AKOP RegTech | Kurumsal Uyum ve Regülasyon Kontrol Merkezi | {new Date().toLocaleDateString('tr-TR')}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="space-y-6">
            {!timelineRecord ? (
              <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-10 text-center space-y-3">
                <GitBranch size={40} className="text-slate-300 mx-auto" />
                <p className="text-sm text-slate-800 font-semibold">Kayıt seçilmedi</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">SPK veya BDDK tablosundan "Timeline Görüntüle" ile bir kayıt seçin.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Timeline Header */}
                <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge className={`text-[10px] ${timelineRecord.authority === 'BDDK' ? 'bg-indigo-50 text-indigo-700 border-indigo-200/60' : 'bg-blue-50 text-blue-700 border-blue-200/60'}`}>{timelineRecord.authority || 'SPK'}</Badge>
                    <Badge variant="outline" className={`text-[10px] ${getCategoryBadgeClass(timelineRecord.sourceType === 'bulletin' ? 'Bülten' : timelineRecord.sourceType === 'press-release' ? 'Duyuru' : timelineRecord.category || 'Mevzuat')}`}>
                      {timelineRecord.sourceType === 'bulletin' ? 'Bülten' : timelineRecord.sourceType === 'legislation' ? (timelineRecord.category || 'Mevzuat') : timelineRecord.sourceType === 'bddk-announcement' ? 'Duyuru' : timelineRecord.sourceType === 'bddk-press-release' ? 'Basın' : timelineRecord.sourceType === 'bddk-decision' ? 'Karar' : timelineRecord.sourceType === 'bddk-regulation' ? 'Mevzuat' : 'Duyuru'}
                    </Badge>
                    <Badge className={`text-[10px] ${getRiskBadgeClass(calculateRegulatoryRisk(timelineRecord).level)}`}>{calculateRegulatoryRisk(timelineRecord).label}</Badge>
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{timelineRecord.title}</h2>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                    <span>{timelineRecord.isoDate || timelineRecord.date || '—'}</span>
                    <span>Numara: {timelineRecord.number || '—'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {calculateOperationalImpact(timelineRecord).areas.map((area) => (<Badge key={area} className="text-[10px] bg-slate-50 text-slate-700 border-slate-200/60">{area}</Badge>))}
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => { setWorkspaceRecord(timelineRecord); setWorkspaceAnalysis(null); setActiveTab('document'); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Timeline üzerinden belge açıldı', entityType: 'regulation', entityId: timelineRecord.id, entityTitle: timelineRecord.title, severity: 'info' }) }} className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">
                      <FileText size={13} /> Belge İncele
                    </button>
                    <button onClick={() => { setAiSelectedRecord(timelineRecord); setActiveTab('ai'); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Timeline üzerinden AI analiz açıldı', entityType: 'regulation', entityId: timelineRecord.id, entityTitle: timelineRecord.title, severity: 'info' }) }} className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">
                      <BrainCircuit size={13} /> AI Analiz Aç
                    </button>
                    {userPerms?.canCreateTask && (
                      <button onClick={() => { openTaskModal(timelineRecord); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Timeline üzerinden görev oluşturuldu', entityType: 'task', entityId: timelineRecord.id, entityTitle: timelineRecord.title, severity: 'info' }) }} className="inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium">
                      <Plus size={13} /> Görev Oluştur
                    </button>
                    )}
                  </div>
                </div>

                {/* Timeline Steps */}
                <div className="relative space-y-6 pl-6">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200 rounded-full" />
                  {(() => {
                    const risk = calculateRegulatoryRisk(timelineRecord)
                    const opImpact = calculateOperationalImpact(timelineRecord)
                    const autoKey = getAutoKey(timelineRecord.id)
                    const aiAnalysis = analysisByRecordId[autoKey]
                    const relatedTasks = tasks.filter((t) => t.regulationId === timelineRecord.id)
                    const docLogs = getAuditLogs().filter((l) => l.entityId === timelineRecord.id)
                    const completedTasks = relatedTasks.filter((t) => t.status === 'Tamamlandı').length
                    const totalRelated = relatedTasks.length
                    const completionRate = totalRelated > 0 ? Math.round((completedTasks / totalRelated) * 100) : 0

                    const steps = [
                      {
                        title: 'Yayımlandı',
                        icon: Landmark,
                        color: 'bg-blue-50 text-blue-700 border-blue-200/60',
                        dot: 'bg-blue-500',
                        content: `Kurum: ${timelineRecord.authority || 'SPK'}\nTür: ${timelineRecord.sourceType || 'Bülten'}\nTarih: ${timelineRecord.isoDate || timelineRecord.date || '—'}`,
                        active: true,
                      },
                      {
                        title: 'AKOP Tarafından İzlemeye Alındı',
                        icon: Database,
                        color: 'bg-slate-50 text-slate-700 border-slate-200/60',
                        dot: 'bg-slate-500',
                        content: `Sistem kaydı oluşturuldu.\nKayıt ID: ${timelineRecord.id.slice(0, 12)}...`,
                        active: true,
                      },
                      {
                        title: 'Risk Skoru Hesaplandı',
                        icon: AlertTriangle,
                        color: risk.level === 'critical' ? 'bg-rose-50 text-rose-700 border-rose-200/60' : risk.level === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200/60' : 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
                        dot: risk.level === 'critical' ? 'bg-rose-500' : risk.level === 'high' ? 'bg-orange-500' : 'bg-emerald-500',
                        content: `Risk Seviyesi: ${risk.label}\n${risk.reason}`,
                        active: true,
                      },
                      {
                        title: 'Operasyon Etkisi Çıkarıldı',
                        icon: Grid3x3,
                        color: opImpact.areas.length > 0 ? 'bg-violet-50 text-violet-700 border-violet-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/60',
                        dot: opImpact.areas.length > 0 ? 'bg-violet-500' : 'bg-slate-300',
                        content: opImpact.areas.length > 0 ? `Etkilenen alanlar: ${opImpact.areas.join(', ')}` : 'Operasyon etkisi tespit edilemedi.',
                        active: opImpact.areas.length > 0,
                      },
                      {
                        title: 'AI Analiz',
                        icon: BrainCircuit,
                        color: aiAnalysis && !aiAnalysis.loading ? 'bg-cyan-50 text-cyan-700 border-cyan-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60',
                        dot: aiAnalysis && !aiAnalysis.loading ? 'bg-cyan-500' : 'bg-amber-400',
                        content: aiAnalysis && !aiAnalysis.loading ? `AI analiz tamamlandı.\nEtki Seviyesi: ${aiAnalysis.impactLevel || 'Belirlenemedi'}\nKaynak: ${aiAnalysis.sourceBasis || 'AI'}` : 'Henüz analiz edilmedi.',
                        active: true,
                        action: !aiAnalysis || aiAnalysis.loading ? (
                          <button onClick={() => { handleAnalyze(timelineRecord); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Timeline üzerinden AI analiz başlatıldı', entityType: 'ai-analysis', entityId: timelineRecord.id, entityTitle: timelineRecord.title, severity: 'info' }) }} className="mt-2 inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">
                            <Sparkles size={13} /> AI Analiz Başlat
                          </button>
                        ) : null,
                      },
                      {
                        title: 'Uyum Görevi',
                        icon: ClipboardList,
                        color: relatedTasks.length > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-amber-50 text-amber-700 border-amber-200/60',
                        dot: relatedTasks.length > 0 ? 'bg-emerald-500' : 'bg-amber-400',
                        content: relatedTasks.length > 0 ? `${relatedTasks.length} görev oluşturuldu.\nSon durum: ${relatedTasks.map((t) => `${t.title} (${t.status})`).join(', ')}` : 'Henüz görev oluşturulmadı.',
                        active: true,
                        action: relatedTasks.length === 0 && userPerms?.canCreateTask ? (
                          <button onClick={() => { openTaskModal(timelineRecord); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Timeline üzerinden görev oluşturuldu', entityType: 'task', entityId: timelineRecord.id, entityTitle: timelineRecord.title, severity: 'info' }) }} className="mt-2 inline-flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium">
                            <Plus size={13} /> Görev Oluştur
                          </button>
                        ) : null,
                      },
                      {
                        title: 'Denetim İzi',
                        icon: Archive,
                        color: docLogs.length > 0 ? 'bg-slate-50 text-slate-700 border-slate-200/60' : 'bg-slate-50 text-slate-400 border-slate-200/60',
                        dot: docLogs.length > 0 ? 'bg-slate-500' : 'bg-slate-300',
                        content: docLogs.length > 0 ? `Bu kayda bağlı ${docLogs.length} denetim olayı.\nSon olaylar: ${docLogs.slice(0, 3).map((l) => l.action).join(', ')}` : 'Henüz denetim kaydı bulunmuyor.',
                        active: true,
                      },
                      {
                        title: 'Kapanış Durumu',
                        icon: CheckCircle,
                        color: completionRate === 100 && totalRelated > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : totalRelated > 0 ? 'bg-amber-50 text-amber-700 border-amber-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/60',
                        dot: completionRate === 100 && totalRelated > 0 ? 'bg-emerald-500' : totalRelated > 0 ? 'bg-amber-400' : 'bg-slate-300',
                        content: totalRelated > 0 ? `Tamamlanma oranı: %${completionRate} (${completedTasks}/${totalRelated})` : 'Henüz görev oluşturulmadı.',
                        active: true,
                        badge: completionRate === 100 && totalRelated > 0 ? 'Tamamlandı' : totalRelated > 0 ? 'Devam Ediyor' : 'Beklemede',
                      },
                    ]

                    return steps.map((step, idx) => (
                      <div key={idx} className="relative">
                        <div className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white ${step.dot} flex items-center justify-center z-10`}>
                          <step.icon size={10} className="text-white" />
                        </div>
                        <div className={`rounded-2xl border p-4 space-y-2 ${step.color}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold">{step.title}</p>
                              {step.badge && (
                                <Badge className={`text-[10px] ${step.badge === 'Tamamlandı' ? 'bg-emerald-100 text-emerald-800' : step.badge === 'Devam Ediyor' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>{step.badge}</Badge>
                              )}
                            </div>
                            <div className={`w-2 h-2 rounded-full ${step.active ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                          </div>
                          <p className="text-[12px] text-slate-700 leading-relaxed whitespace-pre-line">{step.content}</p>
                          {step.action}
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'copilot' && (
          <div className="space-y-6 max-h-[calc(100vh-180px)] flex flex-col">
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center gap-2 mb-1">
                <BrainCircuit size={18} className="text-violet-600" />
                <h2 className="text-sm font-semibold text-slate-800">AKOP Copilot</h2>
                <Badge className="text-[10px] bg-violet-50 text-violet-700 border-violet-200/60">AI Asistan</Badge>
              </div>
              <p className="text-[11px] text-slate-500">SPK/BDDK düzenlemeleri, uyum görevleri, risk ve operasyon analizi için sorularınızı sorun.</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 min-h-[300px]">
              {copilotMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 space-y-2 ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-white/90 border border-slate-200/70 text-slate-800'}`}>
                    <p className="text-[13px] leading-relaxed whitespace-pre-line">{msg.text}</p>
                    {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100/50">
                        {msg.actions.map((action, aIdx) => (
                          <button key={aIdx} onClick={() => handleCopilotAction(action)} className="text-[11px] px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">
                            {action.label}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className={`text-[9px] ${msg.role === 'user' ? 'text-slate-400' : 'text-slate-400'}`}>{new Date(msg.timestamp).toLocaleTimeString('tr-TR')}</p>
                  </div>
                </div>
              ))}
              {copilotLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin text-violet-500" />
                      <p className="text-[12px] text-slate-500">AKOP Copilot düşünüyor...</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Questions */}
            <div className="flex flex-wrap gap-2">
              {[
                'Son 7 günde en kritik düzenlemeler neler?',
                'Açık kritik görevleri listele',
                'Geciken görevler kimde?',
                'Toplam kayıt sayısı nedir?',
                'Yönetici için kısa özet hazırla',
                'Bugünkü kritik mutabakat farkları neler?',
                'SLA aşımı olan mutabakatları göster',
                'Bugünkü kritik Takasbank uyarıları neler?',
                'Margin çağrıları var mı?',
                'Bekleyen onaylar neler?',
                'Bana atanmış onay var mı?',
                'Açık vakalar neler?',
                'Kritik vakaları göster',
                'En yüksek riskli case hangisi?',
                'Bekleyen workflow\'lar neler?',
                'SLA aşan onaylar hangileri?',
                'Kritik workflow\'ları göster',
                'Son güvenlik olayları neler?',
                'MFA pasif kullanıcı var mı?',
                'Başarısız giriş denemelerini göster',
                'Kritik güvenlik olayı var mı?',
                'Açık yükümlülükler neler?',
                'Kritik yükümlülükleri göster',
                'Geciken yükümlülükler hangileri?',
                'En yüksek riskli yükümlülük hangisi?',
                'Genel yükümlülük durumu nedir?',
                'Eksik kanıtlı yükümlülükler neler?',
                'Restricted dokümanları göster',
                'Onay bekleyen kanıtlar var mı?',
                'Bu ay eklenen kanıtlar neler?',
                'SPK yükümlülüklerine bağlı kanıtlar neler?',
                'Genel kanıt durumu nedir?',
                'Son mevzuat değişiklikleri neler?',
                'Kritik değişiklikler hangileri?',
                'Hangi yükümlülükler etkilenmiş?',
                'Bu değişiklik için hangi görevler açılmalı?',
                'Önerilen yükümlülükleri göster',
                'SPK değişikliklerini özetle',
                'Kritik bildirimler neler?',
                'SLA uyarıları var mı?',
                'Okunmamış bildirimlerim neler?',
                'Bugün hangi uyarılar oluştu?',
                'Güvenlik bildirimleri var mı?',
                'Son veri güncellemeleri neler?',
                'Hangi kaynak hata veriyor?',
                'SPK en son ne zaman güncellendi?',
                'Bugün kaç yeni düzenleme geldi?',
                'Başarısız senkronizasyon var mı?',
                'En riskli alanlar neler?',
                'Kritik riskleri göster',
                'Riski artan kayıtlar hangileri?',
                'Hangi yükümlülükler öncelikli?',
                'Bu ay risk trendi nasıl?',
                'Onay bekleyen politikalar neler?',
                'Revizyon gereken politikalar var mı?',
                'Kritik politikalar hangileri?',
                'Bu ay gözden geçirilmesi gereken politikalar neler?',
                'Politika durumunu özetle',
                'Açık bulgular neler?',
                'Kritik bulgular hangileri?',
                'Başarısız testleri göster',
                'En riskli kontroller hangileri?',
                'Bu ay kaç test başarısız?',
                'Kontrol durumunu özetle',
              ].map((q) => (
                <button key={q} onClick={() => { setCopilotInput(q) }} className="text-[10px] px-3 py-1.5 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                  {q}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-2">
              <input
                type="text"
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCopilotAsk() }}
                placeholder="Bir soru sorun..."
                className="flex-1 text-[13px] rounded-xl border-0 px-3 py-2 bg-transparent outline-none text-slate-800 placeholder:text-slate-400"
              />
              <button
                onClick={handleCopilotAsk}
                disabled={copilotLoading || !copilotInput.trim()}
                className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-4 py-2 text-[11px] font-semibold text-white hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {copilotLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                Gönder
              </button>
            </div>
          </div>
        )}

        {activeTab === 'reconciliation' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Database size={18} className="text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-800">MKK Mutabakat Merkezi</h2>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              <p className="text-[11px] text-slate-500">MKK saklama, pozisyon, nakit ve işlem mutabakatlarının merkezi kontrol alanı.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const stats = getReconciliationStats(reconciliationRecords)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Toplam</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Başarılı</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.successful}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Uyuşmazlık</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.discrepancy}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Kritik Fark</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.critical}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Bekleyen</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.pendingReview}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">SLA Aşımı</p>
                    <p className="text-2xl font-bold text-violet-600">{stats.slaBreach}</p>
                  </div>
                </div>
              )
            })()}

            {/* Reconciliation Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { type: 'Pozisyon' as ReconciliationType, desc: 'MKK pozisyonları / kurum içi pozisyonlar / fark adedi ve tutar', icon: Grid3x3 },
                { type: 'Nakit' as ReconciliationType, desc: 'Nakit bakiye / kurum içi bakiye / fark analizi', icon: Landmark },
                { type: 'Saklama' as ReconciliationType, desc: 'Kıymet bazlı saklama / ISIN bazlı farklar', icon: Database },
                { type: 'İşlem' as ReconciliationType, desc: 'Emir / işlem / takas sonrası kayıt eşleşmeleri', icon: ClipboardList },
                { type: 'T+1/T+2' as ReconciliationType, desc: 'Valör uyumu / settlement status kontrolleri', icon: Calendar },
              ].map((card) => {
                const count = reconciliationRecords.filter((r) => r.type === card.type).length
                const openCount = reconciliationRecords.filter((r) => r.type === card.type && r.status !== 'Kapandı').length
                return (
                  <div key={card.type} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 space-y-2 hover:shadow-md transition-all cursor-pointer" onClick={() => setReconFilterType(card.type)}>
                    <div className="flex items-center gap-2">
                      <card.icon size={16} className="text-slate-600" />
                      <h3 className="text-sm font-semibold text-slate-800">{card.type}</h3>
                    </div>
                    <p className="text-[10px] text-slate-500">{card.desc}</p>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-600 font-medium">{count} kayıt</span>
                      {openCount > 0 && <Badge className="text-[9px] bg-amber-50 text-amber-700 border-amber-200/60">{openCount} açık</Badge>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={reconSearch}
                onChange={(e) => setReconSearch(e.target.value)}
                placeholder="Ara (müşteri, ISIN, hesap...)"
                className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full md:w-64"
              />
              <select value={reconFilterType} onChange={(e) => setReconFilterType(e.target.value as ReconciliationType | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Türler</option>
                <option value="Pozisyon">Pozisyon</option>
                <option value="Nakit">Nakit</option>
                <option value="Saklama">Saklama</option>
                <option value="İşlem">İşlem</option>
                <option value="T+1/T+2">T+1/T+2</option>
              </select>
              <select value={reconFilterStatus} onChange={(e) => setReconFilterStatus(e.target.value as ReconciliationStatus | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Durumlar</option>
                <option value="Açık">Açık</option>
                <option value="İncelemede">İncelemede</option>
                <option value="Düzeltme Bekliyor">Düzeltme Bekliyor</option>
                <option value="Onay Bekliyor">Onay Bekliyor</option>
                <option value="Kapandı">Kapandı</option>
              </select>
              <select value={reconFilterRisk} onChange={(e) => setReconFilterRisk(e.target.value as ReconciliationRisk | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Riskler</option>
                <option value="Kritik">Kritik</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Orta">Orta</option>
                <option value="Düşük">Düşük</option>
              </select>
              <button onClick={() => { setReconFilterType('all'); setReconFilterStatus('all'); setReconFilterRisk('all'); setReconSearch('') }} className="inline-flex items-center gap-1 text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                <FilterX size={12} /> Sıfırla
              </button>
            </div>

            {/* Discrepancy Table */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">ID</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Tür</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Müşteri / Hesap</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">ISIN / Kıymet</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">MKK</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Kurum</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Fark</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Risk</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Durum</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Sorumlu</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = reconciliationRecords.filter((r) => {
                      if (reconFilterType !== 'all' && r.type !== reconFilterType) return false
                      if (reconFilterStatus !== 'all' && r.status !== reconFilterStatus) return false
                      if (reconFilterRisk !== 'all' && r.risk !== reconFilterRisk) return false
                      if (reconSearch) {
                        const s = reconSearch.toLowerCase()
                        const text = `${r.id} ${r.customer || ''} ${r.account || ''} ${r.isin || ''} ${r.securityName || ''} ${r.responsible}`.toLowerCase()
                        if (!text.includes(s)) return false
                      }
                      return true
                    })
                    if (filtered.length === 0) {
                      return <tr><td colSpan={11} className="px-4 py-8 text-center text-[11px] text-slate-400">Kayıt bulunmuyor.</td></tr>
                    }
                    return filtered.map((r) => (
                      <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-mono text-slate-600">{r.id}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{r.type}</Badge></td>
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-medium text-slate-800">{r.customer}</p>
                          <p className="text-[9px] text-slate-400 font-mono">{r.account}</p>
                        </td>
                        <td className="px-4 py-3">
                          {r.isin && <p className="text-[10px] font-mono text-slate-600">{r.isin}</p>}
                          {r.securityName && <p className="text-[9px] text-slate-500">{r.securityName}</p>}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-slate-700">{typeof r.mkkValue === 'number' ? r.mkkValue.toLocaleString('tr-TR') : r.mkkValue} {r.currency}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-700">{typeof r.institutionValue === 'number' ? r.institutionValue.toLocaleString('tr-TR') : r.institutionValue} {r.currency}</td>
                        <td className="px-4 py-3 text-[11px] font-semibold">{r.difference !== 0 ? <span className={r.difference > 0 ? 'text-rose-600' : 'text-emerald-600'}>{r.difference > 0 ? '+' : ''}{r.difference.toLocaleString('tr-TR')}</span> : <span className="text-emerald-600">0</span>}</td>
                        <td className="px-4 py-3"><Badge className={`text-[9px] ${getReconRiskBadgeClass(r.risk)}`}>{r.risk}</Badge></td>
                        <td className="px-4 py-3"><Badge className={`text-[9px] ${getReconStatusBadgeClass(r.status)}`}>{r.status}</Badge></td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">{r.responsible}</td>
                        <td className="px-4 py-3">
                          <div className="relative" ref={reconOpenDropdownId === r.id ? reconDropdownRef : undefined}>
                            <button onClick={() => setReconOpenDropdownId(reconOpenDropdownId === r.id ? null : r.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
                              <MoreVertical size={13} />
                            </button>
                            {reconOpenDropdownId === r.id && (
                              <div className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-slate-200/70 bg-white shadow-lg p-1.5 space-y-0.5">
                                <button type="button" onClick={() => { setReconOpenDropdownId(null); setReconDetailRecord(r); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Mutabakat detayı görüntülendi', entityType: 'reconciliation', entityId: r.id, entityTitle: r.type + ' - ' + (r.customer || ''), severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg">
                                  <Eye size={13} className="text-blue-600" /> Detay Gör
                                </button>
                                <button type="button" onClick={() => { setReconOpenDropdownId(null); openTaskModal(undefined, r.type + ' Mutabakat: ' + (r.customer || r.id), r.risk === 'Kritik' ? 'Kritik' : r.risk === 'Yüksek' ? 'Yüksek' : 'Orta', r.notes || ''); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Mutabakat için görev oluşturuldu', entityType: 'reconciliation', entityId: r.id, entityTitle: r.type + ' - ' + (r.customer || ''), severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg">
                                  <ClipboardList size={13} className="text-violet-600" /> Görev Oluştur
                                </button>
                                <button type="button" onClick={() => { setReconOpenDropdownId(null); const newReq = createApprovalRequest({ sourceModule: 'MKK_MUTABAKAT', sourceId: r.id, sourceTitle: r.type + ' - ' + (r.customer || r.id), requestType: r.status === 'Kapandı' ? 'Kapanış Onayı' : 'Düzeltme Onayı', requestedBy: currentUser?.name || 'Sistem', requestedByRole: currentUser?.role || 'Sistem', assignedApprover: 'Yönetici', approverRole: 'Yönetici', riskLevel: r.risk, priority: r.risk === 'Kritik' ? 'Kritik' : r.risk === 'Yüksek' ? 'Yüksek' : 'Orta', notes: r.notes || '' }); if (newReq) setApprovalRequests((prev) => [newReq, ...prev]); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Onay talebi oluşturuldu', entityType: 'reconciliation', entityId: r.id, entityTitle: r.type + ' - ' + (r.customer || ''), severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg">
                                  <Check size={13} className="text-emerald-600" /> Onaya Gönder
                                </button>
                                <button type="button" onClick={() => { setReconOpenDropdownId(null); createCase({ title: r.type + ' - ' + (r.customer || r.id), description: r.notes || r.type + ' mutabakat farkı', sourceModule: 'MKK_MUTABAKAT', sourceId: r.id, status: 'Açık', priority: r.risk === 'Kritik' ? 'Kritik' : r.risk === 'Yüksek' ? 'Yüksek' : 'Orta', riskLevel: r.risk, assignedTo: r.responsible, owner: currentUser?.name || 'Sistem', tags: ['MKK', r.type], relatedTasks: [], relatedApprovals: [], relatedDocuments: [] }); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Case oluşturuldu', entityType: 'reconciliation', entityId: r.id, entityTitle: r.type + ' - ' + (r.customer || ''), severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg">
                                  <BriefcaseBusiness size={13} className="text-indigo-500" /> Case Oluştur
                                </button>
                                <button type="button" onClick={() => { setReconOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Düzeltme talebi açıldı', entityType: 'reconciliation', entityId: r.id, entityTitle: r.type + ' - ' + (r.customer || ''), severity: 'warning' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg">
                                  <RefreshCw size={13} className="text-amber-600" /> Düzeltme Talebi Aç
                                </button>
                                <button type="button" onClick={() => { setReconOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Kapandı işaretlendi', entityType: 'reconciliation', entityId: r.id, entityTitle: r.type + ' - ' + (r.customer || ''), severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg">
                                  <CheckCircle size={13} className="text-emerald-600" /> Kapandı İşaretle
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reconciliation Detail Drawer */}
        {reconDetailRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
            <div className="w-full max-w-lg bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Mutabakat Detayı</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{reconDetailRecord.id}</p>
                </div>
                <button onClick={() => setReconDetailRecord(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-[10px] ${getReconRiskBadgeClass(reconDetailRecord.risk)}`}>{reconDetailRecord.risk}</Badge>
                  <Badge className={`text-[10px] ${getReconStatusBadgeClass(reconDetailRecord.status)}`}>{reconDetailRecord.status}</Badge>
                  <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{reconDetailRecord.type}</Badge>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <p className="text-[11px] font-medium text-slate-800">{reconDetailRecord.customer}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{reconDetailRecord.account}</p>
                  {reconDetailRecord.isin && <p className="text-[10px] text-slate-500 font-mono">ISIN: {reconDetailRecord.isin}</p>}
                  {reconDetailRecord.securityName && <p className="text-[10px] text-slate-500">Kıymet: {reconDetailRecord.securityName}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-blue-500 uppercase">MKK Değeri</p>
                    <p className="text-lg font-bold text-blue-700">{typeof reconDetailRecord.mkkValue === 'number' ? reconDetailRecord.mkkValue.toLocaleString('tr-TR') : reconDetailRecord.mkkValue} {reconDetailRecord.currency}</p>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-violet-500 uppercase">Kurum Değeri</p>
                    <p className="text-lg font-bold text-violet-700">{typeof reconDetailRecord.institutionValue === 'number' ? reconDetailRecord.institutionValue.toLocaleString('tr-TR') : reconDetailRecord.institutionValue} {reconDetailRecord.currency}</p>
                  </div>
                </div>
                <div className="bg-rose-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-rose-500 uppercase">Fark</p>
                  <p className="text-lg font-bold text-rose-700">{reconDetailRecord.difference > 0 ? '+' : ''}{reconDetailRecord.difference.toLocaleString('tr-TR')} {reconDetailRecord.currency}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Sorumlu</p>
                  <p className="text-[11px] text-slate-700">{reconDetailRecord.responsible}</p>
                </div>
                {reconDetailRecord.slaDate && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">SLA Tarihi</p>
                    <p className="text-[11px] text-slate-700">{reconDetailRecord.slaDate}</p>
                  </div>
                )}
                {reconDetailRecord.notes && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Notlar</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{reconDetailRecord.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setReconDetailRecord(null)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">Kapat</button>
                <button onClick={() => { const rec = reconDetailRecord; setReconDetailRecord(null); openTaskModal(undefined, rec.type + ' Mutabakat: ' + (rec.customer || rec.id), rec.risk === 'Kritik' ? 'Kritik' : rec.risk === 'Yüksek' ? 'Yüksek' : 'Orta', rec.notes || ''); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Detaydan görev oluşturuldu', entityType: 'reconciliation', entityId: rec.id, entityTitle: rec.type + ' - ' + (rec.customer || ''), severity: 'info' }) }} className="inline-flex items-center gap-1 text-[11px] px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium">
                  <ClipboardList size={13} /> Görev Oluştur
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'takasbank' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-800">Takasbank İzleme Merkezi</h2>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Teminat, margin çağrıları, takas başarısızlıkları, limit kullanımı ve settlement risklerinin merkezi takibi.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const stats = getTakasbankStats(takasbankAlerts)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Toplam Kayıt</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Başarılı Takas</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.successful}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Başarısız Takas</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.failed}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Margin Çağrısı</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.marginCalls}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Limit Aşımı</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.limitBreach}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Kritik Uyarı</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.critical}</p>
                  </div>
                </div>
              )
            })()}

            {/* Monitor Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { type: 'Teminat Açığı' as TakasbankAlertType, desc: 'Toplam teminat / kullanılabilir teminat / teminat açığı / risk durumu', icon: ShieldCheck },
                { type: 'Margin Çağrısı' as TakasbankAlertType, desc: 'Açık margin çağrısı / kapanan çağrı / son çağrı zamanı', icon: Bell },
                { type: 'Takas Başarısızlığı' as TakasbankAlertType, desc: 'Başarılı / bekleyen / başarısız takas durumu', icon: RefreshCw },
                { type: 'Limit Aşımı' as TakasbankAlertType, desc: 'Toplam limit / kullanılan limit / kullanım oranı', icon: Activity },
                { type: 'Settlement Gecikmesi' as TakasbankAlertType, desc: 'T+1 / T+2 / geciken settlement kontrolleri', icon: Clock },
              ].map((card) => {
                const count = takasbankAlerts.filter((a) => a.type === card.type).length
                const openCount = takasbankAlerts.filter((a) => a.type === card.type && a.status !== 'Kapandı').length
                return (
                  <div key={card.type} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 space-y-2 hover:shadow-md transition-all cursor-pointer" onClick={() => setTakasFilterType(card.type)}>
                    <div className="flex items-center gap-2">
                      <card.icon size={16} className="text-slate-600" />
                      <h3 className="text-sm font-semibold text-slate-800">{card.type}</h3>
                    </div>
                    <p className="text-[10px] text-slate-500">{card.desc}</p>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="text-slate-600 font-medium">{count} kayıt</span>
                      {openCount > 0 && <Badge className="text-[9px] bg-amber-50 text-amber-700 border-amber-200/60">{openCount} açık</Badge>}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input type="text" value={takasSearch} onChange={(e) => setTakasSearch(e.target.value)} placeholder="Ara (üye, hesap, ISIN...)" className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full md:w-64" />
              <select value={takasFilterType} onChange={(e) => setTakasFilterType(e.target.value as TakasbankAlertType | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Türler</option>
                <option value="Teminat Açığı">Teminat Açığı</option>
                <option value="Margin Çağrısı">Margin Çağrısı</option>
                <option value="Limit Aşımı">Limit Aşımı</option>
                <option value="Takas Başarısızlığı">Takas Başarısızlığı</option>
                <option value="Settlement Gecikmesi">Settlement Gecikmesi</option>
                <option value="Nakit Blokaj">Nakit Blokaj</option>
              </select>
              <select value={takasFilterStatus} onChange={(e) => setTakasFilterStatus(e.target.value as TakasbankAlertStatus | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Durumlar</option>
                <option value="Açık">Açık</option>
                <option value="İncelemede">İncelemede</option>
                <option value="Aksiyon Bekliyor">Aksiyon Bekliyor</option>
                <option value="Onay Bekliyor">Onay Bekliyor</option>
                <option value="Kapandı">Kapandı</option>
              </select>
              <select value={takasFilterRisk} onChange={(e) => setTakasFilterRisk(e.target.value as TakasbankAlertRisk | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Riskler</option>
                <option value="Kritik">Kritik</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Orta">Orta</option>
                <option value="Düşük">Düşük</option>
              </select>
              <button onClick={() => { setTakasFilterType('all'); setTakasFilterStatus('all'); setTakasFilterRisk('all'); setTakasSearch('') }} className="inline-flex items-center gap-1 text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><FilterX size={12} /> Sıfırla</button>
            </div>

            {/* Alert Table */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">ID</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Tür</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Hesap / Üye</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Kıymet / ISIN</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Tutar</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Risk</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Durum</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">SLA</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Sorumlu</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = takasbankAlerts.filter((a) => {
                      if (takasFilterType !== 'all' && a.type !== takasFilterType) return false
                      if (takasFilterStatus !== 'all' && a.status !== takasFilterStatus) return false
                      if (takasFilterRisk !== 'all' && a.risk !== takasFilterRisk) return false
                      if (takasSearch) {
                        const s = takasSearch.toLowerCase()
                        const text = `${a.id} ${a.member || ''} ${a.account || ''} ${a.isin || ''} ${a.securityName || ''} ${a.responsible}`.toLowerCase()
                        if (!text.includes(s)) return false
                      }
                      return true
                    })
                    if (filtered.length === 0) {
                      return <tr><td colSpan={10} className="px-4 py-8 text-center text-[11px] text-slate-400">Kayıt bulunmuyor.</td></tr>
                    }
                    return filtered.map((a) => (
                      <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-mono text-slate-600">{a.id}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{a.type}</Badge></td>
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-medium text-slate-800">{a.member}</p>
                          <p className="text-[9px] text-slate-400 font-mono">{a.account}</p>
                        </td>
                        <td className="px-4 py-3">
                          {a.isin && <p className="text-[10px] font-mono text-slate-600">{a.isin}</p>}
                          {a.securityName && <p className="text-[9px] text-slate-500">{a.securityName}</p>}
                        </td>
                        <td className="px-4 py-3 text-[11px] font-semibold text-slate-700">{a.amount.toLocaleString('tr-TR')} {a.currency}</td>
                        <td className="px-4 py-3"><Badge className={`text-[9px] ${getTakasbankRiskBadgeClass(a.risk)}`}>{a.risk}</Badge></td>
                        <td className="px-4 py-3"><Badge className={`text-[9px] ${getTakasbankStatusBadgeClass(a.status)}`}>{a.status}</Badge></td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">{a.slaDate || '—'}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">{a.responsible}</td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button onClick={() => setTakasOpenDropdownId(takasOpenDropdownId === a.id ? null : a.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><MoreVertical size={13} /></button>
                            {takasOpenDropdownId === a.id && (
                              <div className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-slate-200/70 bg-white shadow-lg p-1.5 space-y-0.5">
                                <button type="button" onClick={() => { setTakasOpenDropdownId(null); setTakasDetailAlert(a); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Takasbank uyarı detayı görüntülendi', entityType: 'takasbank', entityId: a.id, entityTitle: a.type + ' - ' + (a.member || ''), severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><Eye size={13} className="text-blue-600" /> Detay Gör</button>
                                <button type="button" onClick={() => { setTakasOpenDropdownId(null); openTaskModal(undefined, a.type + ': ' + (a.member || a.id), a.risk === 'Kritik' ? 'Kritik' : a.risk === 'Yüksek' ? 'Yüksek' : 'Orta', a.notes || ''); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Takasbank uyarısından görev oluşturuldu', entityType: 'takasbank', entityId: a.id, entityTitle: a.type + ' - ' + (a.member || ''), severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><ClipboardList size={13} className="text-violet-600" /> Görev Oluştur</button>
                                <button type="button" onClick={() => { setTakasOpenDropdownId(null); const newReq = createApprovalRequest({ sourceModule: 'TAKASBANK', sourceId: a.id, sourceTitle: a.type + ' - ' + (a.member || a.id), requestType: a.status === 'Kapandı' ? 'Kapanış Onayı' : 'Risk Değişikliği', requestedBy: currentUser?.name || 'Sistem', requestedByRole: currentUser?.role || 'Sistem', assignedApprover: 'Yönetici', approverRole: 'Yönetici', riskLevel: a.risk, priority: a.risk === 'Kritik' ? 'Kritik' : a.risk === 'Yüksek' ? 'Yüksek' : 'Orta', notes: a.notes || '' }); if (newReq) setApprovalRequests((prev) => [newReq, ...prev]); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Onay talebi oluşturuldu', entityType: 'takasbank', entityId: a.id, entityTitle: a.type + ' - ' + (a.member || ''), severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><Check size={13} className="text-emerald-600" /> Onaya Gönder</button>
                                <button type="button" onClick={() => { setTakasOpenDropdownId(null); createCase({ title: a.type + ' - ' + (a.member || a.id), description: a.notes || a.type + ' uyarısı', sourceModule: 'TAKASBANK', sourceId: a.id, status: 'Açık', priority: a.risk === 'Kritik' ? 'Kritik' : a.risk === 'Yüksek' ? 'Yüksek' : 'Orta', riskLevel: a.risk, assignedTo: a.responsible, owner: currentUser?.name || 'Sistem', tags: ['Takasbank', a.type], relatedTasks: [], relatedApprovals: [], relatedDocuments: [] }); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Case oluşturuldu', entityType: 'takasbank', entityId: a.id, entityTitle: a.type + ' - ' + (a.member || ''), severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><BriefcaseBusiness size={13} className="text-indigo-500" /> Case Oluştur</button>
                                <button type="button" onClick={() => { setTakasOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Düzeltme talebi açıldı', entityType: 'takasbank', entityId: a.id, entityTitle: a.type + ' - ' + (a.member || ''), severity: 'warning' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><RefreshCw size={13} className="text-amber-600" /> Düzeltme Talebi Aç</button>
                                <button type="button" onClick={() => { setTakasOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Kapandı işaretlendi', entityType: 'takasbank', entityId: a.id, entityTitle: a.type + ' - ' + (a.member || ''), severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><CheckCircle size={13} className="text-emerald-600" /> Kapandı İşaretle</button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'approval' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ClipboardCheck size={18} className="text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-800">Onay Merkezi</h2>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Görev, mutabakat farkı, Takasbank uyarısı ve regülasyon aksiyonları için kurumsal onay akışı.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const stats = getApprovalStats(approvalRequests)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Bekleyen</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.pending}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Onaylanan</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Reddedilen</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.rejected}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Revizyon</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.revision}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Kritik</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.critical}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">SLA Aşımı</p>
                    <p className="text-2xl font-bold text-violet-600">{stats.slaBreach}</p>
                  </div>
                </div>
              )
            })()}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input type="text" value={approvalSearch} onChange={(e) => setApprovalSearch(e.target.value)} placeholder="Ara (kaynak, talep eden, onaycı...)" className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full md:w-64" />
              <select value={approvalFilterStatus} onChange={(e) => setApprovalFilterStatus(e.target.value as ApprovalStatus | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Durumlar</option>
                <option value="Beklemede">Beklemede</option>
                <option value="Onaylandı">Onaylandı</option>
                <option value="Reddedildi">Reddedildi</option>
                <option value="Revizyon İstendi">Revizyon İstendi</option>
              </select>
              <select value={approvalFilterPriority} onChange={(e) => setApprovalFilterPriority(e.target.value as ApprovalPriority | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Öncelikler</option>
                <option value="Kritik">Kritik</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Orta">Orta</option>
                <option value="Düşük">Düşük</option>
              </select>
              <button onClick={() => setApprovalFilterMine(!approvalFilterMine)} className={`inline-flex items-center gap-1 text-[11px] px-3 py-2 rounded-xl border ${approvalFilterMine ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 bg-white text-slate-600'} hover:bg-slate-50`}><UserCircle size={12} /> {approvalFilterMine ? 'Bana Atanan' : 'Tümü'}</button>
              <button onClick={() => { setApprovalFilterStatus('all'); setApprovalFilterPriority('all'); setApprovalFilterMine(false); setApprovalSearch('') }} className="inline-flex items-center gap-1 text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><FilterX size={12} /> Sıfırla</button>
            </div>

            {/* Approval Table */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Talep</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Kaynak</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Tür</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Risk</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Öncelik</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Talep Eden</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Onaycı</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Durum</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Aşama</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">İlerleme</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Tarih</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = approvalRequests.filter((a) => {
                      if (approvalFilterStatus !== 'all' && a.status !== approvalFilterStatus) return false
                      if (approvalFilterPriority !== 'all' && a.priority !== approvalFilterPriority) return false
                      if (approvalFilterMine) {
                        const myName = currentUser?.name || ''
                        const isApprover = a.assignedApprover === myName || a.assignedApprover === 'Yönetici' && currentUser?.role === 'Yönetici'
                        if (!isApprover) return false
                      }
                      if (approvalSearch) {
                        const s = approvalSearch.toLowerCase()
                        const text = `${a.sourceTitle} ${a.requestedBy} ${a.assignedApprover} ${a.requestType} ${a.sourceModule}`.toLowerCase()
                        if (!text.includes(s)) return false
                      }
                      return true
                    })
                    if (filtered.length === 0) {
                      return <tr><td colSpan={12} className="px-4 py-8 text-center text-[11px] text-slate-400">Onay talebi bulunmuyor.</td></tr>
                    }
                    return filtered.map((a) => {
                      const progress = a.totalStages ? getWorkflowProgress(a) : 0
                      const slaBreached = a.slaDeadline ? new Date() > new Date(a.slaDeadline) : false
                      return (
                        <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-[11px] font-medium text-slate-800">{a.sourceTitle}</p>
                            <p className="text-[9px] text-slate-400 font-mono">{a.id}</p>
                          </td>
                          <td className="px-4 py-3"><Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{a.sourceModule}</Badge></td>
                          <td className="px-4 py-3 text-[11px] text-slate-700">{a.requestType}</td>
                          <td className="px-4 py-3"><Badge className={`text-[9px] ${getReconRiskBadgeClass(a.riskLevel as any)}`}>{a.riskLevel}</Badge></td>
                          <td className="px-4 py-3"><Badge className={`text-[9px] ${getApprovalPriorityBadgeClass(a.priority)}`}>{a.priority}</Badge></td>
                          <td className="px-4 py-3">
                            <p className="text-[11px] text-slate-700">{a.requestedBy}</p>
                            <p className="text-[9px] text-slate-400">{a.requestedByRole}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-[11px] text-slate-700">{a.assignedApprover}</p>
                            <p className="text-[9px] text-slate-400">{a.approverRole}</p>
                          </td>
                          <td className="px-4 py-3"><Badge className={`text-[9px] ${getApprovalStatusBadgeClass(a.status)}`}>{a.status}</Badge></td>
                          <td className="px-4 py-3">
                            {a.totalStages ? (
                              <div className="space-y-0.5">
                                <p className="text-[10px] text-slate-600">{a.currentStage} / {a.totalStages}</p>
                                {slaBreached && <Badge className="text-[8px] bg-rose-50 text-rose-700 border-rose-200/60">SLA Aşımı</Badge>}
                              </div>
                            ) : <span className="text-[10px] text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            {a.totalStages ? (
                              <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${getWorkflowProgressColor(progress)} transition-all`} style={{ width: `${progress}%` }} />
                              </div>
                            ) : <span className="text-[10px] text-slate-400">—</span>}
                          </td>
                          <td className="px-4 py-3 text-[11px] text-slate-600">{new Date(a.createdAt).toLocaleDateString('tr-TR')}</td>
                          <td className="px-4 py-3">
                            <div className="relative">
                              <button onClick={() => setApprovalOpenDropdownId(approvalOpenDropdownId === a.id ? null : a.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><MoreVertical size={13} /></button>
                              {approvalOpenDropdownId === a.id && (
                                <div className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-slate-200/70 bg-white shadow-lg p-1.5 space-y-0.5">
                                  <button type="button" onClick={() => { setApprovalOpenDropdownId(null); setApprovalDetail(a); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Onay detayı görüntülendi', entityType: 'system', entityId: a.id, entityTitle: a.sourceTitle, severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><Eye size={13} className="text-blue-600" /> Detay Gör</button>
                                  {a.status === 'Beklemede' && (currentUser?.role === 'Admin' || currentUser?.role === 'Yönetici' || currentUser?.role === a.pendingRole || (a.pendingRole === 'Uyum Uzmanı' && currentUser?.role === 'Uyum Uzmanı')) && (
                                    <>
                                      <button type="button" onClick={() => { setApprovalOpenDropdownId(null); const updated = a.workflowId && a.totalStages && a.totalStages > 1 ? approveStage(a.id, currentUser?.name || '', currentUser?.role || '', approvalActionNote) : approveRequest(a.id, approvalActionNote); if (updated) setApprovalRequests((prev) => prev.map((r) => r.id === a.id ? updated : r)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Onay talebi onaylandı', entityType: 'system', entityId: a.id, entityTitle: a.sourceTitle, severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><Check size={13} className="text-emerald-600" /> Onayla</button>
                                      <button type="button" onClick={() => { setApprovalOpenDropdownId(null); const updated = a.workflowId && a.totalStages && a.totalStages > 1 ? rejectStage(a.id, currentUser?.name || '', currentUser?.role || '', approvalActionNote) : rejectRequest(a.id, approvalActionNote); if (updated) setApprovalRequests((prev) => prev.map((r) => r.id === a.id ? updated : r)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Onay talebi reddedildi', entityType: 'system', entityId: a.id, entityTitle: a.sourceTitle, severity: 'warning' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><X size={13} className="text-rose-600" /> Reddet</button>
                                      <button type="button" onClick={() => { setApprovalOpenDropdownId(null); const updated = a.workflowId && a.totalStages && a.totalStages > 1 ? requestRevisionStage(a.id, currentUser?.name || '', currentUser?.role || '', approvalActionNote) : requestRevision(a.id, approvalActionNote); if (updated) setApprovalRequests((prev) => prev.map((r) => r.id === a.id ? updated : r)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Onay talebine revizyon istendi', entityType: 'system', entityId: a.id, entityTitle: a.sourceTitle, severity: 'warning' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><RefreshCw size={13} className="text-amber-600" /> Revizyon İste</button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Approval Detail Drawer */}
        {approvalDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
            <div className="w-full max-w-lg bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Onay Talep Detayı</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{approvalDetail.id}</p>
                </div>
                <button onClick={() => setApprovalDetail(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-[10px] ${getApprovalStatusBadgeClass(approvalDetail.status)}`}>{approvalDetail.status}</Badge>
                  <Badge className={`text-[10px] ${getApprovalPriorityBadgeClass(approvalDetail.priority)}`}>{approvalDetail.priority}</Badge>
                  <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{approvalDetail.sourceModule}</Badge>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <p className="text-[11px] font-medium text-slate-800">{approvalDetail.sourceTitle}</p>
                  <p className="text-[10px] text-slate-500">Kaynak ID: <span className="font-mono">{approvalDetail.sourceId}</span></p>
                  <p className="text-[10px] text-slate-500">Talep Türü: {approvalDetail.requestType}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-[10px] text-blue-500 uppercase">Talep Eden</p>
                    <p className="text-[11px] font-semibold text-blue-700">{approvalDetail.requestedBy}</p>
                    <p className="text-[9px] text-blue-500">{approvalDetail.requestedByRole}</p>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-3">
                    <p className="text-[10px] text-violet-500 uppercase">Onaycı</p>
                    <p className="text-[11px] font-semibold text-violet-700">{approvalDetail.assignedApprover}</p>
                    <p className="text-[9px] text-violet-500">{approvalDetail.approverRole}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Risk Seviyesi</p>
                  <p className="text-[11px] text-slate-700">{approvalDetail.riskLevel}</p>
                </div>
                {approvalDetail.notes && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Notlar</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed whitespace-pre-line">{approvalDetail.notes}</p>
                  </div>
                )}
                {/* Workflow Timeline */}
                {approvalDetail.workflowId && approvalDetail.totalStages && approvalDetail.totalStages > 1 && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Workflow Timeline</p>
                    <div className="space-y-2">
                      {(() => {
                        const wf = findWorkflowForModule(approvalDetail.sourceModule)
                        if (!wf) return null
                        return wf.stages.map((stage) => {
                          const isCompleted = approvalDetail.completedStages.includes(stage.order)
                          const isCurrent = approvalDetail.currentStage === stage.order && approvalDetail.status === 'Beklemede'
                          const historyEntry = approvalDetail.stageHistory.find((h) => h.role === stage.role)
                          return (
                            <div key={stage.order} className="flex items-start gap-2">
                              <div className="mt-0.5 shrink-0">
                                {isCompleted ? (
                                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                    <Check size={11} className="text-white" />
                                  </div>
                                ) : isCurrent ? (
                                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                                    <Clock size={11} className="text-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-slate-200" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className={`text-[11px] font-medium ${isCompleted ? 'text-emerald-700' : isCurrent ? 'text-blue-700' : 'text-slate-500'}`}>{stage.role}</p>
                                  {isCurrent && approvalDetail.slaDeadline && (
                                    <Badge variant="outline" className="text-[8px] border-slate-200/60 text-slate-500">SLA: {new Date(approvalDetail.slaDeadline).toLocaleString('tr-TR')}</Badge>
                                  )}
                                </div>
                                {historyEntry && (
                                  <p className="text-[9px] text-slate-500">
                                    {historyEntry.action === 'ONAYLANDI' ? 'Onaylandı' : historyEntry.action === 'REDDEDILDI' ? 'Reddedildi' : 'Revizyon İstendi'}
                                    {historyEntry.user ? ` - ${historyEntry.user}` : ''}
                                  </p>
                                )}
                                {isCurrent && <p className="text-[9px] text-blue-500">Bekliyor</p>}
                              </div>
                            </div>
                          )
                        })
                      })()}
                    </div>
                    {approvalDetail.totalStages && (
                      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full ${getWorkflowProgressColor(getWorkflowProgress(approvalDetail))} transition-all`} style={{ width: `${getWorkflowProgress(approvalDetail)}%` }} />
                      </div>
                    )}
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Durum Geçmişi</p>
                  <div className="text-[11px] text-slate-600 space-y-1">
                    <p>Oluşturuldu: {new Date(approvalDetail.createdAt).toLocaleString('tr-TR')}</p>
                    {approvalDetail.decidedAt && <p>Karar: {new Date(approvalDetail.decidedAt).toLocaleString('tr-TR')}</p>}
                    <p>Son Güncelleme: {new Date(approvalDetail.updatedAt).toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              </div>
              {approvalDetail.status === 'Beklemede' && (currentUser?.role === 'Admin' || currentUser?.role === 'Yönetici' || currentUser?.role === approvalDetail.pendingRole || (approvalDetail.pendingRole === 'Uyum Uzmanı' && currentUser?.role === 'Uyum Uzmanı')) && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Karar Notu (Opsiyonel)</p>
                  <textarea value={approvalActionNote} onChange={(e) => setApprovalActionNote(e.target.value)} rows={2} placeholder="Onay / ret / revizyon için not ekleyin..." className="text-[11px] w-full rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none resize-none" />
                  <div className="flex items-center justify-end gap-2">
                    <button onClick={() => setApprovalDetail(null)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">Kapat</button>
                    <button onClick={() => { const id = approvalDetail.id; const updated = approvalDetail.workflowId && approvalDetail.totalStages && approvalDetail.totalStages > 1 ? rejectStage(id, currentUser?.name || '', currentUser?.role || '', approvalActionNote) : rejectRequest(id, approvalActionNote); if (updated) setApprovalRequests((prev) => prev.map((r) => r.id === id ? updated : r)); setApprovalDetail(null); setApprovalActionNote(''); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Onay talebi reddedildi', entityType: 'system', entityId: id, entityTitle: approvalDetail.sourceTitle, severity: 'warning' }) }} className="text-[11px] px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-medium">Reddet</button>
                    <button onClick={() => { const id = approvalDetail.id; const updated = approvalDetail.workflowId && approvalDetail.totalStages && approvalDetail.totalStages > 1 ? requestRevisionStage(id, currentUser?.name || '', currentUser?.role || '', approvalActionNote) : requestRevision(id, approvalActionNote); if (updated) setApprovalRequests((prev) => prev.map((r) => r.id === id ? updated : r)); setApprovalDetail(null); setApprovalActionNote(''); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Onay talebine revizyon istendi', entityType: 'system', entityId: id, entityTitle: approvalDetail.sourceTitle, severity: 'warning' }) }} className="text-[11px] px-4 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 font-medium">Revizyon İste</button>
                    <button onClick={() => { const id = approvalDetail.id; const updated = approvalDetail.workflowId && approvalDetail.totalStages && approvalDetail.totalStages > 1 ? approveStage(id, currentUser?.name || '', currentUser?.role || '', approvalActionNote) : approveRequest(id, approvalActionNote); if (updated) setApprovalRequests((prev) => prev.map((r) => r.id === id ? updated : r)); setApprovalDetail(null); setApprovalActionNote(''); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Onay talebi onaylandı', entityType: 'system', entityId: id, entityTitle: approvalDetail.sourceTitle, severity: 'info' }) }} className="inline-flex items-center gap-1 text-[11px] px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium"><Check size={13} /> Onayla</button>
                  </div>
                </div>
              )}
              {approvalDetail.status !== 'Beklemede' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button onClick={() => setApprovalDetail(null)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">Kapat</button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'casecenter' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <BriefcaseBusiness size={18} className="text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-800">Case Center</h2>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              <p className="text-[11px] text-slate-500">SPK, BDDK, MKK, Takasbank, görev ve onay süreçlerini merkezi vaka yapısında takip edin.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const stats = getCaseStats(cases)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Toplam Vaka</p>
                    <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Açık Vaka</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Kritik Vaka</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.critical}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Onay Bekleyen</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.pendingApproval}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Bu Ay Kapanan</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.closedThisMonth}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">SLA Riski</p>
                    <p className="text-2xl font-bold text-violet-600">{stats.slaRisk}</p>
                  </div>
                </div>
              )
            })()}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <input type="text" value={caseSearch} onChange={(e) => setCaseSearch(e.target.value)} placeholder="Ara (vaka no, başlık, tag...)" className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full md:w-64" />
              <select value={caseFilterStatus} onChange={(e) => setCaseFilterStatus(e.target.value as CaseStatusType | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Durumlar</option>
                <option value="Açık">Açık</option>
                <option value="İncelemede">İncelemede</option>
                <option value="Aksiyon Bekliyor">Aksiyon Bekliyor</option>
                <option value="Onay Bekliyor">Onay Bekliyor</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="Arşivlendi">Arşivlendi</option>
              </select>
              <select value={caseFilterPriority} onChange={(e) => setCaseFilterPriority(e.target.value as CasePriorityType | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Öncelikler</option>
                <option value="Kritik">Kritik</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Orta">Orta</option>
                <option value="Düşük">Düşük</option>
              </select>
              <select value={caseFilterRisk} onChange={(e) => setCaseFilterRisk(e.target.value as CaseRiskType | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none">
                <option value="all">Tüm Riskler</option>
                <option value="Kritik">Kritik</option>
                <option value="Yüksek">Yüksek</option>
                <option value="Orta">Orta</option>
                <option value="Düşük">Düşük</option>
              </select>
              <button onClick={() => { setCaseFilterStatus('all'); setCaseFilterPriority('all'); setCaseFilterRisk('all'); setCaseSearch('') }} className="inline-flex items-center gap-1 text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><FilterX size={12} /> Sıfırla</button>
            </div>

            {/* Case Table */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Vaka No</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Başlık</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Kaynak</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Risk</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Öncelik</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Durum</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Sorumlu</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Son Güncelleme</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const filtered = cases.filter((c) => {
                      if (caseFilterStatus !== 'all' && c.status !== caseFilterStatus) return false
                      if (caseFilterPriority !== 'all' && c.priority !== caseFilterPriority) return false
                      if (caseFilterRisk !== 'all' && c.riskLevel !== caseFilterRisk) return false
                      if (caseSearch) {
                        const s = caseSearch.toLowerCase()
                        const text = `${c.caseNumber} ${c.title} ${c.description} ${c.sourceModule} ${c.assignedTo} ${c.tags.join(' ')}`.toLowerCase()
                        if (!text.includes(s)) return false
                      }
                      return true
                    })
                    if (filtered.length === 0) {
                      return <tr><td colSpan={9} className="px-4 py-8 text-center text-[11px] text-slate-400">Vaka bulunmuyor.</td></tr>
                    }
                    return filtered.map((c) => (
                      <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] font-mono text-slate-600">{c.caseNumber}</td>
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-medium text-slate-800">{c.title}</p>
                          <p className="text-[9px] text-slate-400 line-clamp-1">{c.description}</p>
                        </td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{c.sourceModule}</Badge></td>
                        <td className="px-4 py-3"><Badge className={`text-[9px] ${getCaseRiskBadgeClass(c.riskLevel)}`}>{c.riskLevel}</Badge></td>
                        <td className="px-4 py-3"><Badge className={`text-[9px] ${getCasePriorityBadgeClass(c.priority)}`}>{c.priority}</Badge></td>
                        <td className="px-4 py-3"><Badge className={`text-[9px] ${getCaseStatusBadgeClass(c.status)}`}>{c.status}</Badge></td>
                        <td className="px-4 py-3 text-[11px] text-slate-700">{c.assignedTo}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">{new Date(c.updatedAt).toLocaleDateString('tr-TR')}</td>
                        <td className="px-4 py-3">
                          <div className="relative">
                            <button onClick={() => setCaseOpenDropdownId(caseOpenDropdownId === c.id ? null : c.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><MoreVertical size={13} /></button>
                            {caseOpenDropdownId === c.id && (
                              <div className="absolute right-0 top-8 z-30 w-48 rounded-xl border border-slate-200/70 bg-white shadow-lg p-1.5 space-y-0.5">
                                <button type="button" onClick={() => { setCaseOpenDropdownId(null); setCaseDetail(c); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Case görüntülendi', entityType: 'system', entityId: c.id, entityTitle: c.title, severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><Eye size={13} className="text-blue-600" /> Detay Gör</button>
                                {!userPerms?.readOnly && c.status !== 'Tamamlandı' && c.status !== 'Arşivlendi' && (
                                  <>
                                    <button type="button" onClick={() => { setCaseOpenDropdownId(null); const updated = closeCase(c.id); if (updated) { /* state refresh via localStorage on next read */ } if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Case kapatıldı', entityType: 'system', entityId: c.id, entityTitle: c.title, severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><CheckCircle size={13} className="text-emerald-600" /> Kapat</button>
                                    <button type="button" onClick={() => { setCaseOpenDropdownId(null); const updated = archiveCase(c.id); if (updated) { /* state refresh */ } if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Case arşivlendi', entityType: 'system', entityId: c.id, entityTitle: c.title, severity: 'info' }) }} className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"><Archive size={13} className="text-slate-600" /> Arşivle</button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Case Detail Drawer */}
        {caseDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
            <div className="w-full max-w-2xl bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">{caseDetail.title}</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{caseDetail.caseNumber}</p>
                </div>
                <button onClick={() => setCaseDetail(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-[10px] ${getCaseStatusBadgeClass(caseDetail.status)}`}>{caseDetail.status}</Badge>
                  <Badge className={`text-[10px] ${getCasePriorityBadgeClass(caseDetail.priority)}`}>{caseDetail.priority}</Badge>
                  <Badge className={`text-[10px] ${getCaseRiskBadgeClass(caseDetail.riskLevel)}`}>{caseDetail.riskLevel}</Badge>
                  <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{caseDetail.sourceModule}</Badge>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <p className="text-[11px] text-slate-700 leading-relaxed">{caseDetail.description}</p>
                  {caseDetail.sourceId && <p className="text-[10px] text-slate-500">Kaynak ID: <span className="font-mono">{caseDetail.sourceId}</span></p>}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-[10px] text-blue-500 uppercase">Sahip</p>
                    <p className="text-[11px] font-semibold text-blue-700">{caseDetail.owner}</p>
                  </div>
                  <div className="bg-violet-50 rounded-xl p-3">
                    <p className="text-[10px] text-violet-500 uppercase">Atanan</p>
                    <p className="text-[11px] font-semibold text-violet-700">{caseDetail.assignedTo}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-3">
                    <p className="text-[10px] text-emerald-500 uppercase">Oluşturuldu</p>
                    <p className="text-[11px] font-semibold text-emerald-700">{new Date(caseDetail.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3">
                    <p className="text-[10px] text-amber-500 uppercase">Güncellendi</p>
                    <p className="text-[11px] font-semibold text-amber-700">{new Date(caseDetail.updatedAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                </div>
                {caseDetail.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {caseDetail.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{tag}</Badge>
                    ))}
                  </div>
                )}
                {caseDetail.relatedTasks.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">İlgili Görevler</p>
                    <div className="flex flex-wrap gap-1.5">
                      {caseDetail.relatedTasks.map((t) => (
                        <Badge key={t} variant="outline" className="text-[9px] border-blue-200/60 text-blue-600">{t}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {caseDetail.relatedApprovals.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">İlgili Onaylar</p>
                    <div className="flex flex-wrap gap-1.5">
                      {caseDetail.relatedApprovals.map((a) => (
                        <Badge key={a} variant="outline" className="text-[9px] border-violet-200/60 text-violet-600">{a}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {caseDetail.relatedDocuments.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">İlgili Belgeler</p>
                    <div className="flex flex-wrap gap-1.5">
                      {caseDetail.relatedDocuments.map((d) => (
                        <Badge key={d} variant="outline" className="text-[9px] border-emerald-200/60 text-emerald-600">{d}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {/* Evidence Section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Kanıt Dokümanları</p>
                    {!userPerms?.readOnly && (
                      <button onClick={() => { setEvidenceAddModalOpen(true); setEvidenceAddLinkedEntityType('case'); setEvidenceAddLinkedEntityId(caseDetail.id); setEvidenceAddLinkedEntityTitle(caseDetail.title); setEvidenceAddTitle(''); setEvidenceAddDescription(''); setEvidenceAddFileName(''); setEvidenceAddClassification('Internal'); }} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><Plus size={10} /> Kanıt Ekle</button>
                    )}
                  </div>
                  {(() => {
                    const linkedEvidence = evidenceDocs.filter((d) => d.linkedEntityType === 'case' && d.linkedEntityId === caseDetail.id)
                    if (linkedEvidence.length === 0) return <p className="text-[11px] text-slate-400 bg-slate-50 rounded-xl p-3">Bu vakaya bağlı kanıt dokümanı bulunmuyor.</p>
                    return (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        {linkedEvidence.map((f) => (
                          <div key={f.id} className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => setEvidenceDetail(f)}>
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-500"><FileText size={14} /></div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-medium text-slate-700 truncate">{f.fileName}</p>
                              <p className="text-[9px] text-slate-400">{f.fileType} · {f.fileSize}</p>
                              <Badge className={`text-[8px] mt-1 ${getClassificationBadgeClass(f.classification)}`}>{f.classification}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </div>

                {/* Case Timeline */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Vaka Timeline</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5 shrink-0 w-2 h-2 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-[11px] text-slate-700">Case Açıldı</p>
                        <p className="text-[9px] text-slate-400">{new Date(caseDetail.createdAt).toLocaleString('tr-TR')}</p>
                      </div>
                    </div>
                    {caseDetail.status !== 'Açık' && (
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0 w-2 h-2 rounded-full bg-blue-500" />
                        <div>
                          <p className="text-[11px] text-slate-700">Durum: {caseDetail.status}</p>
                          <p className="text-[9px] text-slate-400">{new Date(caseDetail.updatedAt).toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                    )}
                    {(caseDetail.status === 'Tamamlandı' || caseDetail.status === 'Arşivlendi') && caseDetail.closedAt && (
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 shrink-0 w-2 h-2 rounded-full bg-slate-400" />
                        <div>
                          <p className="text-[11px] text-slate-700">{caseDetail.status}</p>
                          <p className="text-[9px] text-slate-400">{new Date(caseDetail.closedAt).toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setCaseDetail(null)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">Kapat</button>
                {!userPerms?.readOnly && caseDetail.status !== 'Tamamlandı' && caseDetail.status !== 'Arşivlendi' && (
                  <button onClick={() => { const id = caseDetail.id; const updated = closeCase(id); if (updated) { setCaseDetail(updated); } if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Case kapatıldı', entityType: 'system', entityId: id, entityTitle: caseDetail.title, severity: 'info' }) }} className="inline-flex items-center gap-1 text-[11px] px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium"><CheckCircle size={13} /> Kapat</button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'obligations' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <ClipboardList size={18} className="text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-800">Yükümlülük Merkezi</h2>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-200/60 text-amber-700 bg-amber-50">Demo Veri</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Regülasyondan kaynaklanan yükümlülükleri takip edin, görev, case ve onay süreçlerine dönüştürün.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const stats = getObligationStats(obligations)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Toplam</p>
                    <p className="text-2xl font-bold text-slate-700">{stats.total}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Açık</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Kritik</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.critical}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Yaklaşan</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.upcoming}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Geciken</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.overdue}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Tamamlanan</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
                  </div>
                </div>
              )
            })()}

            {/* Filters */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <input type="text" value={obligationSearch} onChange={(e) => setObligationSearch(e.target.value)} placeholder="Ara..." className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full md:w-64" />
                <select value={obligationFilterAuthority} onChange={(e) => setObligationFilterAuthority(e.target.value as ObligationAuthority | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500">
                  <option value="all">Tüm Kurumlar</option>
                  {['SPK','BDDK','MASAK','MKK','TAKASBANK'].map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <select value={obligationFilterRisk} onChange={(e) => setObligationFilterRisk(e.target.value as ObligationRisk | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500">
                  <option value="all">Tüm Riskler</option>
                  {['Düşük','Orta','Yüksek','Kritik'].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={obligationFilterStatus} onChange={(e) => setObligationFilterStatus(e.target.value as ObligationStatus | 'all')} className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500">
                  <option value="all">Tüm Durumlar</option>
                  {['Açık','Devam Ediyor','Kanıt Bekliyor','Onay Bekliyor','Tamamlandı','Gecikti'].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <button onClick={() => { setObligationSearch(''); setObligationFilterAuthority('all'); setObligationFilterRisk('all'); setObligationFilterStatus('all') }} className="inline-flex items-center gap-1 text-[11px] px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><FilterX size={12} /> Sıfırla</button>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-x-auto">
              <table className="w-full text-left">
                <thead><tr className="border-b border-slate-100">
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">ID</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Yükümlülük</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Kurum</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Madde</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Risk</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Durum</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Sorumlu</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Termin</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Tamamlanma</th>
                  <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-10"></th>
                </tr></thead>
                <tbody>
                  {(() => {
                    const filtered = obligations.filter((o) => {
                      if (obligationFilterAuthority !== 'all' && o.authority !== obligationFilterAuthority) return false
                      if (obligationFilterRisk !== 'all' && o.riskLevel !== obligationFilterRisk) return false
                      if (obligationFilterStatus !== 'all' && o.status !== obligationFilterStatus) return false
                      if (!obligationSearch) return true
                      const q = obligationSearch.toLowerCase()
                      return `${o.title} ${o.owner} ${o.department} ${o.articleReference} ${o.sourceRegulationTitle}`.toLowerCase().includes(q)
                    })
                    if (filtered.length === 0) return <tr><td colSpan={10} className="px-4 py-8 text-center text-[11px] text-slate-400">Yükümlülük bulunmuyor.</td></tr>
                    return filtered.map((o) => (
                      <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-4 py-3 text-[11px] text-slate-500 font-mono">{o.id}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-700 font-medium max-w-xs truncate" title={o.title}>{o.title}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-700">{o.authority}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">{o.articleReference}</td>
                        <td className="px-4 py-3"><Badge className={`text-[9px] ${getObligationRiskBadgeClass(o.riskLevel)}`}>{o.riskLevel}</Badge></td>
                        <td className="px-4 py-3"><Badge className={`text-[9px] ${getObligationStatusBadgeClass(o.status)}`}>{o.status}</Badge></td>
                        <td className="px-4 py-3 text-[11px] text-slate-700">{o.owner}</td>
                        <td className="px-4 py-3 text-[11px] text-slate-600">{new Date(o.dueDate).toLocaleDateString('tr-TR')}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                              <div className="h-full rounded-full bg-blue-500" style={{ width: `${o.completionRate}%` }} />
                            </div>
                            <span className="text-[10px] text-slate-500">{o.completionRate}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 relative">
                          <button onClick={() => setObligationOpenDropdownId(obligationOpenDropdownId === o.id ? null : o.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><MoreVertical size={13} /></button>
                          {obligationOpenDropdownId === o.id && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                              <button onClick={() => { setObligationDetail(o); setObligationOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Yükümlülük görüntülendi', entityType: 'obligation', entityId: o.id, entityTitle: o.title, severity: 'info' }) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"><Eye size={12} /> Detay Gör</button>
                              {!userPerms?.readOnly && (
                                <>
                                  <button onClick={() => { const newTask = createTask({ title: `[Yükümlülük] ${o.title}`, notes: o.description, riskLevel: o.riskLevel, authority: o.authority, dueDate: o.dueDate, assignedTo: o.owner, status: 'Açık' }); setObligations((prev) => prev.map((x) => x.id === o.id ? { ...x, relatedTasks: [...x.relatedTasks, newTask.id], status: 'Devam Ediyor' as ObligationStatus, updatedAt: new Date().toISOString() } : x)); setObligationOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Yükümlülükten görev oluşturuldu', entityType: 'obligation', entityId: o.id, entityTitle: o.title, severity: 'info' }) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"><ClipboardList size={12} /> Görev Oluştur</button>
                                  <button onClick={() => { const newCase = createCase({ title: `Yükümlülük: ${o.title}`, description: o.description, sourceModule: 'OBLIGATION', sourceId: o.id, status: 'Açık', riskLevel: o.riskLevel, priority: o.riskLevel === 'Kritik' ? 'Kritik' : 'Yüksek', assignedTo: o.owner, owner: o.owner, tags: [o.authority, o.articleReference], relatedTasks: [], relatedApprovals: [], relatedDocuments: [] }); setObligations((prev) => prev.map((x) => x.id === o.id ? { ...x, relatedCases: [...x.relatedCases, newCase.id], updatedAt: new Date().toISOString() } : x)); setObligationOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Yükümlülükten case oluşturuldu', entityType: 'obligation', entityId: o.id, entityTitle: o.title, severity: 'info' }) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"><BriefcaseBusiness size={12} /> Case Oluştur</button>
                                  <button onClick={() => { const newApproval = createApprovalRequest({ sourceModule: 'OBLIGATION', sourceId: o.id, sourceTitle: o.title, requestType: 'Yükümlülük Onayı', requestedBy: currentUser?.name || 'Sistem', requestedByRole: currentUser?.role || 'Sistem', assignedApprover: o.owner, approverRole: 'Yönetici', priority: o.riskLevel === 'Kritik' ? 'Kritik' : 'Yüksek', riskLevel: o.riskLevel, notes: o.description }); setObligations((prev) => prev.map((x) => x.id === o.id ? { ...x, relatedApprovals: [...x.relatedApprovals, newApproval.id], status: 'Onay Bekliyor' as ObligationStatus, updatedAt: new Date().toISOString() } : x)); setObligationOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Yükümlülük onaya gönderildi', entityType: 'obligation', entityId: o.id, entityTitle: o.title, severity: 'warning' }) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-slate-700 hover:bg-slate-50"><ClipboardCheck size={12} /> Onaya Gönder</button>
                                  {o.status !== 'Tamamlandı' && (
                                    <button onClick={() => { completeObligation(o.id); setObligations((prev) => prev.map((x) => x.id === o.id ? { ...x, status: 'Tamamlandı' as ObligationStatus, completionRate: 100, updatedAt: new Date().toISOString() } : x)); setObligationOpenDropdownId(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Yükümlülük tamamlandı işaretlendi', entityType: 'obligation', entityId: o.id, entityTitle: o.title, severity: 'info' }) }} className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] text-emerald-700 hover:bg-emerald-50"><CheckCircle size={12} /> Tamamlandı İşaretle</button>
                                  )}
                                </>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>

            {/* Obligation Detail Drawer */}
            {obligationDetail && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
                <div className="w-full max-w-xl bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">{obligationDetail.title}</h3>
                      <p className="text-[11px] text-slate-500 font-mono">{obligationDetail.id}</p>
                    </div>
                    <button onClick={() => setObligationDetail(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{obligationDetail.authority}</Badge>
                    <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{obligationDetail.articleReference}</Badge>
                    <Badge className={`text-[9px] ${getObligationRiskBadgeClass(obligationDetail.riskLevel)}`}>{obligationDetail.riskLevel}</Badge>
                    <Badge className={`text-[9px] ${getObligationStatusBadgeClass(obligationDetail.status)}`}>{obligationDetail.status}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-[10px] text-blue-500 uppercase">Sorumlu</p>
                      <p className="text-[11px] font-semibold text-blue-700">{obligationDetail.owner}</p>
                    </div>
                    <div className="bg-violet-50 rounded-xl p-3">
                      <p className="text-[10px] text-violet-500 uppercase">Departman</p>
                      <p className="text-[11px] font-semibold text-violet-700">{obligationDetail.department}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3">
                      <p className="text-[10px] text-amber-500 uppercase">Termin</p>
                      <p className="text-[11px] font-semibold text-amber-700">{new Date(obligationDetail.dueDate).toLocaleDateString('tr-TR')}</p>
                    </div>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Açıklama</p>
                    <p className="text-[11px] text-slate-700 leading-relaxed">{obligationDetail.description}</p>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">İlerleme</p>
                      <p className="text-[11px] font-semibold text-slate-700">{obligationDetail.completionRate}%</p>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${obligationDetail.completionRate}%` }} />
                    </div>
                  </div>
                  {obligationDetail.relatedTasks.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">İlgili Görevler</p>
                      <div className="flex flex-wrap gap-1.5">
                        {obligationDetail.relatedTasks.map((t) => (
                          <Badge key={t} variant="outline" className="text-[9px] border-blue-200/60 text-blue-600">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {obligationDetail.relatedCases.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">İlgili Vakalar</p>
                      <div className="flex flex-wrap gap-1.5">
                        {obligationDetail.relatedCases.map((c) => (
                          <Badge key={c} variant="outline" className="text-[9px] border-violet-200/60 text-violet-600">{c}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {obligationDetail.relatedApprovals.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">İlgili Onaylar</p>
                      <div className="flex flex-wrap gap-1.5">
                        {obligationDetail.relatedApprovals.map((a) => (
                          <Badge key={a} variant="outline" className="text-[9px] border-sky-200/60 text-sky-600">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Evidence Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase">Kanıt Dosyaları</p>
                      {!userPerms?.readOnly && (
                        <button onClick={() => { setEvidenceAddModalOpen(true); setEvidenceAddLinkedEntityType('obligation'); setEvidenceAddLinkedEntityId(obligationDetail.id); setEvidenceAddLinkedEntityTitle(obligationDetail.title); setEvidenceAddTitle(''); setEvidenceAddDescription(''); setEvidenceAddFileName(''); setEvidenceAddClassification('Internal'); }} className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"><Plus size={10} /> Kanıt Ekle</button>
                      )}
                    </div>
                    {(() => {
                      const linkedEvidence = evidenceDocs.filter((d) => d.linkedEntityType === 'obligation' && d.linkedEntityId === obligationDetail.id)
                      if (linkedEvidence.length === 0) return <p className="text-[11px] text-slate-400 bg-slate-50 rounded-xl p-3">Bu yükümlülüğe bağlı kanıt dokümanı bulunmuyor.</p>
                      return (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          {linkedEvidence.map((f) => (
                            <div key={f.id} className="flex items-center gap-2 rounded-xl border border-slate-200/70 bg-white p-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => setEvidenceDetail(f)}>
                              <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-slate-50 text-slate-500"><FileText size={14} /></div>
                              <div className="min-w-0">
                                <p className="text-[11px] font-medium text-slate-700 truncate">{f.fileName}</p>
                                <p className="text-[9px] text-slate-400">{f.fileType} · {f.fileSize}</p>
                                <Badge className={`text-[8px] mt-1 ${getClassificationBadgeClass(f.classification)}`}>{f.classification}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    })()}
                    <p className="text-[9px] text-amber-600 bg-amber-50 rounded-lg px-2 py-1">Demo Veri — Gerçek dosya upload FAZ 19'da entegre edilecek.</p>
                  </div>
                  {(() => {
                    const linkedCtrls = controls.filter((c) => c.linkedObligationIds.includes(obligationDetail.id))
                    if (linkedCtrls.length === 0) return null
                    return (
                      <div className="space-y-1">
                        <p className="text-[10px] font-semibold text-slate-500 uppercase">Bağlı Kontroller</p>
                        <div className="space-y-1.5">
                          {linkedCtrls.map((c) => (
                            <div key={c.id} className="flex items-center gap-2 rounded-lg border border-slate-100 p-2">
                              <ShieldCheck size={12} className="text-indigo-600" />
                              <span className="text-[11px] text-slate-700">{c.controlNumber} · {c.title}</span>
                              <Badge className={`text-[9px] ${getControlTypeBadgeClass(c.controlType)}`}>{c.controlType}</Badge>
                              <Badge className={`text-[9px] ${getControlRiskBadgeClass(c.riskLevel)}`}>{c.riskLevel}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button onClick={() => setObligationDetail(null)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">Kapat</button>
                    {!userPerms?.readOnly && obligationDetail.status !== 'Tamamlandı' && (
                      <button onClick={() => { completeObligation(obligationDetail.id); setObligations((prev) => prev.map((x) => x.id === obligationDetail.id ? { ...x, status: 'Tamamlandı' as ObligationStatus, completionRate: 100, updatedAt: new Date().toISOString() } : x)); setObligationDetail(null); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Yükümlülük tamamlandı işaretlendi', entityType: 'obligation', entityId: obligationDetail.id, entityTitle: obligationDetail.title, severity: 'info' }) }} className="inline-flex items-center gap-1 text-[11px] px-4 py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-medium"><CheckCircle size={13} /> Tamamlandı İşaretle</button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Shield size={18} className="text-slate-700" />
                  <h2 className="text-sm font-semibold text-slate-800">Security Center</h2>
                </div>
                <Badge variant="outline" className="text-[10px] border-amber-200/60 text-amber-700 bg-amber-50">Mock Security Data</Badge>
              </div>
              <p className="text-[11px] text-slate-500">Kurumsal güvenlik yönetimi, oturum izleme, MFA yönetimi, API anahtarları ve yönetişim politikaları.</p>
            </div>

            {/* KPI Cards */}
            {(() => {
              const stats = getSecurityStats(securitySessions, loginRecords, mfaStatuses, apiKeys)
              return (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Aktif Oturum</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.activeSessions}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Başarısız Giriş</p>
                    <p className="text-2xl font-bold text-rose-600">{stats.failedLogins}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">MFA Aktif</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.mfaActiveUsers}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Yetki Değişikliği</p>
                    <p className="text-2xl font-bold text-violet-600">{stats.permissionChanges}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Kritik Olay</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.criticalEvents}</p>
                  </div>
                  <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-4 text-center">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">API Anahtarı</p>
                    <p className="text-2xl font-bold text-slate-700">{stats.apiKeys}</p>
                  </div>
                </div>
              )
            })()}

            {/* Sub Tabs */}
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'sessions' as const, label: 'Oturumlar', icon: Users },
                { key: 'login' as const, label: 'Giriş Geçmişi', icon: Clock },
                { key: 'mfa' as const, label: 'MFA Durumu', icon: Lock },
                { key: 'apikeys' as const, label: 'API Anahtarları', icon: Key },
                { key: 'audit' as const, label: 'Güvenlik Denetimi', icon: ShieldCheck },
                { key: 'policies' as const, label: 'Yönetişim Politikaları', icon: FileBarChart },
              ].map((t) => (
                <button key={t.key} onClick={() => setSecuritySubTab(t.key)} className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-2 rounded-xl border ${securitySubTab === t.key ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'} hover:shadow-sm transition-all`}>
                  <t.icon size={13} /> {t.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <input type="text" value={securitySearch} onChange={(e) => setSecuritySearch(e.target.value)} placeholder="Ara..." className="text-[11px] rounded-xl border border-slate-200 px-3 py-2 bg-white outline-none focus:border-blue-500 w-full md:w-64" />
            </div>

            {/* Sessions */}
            {securitySubTab === 'sessions' && (
              <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Kullanıcı</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Rol</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Cihaz</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">IP</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Lokasyon</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Son Aktivite</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Durum</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-10"></th>
                  </tr></thead>
                  <tbody>
                    {(() => {
                      const filtered = securitySessions.filter((s) => {
                        if (!securitySearch) return true
                        const q = securitySearch.toLowerCase()
                        return `${s.userName} ${s.role} ${s.device} ${s.ip} ${s.location}`.toLowerCase().includes(q)
                      })
                      if (filtered.length === 0) return <tr><td colSpan={8} className="px-4 py-8 text-center text-[11px] text-slate-400">Oturum bulunmuyor.</td></tr>
                      return filtered.map((s) => (
                        <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-[11px] text-slate-700">{s.userName}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-700">{s.role}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-700">{s.device}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-500 font-mono">{s.ip}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-700">{s.location}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-600">{new Date(s.lastActivity).toLocaleString('tr-TR')}</td>
                          <td className="px-4 py-3"><Badge className={`text-[9px] ${s.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : s.status === 'Kilitli' ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-slate-50 text-slate-600 border-slate-200/60'}`}>{s.status}</Badge></td>
                          <td className="px-4 py-3">
                            {s.status === 'Aktif' && !userPerms?.readOnly && (
                              <button onClick={() => { terminateSession(s.id); setSecuritySessions((prev) => prev.map((x) => x.id === s.id ? { ...x, status: 'Pasif' } : x)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Oturum sonlandırıldı', entityType: 'security', entityId: s.id, entityTitle: s.userName, severity: 'warning' }) }} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" title="Sonlandır"><X size={13} /></button>
                            )}
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Login History */}
            {securitySubTab === 'login' && (
              <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Kullanıcı</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Zaman</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">IP</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Cihaz</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Durum</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Neden</th>
                  </tr></thead>
                  <tbody>
                    {(() => {
                      const filtered = loginRecords.filter((l) => {
                        if (!securitySearch) return true
                        const q = securitySearch.toLowerCase()
                        return `${l.userName} ${l.ip} ${l.device} ${l.status}`.toLowerCase().includes(q)
                      })
                      if (filtered.length === 0) return <tr><td colSpan={6} className="px-4 py-8 text-center text-[11px] text-slate-400">Giriş kaydı bulunmuyor.</td></tr>
                      return filtered.map((l) => (
                        <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-[11px] text-slate-700">{l.userName}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-600">{new Date(l.timestamp).toLocaleString('tr-TR')}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-500 font-mono">{l.ip}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-700">{l.device}</td>
                          <td className="px-4 py-3"><Badge className={`text-[9px] ${l.status === 'Başarılı' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-rose-50 text-rose-700 border-rose-200/60'}`}>{l.status}</Badge></td>
                          <td className="px-4 py-3 text-[11px] text-slate-600">{l.failureReason || '—'}</td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* MFA Status */}
            {securitySubTab === 'mfa' && (
              <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Kullanıcı</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Rol</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">MFA</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Yöntem</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Son Doğrulama</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Zorunlu</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-10"></th>
                  </tr></thead>
                  <tbody>
                    {(() => {
                      const filtered = mfaStatuses.filter((m) => {
                        if (!securitySearch) return true
                        const q = securitySearch.toLowerCase()
                        return `${m.userName} ${m.role}`.toLowerCase().includes(q)
                      })
                      if (filtered.length === 0) return <tr><td colSpan={7} className="px-4 py-8 text-center text-[11px] text-slate-400">Kullanıcı bulunmuyor.</td></tr>
                      return filtered.map((m) => (
                        <tr key={m.userId} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-[11px] text-slate-700">{m.userName}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-700">{m.role}</td>
                          <td className="px-4 py-3"><Badge className={`text-[9px] ${m.mfaEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/60'}`}>{m.mfaEnabled ? 'Aktif' : 'Pasif'}</Badge></td>
                          <td className="px-4 py-3 text-[11px] text-slate-700">{m.method || '—'}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-600">{m.lastVerified ? new Date(m.lastVerified).toLocaleString('tr-TR') : '—'}</td>
                          <td className="px-4 py-3"><Badge className={`text-[9px] ${m.mfaRequired ? 'bg-blue-50 text-blue-700 border-blue-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/60'}`}>{m.mfaRequired ? 'Evet' : 'Hayır'}</Badge></td>
                          <td className="px-4 py-3">
                            {!userPerms?.readOnly && (
                              <div className="flex items-center gap-1">
                                {!m.mfaRequired && (
                                  <button onClick={() => { const updated = requireMFA(m.userId); if (updated) setMFAStatuses((prev) => prev.map((x) => x.userId === m.userId ? updated : x)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'MFA zorunlu yapıldı', entityType: 'security', entityId: m.userId, entityTitle: m.userName, severity: 'info' }) }} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100" title="Zorunlu Yap"><Check size={13} /></button>
                                )}
                                <button onClick={() => { const updated = resetMFA(m.userId); if (updated) setMFAStatuses((prev) => prev.map((x) => x.userId === m.userId ? updated : x)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'MFA sıfırlandı', entityType: 'security', entityId: m.userId, entityTitle: m.userName, severity: 'warning' }) }} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100" title="Sıfırla"><RefreshCw size={13} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* API Keys */}
            {securitySubTab === 'apikeys' && (
              <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Ad</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Anahtar</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Kapsam</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Oluşturulma</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Son Kullanım</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Durum</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3 w-10"></th>
                  </tr></thead>
                  <tbody>
                    {(() => {
                      const filtered = apiKeys.filter((k) => {
                        if (!securitySearch) return true
                        const q = securitySearch.toLowerCase()
                        return `${k.name} ${k.scope}`.toLowerCase().includes(q)
                      })
                      if (filtered.length === 0) return <tr><td colSpan={7} className="px-4 py-8 text-center text-[11px] text-slate-400">API anahtarı bulunmuyor.</td></tr>
                      return filtered.map((k) => (
                        <tr key={k.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-[11px] text-slate-700 font-medium">{k.name}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-500 font-mono">{k.maskedKey}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-700">{k.scope}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-600">{new Date(k.createdAt).toLocaleDateString('tr-TR')}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-600">{k.lastUsed ? new Date(k.lastUsed).toLocaleDateString('tr-TR') : '—'}</td>
                          <td className="px-4 py-3"><Badge className={`text-[9px] ${k.status === 'Aktif' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : k.status === 'İptal' ? 'bg-rose-50 text-rose-700 border-rose-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/60'}`}>{k.status}</Badge></td>
                          <td className="px-4 py-3">
                            {!userPerms?.readOnly && k.status !== 'İptal' && (
                              <div className="flex items-center gap-1">
                                <button onClick={() => { const updated = rotateApiKey(k.id); if (updated) setApiKeys((prev) => prev.map((x) => x.id === k.id ? updated : x)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'API key rotate edildi', entityType: 'security', entityId: k.id, entityTitle: k.name, severity: 'warning' }) }} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100" title="Rotate"><RefreshCw size={13} /></button>
                                <button onClick={() => { const updated = revokeApiKey(k.id); if (updated) setApiKeys((prev) => prev.map((x) => x.id === k.id ? updated : x)); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'API key revoke edildi', entityType: 'security', entityId: k.id, entityTitle: k.name, severity: 'warning' }) }} className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" title="Revoke"><X size={13} /></button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Security Audit */}
            {securitySubTab === 'audit' && (
              <div className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Zaman</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Kullanıcı</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Rol</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Aksiyon</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Tip</th>
                    <th className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Ciddiyet</th>
                  </tr></thead>
                  <tbody>
                    {(() => {
                      const securityLogs = getAuditLogs().filter((log) =>
                        ['login', 'logout', 'role change', 'approval decision', 'session termination', 'api key action', 'security'].includes(log.entityType?.toLowerCase() || '') ||
                        log.action?.toLowerCase().includes('oturum') ||
                        log.action?.toLowerCase().includes('mfa') ||
                        log.action?.toLowerCase().includes('api key') ||
                        log.action?.toLowerCase().includes('güvenlik') ||
                        log.action?.toLowerCase().includes('security')
                      )
                      const filtered = securityLogs.filter((l) => {
                        if (!securitySearch) return true
                        const q = securitySearch.toLowerCase()
                        return `${l.userName} ${l.action} ${l.entityType}`.toLowerCase().includes(q)
                      })
                      if (filtered.length === 0) return <tr><td colSpan={6} className="px-4 py-8 text-center text-[11px] text-slate-400">Güvenlik kaydı bulunmuyor.</td></tr>
                      return filtered.slice(0, 50).map((l) => (
                        <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 text-[11px] text-slate-600">{new Date(l.timestamp).toLocaleString('tr-TR')}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-700">{l.userName}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-600">{l.role}</td>
                          <td className="px-4 py-3 text-[11px] text-slate-700">{l.action}</td>
                          <td className="px-4 py-3"><Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{l.entityType}</Badge></td>
                          <td className="px-4 py-3"><Badge className={`text-[9px] ${getSeverityBadgeClass(l.severity)}`}>{l.severity}</Badge></td>
                        </tr>
                      ))
                    })()}
                  </tbody>
                </table>
              </div>
            )}

            {/* Governance Policies */}
            {securitySubTab === 'policies' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {(() => {
                  const filtered = securityPolicies.filter((p) => {
                    if (!securitySearch) return true
                    const q = securitySearch.toLowerCase()
                    return `${p.name} ${p.description}`.toLowerCase().includes(q)
                  })
                  return filtered.map((p) => (
                    <div key={p.id} className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm p-5 space-y-3 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-slate-50 text-slate-600">
                            {p.category === 'RBAC' ? <Users size={14} /> : p.category === 'MFA' ? <Lock size={14} /> : p.category === 'Session' ? <Clock size={14} /> : p.category === 'Audit' ? <Archive size={14} /> : p.category === 'Approval' ? <ClipboardCheck size={14} /> : <FileText size={14} />}
                          </div>
                          <h3 className="text-[11px] font-semibold text-slate-800">{p.name}</h3>
                        </div>
                        <Badge className={`text-[9px] ${getSecurityPolicyStatusBadgeClass(p.status)}`}>{p.status}</Badge>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">{p.description}</p>
                      <p className="text-[9px] text-slate-400">Son Güncelleme: {new Date(p.lastUpdated).toLocaleDateString('tr-TR')}</p>
                    </div>
                  ))
                })()}
              </div>
            )}
          </div>
        )}

        {/* Takasbank Detail Drawer */}
        {takasDetailAlert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/20 p-4">
            <div className="w-full max-w-lg bg-white/95 border border-slate-200/70 rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-800">Takasbank Uyarı Detayı</h3>
                  <p className="text-[11px] text-slate-500 font-mono">{takasDetailAlert.id}</p>
                </div>
                <button onClick={() => setTakasDetailAlert(null)} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={`text-[10px] ${getTakasbankRiskBadgeClass(takasDetailAlert.risk)}`}>{takasDetailAlert.risk}</Badge>
                  <Badge className={`text-[10px] ${getTakasbankStatusBadgeClass(takasDetailAlert.status)}`}>{takasDetailAlert.status}</Badge>
                  <Badge variant="outline" className="text-[9px] border-slate-200/60 text-slate-600">{takasDetailAlert.type}</Badge>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                  <p className="text-[11px] font-medium text-slate-800">{takasDetailAlert.member}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{takasDetailAlert.account}</p>
                  {takasDetailAlert.isin && <p className="text-[10px] text-slate-500 font-mono">ISIN: {takasDetailAlert.isin}</p>}
                  {takasDetailAlert.securityName && <p className="text-[10px] text-slate-500">Kıymet: {takasDetailAlert.securityName}</p>}
                </div>
                <div className="bg-rose-50 rounded-xl p-3 text-center">
                  <p className="text-[10px] text-rose-500 uppercase">Tutar</p>
                  <p className="text-lg font-bold text-rose-700">{takasDetailAlert.amount.toLocaleString('tr-TR')} {takasDetailAlert.currency}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase">Sorumlu</p>
                  <p className="text-[11px] text-slate-700">{takasDetailAlert.responsible}</p>
                </div>
                {takasDetailAlert.slaDate && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">SLA Tarihi</p>
                    <p className="text-[11px] text-slate-700">{takasDetailAlert.slaDate}</p>
                  </div>
                )}
                {takasDetailAlert.possibleCause && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Olası Neden</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{takasDetailAlert.possibleCause}</p>
                  </div>
                )}
                {takasDetailAlert.recommendedAction && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Önerilen Aksiyon</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{takasDetailAlert.recommendedAction}</p>
                  </div>
                )}
                {takasDetailAlert.relatedReconciliationId && (
                  <div className="bg-amber-50 rounded-xl p-3 border border-amber-200/60">
                    <p className="text-[10px] text-amber-600 uppercase font-semibold">İlgili MKK Mutabakat Kontrolü</p>
                    <p className="text-[11px] text-slate-700">{takasDetailAlert.relatedReconciliationId} (Demo bağlantı)</p>
                  </div>
                )}
                {takasDetailAlert.notes && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-slate-500 uppercase">Notlar</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed">{takasDetailAlert.notes}</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setTakasDetailAlert(null)} className="text-[11px] px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 font-medium">Kapat</button>
                <button onClick={() => { const rec = takasDetailAlert; setTakasDetailAlert(null); openTaskModal(undefined, rec.type + ': ' + (rec.member || rec.id), rec.risk === 'Kritik' ? 'Kritik' : rec.risk === 'Yüksek' ? 'Yüksek' : 'Orta', rec.notes || ''); if (currentUser) addAuditLog({ userId: currentUser.id, userName: currentUser.name, role: currentUser.role, action: 'Detaydan görev oluşturuldu', entityType: 'takasbank', entityId: rec.id, entityTitle: rec.type + ' - ' + (rec.member || ''), severity: 'info' }) }} className="inline-flex items-center gap-1 text-[11px] px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 font-medium"><ClipboardList size={13} /> Görev Oluştur</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
