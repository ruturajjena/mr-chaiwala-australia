import { useRef, cloneElement, type ReactElement, type MouseEvent } from 'react'
import { gsap } from '@/lib/gsap'
import { isTouch, prefersReducedMotion } from '@/lib/device'

interface Props {
  children: ReactElement
  /** How far the element is allowed to chase the pointer, in px. */
  strength?: number
  /** Optional inner element that lags behind for a parallax feel. */
  className?: string
}

/**
 * Pointer-following wrapper. Uses gsap.quickTo so the tween object is created
 * once and only its target value is written on each mousemove — no GC churn at
 * 120Hz, and it lands smoothly on release instead of snapping.
 */
export function Magnetic({ children, strength = 0.32, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const to = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null)

  const ensure = () => {
    if (to.current || !ref.current) return
    const o = { duration: 0.9, ease: 'elastic.out(1, 0.62)' as const }
    to.current = {
      x: gsap.quickTo(ref.current, 'x', o),
      y: gsap.quickTo(ref.current, 'y', o),
    }
  }

  const move = (e: MouseEvent) => {
    if (isTouch() || prefersReducedMotion()) return
    ensure()
    const el = ref.current
    if (!el || !to.current) return
    const r = el.getBoundingClientRect()
    to.current.x((e.clientX - (r.left + r.width / 2)) * strength)
    to.current.y((e.clientY - (r.top + r.height / 2)) * strength)
  }

  const leave = () => {
    ensure()
    to.current?.x(0)
    to.current?.y(0)
  }

  return (
    <span
      ref={ref}
      className={className ?? 'inline-block will-change-transform'}
      onMouseMove={move}
      onMouseLeave={leave}
    >
      {cloneElement(children)}
    </span>
  )
}
