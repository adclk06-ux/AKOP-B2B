export type AssistantIntent =
  | 'greeting'
  | 'unclear'
  | 'validation_error'
  | 'approval_flow'
  | 'transaction_type'
  | 'transaction_status'
  | 'four_eyes'
  | 'deadline'
  | 'audit_log'
  | 'spk_archive'
  | 'takasbank'
  | 'reconciliation'
  | 'dashboard'
  | 'user_management'
  | 'first_time_guide'
  | 'help'
  | 'unknown'

export interface AssistantContext {
  userRole: string
  currentPage: string
  selectedTransactionId: string | null
  selectedTransactionType: string | null
  selectedTransactionStatus: string | null
  validationErrors: string[]
  canApprove: boolean
}

export interface AssistantMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  source?: string
  contextLabel?: string
  ragDebug?: {
    topDocumentId?: string
    topDocumentTitle?: string
    score?: number
    matchedKeywords?: string[]
  }
}

export interface AssistantResponse {
  intent: AssistantIntent
  content: string
  source?: string
  contextLabel?: string
  ragDebug?: {
    topDocumentId?: string
    topDocumentTitle?: string
    score?: number
    matchedKeywords?: string[]
  }
  ragContext?: string
}
