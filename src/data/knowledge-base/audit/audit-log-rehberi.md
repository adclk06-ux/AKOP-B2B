---
id: audit-log-rehberi
title: Denetim ve Loglama Rehberi
category: audit
sourceType: internal_knowledge
version: 0.1
lastUpdated: 2026-06-17
---

# Denetim ve Loglama Rehberi

## Amaç

Her işlemde yapılan tüm aksiyonların kim tarafından ne zaman gerçekleştirildiğinin kaydını tutmak. Audit Log, operasyonel şeffaflık ve yasal uygunluk için zorunludur.

## Ne Zaman Kullanılır?

- Bir işlemin geçmişini araştırırken
- Kimin ne zaman onayladığını/Reddettiğini öğrenmek istendiğinde
- Uyuşmazlık veya hataya neden olan adımı bulurken

## Kritik Kurallar

- Her işlem aksiyonu (oluşturma, yükleme, onay, red, gönderim) loglanmalıdır.
- Zaman damgası (timestamp) ISO 8601 formatında olmalıdır.
- Kullanıcı ID ve rol bilgisi her kayıtta görünmelidir.
- Log kayıtları silinemez ve değiştirilemez.
- Sistem tarafından otomatik olarak oluşturulur, manuel düzenleme yapılamaz.

## Sık Hatalar

- Audit Log'un sadece hata durumlarında değil her zaman incelenmemesi.
- Zaman damgalarının yerel saat ile UTC arasındaki farkı göz ardı edilmesi.
- Onay ve gönderim adımlarının ayrı aksiyonlar olarak algılanmaması.

## Kullanıcıya Önerilecek Sonraki Adım

İşlem detayına gidin ve "Audit Log" sekmesine tıklayın. Oluşturan, onaylayan, reddeden kullanıcıları ve zaman damgalarını inceleyin.
