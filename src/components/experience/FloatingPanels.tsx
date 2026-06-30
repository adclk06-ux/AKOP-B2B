import { scenes, type SceneKey } from './experienceData'

type FloatingPanelsProps = {
  scene: SceneKey
}

export function FloatingPanels({ scene }: FloatingPanelsProps) {
  const activeScene = scenes.find((item) => item.key === scene) ?? scenes[0]
  return (
    <div className="akop-floating-panels" aria-live="polite">
      <div className="akop-live-chip">
        <span />
        Live Regulatory Intelligence
      </div>
      <div className="akop-scene-range">{activeScene.range}</div>
      <div className="akop-floating-card">
        <small>Aktif Modüller</small>
        <div className="akop-module-tags">
          {activeScene.modules.map((module) => (
            <span key={module}>{module}</span>
          ))}
        </div>
      </div>
      {activeScene.metrics ? (
        <div className="akop-metric-stack">
          {activeScene.metrics.map((metric) => (
            <div key={metric.label} className={`akop-metric akop-tone-${metric.tone ?? 'info'}`}>
              <span>{metric.label}</span>
              <strong>{metric.value}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}
