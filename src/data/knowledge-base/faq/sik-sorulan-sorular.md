---
id: sik-sorulan-sorular
title: Sık Sorulan Sorular
category: faq
sourceType: internal_knowledge
version: 0.1
lastUpdated: 2026-06-17
---

# Sık Sorulan Sorular

## 1. Validasyon hatası nedir?

Validasyon hatası, yüklenen Excel/CSV dosyasındaki verilerin MKK format kurallarına uymaması durumudur. Örneğin TCKN 11 hane değilse, VKN 10 hane değilse veya tarih formatı hatalıysa sistem işlemi durdurur.

**Çözüm:** İşlem detayına gidin ve "Validasyon" sekmesine tıklayın. Hata tablosunda hangi satır ve alanda sorun olduğunu belirleyin, düzeltin ve dosyayı tekrar yükleyin.

---

## 2. Onay akışı nasıl işler?

**Admin rolü:** Onay Bekliyor durumundaki işlemleri inceleyip MKK'ya gönderebilir. Onaylar menüsünden bekleyen işlemleri listeleyin, detayları inceleyip "MKK'ya Gönder ve Onayla" butonunu kullanın.

**Operasyon rolü:** İşlemi oluşturun, dosyayı yükleyin ve validasyonu tamamlayın. İşlem Onay Bekliyor durumuna geçince yöneticinin onaylamasını bekleyin.

---

## 3. TX-002 nedir?

TX-002 Yabancı Yatırımcı Listesi, yabancı yatırımcıların portföy bilgilerinin MKK'ya bildirilmesidir. Yabancı pay sahipliği oranlarının doğru takibi sermaye piyasası şeffaflığı için zorunludur.

**Kritik Kontroller:**
- Yabancı kimlik numarası veya LEI kodu zorunludur.
- Ülke kodu doğru ve standart olmalıdır.
- Portföy miktarı ve tarihi eksiksiz girilmelidir.

---

## 4. İşlem durumları nelerdir?

- **Taslak:** İşlem oluşturuldu, henüz dosya yüklenmedi.
- **Validasyon Hatası:** Dosyada format hatası var, düzeltme gerekli.
- **Onay Bekliyor:** Validasyon başarılı, yetkili onayı bekleniyor.
- **Onaylandı:** İşlem onaylandı, MKK'ya gönderime hazır.
- **Tamamlandı:** İşlem doğrulandı, onaylandı ve MKK'ya gönderildi.

---

## 5. Bu işlemi kim onayladı?

İşlem detayına gidin ve "Audit Log" sekmesine tıklayın. Oluşturan, onaylayan, reddeden kullanıcıları ve zaman damgalarını inceleyin. Audit Log, her işlemde yapılan tüm aksiyonların kaydıdır.

---

## 6. Dört Göz İlkesi nedir?

Aynı kişinin hem hazırlayıp hem onaylamasını önlemek için uygulanır. Operasyon kullanıcısı işlemi hazırlar, Yönetici kontrol edip onaylar. Bu ilke, MKK operasyonlarında riski minimize eder.

---

## 7. Deadline ne demek?

MKK işlemlerinin belirli teslim süreleridir. Dashboard'daki "Yaklaşan Kritik Süreler" widget'ı kırmızı (acil) ve amber (yaklaşan) işlemleri gösterir. Deadline geçen işlemler operasyonel risk taşır.
