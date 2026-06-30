import type { AssistantContext, AssistantResponse, AssistantMessage } from '@/types/assistant'
import { detectAssistantIntent } from './assistantIntent'
import { ENABLE_LLM_ASSISTANT, buildOpenAIPayload, callAssistantLLM } from './openai'
import { retrieveKnowledgeForIntent, buildKnowledgeContext } from './rag'

function section(title: string, body: string) {
  return `**${title}**\n${body}`
}

function buildContextLabel(ctx: AssistantContext): string {
  const roleLabel = ctx.userRole === 'admin' ? 'Admin' : 'Operasyon'
  const pageMap: Record<string, string> = {
    '/': 'Dashboard',
    '/transactions': 'İşlemler',
    '/transactions/new': 'Yeni İşlem',
    '/approvals': 'Onaylar',
    '/users': 'Kullanıcılar',
    '/reports': 'Raporlar',
    '/audit-logs': 'Audit Log',
    '/assistant': 'Asistan',
  }
  const page = pageMap[ctx.currentPage] || 'Genel'
  const tx = ctx.selectedTransactionType || 'Genel Yardım'
  return `${roleLabel} / ${page} / ${tx}`
}

function getSource(intent: string): string {
  switch (intent) {
    case 'transaction_type':
      return 'MKK İşlem Kataloğu'
    case 'validation_error':
      return 'MKK Validasyon Kuralları'
    case 'approval_flow':
      return 'Operasyon Prosedürü'
    case 'audit_log':
      return 'Denetim ve Loglama Rehberi'
    case 'deadline':
      return 'Operasyon Takvim Kuralları'
    case 'four_eyes':
      return 'Dört Göz İlkesi Prosedürü'
    case 'transaction_status':
      return 'İşlem Durum Rehberi'
    default:
      return 'Sistem Bilgi Havuzu'
  }
}

function greetingResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'greeting',
    content: [
      section('Merhaba', 'AKOP Copilot\'a hoş geldiniz. SPK, MKK, Takasbank ve operasyon süreçleri için yapay zeka destekli yardımcınızım.'),
      '',
      section('Ne yapabilirim?', [
        `İşlem numarası vererek (örn: TX-002) işlem özelinde bilgi alabilirsiniz.`,
        `Aldığınız validasyon hata mesajını yazabilirsiniz.`,
        `Onay akışı veya Dört Göz İlkesi hakkında soru sorabilirsiniz.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'İşlem numarası, hata mesajı veya merak ettiğiniz süreci yazabilirsiniz.'),
    ].join('\n'),
  }
}

function unclearResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'unclear',
    content: [
      section('Merhaba', 'Size yardımcı olabilmem için biraz daha bilgiye ihtiyacım var.'),
      '',
      section('Ne Yapmalısınız?', [
        `İşlem numarası paylaşın (örn: TX-002, TX-003)`,
        `Bulunduğunuz ekranı belirtin (örn: Validasyon, Onaylar, Yeni İşlem)`,
        `Aldığınız hata mesajını yazın (örn: "TCKN 11 hane olmalı")`,
        `Ya da hızlı sorulardan birini seçin.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'Lütfen hangi konuda yardım almak istediğinizi kısaca yazın.'),
    ].join('\n'),
  }
}

function validationErrorResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'validation_error',
    content: [
      section('Açıklama', 'Validasyon hatası, yüklenen Excel/CSV dosyasındaki verilerin MKK format kurallarına uymaması durumudur. Örneğin TCKN 11 hane değilse, VKN 10 hane değilse veya tarih formatı hatalıysa sistem işlemi durdurur.'),
      '',
      section('Neden Önemli?', 'Format hatası olan işlemler MKK\'ya iletilemez ve operasyonel süreç durur. Her kayıt standartlara uygun olmalıdır.'),
      '',
      section('Ne Yapmalısınız?', [
        `İşlem detayına gidin ve "Validasyon" sekmesine tıklayın.`,
        `Hata tablosunda hangi satır ve alanda sorun olduğunu belirleyin.`,
        `TCKN: 11 haneli, sadece rakam olmalı.`,
        `VKN: 10 haneli, sadece rakam olmalı.`,
        `Tarih: GG.AA.YYYY formatında olmalı.`,
        `Düzeltilmiş dosyayı tekrar yükleyin.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'Dosyayı düzelttikten sonra işlem detayına gidip "Dosyalar" sekmesinden yeni dosyayı yükleyin.'),
    ].join('\n'),
  }
}

function approvalFlowResponse(ctx: AssistantContext): AssistantResponse {
  if (ctx.userRole === 'admin') {
    return {
      intent: 'approval_flow',
      content: [
        section('Açıklama', 'Admin rolündesiniz. Onay Bekliyor durumundaki işlemleri inceleyip MKK\'ya gönderebilirsiniz.'),
        '',
        section('Ne Yapmalısınız?', [
          `"Onaylar" menüsünden bekleyen işlemleri listeleyin.`,
          `İşlem detayına girin; dosya, validasyon ve kayıt sayısını kontrol edin.`,
          `Uygunsa "MKK\'ya Gönder ve Onayla" butonunu kullanın.`,
          `Reddetmek gerekiyorsa nedenini belirtin ve "Reddet" seçeneğini kullanın.`,
        ].join('\n')),
        '',
        section('Sonraki Adım', 'Onaylar menüsüne giderek bekleyen işlemleri inceleyin.'),
      ].join('\n'),
    }
  }

  return {
    intent: 'approval_flow',
    content: [
      section('Açıklama', 'Operasyon rolünde işlemi hazırlayıp validasyondan geçirirsiniz. Ardından işlem Onay Bekliyor durumuna geçer.'),
      '',
      section('Ne Yapmalısınız?', [
        `İşlemi oluşturun, dosyayı yükleyin ve validasyonu tamamlayın.`,
        `İşlem "Onay Bekliyor" durumuna geçince bekleyin.`,
        `Dört Göz İlkesi gereği nihai onayı yönetici verir.`,
        `Yönetici onayladıktan sonra işlem MKK\'ya gönderilir.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'İşlem durumunu İşlemler ekranından takip edebilirsiniz.'),
    ].join('\n'),
  }
}

