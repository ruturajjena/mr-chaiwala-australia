/**
 * Capability tiering. Everything expensive (particle counts, blur radii, the
 * number of simultaneously decoding videos) reads from `tier` so a 2019 laptop
 * degrades gracefully instead of dropping frames.
 */
export type Tier = 'high' | 'mid' | 'low'

const q = (s: string) => typeof window !== 'undefined' && window.matchMedia(s).matches

export const isTouch = () => q('(hover: none), (pointer: coarse)')
export const prefersReducedMotion = () => q('(prefers-reduced-motion: reduce)')

let cached: Tier | null = null

export const getTier = (): Tier => {
  if (cached) return cached
  if (typeof window === 'undefined') return (cached = 'mid')
  if (prefersReducedMotion()) return (cached = 'low')

  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const small = window.innerWidth < 768
  const dpr = window.devicePixelRatio || 1

  // Phones do the same work over far fewer pixels, so they are not
  // automatically "low" — but a weak phone is.
  if (cores <= 4 || mem <= 3) cached = 'low'
  else if (small || cores <= 6 || dpr > 2.5) cached = 'mid'
  else cached = 'high'

  return cached
}

/** Device-pixel-ratio budget for canvas layers. */
export const canvasDpr = () => {
  const t = getTier()
  const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  return Math.min(dpr, t === 'high' ? 2 : t === 'mid' ? 1.6 : 1.25)
}
