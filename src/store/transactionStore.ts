import { create } from 'zustand'
import type { Transaction, TransactionStatus, ValidationError, ApprovalRecord, AuditLog, FileRecord, HistoryLog } from '@/types'

interface TransactionState {
  transactions: Transaction[]
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'files' | 'validationErrors' | 'approvals' | 'auditLogs' | 'validRecordCount' | 'invalidRecordCount' | 'historyLogs' | 'currentApprovalRole' | 'canApprove'>) => Transaction
  updateTransaction: (id: string, data: Partial<Transaction>) => void
  uploadFile: (transactionId: string, file: FileRecord) => void
  setValidationResult: (transactionId: string, errors: ValidationError[], validCount: number, invalidCount: number) => void
  updateValidationError: (transactionId: string, index: number, error: ValidationError) => void
  revalidateRow: (transactionId: string, index: number) => void
  addApproval: (transactionId: string, approval: ApprovalRecord) => void
  addAuditLog: (transactionId: string, log: Omit<AuditLog, 'id' | 'timestamp' | 'transactionId'>) => void
  addHistoryLog: (transactionId: string, log: Omit<HistoryLog, 'id' | 'timestamp'>) => void
}

const now = new Date().toISOString()
const oneHourLater = new Date(Date.now() + 60 * 60 * 1000).toISOString()
const twoHoursLater = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