function transactionTypeResponse(_ctx: AssistantContext, query: string): AssistantResponse {
  const lower = query.toLowerCase()

  if (lower.includes('tx-001') || lower.includes('pay dağılım') || lower.includes('pay dagilim')) {
    return {
      intent: 'transaction_type',
      content: [
        section('Açıklama', 'TX-001 Pay Dağılım Raporu, bir şirketteki pay sahiplerinin dağılımını MKK\'ya bildirmek için kullanılır.'),
        '',
        section('Neden Önemli?', 'Pay sahipliği bilgilerinin eksik veya hatalı bildirilmesi yasal zorunluluğun ihlali anlamına gelir.'),
        '',
        section('Kritik Kontroller', [
          `TCKN: 11 hane, sadece rakam.`,
          `VKN: 10 hane, sadece rakam.`,
          `Pay miktarı: Negatif olamaz, maksimum 2 ondalık.`,
        ].join('\n')),
        '',
        section('Sonraki Adım', 'Yeni İşlem ekranından "Pay Dağılımı" şablonunu indirip verileri doldurun.'),
      ].join('\n'),
    }
  }

  if (lower.includes('tx-002') || lower.includes('yabancı yatırımcı') || lower.includes('yabanci yatirimci')) {
    return {
      intent: 'transaction_type',
      content: [
        section('Açıklama', 'TX-002 Yabancı Yatırımcı Listesi, yabancı yatırımcıların portföy bilgilerinin MKK\'ya bildirilmesidir.'),
        '',
        section('Neden Önemli?', 'Yabancı pay sahipliği oranlarının doğru takibi sermaye piyasası şeffaflığı için zorunludur.'),
        '',
        section('Kritik Kontroller', [
          `Yabancı kimlik numarası veya LEI kodu zorunludur.`,
          `Ülke kodu doğru ve standart olmalıdır.`,
          `Portföy miktarı ve tarihi eksiksiz girilmelidir.`,
        ].join('\n')),
        '',
        section('Sonraki Adım', 'Yeni İşlem ekranından "Yabancı Yatırımcı Listesi" şablonunu indirip LEI kodunu kontrol edin.'),
      ].join('\n'),
    }
  }

  if (lower.includes('tx-003') || lower.includes('kurumsal eylem') || lower.includes('temettü') || lower.includes('bedelsiz') || lower.includes('bedelli') || lower.includes('hak kullanım')) {
    return {
      intent: 'transaction_type',
      content: [
        section('Açıklama', 'TX-003 Kurumsal Eylem Verileri; temettü, bedelli/bedelsiz sermaye artırımı, hak kullanımı ve genel kurul gibi süreçlerin MKK\'ya bildirilmesidir.'),
        '',
        section('Neden Önemli?', 'Kurumsal eylemler yatırımcı haklarını doğrudan etkiler. Hatalı bildirim maddi zarara ve yasal yaptırıma yol açar.'),
        '',
        section('Kritik Kontroller', [
          `Tarihler GG.AA.YYYY formatında olmalı.`,
          `Tutar alanları kuruş hassasiyetinde doğru olmalı.`,
          `Hak kullanım oranları doğru girilmeli.`,
          `Risk Seviyesi: Çok yüksek. Çift kontrol yapılmalı.`,
        ].join('\n')),
        '',
        section('Sonraki Adım', 'Yeni İşlem ekranından "Kurumsal Eylem" şablonunu indirip tarih ve tutar alanlarını çift kontrol edin.'),
      ].join('\n'),
    }
  }

  return {
    intent: 'transaction_type',
    content: [
      section('Açıklama', 'MKK işlem tipleri şunlardır: TX-001 Pay Dağılımı, TX-002 Yabancı Yatırımcı Listesi, TX-003 Kurumsal Eylem.'),
      '',
      section('Ne Yapmalısınız?', [
        `Sormak istediğiniz işlem tipinin kodunu veya adını yazın (örn: TX-001, Pay Dağılımı).`,
        `İşlem hakkında detaylı bilgi ve validasyon kurallarını öğrenebilirsiniz.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'Hangi işlem tipi hakkında bilgi almak istediğinizi yazın.'),
    ].join('\n'),
  }
}

function transactionStatusResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'transaction_status',
    content: [
      section('Açıklama', 'Her MKK işlemi bir yaşam döngüsüne sahiptir. Durum takibi operasyon kontrolünün temelidir.'),
      '',
      section('İşlem Durumları', [
        `Taslak: İşlem oluşturuldu, henüz dosya yüklenmedi.`,
        `Validasyon Hatası: Dosyada format hatası var, düzeltme gerekli.`,
        `Onay Bekliyor: Validasyon başarılı, yetkili onayı bekleniyor.`,
        `Onaylandı: İşlem onaylandı, MKK\'ya gönderime hazır.`,
        `Tamamlandı: İşlem doğrulandı, onaylandı ve MKK\'ya gönderildi.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'İşleminizin hangi durumda olduğunu kontrol etmek için İşlem Listesi\'ne gidin.'),
    ].join('\n'),
  }
}

function fourEyesResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'four_eyes',
    content: [
      section('Açıklama', 'MKK operasyonlarında Dört Göz İlkesi (maker-checker) uygulanır. Operasyon kullanıcısı işlemi hazırlar, Yönetici kontrol edip onaylar.'),
      '',
      section('Neden Önemli?', 'Aynı kişinin hem hazırlayıp hem onaylaması risk oluşturur. MKK süreçlerinde bu ayrım zorunludur.'),
      '',
      section('Ne Yapmalısınız?', [
        `Operasyon kullanıcısı: İşlemi oluşturun, dosyayı yükleyin, validasyonu tamamlayın.`,
        `Operasyon kullanıcısı: İşlem "Onay Bekliyor" durumuna geçince bekleyin.`,
        `Yönetici: "Onaylar" menüsünden işlemi açın, detayları inceleyin.`,
        `Yönetici: Onay verirken veya reddederken mutlaka yorum ekleyin.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'Rolünüze göre işlemi hazırlayın veya Onaylar ekranından inceleyin.'),
    ].join('\n'),
  }
}

function deadlineResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'deadline',
    content: [
      section('Açıklama', 'MKK işlemlerinin belirli teslim süreleri vardır. Deadline yaklaşan veya geçmiş işlemler operasyonel risk taşır.'),
      '',
      section('Ne Yapmalısınız?', [
        `Dashboard\'taki "Yaklaşan Kritik Süreler" widget\'ını kontrol edin.`,
        `Kırmızı/amber renkli kartlar acil işlemleri gösterir.`,
        `İşlemi hemen tamamlayın veya yetkiliye iletin.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'Dashboard\'tan deadline durumunu kontrol edin veya işlem detayındaki tarih bilgisini inceleyin.'),
    ].join('\n'),
  }
}

function auditLogResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'audit_log',
    content: [
      section('Açıklama', 'Audit Log, her işlemde yapılan tüm aksiyonların kim tarafından ne zaman gerçekleştirildiğinin kaydıdır.'),
      '',
      section('Ne Yapmalısınız?', [
        `İşlem detayına gidin ve "Audit Log" sekmesine tıklayın.`,
        `Oluşturan, onaylayan, reddeden kullanıcıları görün.`,
        `Zaman damgaları ile süreç süresini analiz edin.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'İşlem detayındaki Audit Log sekmesinden geçmiş aksiyonları inceleyin.'),
    ].join('\n'),
  }
}

function helpResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'help',
    content: [
      section('Yardım', 'Size MKK süreçleri hakkında şu konularda yardımcı olabilirim:'),
      '',
      [
        `• Validasyon hataları ve çözümleri`,
        `• Onay akışı ve Dört Göz İlkesi`,
        `• İşlem tipleri (TX-001, TX-002, TX-003)`,
        `• İşlem durumları ve takibi`,
        `• Audit Log ve geçmiş sorgulama`,
      ].join('\n'),
      '',
      section('Sonraki Adım', 'Hangi konuda yardım almak istediğinizi yazın veya hızlı sorulardan birini seçin.'),
    ].join('\n'),
  }
}

function spkArchiveResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'spk_archive',
    content: [
      section('Açıklama', 'RegTech Uyum & Risk ekranında SPK bültenleri ve basın duyuruları birleşik arşivi bulunur. Sistem 2000 yılından günümüze kadar olan SPK yayınlarını otomatik çeker ve AI ile analiz eder.'),
      '',
      section('Ne Yapabilirsiniz?', [
        `Arşivde yıl, kaynak tipi (bülten/basın duyurusu) ve limit filtresi kullanabilirsiniz.`,
        `Her kayda tıklayıp AI analizi (etkilenen alanlar, uyum checklisti, etki seviyesi) görebilirsiniz.`,
        `PDF yükleme ile kendi belgelerinizi analiz ettirebilirsiniz.`,
        `affectedAreas: Uyum, Risk, Operasyon, MKK, Takasbank, MASAK, Açığa Satış, Halka Arz, Portföy Yönetimi.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'RegTech Uyum & Risk menüsünden SPK Arşivi sekmesine gidin.'),
    ].join('\n'),
  }
}

function takasbankResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'takasbank',
    content: [
      section('Açıklama', 'Takasbank İzleme ekranı, aracı kurumların takas yükümlülüklerini, teminat durumunu ve mutabakat farklarını gerçek zamanlı takip eder.'),
      '',
      section('Takip Edilen Alanlar', [
        `Takas Durumu: Gün içi piyasa takası ve settlement bilgileri.`,
        `Nakit Yükümlülükleri: Açık pozisyonlara karşılık nakit borç/alacak takibi.`,
        `Menkul Kıymet Yükümlülükleri: Açık pozisyonlara karşılık menkul kıymet borç/alacak takibi.`,
        `Teminat Uyarıları: Eksik veya azalan teminat bildirimleri.`,
        `Mutabakat Farkları: MKK ile Takasbank kayıtları arasındaki farklılıklar.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'Risk & Uyum menüsünden Takasbank İzleme sayfasına gidin.'),
    ].join('\n'),
  }
}

function reconciliationResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'reconciliation',
    content: [
      section('Açıklama', 'MKK Mutabakatı ekranında kendi sisteminizdeki kayıtları MKK verileriyle karşılaştırabilirsiniz. Excel dosyası yükleyerek farklı kayıtları otomatik tespit eder.'),
      '',
      section('Ne Yapmalısınız?', [
        `MKK Mutabakatı sayfasına gidin.`,
        `Sisteminizden aldığınız Excel dosyasını yükleyin.`,
        `Sistem, MKK verileriyle satır satır karşılaştırma yapar.`,
        `Farklı kayıtları (uyumsuzluk, eksik, fazla) listeleyerek raporlar.`,
        `Farklı satırları inceleyip düzeltme işlemlerini başlatın.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'MKK Mutabakatı menüsüne gidip Excel dosyanızı yükleyin.'),
    ].join('\n'),
  }
}

function dashboardResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'dashboard',
    content: [
      section('Açıklama', 'Dashboard (Ana Sayfa), operasyonun genel durumunu tek ekranda gösterir. Bekleyen işlemler, yaklaşan deadline\'lar, son aktiviteler ve hızlı aksiyon kartları burada yer alır.'),
      '',
      section('Dashboard Kartları', [
        `Bekleyen İşlemler: Onay bekleyen veya taslak durumdaki işlemler.`,
        `Yaklaşan Deadline'lar: Kritik süresi yaklaşan işlemler (kırmızı/amber renkli).`,
        `Son Aktiviteler: Son yapılan işlem hareketleri.`,
        `Hızlı Aksiyonlar: Yeni işlem oluşturma, onaylara gitme gibi kısayollar.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'Ana Sayfa\'ya giderek operasyon özetini kontrol edin.'),
    ].join('\n'),
  }
}

function userManagementResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'user_management',
    content: [
      section('Açıklama', 'Kullanıcı Yönetimi ekranında sistem kullanıcılarını ve rollerini yönetebilirsiniz. Roller: Admin, Operation, Approver, Auditor, Manager.'),
      '',
      section('Roller ve Yetkiler', [
        `Admin: Tüm yetkiler, kullanıcı yönetimi, onaylama.`,
        `Operation: İşlem oluşturma, dosya yükleme, validasyon.`,
        `Approver: Onay bekleyen işlemleri onaylama/reddetme.`,
        `Auditor: Audit log okuma, raporlama.`,
        `Manager: Dashboard ve raporları görüntüleme.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'Yönetim menüsünden Kullanıcılar sayfasına gidin.'),
    ].join('\n'),
  }
}

function firstTimeGuideResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'first_time_guide',
    content: [
      section('AKOP\'a Hoş Geldiniz', 'AKOP (Aracı Kurum Operasyon Platformu), MKK süreçlerinizi, SPK uyumunuzu, Takasbank izlemenizi ve mutabakatlarınızı tek çatı altında yönetmenizi sağlayan bir operasyon ve risk platformudur.'),
      '',
      section('Platform Menüsü', [
        `📊 Dashboard: Operasyon özetini görün — bekleyen işlemler, deadline\'lar, son aktiviteler.`,
        `📝 İşlemler: MKK işlemlerinizi listeleyin, filtreleyin, detayları inceleyin.`,
        `➕ Yeni İşlem: TX-001 (Pay Dağılımı), TX-002 (Yabancı Yatırımcı), TX-003 (Kurumsal Eylem) oluşturun.`,
        `✅ Onaylar: Bekleyen işlemleri onaylayın veya reddedin.`,
        `🔍 Audit Log: "Kim ne zaman ne yaptı" sorgulayın.`,
        `📈 RegTech: SPK bültenleri ve basın duyuruları arşivini AI ile analiz edin.`,
        `🏦 Takasbank: Takas yükümlülükleri, teminat uyarıları, mutabakat farkları.`,
        `🔄 Mutabakat: Excel ile MKK verilerini karşılaştırın.`,
        `👥 Kullanıcılar: Rol ve yetki yönetimi.`,
        `🤖 Asistan (burası): Sorularınızı sorun, süreçleri öğrenin.`,
      ].join('\n')),
      '',
      section('Başlangıç Adımları', [
        `1. Dashboard'u inceleyin — operasyon durumunu görün.`,
        `2. Bir işlem tipi seçin (TX-001, TX-002 veya TX-003).`,
        `3. Şablonu indirin, Excel'inizi doldurun ve yükleyin.`,
        `4. Validasyon başarılı olunca onay akışına gönderin.`,
        `5. Onay sonrası işlem MKK'ya iletilir.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'Hangi modül hakkında daha fazla bilgi almak istersiniz? Sorunuzu yazın veya hızlı sorulardan birini seçin.'),
    ].join('\n'),
  }
}

function unknownResponse(_ctx: AssistantContext): AssistantResponse {
  return {
    intent: 'unknown',
    content: [
      section('Açıklama', `"Bu konuda doğrudan bir bilgi bulunmuyor."`),
      '',
      section('Ne Yapmalısınız?', [
        `İşlem numarası veya hata mesajını paylaşın.`,
        `Bulunduğunuz ekranı belirtin.`,
        `Ya da hızlı sorulardan birini seçin.`,
      ].join('\n')),
      '',
      section('Sonraki Adım', 'Daha spesifik bilgi verirseniz size doğru yönlendirmeyi yapabilirim.'),
    ].join('\n'),
  }
}

function extractTxCodeFromMessage(message: string): string | undefined {
  const match = message.match(/\b(TX-\d{3})\b/)
  return match?.[1]
}

export async function generateAssistantResponse(
  message: string,
  context: AssistantContext,
  history: AssistantMessage[] = []
): Promise<AssistantResponse> {
  const intent = detectAssistantIntent(message)

  // RAG retrieval: runs for both LLM and rule-based paths
  const ragResults = retrieveKnowledgeForIntent(intent, message)
  const ragContext = ragResults.length > 0 ? buildKnowledgeContext(ragResults) : undefined

  // If message contains a TX code but context doesn't, inject it
  const txFromMessage = extractTxCodeFromMessage(message)
  const enrichedContext: AssistantContext = txFromMessage && !context.selectedTransactionType
    ? { ...context, selectedTransactionType: txFromMessage }
    : context

  if (ENABLE_LLM_ASSISTANT) {
    const payload = buildOpenAIPayload(message, enrichedContext, history, ragContext)
    const llmResponse = await callAssistantLLM(payload)
    const top = ragResults[0]
    return {
      ...llmResponse,
      source: top?.document.title || llmResponse.source || 'OpenAI / LLM Proxy',
      contextLabel: buildContextLabel(enrichedContext),
      ragDebug: top
        ? {
            topDocumentId: top.document.id,
            topDocumentTitle: top.document.title,
            score: top.score,
            matchedKeywords: top.matchedKeywords,
          }
        : undefined,
      ragContext,
    }
  }

  let response: AssistantResponse
  switch (intent) {
    case 'greeting':
      response = greetingResponse(context)
      break
    case 'unclear':
      response = unclearResponse(context)
      break
    case 'validation_error':
      response = validationErrorResponse(context)
      break
    case 'approval_flow':
      response = approvalFlowResponse(context)
      break
    case 'transaction_type':
      response = transactionTypeResponse(context, message)
      break
    case 'transaction_status':
      response = transactionStatusResponse(context)
      break
    case 'four_eyes':
      response = fourEyesResponse(context)
      break
    case 'deadline':
      response = deadlineResponse(context)
      break
    case 'audit_log':
      response = auditLogResponse(context)
      break
    case 'spk_archive':
      response = spkArchiveResponse(context)
      break
    case 'takasbank':
      response = takasbankResponse(context)
      break
    case 'reconciliation':
      response = reconciliationResponse(context)
      break
    case 'dashboard':
      response = dashboardResponse(context)
      break
    case 'user_management':
      response = userManagementResponse(context)
      break
    case 'first_time_guide':
      response = firstTimeGuideResponse(context)
      break
    case 'help':
      response = helpResponse(context)
      break
    default:
      response = unknownResponse(context)
  }

  const top = ragResults[0]
  const bestSource = top?.document.title

  return {
    ...response,
    source: bestSource || getSource(intent),
    contextLabel: buildContextLabel(context),
    ragDebug: top
      ? {
          topDocumentId: top.document.id,
          topDocumentTitle: top.document.title,
          score: top.score,
          matchedKeywords: top.matchedKeywords,
        }
      : undefined,
    ragContext,
  }
}
