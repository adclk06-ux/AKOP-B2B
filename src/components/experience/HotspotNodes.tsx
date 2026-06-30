import { useMemo, useState } from 'react'
import { hotspots, type Hotspot, type SceneKey } from './experienceData'

type HotspotNodesProps = {
  scene: SceneKey
}

export function HotspotNodes({ scene }: HotspotNodesProps) {
  const [active, setActive] = useState<Hotspot | null>(null)
  const visibleHotspots = useMemo(() => hotspots.filter((hotspot) => hotspot.scene === scene), [scene])

  return (
    <div className="akop-hotspots" aria-label="AKOP modül sıcak noktaları">
      {visibleHotspots.map((hotspot) => (
        <button
          key={hotspot.id}
          className={`akop-hotspot akop-hotspot-${hotspot.tone}`}
          style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
          onPointerEnter={() => setActive(hotspot)}
          onFocus={() => setActive(hotspot)}
          onPointerLeave={() => setActive(null)}
          onBlur={() => setActive(null)}
          type="button"
        >
          <span />
          <strong>{hotspot.label}</strong>
        </button>
      ))}
      {active ? (
        <aside className={`akop-hotspot-popover akop-hotspot-${active.tone}`} style={{ left: `${Math.min(active.x + 4, 70)}%`, top: `${Math.max(active.y - 8, 16)}%` }}>
          <span>{active.label}</span>
          <p>{active.detail}</p>
          <b>{active.score}</b>
        </aside>
      ) : null}
    </div>
  )
}