const mockTransactions: Transaction[] = [
  {
    id: 'TX-001',
    title: 'Hisse Senedi Pay Dağılım Raporu',
    description: 'Q1 2024 hisse senedi pay dağılım verileri',
    type: 'Pay Dağılımı',
    templateType: 'pay-dagilimi',
    status: 'completed',
    createdBy: '2',
    createdByName: 'Operasyon Kullanıcı',
    createdAt: now,
    updatedAt: now,
    deadline: twoHoursLater,
    files: [{ id: 'f1', name: 'pay_dagilim_q1.xlsx', size: 12400, uploadedAt: now }],
    validationErrors: [],
    validRecordCount: 150,
    invalidRecordCount: 0,
    approvals: [
      { id: 'a1', userId: '5', userName: 'Yönetici / Onay Makamı', role: 'manager', action: 'approved', comment: 'Onaylandı', timestamp: now },
    ],
    auditLogs: [
      { id: 'l1', transactionId: 'TX-001', userId: '2', userName: 'Operasyon Kullanıcı', action: 'İşlem Oluşturuldu', details: 'İşlem başlatıldı', timestamp: now },
      { id: 'l2', transactionId: 'TX-001', userId: '2', userName: 'Operasyon Kullanıcı', action: 'Dosya Yüklendi', details: 'pay_dagilim_q1.xlsx', timestamp: now },
      { id: 'l3', transactionId: 'TX-001', userId: '5', userName: 'Yönetici / Onay Makamı', action: 'Onay Verildi', details: '', timestamp: now },
      { id: 'l4', transactionId: 'TX-001', userId: '2', userName: 'Operasyon Kullanıcı', action: "MKK'ya Gönderildi", details: '', timestamp: now },
    ],
    historyLogs: [
      { id: 'h1', timestamp: now, actor: 'Operasyon Kullanıcısı', action: 'İşlem Oluşturuldu', description: 'Hisse Senedi Pay Dağılım Raporu işlemi başlatıldı', status: 'draft' },
      { id: 'h2', timestamp: now, actor: 'Sistem', action: 'Dosya Yüklendi', description: 'pay_dagilim_q1.xlsx dosyası başarıyla yüklendi', status: 'pending_validation' },
      { id: 'h3', timestamp: now, actor: 'Sistem', action: 'Validasyon Tamamlandı', description: '150 kayıt geçerli, 0 hatalı kayıt', status: 'pending_approval' },
      { id: 'h4', timestamp: now, actor: 'Yönetici / Onay Makamı', action: 'Onay Verildi', description: "İşlem onaylandı ve MKK'ya gönderildi", status: 'completed' },
    ],
    currentApprovalRole: 'manager',
    canApprove: true,
    mkkReference: 'MKK-2024-001',
  },
  {
    id: 'TX-002',
    title: 'Yabancı Yatırımcı Listesi',
    description: 'Yabancı yatırımcı bilgi güncellemesi',
    type: 'Yatırımcı Bilgisi',
    templateType: 'yabanci-yatirimci',
    status: 'pending_approval',
    createdBy: '2',
    createdByName: 'Operasyon Kullanıcı',
    createdAt: now,
    updatedAt: now,
    deadline: oneHourLater,
    errorMessage: 'Onay bekleniyor',
    files: [{ id: 'f2', name: 'yabanci_yatirimci.xlsx', size: 8900, uploadedAt: now }],
    validationErrors: [],
    validRecordCount: 45,
    invalidRecordCount: 0,
    approvals: [],
    auditLogs: [
      { id: 'l5', transactionId: 'TX-002', userId: '2', userName: 'Operasyon Kullanıcı', action: 'İşlem Oluşturuldu', details: '', timestamp: now },
      { id: 'l6', transactionId: 'TX-002', userId: '2', userName: 'Operasyon Kullanıcı', action: 'Dosya Yüklendi', details: 'yabanci_yatirimci.xlsx', timestamp: now },
      { id: 'l7', transactionId: 'TX-002', userId: '2', userName: 'Operasyon Kullanıcı', action: 'Validasyon Tamamlandı', details: '45 kayıt geçerli', timestamp: now },
    ],
    historyLogs: [
      { id: 'h5', timestamp: now, actor: 'Operasyon Kullanıcısı', action: 'İşlem Oluşturuldu', description: 'Yabancı Yatırımcı Listesi işlemi başlatıldı', status: 'draft' },
      { id: 'h6', timestamp: now, actor: 'Sistem', action: 'Dosya Yüklendi', description: 'yabanci_yatirimci.xlsx dosyası başarıyla yüklendi', status: 'pending_validation' },
      { id: 'h7', timestamp: now, actor: 'Sistem', action: 'Validasyon Tamamlandı', description: '45 kayıt geçerli, 0 hatalı kayıt', status: 'pending_approval' },
      { id: 'h8', timestamp: oneHourLater, actor: 'Beklemede', action: 'Yönetici Onayı', description: 'Yönetici / Onay Makamı onayı bekleniyor', status: 'pending_approval' },
    ],
    currentApprovalRole: 'manager',
    canApprove: true,
  },
  {
    id: 'TX-003',
    title: 'Kurumsal Eylem Verileri',
    description: 'Temettü ve bedelsiz dağıtım verileri',
    type: 'Kurumsal Eylem',
    templateType: 'kurumsal-eylem',
    status: 'validation_failed',
    createdBy: '2',
    createdByName: 'Operasyon Kullanıcı',
    createdAt: now,
    updatedAt: now,
    deadline: twoHoursLater,
    errorMessage: '3 kayıtta validasyon hatası',
    files: [{ id: 'f3', name: 'kurumsal_eylem.csv', size: 5600, uploadedAt: now }],
    validationErrors: [
      { row: 12, field: 'ISIN', cellValue: 'TR00ABC12345', message: 'Geçersiz ISIN formatı', suggestedFix: 'TR ile başlayan 12 karakterlik ISIN kodu girin (örn: TRABC1234567)' },
      { row: 15, field: 'Miktar', cellValue: '-500', message: 'Miktar negatif olamaz', suggestedFix: 'Pozitif bir sayı girin (örn: 500)' },
      { row: 28, field: 'Tarih', cellValue: '15/06/2024', message: 'Tarih formatı hatalı', suggestedFix: 'YYYY-MM-DD formatında girin (örn: 2024-06-15)' },
    ],
    validRecordCount: 22,
    invalidRecordCount: 3,
    approvals: [],
    auditLogs: [
      { id: 'l8', transactionId: 'TX-003', userId: '2', userName: 'Operasyon Kullanıcı', action: 'İşlem Oluşturuldu', details: '', timestamp: now },
      { id: 'l9', transactionId: 'TX-003', userId: '2', userName: 'Operasyon Kullanıcı', action: 'Dosya Yüklendi', details: 'kurumsal_eylem.csv', timestamp: now },
      { id: 'l10', transactionId: 'TX-003', userId: '2', userName: 'Operasyon Kullanıcı', action: 'Validasyon Hatası', details: '3 hata bulundu', timestamp: now },
    ],
    historyLogs: [
      { id: 'h9', timestamp: now, actor: 'Operasyon Kullanıcısı', action: 'İşlem Oluşturuldu', description: 'Kurumsal Eylem Verileri işlemi başlatıldı', status: 'draft' },
      { id: 'h10', timestamp: now, actor: 'Sistem', action: 'Dosya Yüklendi', description: 'kurumsal_eylem.csv dosyası başarıyla yüklendi', status: 'pending_validation' },
      { id: 'h11', timestamp: now, actor: 'Sistem', action: 'Validasyon Hatası', description: '22 kayıt geçerli, 3 hatalı kayıt bulundu', status: 'validation_failed' },
    ],
    currentApprovalRole: 'operation',
    canApprove: false,
  },
]

