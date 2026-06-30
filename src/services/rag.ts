import type { AssistantIntent } from '@/types/assistant'

export type KnowledgeCategory =
  | 'tx'
  | 'validation'
  | 'approval'
  | 'audit'
  | 'deadlines'
  | 'faq'

export interface KnowledgeDocument {
  id: string
  title: string
  category: KnowledgeCategory
  sourceType: 'internal_knowledge'
  version: string
  lastUpdated: string
  content: string
  keywords: string[]
}

export interface RetrievedKnowledge {
  document: KnowledgeDocument
  score: number
  matchedKeywords: string[]
}

const knowledgeRegistry: KnowledgeDocument[] = [
  {
    id: 'tx-001-pay-dagilim',
    title: 'TX-001 Pay Dağılım Raporu',
    category: 'tx',
    sourceType: 'internal_knowledge',
    version: '0.1',
    lastUpdated: '2026-06-17',
    content:
      `Bir şirketteki pay sahiplerinin dağılımını MKK'ya bildirmek için kullanılır. TCKN: 11 hane, VKN: 10 hane, Pay miktarı negatif olamaz.`,
    keywords: [
      'tx-001',
      'pay',
      'dağılım',
      'pay sahibi',
      'pay dağılım',
      'tckn',
      'vkn',
      'pay miktarı',
    ],
  },
  {
    id: 'tx-002-yabanci-yatirimci',
    title: 'TX-002 Yabancı Yatırımcı Listesi',
    category: 'tx',
    sourceType: 'internal_knowledge',
    version: '0.1',
    lastUpdated: '2026-06-17',
    content:
      `Yabancı yatırımcıların portföy bilgilerinin MKK'ya bildirilmesidir. LEI kodu zorunlu, ülke kodu standart olmalı.`,
    keywords: [
      'tx-002',
      'yabancı',
      'yatırımcı',
      'yabancı yatırımcı',
      'lei',
      'portföy',
      'ülke kodu',
      'yabanci',
    ],
  },
  {
    id: 'tx-003-kurumsal-eylem',
    title: 'TX-003 Kurumsal Eylem Verileri',
    category: 'tx',
    sourceType: 'internal_knowledge',
    version: '0.1',
    lastUpdated: '2026-06-17',
    content:
      `Temettü, bedelli/bedelsiz sermaye artırımı, hak kullanımı ve genel kurul gibi kurumsal eylemlerin MKK'ya bildirilmesi. Tarih GG.AA.YYYY, tutar kuruş hassasiyetinde.`,
    keywords: [
      'tx-003',
      'kurumsal',
      'eylem',
      'temettü',
      'bedelli',
      'bedelsiz',
      'hak kullanım',
      'sermaye artırım',
    ],
  },
  {
    id: 'mkk-validation-rules',
    title: 'MKK Validasyon Kuralları',
    category: 'validation',
    sourceType: 'internal_knowledge',
    version: '0.1',
    lastUpdated: '2026-06-17',
    content:
      'Yüklenen dosyadaki verilerin MKK format kurallarına uygunluğunu kontrol eder. TCKN 11 hane, VKN 10 hane, tarih GG.AA.YYYY.',
    keywords: [
      'validasyon',
      'hata',
      'tckn',
      'vkn',
      'format',
      'formatı',
      'yanlış',
      'eksik',
      'geçersiz',
      'lei',
      'tarih formatı',
    ],
  },
  {
    id: 'dort-goz-ilkesi',
    title: 'Dört Göz İlkesi ve Onay Süreci',
    category: 'approval',
    sourceType: 'internal_knowledge',
    version: '0.1',
    lastUpdated: '2026-06-17',
    content:
      'Operasyon kullanıcısı işlemi hazırlar, Yönetici/Admin kontrol edip onaylar. Aynı kişi hem hazırlayıcı hem onaylaycı olamaz.',
    keywords: [
      'onay',
      'onayla',
      'onaylama',
      'onaylandı',
      'onayladı',
      'onaylayan',
      'dört göz',
      'maker',
      'checker',
      'reddet',
      'red',
      'reddedildi',
    ],
  },
  {
    id: 'audit-log-rehberi',
    title: 'Denetim ve Loglama Rehberi',
    category: 'audit',
    sourceType: 'internal_knowledge',
    version: '0.1',
    lastUpdated: '2026-06-17',
    content:
      'Her işlemde yapılan tüm aksiyonların kim tarafından ne zaman gerçekleştirildiğinin kaydıdır. Log kayıtları silinemez.',
    keywords: [
      'audit',
      'log',
      'kim',
      'kim yaptı',
      'ne zaman',
      'geçmiş',
      'tarihçe',
      'denetim',
    ],
  },
  {
    id: 'operasyon-takvim-kurallari',
    title: 'Operasyon Takvim Kuralları',
    category: 'deadlines',
    sourceType: 'internal_knowledge',
    version: '0.1',
    lastUpdated: '2026-06-17',
    content:
      'MKK işlemlerinin belirli teslim süreleri vardır. Dashboard Yaklaşan Kritik Süreler widget kırmızı (acil) ve amber (yaklaşan) gösterir.',
    keywords: [
      'deadline',
      'süre',
      'son tarih',
      'zaman',
      'kritik',
      'yaklaşan',
      'takvim',
      'operasyon takvim',
    ],
  },
  {
    id: 'sik-sorulan-sorular',
    title: 'Sık Sorulan Sorular',
    category: 'faq',
    sourceType: 'internal_knowledge',
    version: '0.1',
    lastUpdated: '2026-06-17',
    content:
      'Validasyon hatası nedir, onay akışı nasıl işler, TX-002 nedir, işlem durumları nelerdir, kim onayladı, Dört Göz nedir, deadline ne demek gibi soruların cevapları.',
    keywords: [
      'yardım',
      'yardim',
      'ne yapmalıyım',
      'nasıl',
      'bilgi',
      'rehber',
      'öğren',
      'soru',
      'cevap',
      'faq',
    ],
  },
]

