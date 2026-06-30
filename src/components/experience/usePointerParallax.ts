import { useEffect, useState } from 'react'

export function usePointerParallax() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      setPointer({
        x: (event.clientX / window.innerWidth - 0.5) * 2,
        y: (event.clientY / window.innerHeight - 0.5) * 2,
      })
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [])

  return pointer
}
