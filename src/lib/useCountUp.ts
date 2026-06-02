import { useEffect, useRef, useState } from 'react'

const prefersReduced =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Animate a number from 0 up to `target` (easeOutCubic). Returns the live value. */
export function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  const raf = useRef(0)

  useEffect(() => {
    if (prefersReduced) return
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1)
      setValue(target * (1 - Math.pow(1 - t, 3)))
      if (t < 1) raf.current = requestAnimationFrame(tick)
      else setValue(target)
    }
    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration])

  return prefersReduced ? target : value
}