export const useTransactionStore = create<TransactionState>((set) => ({
  transactions: mockTransactions,
  addTransaction: (tx) => {
    const newId = `TX-${String(Date.now()).slice(-4)}`
    const newTx: Transaction = {
      ...tx,
      id: newId,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      files: [],
      validationErrors: [],
      validRecordCount: 0,
      invalidRecordCount: 0,
      approvals: [],
      auditLogs: [
        {
          id: `l-${Date.now()}`,
          transactionId: newId,
          userId: tx.createdBy,
          userName: tx.createdByName,
          action: 'İşlem Oluşturuldu',
          details: tx.title,
          timestamp: new Date().toISOString(),
        },
      ],
      historyLogs: [
        {
          id: `h-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: tx.createdByName,
          action: 'İşlem Oluşturuldu',
          description: `${tx.title} işlemi başlatıldı`,
          status: 'draft',
        },
      ],
      currentApprovalRole: 'manager',
      canApprove: false,
    }
    set((state) => ({ transactions: [newTx, ...state.transactions] }))
    return newTx
  },
  updateTransaction: (id, data) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
      ),
    })),
  uploadFile: (transactionId, file) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transactionId
          ? { ...t, files: [...t.files, file], updatedAt: new Date().toISOString() }
          : t
      ),
    })),
  setValidationResult: (transactionId, errors, validCount, invalidCount) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              validationErrors: errors,
              validRecordCount: validCount,
              invalidRecordCount: invalidCount,
              status: errors.length > 0 ? 'validation_failed' : 'pending_approval',
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    })),
  updateValidationError: (transactionId, index, error) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              validationErrors: t.validationErrors.map((e, i) => (i === index ? error : e)),
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    })),
  revalidateRow: (transactionId, index) =>
    set((state) => {
      const tx = state.transactions.find((t) => t.id === transactionId)
      if (!tx) return state
      const error = tx.validationErrors[index]
      if (!error) return state

      let isValid = true
      const val = error.cellValue.trim()
      if (error.field === 'TCKN') {
        isValid = /^\d{11}$/.test(val)
      } else if (error.field === 'VKN') {
        isValid = /^\d{10}$/.test(val)
      } else if (error.field === 'Tarih') {
        isValid = /^\d{4}-\d{2}-\d{2}$/.test(val)
      } else if (val === '') {
        isValid = false
      }

      const updatedErrors = [...tx.validationErrors]
      if (isValid) {
        updatedErrors.splice(index, 1)
      } else {
        updatedErrors[index] = { ...error, message: 'Düzeltme sonrası hala geçersiz' }
      }

      const allValid = updatedErrors.length === 0
      return {
        transactions: state.transactions.map((t) =>
          t.id === transactionId
            ? {
                ...t,
                validationErrors: updatedErrors,
                invalidRecordCount: updatedErrors.length,
                validRecordCount: allValid ? t.validRecordCount + t.invalidRecordCount : t.validRecordCount,
                status: allValid ? 'pending_approval' : 'validation_failed',
                updatedAt: new Date().toISOString(),
              }
            : t
        ),
      }
    }),
  addApproval: (transactionId, approval) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              approvals: [...t.approvals, approval],
              status: approval.action === 'approved' ? 'approved' : 'rejected',
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    })),
  addAuditLog: (transactionId, log) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              auditLogs: [
                ...t.auditLogs,
                { ...log, transactionId, id: `l-${Date.now()}`, timestamp: new Date().toISOString() },
              ],
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    })),
  addHistoryLog: (transactionId, log) =>
    set((state) => ({
      transactions: state.transactions.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              historyLogs: [
                ...t.historyLogs,
                { ...log, id: `h-${Date.now()}`, timestamp: new Date().toISOString() },
              ],
              updatedAt: new Date().toISOString(),
            }
          : t
      ),
    })),
}))

export const statusLabels: Record<TransactionStatus, string> = {
  draft: 'Taslak',
  pending_validation: 'Validasyon Bekleniyor',
  validation_failed: 'Validasyon Hatası',
  pending_approval: 'Onay Bekleniyor',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  sent_to_mkk: "MKK'ya Gönderildi",
  completed: 'Tamamlandı',
}

export const statusDotColors: Record<TransactionStatus, string> = {
  draft: 'bg-slate-400',
  pending_validation: 'bg-amber-500',
  validation_failed: 'bg-rose-500',
  pending_approval: 'bg-blue-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-rose-500',
  sent_to_mkk: 'bg-indigo-500',
  completed: 'bg-emerald-500',
}

export const statusColors: Record<TransactionStatus, string> = {
  draft: 'bg-slate-50 text-slate-600 border border-slate-200/60',
  pending_validation: 'bg-amber-50 text-amber-700 border border-amber-200/60',
  validation_failed: 'bg-rose-50 text-rose-700 border border-rose-200/60',
  pending_approval: 'bg-blue-50 text-blue-700 border border-blue-200/60',
  approved: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
  rejected: 'bg-rose-50 text-rose-700 border border-rose-200/60',
  sent_to_mkk: 'bg-indigo-50 text-indigo-700 border border-indigo-200/60',
  completed: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
}
