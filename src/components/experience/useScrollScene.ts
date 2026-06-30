import { useEffect, useState } from 'react'
import type { SceneKey } from './experienceData'

const sceneByProgress = (progress: number): SceneKey => {
  if (progress < 0.2) return 'hero'
  if (progress < 0.4) return 'data'
  if (progress < 0.6) return 'risk'
  if (progress < 0.8) return 'core'
  return 'executive'
}

export function useScrollScene() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    let current = 0
    let target = 0

    const measure = () => {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
      target = Math.min(Math.max(window.scrollY / maxScroll, 0), 1)
    }

    const tick = () => {
      current += (target - current) * 0.11
      setProgress((previous) => (Math.abs(previous - current) > 0.001 ? current : previous))
      frame = window.requestAnimationFrame(tick)
    }

    measure()
    frame = window.requestAnimationFrame(tick)
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return { progress, scene: sceneByProgress(progress) }
}
