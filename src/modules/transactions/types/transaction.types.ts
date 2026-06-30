export interface TransactionRecord {
  id: string
  referenceNo: string
  type: 'buy' | 'sell' | 'transfer' | 'dividend'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  counterparty?: string
  settlementDate?: string
  createdAt: string
  updatedAt: string
}

export interface TransactionFilter {
  type?: string
  status?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}
