import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useTransactionStore } from '@/store/transactionStore'
import type { AssistantContext } from '@/types/assistant'

export function useAssistantContext(): AssistantContext {
  const user = useAuthStore((s) => s.user)
  const location = useLocation()
  const transactions = useTransactionStore((s) => s.transactions)

  const txIdFromPath = location.pathname.startsWith('/transactions/') && !location.pathname.includes('/new')
    ? location.pathname.split('/transactions/')[1]
    : null

  const currentTx = txIdFromPath ? transactions.find((t) => t.id === txIdFromPath) : null

  const validationErrors = useMemo(() => {
    if (!currentTx) return []
    return currentTx.validationErrors.map((e) => `${e.field}: ${e.message}`)
  }, [currentTx])

  return {
    userRole: user?.role || '',
    currentPage: location.pathname,
    selectedTransactionId: currentTx?.id || null,
    selectedTransactionType: currentTx?.type || null,
    selectedTransactionStatus: currentTx?.status || null,
    validationErrors,
    canApprove: user?.role === 'admin' || user?.role === 'approver',
  }
}
