import type { AssistantIntent } from '@/types/assistant'

const greetingWords = ['alo', 'merhaba', 'selam', 'hey', 'selamlar', 'günaydın', 'iyi akşamlar', 'iyi günler', 'hoşgeldin', 'hoş geldin']
const unclearWords = ['tamam', 'oldu', 'evet', 'hayır', 'yaptım', 'bitti', 'tamamladım', 'gönderdim', 'yüklendi', 'onayladım', 'reddettim', 'bekliyorum', 'ok', 'hmm', 'eee']
const validationWords = ['validasyon', 'hata', 'tckn', 'vkn', 'lei', 'format', 'yanlış', 'eksik', 'geçersiz', 'formatı']
const approvalWords = ['onay', 'onayla', 'onaylama', 'onaylamak', 'onaylandı', 'onayladı', 'onaylayan', 'mkk\'ya gönder', 'gönder', 'gönderme', 'reddet', 'revize', 'red', 'reddedildi', 'reddeden']
const transactionWords = ['tx-001', 'tx-002', 'tx-003', 'tx001', 'tx002', 'tx003', 'pay dağılım', 'pay dagilim', 'yabancı yatırımcı', 'yabanci yatirimci', 'kurumsal eylem', 'hak kullanım', 'temettü', 'temettu', 'bedelsiz', 'bedelli']
const statusWords = ['durum', 'status', 'onay bekliyor', 'tamamlandı', 'tamamlandi', 'taslak', 'draft', 'reddedildi', 'gönderildi', 'gönderildi']
const fourEyesWords = ['dört göz', 'dort goz', 'maker', 'checker', 'dortgoz', '4 göz', '4 goz']
const deadlineWords = ['deadline', 'süre', 'sure', 'son tarih', 'zaman', 'kritik', 'yaklaşan', 'yaklasan']
const auditWords = ['audit', 'log', 'kim', 'kim yaptı', 'kim yapti', 'ne zaman', 'geçmiş', 'gecmis', 'tarihçe', 'tarihce']
const spkWords = ['spk', 'bülten', 'bulten', 'basın duyuru', 'basin duyuru', 'regtech', 'uyum', 'mevzuat', 'tebliğ', 'teblig', 'açığa satış', 'aciga satis', 'halka arz', 'portföy']
const takasbankWords = ['takasbank', 'takas', 'settlement', 'teminat', 'nakit', 'menkul kıymet', 'yüklülük', 'yukumluluk', 'mutabakat', 'eşleşme', 'eslesme']
const reconciliationWords = ['mutabakat', 'reconciliation', 'excel', 'karşılaştırma', 'karsilastirma', 'fark', 'uyumsuzluk', 'eşleştirme', 'eslestirme', 'mkk mutabakat']
const dashboardWords = ['dashboard', 'ana sayfa', 'anasayfa', 'özet', 'ozet', 'kart', 'widget', 'panel', 'rapor', 'grafik', 'istatistik']
const userManagementWords = ['kullanıcı', 'kullanici', 'rol', 'yetki', 'admin', 'operation', 'approver', 'auditor', 'manager', 'hesap', 'şifre', 'sifre', 'giriş', 'giris']
const firstTimeWords = ['ilk kez', 'ilkkez', 'yeni', 'tanıtım', 'tanitim', 'nasıl kullanırım', 'nasil kullanirim', 'başlangıç', 'baslangic', 'giriş rehberi', 'giris rehberi', 'platform nedir']
const helpWords = ['yardım', 'yardim', 'ne yapmalıyım', 'ne yapmaliyim', 'nasıl', 'nasil', 'bilgi', 'rehber', 'öğren', 'ogren']

export function detectAssistantIntent(message: string): AssistantIntent {
  const lower = message.toLowerCase().trim()
  const words = lower.split(/\s+/).filter((w) => w.length > 0)

  // Greeting: short + greeting word, or standalone greeting
  if (words.length <= 2 && words.some((w) => greetingWords.includes(w))) return 'greeting'
  if (words.some((w) => greetingWords.includes(w))) return 'greeting'

  // Unclear: short + unclear word, or very short without keywords
  if (words.length <= 2 && words.some((w) => unclearWords.includes(w))) return 'unclear'
  if (message.trim().length < 10 && words.some((w) => unclearWords.includes(w))) return 'unclear'

  // First time guide (high priority for new users)
  if (words.some((w) => firstTimeWords.includes(w))) return 'first_time_guide'

  // SPK archive
  if (words.some((w) => spkWords.includes(w))) return 'spk_archive'

  // Takasbank
  if (words.some((w) => takasbankWords.includes(w))) return 'takasbank'

  // Reconciliation
  if (words.some((w) => reconciliationWords.includes(w))) return 'reconciliation'

  // Dashboard
  if (words.some((w) => dashboardWords.includes(w))) return 'dashboard'

  // User management
  if (words.some((w) => userManagementWords.includes(w))) return 'user_management'

  // Validation
  if (words.some((w) => validationWords.includes(w))) return 'validation_error'

  // Audit priority: "kim onayladı", "ne zaman gönderildi" etc.
  const hasAuditKeyword = words.some((w) => ['kim', 'ne zaman'].includes(w))
  const hasApprovalKeyword = words.some((w) => approvalWords.includes(w))
  if (hasAuditKeyword && hasApprovalKeyword) return 'audit_log'

  // Approval
  if (words.some((w) => approvalWords.includes(w))) return 'approval_flow'

  // Transaction type
  if (words.some((w) => transactionWords.includes(w))) return 'transaction_type'

  // Status
  if (words.some((w) => statusWords.includes(w))) return 'transaction_status'

  // Four eyes
  if (words.some((w) => fourEyesWords.includes(w))) return 'four_eyes'

  // Deadline
  if (words.some((w) => deadlineWords.includes(w))) return 'deadline'

  // Audit
  if (words.some((w) => auditWords.includes(w))) return 'audit_log'

  // Help
  if (words.some((w) => helpWords.includes(w))) return 'help'

  return 'unknown'
}
