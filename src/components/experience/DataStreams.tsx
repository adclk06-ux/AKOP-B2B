import type { SceneKey } from './experienceData'

const sources = ['SPK', 'BDDK', 'MASAK', 'MKK', 'Takasbank', 'TCMB', 'KVKK', 'Resmi Gazete']

type DataStreamsProps = {
  scene: SceneKey
  progress: number
}

export function DataStreams({ scene, progress }: DataStreamsProps) {
  const active = scene === 'data' || scene === 'core'
  return (
    <div className={`akop-data-streams ${active ? 'is-active' : ''}`} style={{ '--progress': progress } as React.CSSProperties}>
      {sources.map((source, index) => (
        <span key={source} className="akop-data-stream" style={{ '--i': index } as React.CSSProperties}>
          <b>{source}</b>
        </span>
      ))}
    </div>
  )
}
