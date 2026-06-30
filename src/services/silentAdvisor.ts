export interface SilentSuggestion {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  actionLabel?: string
  actionPath?: string
  source: 'mkk' | 'reconciliation' | 'regtech' | 'spk'
}

export function getDashboardSuggestions(): SilentSuggestion[] {
  return [
    {
      id: 'sa-dash-001',
      severity: 'critical',
      title: 'TX-002 işlemlerinde LEI alanı kaynaklı validasyon hataları artıyor.',
      description: 'Son 24 saatte 8 adet TX-002 işlemi LEI eksikliğinden reddedildi. Operasyon ekibinin kontrol etmesi önerilir.',
      actionLabel: 'İşlemlere Git',
      actionPath: '/transactions',
      source: 'mkk',
    },
    {
      id: 'sa-dash-002',
      severity: 'warning',
      title: 'Mutabakat farkı bulunan kayıtlar kapanmadan günlük rapor tamamlanmamalı.',
      description: 'Dün başlatılan mutabakat analizinde 3 farklı kayıt tespit edildi. Rapor onaylanmadan önce çözülmesi gerekir.',
      actionLabel: 'Mutabakatı Aç',
      actionPath: '/reconciliation',
      source: 'reconciliation',
    },
    {
      id: 'sa-dash-003',
      severity: 'info',
      title: 'SPK mevzuat güncellemesi uyum incelemesi bekliyor.',
      description: 'SPK Bültenleri kaynağından yeni bir güncelleme tespit edildi. Uyum ekibi tarafından incelenmesi gerekiyor.',
      actionLabel: 'RegTech Paneli',
      actionPath: '/regtech',
      source: 'spk',
    },
    {
      id: 'sa-dash-004',
      severity: 'critical',
      title: 'Kritik risk seviyesinde 1 müşteri kaydı var.',
      description: 'ABC Holding A.Ş. için SPK Seri:V No:98 kuralı ihlali tespit edildi. Finansal Suistimal Takımı bilgilendirilmeli.',
      actionLabel: 'Risk Detayları',
      actionPath: '/regtech',
      source: 'regtech',
    },
  ]
}

export function getTransactionSuggestions(): SilentSuggestion[] {
  return [
    {
      id: 'sa-tx-001',
      severity: 'warning',
      title: 'Onay bekleyen işlem sayısı artışta.',
      description: '3 işlem onay bekliyor. Kritik süre yaklaşıyor.',
      actionLabel: 'Onaylara Git',
      actionPath: '/approvals',
      source: 'mkk',
    },
  ]
}

export function getReconciliationSuggestions(): SilentSuggestion[] {
  return [
    {
      id: 'sa-rec-001',
      severity: 'warning',
      title: 'Karşı taraf dosyası sistem dosyasından daha eski tarihli.',
      description: 'Karşı taraf raporu son güncelleme: 2024-06-15. Güncel dosya yüklemek önerilir.',
      source: 'reconciliation',
    },
  ]
}

export function getRegTechSuggestions(): SilentSuggestion[] {
  return [
    {
      id: 'sa-reg-001',
      severity: 'warning',
      title: 'SPK mevzuat güncellemeleri kontrol edilmeli.',
      description: 'SPK Bültenleri ve Basın Duyuruları kaynakları düzenli senkronize edilmeli. Son kontrol zamanı kontrol edin.',
      source: 'regtech',
    },
    {
      id: 'sa-reg-002',
      severity: 'info',
      title: 'Uyum dokümantasyonu güncel tutulmalı.',
      description: 'SPK tarafından yayınlanan yeni düzenlemelerin kurum içi prosedürlere entegre edilmesi önerilir.',
      source: 'regtech',
    },
  ]
}
