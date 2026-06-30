# AKOP RAG Bilgi Tabanı

Bu klasör, AKOP asistanı için RAG (Retrieval-Augmented Generation) bilgi tabanının statik temelini oluşturur.

## Amaç

İleride OpenAI veya benzeri bir LLM entegre edildiğinde, sistem bağlamını zenginleştirmek için yapılandırılmış bilgi kaynakları sağlamak.

## Mevcut Durum

- Şu anda statik bir bilgi tabanıdır.
- Her bilgi parçası markdown dosyaları şeklinde tutulur.
- `frontmatter` metadata alanları (id, title, category, sourceType, version, lastUpdated) arama ve retrieval için kullanılabilir.
- Embedding, vector database veya vektörel arama henüz uygulanmamıştır.

## Klasör Yapısı

| Klasör | İçerik |
|--------|--------|
| `tx/` | MKK işlem tipleri (TX-001, TX-002, TX-003) |
| `validation/` | Validasyon kuralları ve format gereksinimleri |
| `approval/` | Onay süreçleri ve Dört Göz İlkesi |
| `audit/` | Audit log ve işlem geçmişi rehberi |
| `deadlines/` | Operasyonel süre ve takvim kuralları |
| `faq/` | Sık sorulan sorular ve kısa cevaplar |

## Gelecek Plan

### Faz 4 — RAG Altyapısı

1. Markdown dosyaları chunk'lara bölünecek.
2. Her chunk için embedding vektörü üretilecek.
3. Metadata alanları (id, title, category) indekslenecek.
4. Vektör veritabanı (örn. Pinecone, Weaviate veya basit cosin skoru) entegre edilecek.

### Faz 5 — Backend Proxy Entegrasyonu

- Kullanıcı sorusu backend'e gönderilecek.
- Backend önce vector DB'de arama yaparak ilgili chunk'ları bulacak.
- Bulunan chunk'lar LLM prompt'unun context bölümüne enjekte edilecek.
- LLM, RAG bilgisiyle zenginleştirilmiş cevap üretecek.

## Metadata Formatı

Her markdown dosyası şu frontmatter'ı içermelidir:

```yaml
---
id: tx-001-pay-dagilim
title: TX-001 Pay Dağılım Raporu
category: tx
sourceType: internal_knowledge
version: 0.1
lastUpdated: 2026-06-17
---
```

## RAG Smoke Test

`src/services/rag.test-cases.ts` dosyası, statik knowledge registry üzerinde retrieval doğruluğunu test etmek için kullanılır.

Bu testler development sırasında manuel import edilerek veya console'dan çağrılarak kullanılabilir:

```typescript
import { runRagSmokeTests } from '@/services/rag.test-cases'
runRagSmokeTests()
```

Test edilen senaryolar:
- "TX-002 nedir?" → TX-002 dokümanı
- "TCKN 11 hane hatası aldım" → Validasyon kuralları
- "bu işlemi kim onayladı?" → Audit log rehberi
- "deadline ne demek?" → Operasyon takvim kuralları
- "dört göz ilkesi nedir?" → Onay süreci
- "TX-003 temettü hatası" → Kurumsal eylem dokümanı

> Not: Bu test dosyası production runtime'ına bağlanmaz.

## Notlar

- Bu dosyalar frontend bundle'a dahil edilmeyecek. Yalnızca backend retrieval sürecinde kullanılacak.
- İçerik sürümü değiştikçe `version` ve `lastUpdated` alanları güncellenmeli.
