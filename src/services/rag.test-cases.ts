import { debugRetrieveKnowledge } from './rag'

interface RagTestCase {
  query: string
  expectedTopDocumentId: string
}

const testCases: RagTestCase[] = [
  {
    query: 'TX-002 nedir?',
    expectedTopDocumentId: 'tx-002-yabanci-yatirimci',
  },
  {
    query: 'TCKN 11 hane hatası aldım',
    expectedTopDocumentId: 'mkk-validation-rules',
  },
  {
    query: 'bu işlemi kim onayladı?',
    expectedTopDocumentId: 'audit-log-rehberi',
  },
  {
    query: 'deadline ne demek?',
    expectedTopDocumentId: 'operasyon-takvim-kurallari',
  },
  {
    query: 'dört göz ilkesi nedir?',
    expectedTopDocumentId: 'dort-goz-ilkesi',
  },
  {
    query: 'TX-003 temettü hatası',
    expectedTopDocumentId: 'tx-003-kurumsal-eylem',
  },
]

export function runRagSmokeTests(): {
  total: number
  passed: number
  failed: number
  results: {
    query: string
    expected: string
    actual: string | null
    passed: boolean
    score: number
  }[]
} {
  const results = testCases.map((tc) => {
    const debug = debugRetrieveKnowledge(tc.query)
    const top = debug.results[0] || null
    const passed = top?.id === tc.expectedTopDocumentId

    return {
      query: tc.query,
      expected: tc.expectedTopDocumentId,
      actual: top?.id ?? null,
      passed,
      score: top?.score ?? 0,
    }
  })

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  // eslint-disable-next-line no-console
  console.log('=== RAG Smoke Test Sonuçları ===')
  // eslint-disable-next-line no-console
  console.table(
    results.map((r) => ({
      Query: r.query,
      Expected: r.expected,
      Actual: r.actual,
      Score: r.score.toFixed(1),
      Status: r.passed ? 'PASS' : 'FAIL',
    }))
  )
  // eslint-disable-next-line no-console
  console.log(`Toplam: ${results.length} | Geçti: ${passed} | Kaldı: ${failed}`)

  return { total: results.length, passed, failed, results }
}
