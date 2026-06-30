import type { SceneKey } from './experienceData'

type CopilotWaveformProps = {
  scene: SceneKey
}

export function CopilotWaveform({ scene }: CopilotWaveformProps) {
  return (
    <aside className={`akop-copilot ${scene === 'executive' || scene === 'core' || scene === 'risk' ? 'is-active' : ''}`}>
      <div className="akop-waveform" aria-hidden="true">
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} style={{ '--i': index } as React.CSSProperties} />
        ))}
      </div>
      <div>
        <small>Platform Zeka Katmanı</small>
        <strong>AKOP Copilot</strong>
        <p>
          Aracı Kurum Operasyon Platformu içindeki regülasyon, mutabakat, risk, vaka, onay, kanıt ve raporlama verisini tek bağlamda okuyarak
          kullanıcıya kaynaklı cevap ve uygulanabilir aksiyon verir.
        </p>
      </div>
    </aside>
  )
}
