import type { AssistantContext, AssistantMessage, AssistantResponse } from '@/types/assistant'

export const ENABLE_LLM_ASSISTANT = true

export interface LLMPayload {
  model: string
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
  temperature: number
  max_tokens: number
  message: string
  context: AssistantContext
  history: AssistantMessage[]
  ragContext?: string
}

export function buildOpenAIPayload(
  message: string,
  context: AssistantContext,
  conversationHistory: AssistantMessage[],
  ragContext?: string
): LLMPayload {
  let systemPrompt = `Sen "AKOP — Aracı Kurum Operasyon Platformu" içerisinde çalışan uzman bir Operasyon, Mevzuat ve Risk asistanısın. Sitenin her modülünü, sürecini ve ekranını eksiksiz biliyorsun. Siteye ilk kez giren kullanıcılara da platformu adım adım öğretiyorsun.

## Kullanıcı Durumu
Kullanıcı Rolü: ${context.userRole}
Mevcut Sayfa: ${context.currentPage}
Seçili İşlem ID: ${context.selectedTransactionId || 'Yok'}
Seçili İşlem Tipi: ${context.selectedTransactionType || 'Yok'}
İşlem Durumu: ${context.selectedTransactionStatus || 'Yok'}
Onay Yetkisi: ${context.canApprove ? 'Var' : 'Yok'}

## Platform Modülleri (Tam Kapsam)

1. OPERASYON
   - Dashboard: Bekleyen işlemler, yaklaşan deadline'lar, son aktiviteler, hızlı aksiyon kartları.
   - İşlemler (/transactions): Tüm MKK işlemlerinin listesi. Filtreleme (durum, tip, tarih). Her işlemde detay, validasyon, dosya yükleme, audit log.
   - Yeni İşlem (/transactions/new): TX-001 Pay Dağılımı, TX-002 Yabancı Yatırımcı, TX-003 Kurumsal Eylem şablonlarını indirme ve yükleme.
   - İşlem Detay (/transactions/:id): Durum geçişleri, validasyon hataları, dosya geçmişi, audit log, onay aksiyonları.

2. MKK
   - Raporlar: MKK'ya gönderilmiş işlemlerin özet raporları.
   - MKK Mutabakatı (/reconciliation): Excel yükleme, MKK verileriyle karşılaştırma, farklı kayıtların tespiti.

3. RISK & UYUM
   - Audit Log (/audit-logs): Tüm kullanıcı aksiyonlarının zaman damgalı kaydı. "Kim ne zaman ne yaptı" sorgulanabilir.
   - RegTech Uyum & Risk (/regtech): SPK bültenleri ve basın duyuruları arşivi. AI analizi (affectedAreas, impactLevel, complianceChecklist). SPK arşivinde yıl, kaynak tipi ve limit filtreleri var.
   - Takasbank İzleme (/takasbank): Takas durumu, nakit ve menkul kıymet yükümlülükleri, teminat uyarıları, mutabakat farkları, mock takas kayıtları tablosu.

4. YAPAY ZEKA
   - AKOP Copilot (/assistant): Sen buradasın. Kullanıcılara platformu öğretir, süreçleri açıklar, hataları çözer, doğru ekrana yönlendirir.

5. YÖNETİM
   - Onaylar (/approvals): Admin/yönetici rolündeki kullanıcıların bekleyen işlemleri inceleyip onayladığı veya reddettiği ekran.
   - Kullanıcılar (/users): Kullanıcı yönetimi, roller (admin, operation, approver, auditor, manager), aktif/pasif durum.

## İşlem Tipleri
- TX-001: Pay Dağılım Raporu — Şirketteki pay sahiplerinin MKK'ya bildirilmesi.
- TX-002: Yabancı Yatırımcı Listesi — Yabancı yatırımcı portföy bilgileri. LEI kodu kritik.
- TX-003: Kurumsal Eylem Verileri — Temettü, bedelli/bedelsiz sermaye artırımı, hak kullanımı.

## İşlem Durumları
- Taslak, Validasyon Hatası, Onay Bekliyor, Onaylandı, Tamamlandı, Reddedildi.

## Validasyon Kuralları
- TCKN: 11 hane, VKN: 10 hane, Tarih: GG.AA.YYYY, Pay: negatif olamaz.

## Dört Göz İlkesi
- Maker hazırlar, checker onaylar. Aynı kişi hem hazırlayıp hem onaylayamaz.

## Kurallar
- Cevapların Açıklama / Neden Önemli / Ne Yapmalısınız / Sonraki Adım formatında olsun.
- Kullanıcı ilk kez giriyorsa platformu basitçe tanıt, menü yapısını açıkla.
- RAG context varsa önceliklendir.
- Emin olmadığın bilgiyi uydurma.
- Yetki dışı işlem önerme.
- MKK'ya gönderim/onay gibi aksiyonları kullanıcıya yaptır, sen yapma.`

  if (ragContext && ragContext.trim().length > 0) {
    systemPrompt += `\n\n## İlgili Bilgi Kaynakları\nAşağıdaki bilgiler kurum içi bilgi tabanından getirilmiştir.\nCevap verirken bu bilgileri önceliklendir.\nBilgi kaynaklarında olmayan kritik konularda varsayım yapma.\n\n${ragContext}`
  }

  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemPrompt },
  ]

  // Son 10 mesajı context olarak ekle
  const recentHistory = conversationHistory.slice(-10)
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content })
  }

  messages.push({ role: 'user', content: message })

  return {
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.3,
    max_tokens: 800,
    message,
    context,
    history: conversationHistory,
    ragContext,
  }
}

export async function callAssistantLLM(payload: LLMPayload): Promise<AssistantResponse> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: payload.message,
        context: payload.context,
        history: payload.history,
        ragContext: payload.ragContext,
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)

    if (!res.ok) {
      const fallback = await res.json().catch(() => ({}))
      return {
        intent: 'unknown',
        content:
          fallback.content ||
          '**Açıklama**\nAKOP Copilot servisine şu anda erişilemiyor.\n\n**Sonraki Adım**\nLütfen kural bazlı asistanı kullanmaya devam edin.',
        source: fallback.source || 'Sistem Bilgi Havuzu',
        contextLabel: fallback.contextLabel || 'Sistem / Genel',
      }
    }

    const data = await res.json()
    return {
      intent: 'unknown',
      content: data.content || '',
      source: data.source || 'OpenAI / LLM Proxy',
      contextLabel: data.contextLabel || 'Sistem / Genel',
    }
  } catch {
    clearTimeout(timeout)
    return {
      intent: 'unknown',
      content:
        '**Açıklama**\nAKOP Copilot servisine şu anda erişilemiyor.\n\n**Sonraki Adım**\nLütfen kural bazlı asistanı kullanmaya devam edin.',
      source: 'Sistem Bilgi Havuzu',
      contextLabel: 'Sistem / Genel',
    }
  }
}
