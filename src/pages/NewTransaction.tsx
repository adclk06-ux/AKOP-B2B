import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useTransactionStore } from '@/store/transactionStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Upload,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  Download,
  FileText,
  ShieldCheck,
  Ban,
  Calendar,
} from 'lucide-react'

const templates = [
  { key: 'pay-dagilimi', label: 'Pay Dağılımı Şablonu', icon: FileText },
  { key: 'hak-kullanimi', label: 'Hak Kullanımı Şablonu', icon: ShieldCheck },
  { key: 'yatirimci-blokaji', label: 'Yatırımcı Blokajı Şablonu', icon: Ban },
  { key: 'yabanci-yatirimci', label: 'Yabancı Yatırımcı Listesi Şablonu', icon: FileText },
]

const typeToTemplate: Record<string, string> = {
  'Pay Dağılımı': 'pay-dagilimi',
  'Hak Kullanımı': 'hak-kullanimi',
  'Yatırımcı Blokajı': 'yatirimci-blokaji',
  'Yatırımcı Bilgisi': 'yabanci-yatirimci',
  'Kurumsal Eylem': 'pay-dagilimi',
  'Diğer': 'pay-dagilimi',
}

interface ParsedError {
  row: number
  field: string
  cellValue: string
  message: string
  suggestedFix: string
}

function runFrontendValidation(headers: string[], row: any[], rowIndex: number): ParsedError[] {
  const errors: ParsedError[] = []
  headers.forEach((h: string, idx: number) => {
    const val = row[idx] !== undefined ? String(row[idx]).trim() : ''
    if (val === '') {
      errors.push({
        row: rowIndex + 1,
        field: h,
        cellValue: '',
        message: 'Zorunlu alan boş bırakılamaz',
        suggestedFix: 'Alanı doldurun',
      })
      return
    }
    if (h.toUpperCase().includes('TCKN') || h.toUpperCase().includes('TC_KIMLIK')) {
      if (!/^\d{11}$/.test(val)) {
        errors.push({
          row: rowIndex + 1,
          field: h,
          cellValue: val,
          message: 'TCKN 11 hane olmalıdır',
          suggestedFix: '11 haneli TC Kimlik No girin',
        })
      }
    }
    if (h.toUpperCase().includes('VKN') || h.toUpperCase().includes('VERGI_NO')) {
      if (!/^\d{10}$/.test(val)) {
        errors.push({
          row: rowIndex + 1,
          field: h,
          cellValue: val,
          message: 'VKN 10 hane olmalıdır',
          suggestedFix: '10 haneli Vergi Kimlik No girin',
        })
      }
    }
    if (h.toUpperCase().includes('TARIH') || h.toUpperCase().includes('DATE')) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val) && !/^\d{2}\.\d{2}\.\d{4}$/.test(val)) {
        errors.push({
          row: rowIndex + 1,
          field: h,
          cellValue: val,
          message: 'Tarih formatı YYYY-MM-DD olmalıdır',
          suggestedFix: '2024-06-15 formatında girin',
        })
      }
    }
  })
  return errors
}

