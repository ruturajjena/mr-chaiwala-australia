import { useRef, type ReactNode } from 'react'
import { gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/device'
import { useIsoLayoutEffect } from '@/hooks/useIsoLayoutEffect'
import { cn } from '@/lib/utils'

type Dir = 'up' | 'down' | 'left' | 'right'

const CLIP: Record<Dir, [string, string]> = {
  up: ['inset(100% 0% 0% 0%)', 'inset(0% 0% 0% 0%)'],
  down: ['inset(0% 0% 100% 0%)', 'inset(0% 0% 0% 0%)'],
  left: ['inset(0% 0% 0% 100%)', 'inset(0% 0% 0% 0%)'],
  right: ['inset(0% 100% 0% 0%)', 'inset(0% 0% 0% 0%)'],
}

interface Props {
  children: ReactNode
  className?: string
  dir?: Dir
  /** Inner counter-scale, so the content sits still behind a moving aperture. */
  counter?: boolean
  start?: string
  end?: string
}

/**
 * A clip-path aperture opening over its content — scrubbed, never played.
 *
 * The aperture's position is a function of where the element sits in the
 * viewport, so it opens as the visitor scrolls down and closes again if they
 * scroll back. Never a fade, and never a one-shot that keeps running after the
 * scroll has stopped.
 */
export function Reveal({
  children,
  className,
  dir = 'up',
  counter = true,
  start = 'top 92%',
  end = 'top 52%',
}: Props) {
  const wrap = useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const el = wrap.current
    if (!el) return
    if (prefersReducedMotion()) {
      el.style.clipPath = 'none'
      return
    }
    const inner = el.firstElementChild as HTMLElement | null
    const [from, to] = CLIP[dir]

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: el, start, end, scrub: true },
      })
      tl.fromTo(el, { clipPath: from }, { clipPath: to }, 0)
      if (counter && inner) tl.fromTo(inner, { scale: 1.16 }, { scale: 1 }, 0)
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={wrap} className={cn('overflow-hidden', className)}>
      {children}
    </div>
  )
}

/** Vertical parallax. Already a pure function of scroll position. */
export function Parallax({
  children,
  className,
  amount = 12,
  scale,
}: {
  children: ReactNode
  className?: string
  /** Travel in % of the element's height, over its full scroll pass. */
  amount?: number
  scale?: number
}) {
  const ref = useRef<HTMLDivElement>(null)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -amount / 2, ...(scale ? { scale } : {}) },
        {
          yPercent: amount / 2,
          ...(scale ? { scale: 1 } : {}),
          ease: 'none',
          scrollTrigger: {
            trigger: el.parentElement ?? el,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [amount, scale])

  return (
    <div ref={ref} className={cn('will-change-transform', className)}>
      {children}
    </div>
  )
}

/** Section eyebrow — a rule, an index and a label. */
export function Eyebrow({ index, children }: { index: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4">
      <span className="num text-[0.66rem] font-light text-gold/90">{index}</span>
      <span className="h-px w-10 bg-gradient-to-r from-gold/60 to-transparent" />
      <span className="eyebrow text-cream/58">{children}</span>
    </div>
  )
}