export function retrieveKnowledge(
  query: string,
  options?: {
    category?: KnowledgeCategory
    limit?: number
  }
): RetrievedKnowledge[] {
  const lowerQuery = query.toLowerCase()
  const queryWords = lowerQuery.split(/\s+/).filter((w) => w.length > 2)
  const limit = options?.limit ?? 3

  const results: RetrievedKnowledge[] = []

  for (const doc of knowledgeRegistry) {
    if (options?.category && doc.category !== options.category) {
      continue
    }

    let score = 0
    const matchedKeywords: string[] = []

    // Exact TX code match bonus (+10)
    const txCodeMatch = lowerQuery.match(/\b(tx-\d{3})\b/)
    if (txCodeMatch && doc.id.toLowerCase().startsWith(txCodeMatch[1])) {
      score += 10
      matchedKeywords.push(txCodeMatch[1])
    }

    // Keyword matching (highest weight)
    for (const kw of doc.keywords) {
      if (lowerQuery.includes(kw.toLowerCase())) {
        score += 3
        matchedKeywords.push(kw)
      }
    }

    // Title match (medium weight)
    for (const qw of queryWords) {
      if (doc.title.toLowerCase().includes(qw)) {
        score += 1
      }
    }

    // Content match (low weight)
    for (const qw of queryWords) {
      if (doc.content.toLowerCase().includes(qw)) {
        score += 0.5
      }
    }

    if (score > 0) {
      results.push({ document: doc, score, matchedKeywords })
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score)

  return results.slice(0, limit)
}

const intentToCategory: Record<AssistantIntent, KnowledgeCategory | null> = {
  greeting: null,
  unclear: null,
  validation_error: 'validation',
  approval_flow: 'approval',
  transaction_type: 'tx',
  transaction_status: 'tx',
  four_eyes: 'approval',
  deadline: 'deadlines',
  audit_log: 'audit',
  spk_archive: 'faq',
  takasbank: 'faq',
  reconciliation: 'faq',
  dashboard: 'faq',
  user_management: 'faq',
  first_time_guide: 'faq',
  help: 'faq',
  unknown: 'faq',
}

export function retrieveKnowledgeForIntent(
  intent: AssistantIntent,
  message: string
): RetrievedKnowledge[] {
  const category = intentToCategory[intent]
  if (!category) {
    // For greeting/unclear, search all categories
    return retrieveKnowledge(message, { limit: 3 })
  }
  return retrieveKnowledge(message, { category, limit: 3 })
}

export function buildKnowledgeContext(retrieved: RetrievedKnowledge[]): string {
  if (retrieved.length === 0) return ''

  const sections = retrieved.map((r) => {
    return `Kaynak: ${r.document.title}\nKategori: ${r.document.category}\nİçerik:\n${r.document.content}`
  })

  return sections.join('\n\n---\n\n')
}

export function debugRetrieveKnowledge(query: string): {
  query: string
  results: { id: string; title: string; score: number; matchedKeywords: string[] }[]
} {
  const results = retrieveKnowledge(query, { limit: 10 })
  return {
    query,
    results: results.map((r) => ({
      id: r.document.id,
      title: r.document.title,
      score: r.score,
      matchedKeywords: r.matchedKeywords,
    })),
  }
}
