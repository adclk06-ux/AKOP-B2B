import { useState } from 'react'
import { scenes, type ExperienceCard, type SceneKey } from './experienceData'

type ScrollNarrativeProps = {
  scene: SceneKey
}

export function ScrollNarrative({ scene }: ScrollNarrativeProps) {
  const [activeCard, setActiveCard] = useState<ExperienceCard | null>(null)

  return (
    <div className="akop-narrative-layer">
      <div className="akop-brand-lockup" aria-label="AKOP Aracı Kurum Operasyon Platformu">
        <strong>AKOP</strong>
        <span>Aracı Kurum Operasyon Platformu</span>
        <small>Compliance Operating System for Capital Markets</small>
      </div>
      {scenes.map((item) => (
        <section key={item.key} className={`akop-narrative-section ${scene === item.key ? 'is-active' : ''}`} aria-current={scene === item.key ? 'step' : undefined}>
          <div className="akop-copy-block">
            <span className="akop-eyebrow">{item.eyebrow}</span>
            <h1>{item.title}</h1>
            <p>{item.body}</p>
            <div className="akop-cta-row">
              {item.key === 'hero' ? (
                <>
                  <a href="#data-intel">Command Center'ı Keşfet</a>
                  <a href="#risk-scoring">RegTech Katmanını Gör</a>
                </>
              ) : item.key === 'executive' ? (
                <>
                  <a href="/">Executive Dashboard'a Git</a>
                  <a href="/reports">Board Report Oluştur</a>
                  <a href="/assistant">Copilot'a Sor</a>
                </>
              ) : null}
            </div>
          </div>
          <div className="akop-card-row">
            {item.cards.map((card) => (
              <button key={card.title} className="akop-glass-card akop-detail-card" type="button" onClick={() => setActiveCard(card)}>
                <h2>{card.title}</h2>
                {card.lines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
                <span>Detayları İncele</span>
              </button>
            ))}
          </div>
        </section>
      ))}
      {activeCard ? <CardDetailModal card={activeCard} onClose={() => setActiveCard(null)} /> : null}
    </div>
  )
}

function CardDetailModal({ card, onClose }: { card: ExperienceCard; onClose: () => void }) {
  return (
    <div className="akop-detail-overlay" role="dialog" aria-modal="true" aria-labelledby="akop-detail-title">
      <button className="akop-detail-backdrop" type="button" aria-label="Detay penceresini kapat" onClick={onClose} />
      <article className="akop-detail-panel">
        <header>
          <div>
            <small>AKOP Modül Detayı</small>
            <h2 id="akop-detail-title">{card.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat">Kapat</button>
        </header>
        <p className="akop-detail-lead">{card.detail}</p>
        <div className="akop-detail-grid">
          <section>
            <h3>Özellikler ve Nitelikler</h3>
            <ul>
              {card.attributes.map((attribute) => (
                <li key={attribute}>{attribute}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3>Operasyon Akışı</h3>
            <ol>
              {card.workflow.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </section>
        </div>
        <aside className="akop-detail-copilot">
          <strong>AKOP Copilot bu modülde ne yapar?</strong>
          <p>{card.copilot}</p>
        </aside>
      </article>
    </div>
  )
}
