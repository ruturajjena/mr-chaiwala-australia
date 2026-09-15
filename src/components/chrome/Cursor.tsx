import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { isTouch, prefersReducedMotion } from '@/lib/device'

/**
 * Two-part cursor: a hard 5px core that tracks the pointer almost exactly, and a
 * soft ring that trails it. The lag between the two is what makes it feel like
 * an object with weight rather than a decorated pointer.
 *
 * Hover states are read from `data-cursor` on any ancestor of the hit element,
 * so components opt in declaratively without importing anything.
 */
export function Cursor() {
  const core = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (isTouch() || prefersReducedMotion()) return
    const c = core.current
    const r = ring.current
    const l = label.current
    if (!c || !r || !l) return

    document.documentElement.classList.add('has-custom-cursor')

    const cx = gsap.quickTo(c, 'x', { duration: 0.13, ease: 'power3' })
    const cy = gsap.quickTo(c, 'y', { duration: 0.13, ease: 'power3' })
    const rx = gsap.quickTo(r, 'x', { duration: 0.55, ease: 'power3' })
    const ry = gsap.quickTo(r, 'y', { duration: 0.55, ease: 'power3' })

    let visible = false
    const show = () => {
      if (visible) return
      visible = true
      gsap.to([c, r], { autoAlpha: 1, duration: 0.35 })
    }

    const move = (e: PointerEvent) => {
      show()
      cx(e.clientX)
      cy(e.clientY)
      rx(e.clientX)
      ry(e.clientY)
    }

    const leave = () => {
      visible = false
      gsap.to([c, r], { autoAlpha: 0, duration: 0.25 })
    }

    let state = ''
    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement)?.closest?.('[data-cursor]') as HTMLElement | null
      const next = el?.dataset.cursor ?? ''
      if (next === state) return
      state = next

      const text = el?.dataset.cursorLabel ?? ''
      l.textContent = text

      const spec =
        next === 'view'
          ? { scale: 3.4, borderColor: 'rgba(200,155,60,0.55)', backgroundColor: 'rgba(200,155,60,0.07)' }
          : next === 'link'
            ? { scale: 2.1, borderColor: 'rgba(247,234,215,0.55)', backgroundColor: 'rgba(247,234,215,0.05)' }
            : next === 'drag'
              ? { scale: 2.8, borderColor: 'rgba(247,234,215,0.4)', backgroundColor: 'rgba(247,234,215,0.04)' }
              : { scale: 1, borderColor: 'rgba(247,234,215,0.32)', backgroundColor: 'rgba(247,234,215,0)' }

      gsap.to(r, { ...spec, duration: 0.5, ease: 'silk', overwrite: 'auto' })
      gsap.to(c, { scale: next ? 0.35 : 1, duration: 0.45, ease: 'silk', overwrite: 'auto' })
      gsap.to(l, { autoAlpha: text ? 1 : 0, duration: 0.3, overwrite: 'auto' })
    }

    const down = () => gsap.to(r, { scale: '-=0.35', duration: 0.22, overwrite: 'auto' })
    const up = () => gsap.to(r, { scale: '+=0.35', duration: 0.35, overwrite: 'auto' })

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    window.addEventListener('pointerdown', down, { passive: true })
    window.addEventListener('pointerup', up, { passive: true })
    document.addEventListener('pointerleave', leave)

    return () => {
      document.documentElement.classList.remove('has-custom-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.removeEventListener('pointerleave', leave)
    }
  }, [])

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-cursor hidden md:block">
      <div
        ref={ring}
        className="absolute -left-5 -top-5 h-10 w-10 rounded-full border border-cream/30 opacity-0 mix-blend-difference"
        style={{ backdropFilter: 'invert(0.04)' }}
      >
        <span
          ref={label}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-sans text-[3.2px] font-semibold uppercase tracking-[0.3em] text-cream opacity-0"
        />
      </div>
      <div className="absolute -left-[3px] -top-[3px] h-[6px] w-[6px] rounded-full bg-cream opacity-0" ref={core} />
    </div>
  )
}