export default function NewTransaction() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const addTransaction = useTransactionStore((s) => s.addTransaction)
  const uploadFile = useTransactionStore((s) => s.uploadFile)
  const setValidationResult = useTransactionStore((s) => s.setValidationResult)
  const addAuditLog = useTransactionStore((s) => s.addAuditLog)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('Pay Dağılımı')
  const [deadline, setDeadline] = useState('')
  const [, setFile] = useState<File | null>(null)
  const [parsedErrors, setParsedErrors] = useState<ParsedError[]>([])
  const [validCount, setValidCount] = useState(0)
  const [invalidCount, setInvalidCount] = useState(0)
  const [step, setStep] = useState<'form' | 'upload' | 'validation'>('form')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentTxId, setCurrentTxId] = useState<string>('')

  const handleCreate = () => {
    if (!user) return
    const tx = addTransaction({
      title,
      description,
      type,
      createdBy: user.id,
      createdByName: user.name,
      templateType: typeToTemplate[type] || 'pay-dagilimi',
      deadline: deadline || undefined,
    })
    setStep('upload')
    return tx
  }

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile)
    const txId = currentTxId || handleCreate()?.id || ''
    if (!txId) return
    setCurrentTxId(txId)

    uploadFile(txId, {
      id: `f-${Date.now()}`,
      name: selectedFile.name,
      size: selectedFile.size,
      uploadedAt: new Date().toISOString(),
    })

    addAuditLog(txId, {
      userId: user!.id,
      userName: user!.name,
      action: 'Dosya Yüklendi',
      details: selectedFile.name,
    })

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx')
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]

        let valid = 0
        let invalid = 0
        const allErrors: ParsedError[] = []

        if (jsonData.length > 1) {
          const headers = jsonData[0]
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i]
            const rowErrors = runFrontendValidation(headers, row, i)
            if (rowErrors.length > 0) {
              allErrors.push(...rowErrors)
              invalid++
            } else {
              valid++
            }
          }
        }

        setParsedErrors(allErrors)
        setValidCount(valid)
        setInvalidCount(invalid)
        setValidationResult(txId, allErrors, valid, invalid)

        addAuditLog(txId, {
          userId: user!.id,
          userName: user!.name,
          action: 'Validasyon Tamamlandı',
          details: `${valid} geçerli, ${invalid} hatalı kayıt`,
        })

        setStep('validation')
      } catch (err) {
        console.error('Dosya okuma hatası:', err)
      }
    }
    reader.readAsArrayBuffer(selectedFile)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) handleFileSelect(droppedFile)
  }

  const downloadTemplate = async (key: string) => {
    try {
      const XLSX = await import('xlsx')
      const headersMap: Record<string, string[]> = {
        'pay-dagilimi': ['ISIN', 'Tarih', 'Miktar', 'Fiyat', 'TCKN', 'VKN'],
        'hak-kullanimi': ['ISIN', 'Tarih', 'Hak Türü', 'Oran', 'TCKN'],
        'yatirimci-blokaji': ['ISIN', 'Başlangıç', 'Bitiş', 'TCKN', 'Blokaj Nedeni'],
        'yabanci-yatirimci': ['ISIN', 'Ülke', 'Pasaport No', 'Tarih', 'Miktar'],
      }
      const ws = XLSX.utils.aoa_to_sheet([headersMap[key] || []])
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Template')
      XLSX.writeFile(wb, `${key}_sablonu.xlsx`)
    } catch (err) {
      console.error('Şablon indirilemedi:', err)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-8 py-8 space-y-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Yeni İşlem Oluştur</h2>
          <p className="text-sm text-slate-500">Yeni bir operasyon işlemi başlatın ve dosyaları yükleyin.</p>
        </div>

        {step === 'form' && (
          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">İşlem Bilgileri</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-xs text-slate-500">Başlık</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs text-slate-500">İşlem Türü</Label>
                <Select id="type" value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option>Pay Dağılımı</option>
                  <option>Hak Kullanımı</option>
                  <option>Yatırımcı Blokajı</option>
                  <option>Yatırımcı Bilgisi</option>
                  <option>Kurumsal Eylem</option>
                  <option>Diğer</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-xs text-slate-500">Deadline (Son Gönderim Saati)</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <Input id="deadline" type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="pl-9 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs text-slate-500">Açıklama</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </div>

              <div className="rounded-2xl border border-slate-200/70 bg-slate-50/50 p-4 space-y-3">
                <p className="text-sm font-medium text-slate-500">MKK Şablonları</p>
                <div className="grid grid-cols-2 gap-2">
                  {templates.map((t) => (
                    <Button key={t.key} variant="outline" size="sm" className="justify-start gap-2 rounded-xl border-slate-200/70" onClick={() => downloadTemplate(t.key)}>
                      <Download size={14} />
                      {t.label}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={() => { const tx = handleCreate(); if (tx) setCurrentTxId(tx.id); }} disabled={!title} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold">
                Devam Et
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 'upload' && (
          <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Dosya Yükleme</CardTitle></CardHeader>
            <CardContent>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 cursor-pointer transition-colors ${
                  dragOver ? 'border-blue-400 bg-blue-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Upload size={40} className="text-slate-400" />
                <p className="text-sm text-slate-500 text-center">Excel veya CSV dosyasını sürükleyip bırakın veya tıklayarak seçin.</p>
                <p className="text-xs text-slate-400">Frontend validasyon: TCKN (11), VKN (10), Tarih (YYYY-MM-DD), Zorunlu alanlar</p>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }} />
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'validation' && (
          <div className="space-y-4">
            <Card className="bg-white/90 border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <FileSpreadsheet size={18} className="text-slate-600" />
                  Validasyon Sonucu
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4 flex items-center gap-3 shadow-sm">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600"><CheckCircle size={20} /></div>
                    <div>
                      <p className="text-xs text-slate-500">Geçerli Kayıt</p>
                      <p className="text-xl font-bold text-slate-900">{validCount}</p>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200/70 bg-white p-4 flex items-center gap-3 shadow-sm">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-rose-50 text-rose-600"><AlertTriangle size={20} /></div>
                    <div>
                      <p className="text-xs text-slate-500">Hatalı Kayıt</p>
                      <p className="text-xl font-bold text-slate-900">{invalidCount}</p>
                    </div>
                  </div>
                </div>

                {parsedErrors.length > 0 && (
                  <Alert className="bg-rose-50/60 border border-rose-200/60 rounded-2xl">
                    <AlertTriangle size={18} className="text-rose-600" />
                    <AlertTitle className="text-rose-700 text-sm">Frontend Validasyon Uyarısı</AlertTitle>
                    <AlertDescription className="text-rose-600 text-xs">
                      {parsedErrors.length} adet hata dosya yüklenmeden önce tespit edildi. Bu hataları düzelttikten sonra tekrar yükleyin.
                    </AlertDescription>
                  </Alert>
                )}

                {parsedErrors.length > 0 && (
                  <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Satır</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Kolon</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Hücre Değeri</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Hata</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Önerilen Düzeltme</th>
                          </tr>
                        </thead>
                        <tbody>
                          {parsedErrors.map((err, idx) => (
                            <tr key={idx} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70">
                              <td className="px-3 py-2 font-mono text-xs text-slate-700">{err.row}</td>
                              <td className="px-3 py-2 text-xs font-medium text-slate-700">{err.field}</td>
                              <td className="px-3 py-2 text-rose-600 font-mono text-xs">{err.cellValue}</td>
                              <td className="px-3 py-2 text-rose-600 text-xs">{err.message}</td>
                              <td className="px-3 py-2 text-emerald-700 text-xs">{err.suggestedFix}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => navigate('/transactions')} className="rounded-xl border-slate-200/70">İşlem Listesine Dön</Button>
                  {parsedErrors.length === 0 && (
                    <Button onClick={() => navigate(`/transactions/${currentTxId}`)} className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white">İşlemi Görüntüle</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
