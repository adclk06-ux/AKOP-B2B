---
id: tx-002-yabanci-yatirimci
title: TX-002 Yabancı Yatırımcı Listesi
category: tx
sourceType: internal_knowledge
version: 0.1
lastUpdated: 2026-06-17
---

# TX-002 Yabancı Yatırımcı Listesi

## Amaç

Yabancı yatırımcıların portföy bilgilerinin MKK'ya bildirilmesidir. Yabancı pay sahipliği oranlarının doğru takibi sermaye piyasası şeffaflığı için zorunludur.

## Ne Zaman Kullanılır?

- Yabancı yatırımcı pay sahipliği değiştiğinde
- Aylık/üç aylık periyodik bildirimlerde
- Yeni yabancı yatırımcı portföye eklendiğinde

## Kritik Kurallar

- Yabancı kimlik numarası veya LEI (Legal Entity Identifier) kodu zorunludur.
- Ülke kodu doğru ve standart (ISO 3166-1 alpha-2) olmalıdır.
- Portföy miktarı ve tarihi eksiksiz girilmelidir.
- LEI kodu 20 karakter, alfanümerik olmalıdır.
- Yabancı yatırımcı tipi (bireysel/kurumsal) doğru seçilmelidir.

## Sık Hatalar

- LEI kodu eksik veya hatalı girilir.
- Ülke kodu yanlış veya tam ad yazılır (örneğin "Türkiye" yerine "TR").
- Portföy miktarı için ondalık ayraç yerine virgül kullanılır.
- Yabancı yatırımcı tipi seçilmez.

## Kullanıcıya Önerilecek Sonraki Adım

Yeni İşlem ekranından "Yabancı Yatırımcı Listesi" şablonunu indirip LEI kodunu kontrol edin. LEI kodu yoksa yatırımcıdan talep edin.
