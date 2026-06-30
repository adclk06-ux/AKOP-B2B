---
id: tx-001-pay-dagilim
title: TX-001 Pay Dağılım Raporu
category: tx
sourceType: internal_knowledge
version: 0.1
lastUpdated: 2026-06-17
---

# TX-001 Pay Dağılım Raporu

## Amaç

Bir şirketteki pay sahiplerinin dağılımını MKK'ya (Merkezi Kayıt Kuruluşu) bildirmek için kullanılır. Pay sahipliği bilgilerinin eksik veya hatalı bildirilmesi yasal zorunluluğun ihlali anlamına gelir.

## Ne Zaman Kullanılır?

- Şirket pay yapısında değişiklik olduğunda
- Yıllık düzenli pay dağılım bildirimlerinde
- Yeni pay sahibi eklendiğinde veya çıkarıldığında

## Kritik Kurallar

- TCKN: 11 hane, sadece rakam olmalıdır.
- VKN: 10 hane, sadece rakam olmalıdır.
- Pay miktarı: Negatif olamaz, maksimum 2 ondalık basamak olabilir.
- Pay tutarı: Kuruş hassasiyetinde doğru olmalıdır.
- Her pay sahibi için en az bir tanımlayıcı (TCKN/VKN/Yabancı Kimlik) zorunludur.

## Sık Hatalar

- TCKN/VKN rakam sayısı yanlış girilir (10 veya 12 hane).
- Pay miktarı negatif veya fazla ondalık basamaklı girilir.
- Aynı pay sahibi birden fazla kez listelenir.
- Tarih formatı hatalıdır (GG.AA.YYYY yerine farklı format).

## Kullanıcıya Önerilecek Sonraki Adım

Yeni İşlem ekranından "Pay Dağılımı" şablonunu indirip verileri doldurun. Yüklemeden önce validasyonu çalıştırın.
