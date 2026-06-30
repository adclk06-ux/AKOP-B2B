import { useEffect } from 'react'
import { create } from 'zustand'

export type MarketAsset = {
  symbol: string
  name: string
  type: 'Hisse' | 'Fon' | 'Altın' | 'Döviz' | 'Kripto'
  value: number
  weight: number
  change: number
  volume: number
}

type MarketState = {
  assets: MarketAsset[]
  riskProfile: number
  setRiskProfile: (riskProfile: number) => void
  tick: () => void
}

const initialAssets: MarketAsset[] = [
  { symbol: 'BIST', name: 'BIST 100 Sepeti', type: 'Hisse', value: 9824, weight: 34, change: 1.18, volume: 78 },
  { symbol: 'AKFON', name: 'Karma Fon', type: 'Fon', value: 152.4, weight: 22, change: 0.42, volume: 42 },
  { symbol: 'XAU', name: 'Gram Altın', type: 'Altın', value: 2478, weight: 18, change: -0.24, volume: 36 },
  { symbol: 'USDTRY', name: 'Dolar/TL', type: 'Döviz', value: 32.88, weight: 14, change: 0.16, volume: 55 },
  { symbol: 'BTC', name: 'Bitcoin', type: 'Kripto', value: 64280, weight: 12, change: -1.72, volume: 91 },
]

export const useRealtimeMarketStore = create<MarketState>((set) => ({
  assets: initialAssets,
  riskProfile: 48,
  setRiskProfile: (riskProfile) => set({ riskProfile }),
  tick: () =>
    set((state) => ({
      assets: state.assets.map((asset) => {
        const drift = (Math.random() - 0.48) * (asset.type === 'Kripto' ? 0.9 : 0.34)
        const change = Math.max(Math.min(asset.change + drift, 4.8), -4.8)
        const value = Math.max(asset.value * (1 + drift / 800), 0.01)
        const volume = Math.max(Math.min(asset.volume + (Math.random() - 0.5) * 12, 100), 10)
        return { ...asset, change, value, volume }
      }),
    })),
}))

export function useRealtimeMarketStream(enabled: boolean) {
  const tick = useRealtimeMarketStore((state) => state.tick)

  useEffect(() => {
    if (!enabled) return undefined
    const interval = window.setInterval(tick, 900)
    return () => window.clearInterval(interval)
  }, [enabled, tick])
}
