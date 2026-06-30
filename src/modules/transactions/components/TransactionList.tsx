import { useEffect, useState } from 'react'
import type { TransactionRecord } from '../types/transaction.types'
import { fetchTransactions } from '../services/transactionService'

export default function TransactionList() {
  const [items, setItems] = useState<TransactionRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransactions()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-4 text-sm text-slate-500">İşlemler yükleniyor...</div>

  return (
    <div className="space-y-2">
      {items.map((t) => (
        <div key={t.id} className="flex items-center justify-between rounded-md border border-slate-200 p-3">
          <div className="text-sm font-medium">{t.referenceNo}</div>
          <div className="text-xs text-slate-500">{t.status}</div>
        </div>
      ))}
      {items.length === 0 && <div className="text-sm text-slate-400">Kayıt bulunamadı.</div>}
    </div>
  )
}
