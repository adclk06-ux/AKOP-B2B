---
id: mkk-validation-rules
title: MKK Validasyon Kuralları
category: validation
sourceType: internal_knowledge
version: 0.1
lastUpdated: 2026-06-17
---

# MKK Validasyon Kuralları

## Amaç

Yüklenen Excel/CSV dosyasındaki verilerin MKK format kurallarına uygunluğunu kontrol etmek. Format hatası olan işlemler MKK'ya iletilemez ve operasyonel süreç durur.

## Ne Zaman Kullanılır?

- Dosya yükleme sonrası otomatik olarak
- Kullanıcı manuel validasyon tetiklediğinde
- Onay öncesi kontrol olarak

## Kritik Kurallar

- TCKN: 11 hane, sadece rakam.
- VKN: 10 hane, sadece rakam.
- LEI: 20 karakter, alfanümerik.
- Tarih: GG.AA.YYYY formatında olmalı.
- Pay miktarı: Negatif olamaz, maksimum 2 ondalık.
- Tutar alanları: Kuruş hassasiyetinde.

## Sık Hatalar

- TCKN/VKN rakam sayısı yanlış (10, 12, 9 hane gibi).
- Tarih formatı hatalı (AA.GG.YYYY veya YYYY-AA-GG gibi).
- Boş hücreler zorunlu alanlarda bırakılır.
- Ondalık ayracı olarak nokta yerine virgül kullanılır.
- Türkçe karakter sorunları (ı, ş, ç, ö gibi karakterler hatalı kodlanır).

## Kullanıcıya Önerilecek Sonraki Adım

İşlem detayına gidin ve "Validasyon" sekmesine tıklayın. Hata tablosunda hangi satır ve alanda sorun olduğunu belirleyin. Düzeltilmiş dosyayı tekrar yükleyin.
