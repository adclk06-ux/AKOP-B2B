import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import RoleGuard from '@/components/RoleGuard'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import Transactions from '@/pages/Transactions'
import NewTransaction from '@/pages/NewTransaction'
import TransactionDetail from '@/pages/TransactionDetail'
import Approvals from '@/pages/Approvals'
import Reports from '@/pages/Reports'
import Users from '@/pages/Users'
import AuditLogs from '@/pages/AuditLogs'
import Assistant from '@/pages/Assistant'
import RegTechDashboard from '@/pages/RegTechDashboard'
import TakasbankDashboard from '@/pages/TakasbankDashboard'
import ControlTestingCenter from '@/pages/ControlTestingCenter'
import KriKpiCenter from '@/pages/KriKpiCenter'
import CapaCenter from '@/pages/CapaCenter'
import IncidentManagement from '@/pages/IncidentManagement'
import VendorRiskManagement from '@/pages/VendorRiskManagement'
import InternalAuditManagement from '@/pages/InternalAuditManagement'
import ComplianceCalendar from '@/pages/ComplianceCalendar'
import HorizonScanning from '@/pages/HorizonScanning'
import TrainingAwareness from '@/pages/TrainingAwareness'
import AmlMasakCenter from '@/pages/AmlMasakCenter'
import BusinessContinuityManagement from '@/pages/BusinessContinuityManagement'
import DataPrivacyCenter from '@/pages/DataPrivacyCenter'
import EsgSustainability from '@/pages/EsgSustainability'
import EnterpriseSearch from '@/pages/EnterpriseSearch'
import AiComplianceOfficer from '@/pages/AiComplianceOfficer'
import RealIntegrationLayer from '@/pages/RealIntegrationLayer'
import MultiTenantSaaS from '@/pages/MultiTenantSaaS'
import BillingSubscription from '@/pages/BillingSubscription'
import WhiteLabelEngine from '@/pages/WhiteLabelEngine'
import CustomerPortal from '@/pages/CustomerPortal'
import ApiGateway from '@/pages/ApiGateway'
import IntegrationMarketplace from '@/pages/IntegrationMarketplace'
import AdvancedAnalytics from '@/pages/AdvancedAnalytics'
import AiAgentLayer from '@/pages/AiAgentLayer'
import AutonomousActions from '@/pages/AutonomousActions'
import PlatformOne from '@/pages/PlatformOne'
import NotificationSettings from '@/pages/NotificationSettings'
import Settings from '@/pages/Settings'

const Reconciliation = lazy(() => import('@/pages/Reconciliation'))
const AKOPExperience = lazy(() => import('@/pages/AKOPExperience'))

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/akop-intelligence" element={<Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950 text-sky-100">AKOP Intelligence yükleniyor...</div>}><AKOPExperience /></Suspense>} />
        <Route path="/" element={<Layout><Dashboard /></Layout>} />
        <Route path="/transactions" element={<Layout><Transactions /></Layout>} />
        <Route path="/transactions/new" element={<Layout><RoleGuard allowedRoles={['operation']}><NewTransaction /></RoleGuard></Layout>} />
        <Route path="/transactions/:id" element={<Layout><TransactionDetail /></Layout>} />
        <Route path="/approvals" element={<Layout><RoleGuard allowedRoles={['admin']}><Approvals /></RoleGuard></Layout>} />
        <Route path="/reports" element={<Layout><Reports /></Layout>} />
        <Route path="/users" element={<Layout><RoleGuard allowedRoles={['admin']}><Users /></RoleGuard></Layout>} />
        <Route path="/audit-logs" element={<Layout><AuditLogs /></Layout>} />
        <Route path="/assistant" element={<Layout><Assistant /></Layout>} />
        <Route path="/reconciliation" element={<Layout><Suspense fallback={<div className="flex items-center justify-center h-full text-slate-500">Yükleniyor...</div>}><Reconciliation /></Suspense></Layout>} />
        <Route path="/regtech" element={<Layout><RegTechDashboard /></Layout>} />
        <Route path="/takasbank" element={<Layout><TakasbankDashboard /></Layout>} />
        <Route path="/control-testing" element={<Layout><ControlTestingCenter /></Layout>} />
        <Route path="/kri-kpi" element={<Layout><KriKpiCenter /></Layout>} />
        <Route path="/capa" element={<Layout><CapaCenter /></Layout>} />
        <Route path="/incidents" element={<Layout><IncidentManagement /></Layout>} />
        <Route path="/vendor-risk" element={<Layout><VendorRiskManagement /></Layout>} />
        <Route path="/internal-audit" element={<Layout><InternalAuditManagement /></Layout>} />
        <Route path="/compliance-calendar" element={<Layout><ComplianceCalendar /></Layout>} />
        <Route path="/horizon-scanning" element={<Layout><HorizonScanning /></Layout>} />
        <Route path="/training-awareness" element={<Layout><TrainingAwareness /></Layout>} />
        <Route path="/aml-masak" element={<Layout><AmlMasakCenter /></Layout>} />
        <Route path="/business-continuity" element={<Layout><BusinessContinuityManagement /></Layout>} />
        <Route path="/data-privacy" element={<Layout><DataPrivacyCenter /></Layout>} />
        <Route path="/esg-sustainability" element={<Layout><EsgSustainability /></Layout>} />
        <Route path="/enterprise-search" element={<Layout><EnterpriseSearch /></Layout>} />
        <Route path="/ai-compliance-officer" element={<Layout><AiComplianceOfficer /></Layout>} />
        <Route path="/real-integrations" element={<Layout><RealIntegrationLayer /></Layout>} />
        <Route path="/multi-tenant" element={<Layout><MultiTenantSaaS /></Layout>} />
        <Route path="/billing" element={<Layout><BillingSubscription /></Layout>} />
        <Route path="/white-label" element={<Layout><WhiteLabelEngine /></Layout>} />
        <Route path="/customer-portal" element={<Layout><CustomerPortal /></Layout>} />
        <Route path="/api-gateway" element={<Layout><ApiGateway /></Layout>} />
        <Route path="/integration-marketplace" element={<Layout><IntegrationMarketplace /></Layout>} />
        <Route path="/advanced-analytics" element={<Layout><AdvancedAnalytics /></Layout>} />
        <Route path="/ai-agent" element={<Layout><AiAgentLayer /></Layout>} />
        <Route path="/autonomous-actions" element={<Layout><AutonomousActions /></Layout>} />
        <Route path="/platform-one" element={<Layout><PlatformOne /></Layout>} />
        <Route path="/settings" element={<Layout><Settings /></Layout>} />
        <Route path="/notification-settings" element={<Layout><NotificationSettings /></Layout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
