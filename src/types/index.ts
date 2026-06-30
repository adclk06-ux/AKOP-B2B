export type UserRole = 'admin' | 'operation' | 'approver' | 'manager' | 'auditor'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  active: boolean
}

export type TransactionStatus =
  | 'draft'
  | 'pending_validation'
  | 'validation_failed'
  | 'pending_approval'
  | 'approved'
  | 'rejected'
  | 'sent_to_mkk'
  | 'completed'

export interface ValidationError {
  row: number
  field: string
  cellValue: string
  message: string
  suggestedFix: string
}

export interface FileRecord {
  id: string
  name: string
  size: number
  uploadedAt: string
}

export interface ApprovalRecord {
  id: string
  userId: string
  userName: string
  role: UserRole
  action: 'approved' | 'rejected'
  comment: string
  timestamp: string
}

export interface AuditLog {
  id: string
  transactionId: string
  userId: string
  userName: string
  action: string
  details: string
  timestamp: string
}

export interface HistoryLog {
  id: string
  timestamp: string
  actor: string
  action: string
  description: string
  status?: string
}

export interface Transaction {
  id: string
  title: string
  description: string
  type: string
  status: TransactionStatus
  createdBy: string
  createdByName: string
  createdAt: string
  updatedAt: string
  files: FileRecord[]
  validationErrors: ValidationError[]
  validRecordCount: number
  invalidRecordCount: number
  approvals: ApprovalRecord[]
  auditLogs: AuditLog[]
  mkkReference?: string
  deadline?: string
  errorMessage?: string
  historyLogs: HistoryLog[]
  currentApprovalRole: UserRole
  canApprove: boolean
  templateType: string
}
