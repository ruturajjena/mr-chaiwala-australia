import { useRef } from 'react'
import SplitType from 'split-type'
import { gsap } from '@/lib/gsap'
import { prefersReducedMotion } from '@/lib/device'
import { useIsoLayoutEffect } from './useIsoLayoutEffect'

type Kind = 'lines' | 'words' | 'chars'

interface Options {
  kind?: Kind
  /** Stagger between units, in timeline units (the tween is scrubbed). */
  stagger?: number
  /** ScrollTrigger window. */
  start?: string
  end?: string
  y?: number
  rotate?: number
  blur?: number
}

/**
 * Masked type reveal, scrubbed against scroll position.
 *
 * SplitType wraps each line in an overflow-hidden parent, so glyphs rise out of
 * nothing rather than fading in — and because the tween is `scrub: true`, the
 * letters climb while the visitor scrolls down and sink back if they scroll up.
 * It never plays on its own.
 *
 * Two details matter more than the animation itself:
 *
 *  1. The split waits for `document.fonts.ready`. Splitting against a fallback
 *     face measures the wrong line breaks, and the reveal then animates lines
 *     that do not match the final layout.
 *  2. `.split-pending` (opacity: 0) is removed on every path — including the
 *     failure paths. A reveal is a nicety; legibility is not.
 */
export function useSplitReveal<T extends HTMLElement>(opts: Options = {}) {
  const {
    kind = 'lines',
    stagger = 0.35,
    start = 'top 88%',
    end = 'top 46%',
    y = 110,
    rotate = 0,
    blur = 6,
  } = opts

  const ref = useRef<T>(null)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const show = () => el.classList.remove('split-pending')

    if (prefersReducedMotion()) {
      show()
      return
    }

    let ctx: gsap.Context | null = null
    let cancelled = false

    // Hard floor: whatever happens with fonts or SplitType, the copy is visible.
    const failsafe = window.setTimeout(show, 1200)

    const run = () => {
      if (cancelled || !ref.current) return

      ctx = gsap.context(() => {
        const split = new SplitType(el, {
          types: kind === 'chars' ? 'lines,words,chars' : kind === 'words' ? 'lines,words' : 'lines',
          lineClass: 'line-mask',
          tagName: 'span',
        })

        const targets =
          kind === 'chars' ? split.chars : kind === 'words' ? split.words : split.lines

        show()
        if (!targets?.length) return

        gsap.fromTo(
          targets,
          {
            yPercent: y,
            rotate,
            filter: blur ? `blur(${blur}px)` : 'none',
            opacity: 0,
          },
          {
            yPercent: 0,
            rotate: 0,
            filter: 'blur(0px)',
            opacity: 1,
            ease: 'none',
            stagger,
            scrollTrigger: { trigger: el, start, end, scrub: true },
          },
        )

        return () => split.revert()
      }, el)
    }

    if (document.fonts?.status === 'loaded') run()
    else document.fonts?.ready.then(run) ?? run()

    return () => {
      cancelled = true
      clearTimeout(failsafe)
      ctx?.revert()
    }
  }, [])

  return ref
}
