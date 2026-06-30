---
id: dort-goz-ilkesi
title: Dört Göz İlkesi ve Onay Süreci
category: approval
sourceType: internal_knowledge
version: 0.1
lastUpdated: 2026-06-17
---

# Dört Göz İlkesi ve Onay Süreci

## Amaç

MKK operasyonlarında aynı kişinin hem hazırlayıp hem onaylamasını önlemek. Operasyon kullanıcısı (maker) işlemi hazırlar, Yönetici/Admin (checker) kontrol edip onaylar.

## Ne Zaman Kullanılır?

- Her MKK işlemi onay adımına ulaştığında
- Validasyon başarılı tamamlandığında
- MKK'ya gönderim öncesinde

## Kritik Kurallar

- Operasyon kullanıcısı: İşlemi oluşturur, dosyayı yükler, validasyonu tamamlar.
- Yönetici/Admin: İşlemi inceleyip onaylar veya reddeder.
- Aynı kişi hem hazırlayıcı hem onaylaycı olamaz.
- Onay verirken veya reddederken mutlaka yorum eklenmelidir.
- Reddedilen işlem revize edilip tekrar gönderilebilir.

## Sık Hatalar

- Onay verilirken detaylı inceleme yapılmaz.
- Red sebebi yetersiz yazılır.
- Onaylanmış işlem üzerinde tekrar değişiklik yapılmaya çalışılır.
- Operasyon kullanıcısı onay yetkisini beklerken işlemi siler.

## Kullanıcıya Önerilecek Sonraki Adım

**Admin:** Onaylar menüsünden bekleyen işlemleri listeleyin, detayları inceleyip MKK'ya Gönder ve Onayla butonunu kullanın.

**Operasyon:** İşlemi hazırlayıp Onay Bekliyor durumuna getirin, yöneticinin onaylamasını bekleyin.
