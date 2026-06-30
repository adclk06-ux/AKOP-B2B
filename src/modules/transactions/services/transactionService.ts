import type { TransactionRecord, TransactionFilter } from '../types/transaction.types'

export async function fetchTransactions(filter?: TransactionFilter): Promise<TransactionRecord[]> {
  const params = new URLSearchParams(filter as Record<string, string>)
  const res = await fetch(`/api/transactions?${params.toString()}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export async function fetchTransactionById(id: string): Promise<TransactionRecord> {
  const res = await fetch(`/api/transactions/${id}`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
