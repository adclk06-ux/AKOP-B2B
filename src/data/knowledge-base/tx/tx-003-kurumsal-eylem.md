---
id: tx-003-kurumsal-eylem
title: TX-003 Kurumsal Eylem Verileri
category: tx
sourceType: internal_knowledge
version: 0.1
lastUpdated: 2026-06-17
---

# TX-003 Kurumsal Eylem Verileri

## Amaç

Temettü, bedelli/bedelsiz sermaye artırımı, hak kullanımı ve genel kurul gibi kurumsal eylemlerin MKK'ya bildirilmesidir.

## Ne Zaman Kullanılır?

- Şirket temettü dağıtım kararı aldığında
- Sermaye artırımı (bedelli veya bedelsiz) yapıldığında
- Hak kullanımı (rüçhan hakkı vb.) sürecinde
- Genel kurul toplantısı sonrası

## Kritik Kurallar

- Tarihler GG.AA.YYYY formatında olmalıdır.
- Tutar alanları kuruş hassasiyetinde doğru olmalıdır.
- Hak kullanım oranları doğru girilmelidir.
- Risk Seviyesi: Çok yüksek. Çift kontrol yapılmalıdır.
- Kurumsal eylem tipi doğru seçilmelidir (temettü, bedelsiz, bedelli, hak kullanımı).

## Sık Hatalar

- Temettü tarihi ile ödeme tarihi karıştırılır.
- Bedelsiz artırım oranı hatalı hesaplanır.
- Hak kullanım fiyatı kuruş yerine TL olarak girilir.
- Genel kurul tarihi ve kayıt tarihi aynı gün sanılır.

## Kullanıcıya Önerilecek Sonraki Adım

Yeni İşlem ekranından "Kurumsal Eylem" şablonunu indirip tarih ve tutar alanlarını çift kontrol edin. Finans ekibi ile koordinasyon sağlayın.
