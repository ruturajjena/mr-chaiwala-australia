import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// One easing vocabulary for the whole site.
gsap.registerEase('silk', (p) => 1 - Math.pow(1 - p, 4))
gsap.registerEase('swift', (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2))

gsap.defaults({ ease: 'silk', duration: 1 })

// GSAP's own rAF is disabled; Lenis drives the ticker so scroll and animation
// share a single frame. See lib/scroll.ts.
gsap.ticker.lagSmoothing(220, 33)

export { gsap, ScrollTrigger }
