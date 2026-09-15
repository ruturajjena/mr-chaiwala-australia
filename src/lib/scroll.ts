import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from './device'

let lenis: Lenis | null = null

/** Live scroll velocity in px/frame, smoothed. Read by the theatre. */
export const scrollState = { velocity: 0, progress: 0 }

export function initScroll() {
  if (lenis) return lenis

  lenis = new Lenis({
    // Long, heavy glide — the site should feel like it has mass.
    duration: 1.15,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    wheelMultiplier: 0.92,
    touchMultiplier: 1.5,
    syncTouch: true,
    // syncTouchLerp keeps native-feeling momentum on iOS while still routing
    // through Lenis, which ScrollTrigger needs for pinning to stay stable.
    syncTouchLerp: 0.09,
    autoRaf: false,
    smoothWheel: !prefersReducedMotion(),
  })

  lenis.on('scroll', (e: { velocity: number; progress: number }) => {
    scrollState.velocity = e.velocity
    scrollState.progress = e.progress
    ScrollTrigger.update()
  })

  // Single rAF for Lenis + GSAP. gsap.ticker gives us the shared clock.
  const tick = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(tick)

  // Exposed for tooling (visual regression harness, Lighthouse runs) — the
  // instance is otherwise module-private.
  ;(window as unknown as { __lenis?: Lenis }).__lenis = lenis

  ScrollTrigger.defaults({ markers: false })
  // Stability on phones: the URL bar showing and hiding resizes the viewport on
  // every direction change. Refreshing on those resizes re-measures every
  // pinned timeline mid-gesture, which reads as a jump. Real resizes (rotation,
  // window changes) still refresh.
  ScrollTrigger.config({ ignoreMobileResize: true })

  // No scrollerProxy: Lenis drives the real window scroll position, so
  // ScrollTrigger can read it natively. A proxy that writes back through
  // lenis.scrollTo() makes ScrollTrigger and Lenis fight over the same value
  // during refresh, which is a known source of end-of-page jitter.

  return lenis
}

export function destroyScroll() {
  lenis?.destroy()
  lenis = null
}

export const getLenis = () => lenis

export function lockScroll(locked: boolean) {
  if (!lenis) return
  locked ? lenis.stop() : lenis.start()
}

interface ScrollToOpts {
  duration?: number
  offset?: number
  immediate?: boolean
  /** Scroll even if Lenis is currently stopped (e.g. behind an overlay). */
  force?: boolean
  onComplete?: () => void
}

export function scrollTo(target: number | string | HTMLElement, opts: ScrollToOpts = {}) {
  if (!lenis) {
    const y =
      typeof target === 'number'
        ? target
        : (typeof target === 'string' ? document.querySelector(target) : target)?.getBoundingClientRect()
            .top ?? 0
    window.scrollTo({ top: y, behavior: 'smooth' })
    return
  }
  lenis.scrollTo(target, {
    duration: opts.duration ?? 1.4,
    offset: opts.offset ?? 0,
    immediate: opts.immediate,
    force: opts.force,
    easing: (t) => 1 - Math.pow(1 - t, 4),
    onComplete: opts.onComplete,
  })
}
