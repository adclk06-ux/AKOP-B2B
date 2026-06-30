import { useMemo } from 'react'
import { useRealtimeMarketStore, type MarketAsset } from './useRealtimeMarketStore'

type FinTechModulesProps = {
  scene: string
  twoDimensional: boolean
  onToggleMode: () => void
  loading: boolean
}

const formatValue = (asset: MarketAsset) =>
  new Intl.NumberFormat('tr-TR', {
    maximumFractionDigits: asset.value > 100 ? 0 : 2,
  }).format(asset.value)

export function FinTechModules({ scene, twoDimensional, onToggleMode, loading }: FinTechModulesProps) {
  const assets = useRealtimeMarketStore((state) => state.assets)
  const riskProfile = useRealtimeMarketStore((state) => state.riskProfile)
  const setRiskProfile = useRealtimeMarketStore((state) => state.setRiskProfile)
  const totalValue = useMemo(() => assets.reduce((sum, asset) => sum + asset.value * asset.weight, 0), [assets])

  if (loading) {
    return (
      <div className="akop-wire-loader" role="status" aria-live="polite">
        <div className="akop-wire-cube" />
        <span>3D piyasa mimarisi hazırlanıyor</span>
      </div>
    )
  }

  return (
    <>
      <button className="akop-mode-toggle" type="button" onClick={onToggleMode} aria-pressed={twoDimensional}>
        {twoDimensional ? '3D Moda Dön' : '2D Veri Tablosu'}
      </button>

      {twoDimensional ? (
        <section className="akop-flat-market" aria-label="Hızlı 2D piyasa tablosu">
          <div>
            <small>Ultra hızlı mod</small>
            <strong>{Math.round(totalValue).toLocaleString('tr-TR')} TL</strong>
          </div>
          <table>
            <thead>
              <tr>
                <th>Varlık</th>
                <th>Tip</th>
                <th>Değer</th>
                <th>Değişim</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.symbol}>
                  <td>{asset.symbol}</td>
                  <td>{asset.type}</td>
                  <td>{formatValue(asset)}</td>
                  <td className={asset.change >= 0 ? 'is-up' : 'is-down'}>{asset.change.toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ) : (
        <div className="akop-fintech-layer" aria-label="3D FinTech bileşenleri">
          <WealthSphere assets={assets} active={scene === 'hero' || scene === 'executive'} />
          <MarketTerrain assets={assets} active={scene === 'data' || scene === 'risk'} />
          <StressTestSimulator active={scene === 'risk'} riskProfile={riskProfile} setRiskProfile={setRiskProfile} />
          <ParticleStream assets={assets} active={scene === 'core'} />
        </div>
      )}
    </>
  )
}

function WealthSphere({ assets, active }: { assets: MarketAsset[]; active: boolean }) {
  return (
    <div className={`akop-wealth-sphere ${active ? 'is-active' : ''}`}>
      {assets.map((asset, index) => (
        <button
          key={asset.symbol}
          type="button"
          className={asset.change >= 0 ? 'is-up' : 'is-down'}
          style={
            {
              '--i': index,
              '--weight': asset.weight,
              '--change': Math.abs(asset.change),
            } as React.CSSProperties
          }
          title={`${asset.name}: ${formatValue(asset)} (${asset.change.toFixed(2)}%)`}
        >
          <span>{asset.symbol}</span>
        </button>
      ))}
    </div>
  )
}

function MarketTerrain({ assets, active }: { assets: MarketAsset[]; active: boolean }) {
  return (
    <div className={`akop-market-terrain ${active ? 'is-active' : ''}`}>
      {assets.map((asset, index) => (
        <span
          key={asset.symbol}
          className={asset.change >= 0 ? 'is-up' : 'is-down'}
          style={
            {
              '--i': index,
              '--height': `${38 + asset.volume * 1.45}px`,
            } as React.CSSProperties
          }
        >
          <b>{asset.symbol}</b>
        </span>
      ))}
    </div>
  )
}

function StressTestSimulator({
  active,
  riskProfile,
  setRiskProfile,
}: {
  active: boolean
  riskProfile: number
  setRiskProfile: (riskProfile: number) => void
}) {
  return (
    <div className={`akop-stress-test ${active ? 'is-active' : ''}`}>
      <div className="akop-wave-stage" style={{ '--risk': riskProfile } as React.CSSProperties}>
        {Array.from({ length: 18 }, (_, index) => (
          <span key={index} style={{ '--i': index } as React.CSSProperties} />
        ))}
      </div>
      <label>
        Risk Profili
        <input type="range" min="0" max="100" value={riskProfile} onChange={(event) => setRiskProfile(Number(event.target.value))} />
      </label>
      <strong>{riskProfile < 35 ? 'Muhafazakar' : riskProfile > 70 ? 'Agresif' : 'Dengeli'} Senaryo</strong>
    </div>
  )
}

function ParticleStream({ assets, active }: { assets: MarketAsset[]; active: boolean }) {
  const orderFlow = assets.flatMap((asset, assetIndex) =>
    Array.from({ length: Math.ceil(asset.volume / 18) }, (_, index) => ({
      key: `${asset.symbol}-${index}`,
      asset,
      index: index + assetIndex * 4,
    })),
  )

  return (
    <div className={`akop-order-stream ${active ? 'is-active' : ''}`}>
      {orderFlow.map(({ key, asset, index }) => (
        <span
          key={key}
          className={asset.change >= 0 ? 'is-up' : 'is-down'}
          style={{ '--i': index, '--speed': `${2.2 + Math.abs(asset.change) * 0.22}s` } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
