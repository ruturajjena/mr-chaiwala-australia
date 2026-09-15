import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'
import { lockScroll } from '@/lib/scroll'
import { prefersReducedMotion } from '@/lib/device'
import { Logo } from '@/components/ui/Logo'
import { SITE } from '@/data/site'

/**
 * The kettle draws itself on, pours, and the whole lockup lifts away behind the
 * hero. It resolves as soon as the first product clip can play, and hard-caps
 * at 2.6s so a slow connection never holds the page hostage.
 */
const SEEN = 'mc:intro'

/** Fades out and removes the pre-React first-paint frame. */
export function dismissBoot() {
  const boot = document.getElementById('boot')
  if (!boot) return
  boot.dataset.off = ''
  window.setTimeout(() => boot.remove(), 360)
}

/** True the first time this tab loads the site. */
export const isFirstVisit = () => {
  try {
    return sessionStorage.getItem(SEEN) !== '1'
  } catch {
    return true
  }
}

export function Preloader({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const el = root.current
    if (!el) return

    try {
      sessionStorage.setItem(SEEN, '1')
    } catch {
      /* private mode — the intro simply plays again */
    }

    // Fade in over the static boot frame, then drop it. Both are near-black
    // with the same warm radial, so the handover is invisible.
    gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.26, ease: 'none' })
    dismissBoot()

    lockScroll(true)

    const finish = () => {
      lockScroll(false)
      setGone(true)
      onDone()
    }

    if (prefersReducedMotion()) {
      gsap.to(el, { autoAlpha: 0, duration: 0.4, onComplete: finish })
      return
    }

    const ctx = gsap.context(() => {
      const strokes = el.querySelectorAll('[data-logo="kettle"] > *')
      const stream = el.querySelector('[data-logo="stream"]')
      const glass = el.querySelector('[data-logo="glass"] path')
      const word = el.querySelector('[data-logo="word"]')
      const tag = el.querySelector('[data-logo="tagline"]')
      const bar = el.querySelector('[data-bar]')

      const tl = gsap.timeline()

      gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1, opacity: 1 })
      gsap.set([glass], { strokeDasharray: 1, strokeDashoffset: 1 })
      gsap.set(stream, { scaleY: 0, transformOrigin: '50% 0%', opacity: 0 })
      gsap.set([word, tag], { opacity: 0, yPercent: 32 })
      gsap.set('[data-logo="glass"] g', { opacity: 0 })

      // ~1.2s end to end. The veil is the last thing standing between the
      // visitor and the hero, so it holds LCP hostage for exactly as long as it
      // runs — a brand moment worth having, but not worth two seconds of one.
      tl.to(strokes, { strokeDashoffset: 0, duration: 0.62, stagger: 0.028, ease: 'power2.inOut' })
        .to(glass, { strokeDashoffset: 0, duration: 0.3, ease: 'power2.out' }, '-=0.26')
        .to(stream, { scaleY: 1, opacity: 1, duration: 0.3, ease: 'power2.in' }, '-=0.18')
        .to('[data-logo="glass"] g', { opacity: 1, duration: 0.28, ease: 'power1.out' }, '-=0.12')
        .to([word, tag], { opacity: 1, yPercent: 0, duration: 0.46, stagger: 0.05, ease: 'silk' }, '-=0.2')
        .to(bar, { scaleX: 1, duration: 0.72, ease: 'power2.inOut' }, 0.12)

      // Hold until both the animation and the hero clip are ready.
      let ready = false
      let played = false
      const maybeExit = () => {
        if (!ready || !played) return
        gsap
          .timeline({ onComplete: finish })
          .to('[data-veil-inner]', {
            yPercent: -14,
            opacity: 0,
            filter: 'blur(14px)',
            duration: 0.62,
            ease: 'silk',
          })
          .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.78, ease: 'silk' }, '-=0.46')
      }

      tl.eventCallback('onComplete', () => {
        played = true
        maybeExit()
      })

      // `loadeddata`, not `canplay`: one decoded frame is all that is needed for
      // the hero to look right the instant the veil lifts, and waiting for a
      // full playable buffer can cost several seconds on a phone.
      const hero = document.querySelector<HTMLVideoElement>('.plate video')
      const markReady = () => {
        ready = true
        maybeExit()
      }
      if (hero && hero.readyState >= 2) markReady()
      else {
        hero?.addEventListener('loadeddata', markReady, { once: true })
        window.setTimeout(markReady, 1400)
      }
    }, el)

    return () => {
      ctx.revert()
      lockScroll(false)
    }
  }, [onDone])

  if (gone) return null

  return (
    <div
      ref={root}
      className="fixed inset-0 z-veil flex items-center justify-center bg-ink"
      style={{ clipPath: 'inset(0% 0% 0% 0%)' }}
      role="status"
      aria-label="Loading"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 50% 44% at 50% 46%, rgba(200,155,60,0.14), transparent 70%)',
        }}
      />
      <div data-veil-inner className="relative flex w-full flex-col items-center px-gutter">
        <Logo variant="full" className="w-[min(74vw,26rem)] text-cream" title={SITE.name} />
        <div className="mt-12 h-px w-[min(60vw,18rem)] overflow-hidden bg-cream/10">
          <div data-bar className="h-full w-full origin-left scale-x-0 bg-gradient-to-r from-copper via-gold to-cream" />
        </div>
      </div>
    </div>
  )
}
