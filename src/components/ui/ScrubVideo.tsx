import { memo, useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { plateSource, posterSrc, type MediaKey } from '@/lib/media'
import { Seeker, loadClip, unloadClip } from '@/lib/scrub'
import { cn } from '@/lib/utils'

interface Props {
  media: MediaKey
  /**
   * A dedicated encode for the box this plate is drawn in. `portrait` is the
   * full-resolution 4:5 crop for plates in a fixed 4:5 `object-cover` box —
   * see `plateSource` in lib/media.ts. Omit for the standard ladder.
   */
  rung?: 'portrait'
  className?: string
  style?: React.CSSProperties
  /** Portion of the clip to scrub across, 0–1. */
  range?: [number, number]
  /** ScrollTrigger window. Defaults to the element crossing the viewport. */
  start?: string
  end?: string
  /** Attach the source only once the element is this close to the viewport. */
  rootMargin?: string
}

/**
 * A <video> used as a scroll-scrubbed image sequence.
 *
 * There is no autoplay, no loop and no play() — the element's own progress
 * through the viewport sets its playhead, so a clip advances only while the
 * visitor is moving and reverses when they scroll back up. Same contract as the
 * hero theatre, applied to the section media.
 *
 * The source is attached lazily and released again once the element is well out
 * of the way, which keeps the decoder count down over a page this long.
 */
export const ScrubVideo = memo(function ScrubVideo({
  media,
  rung,
  className,
  style,
  range = [0, 1],
  start = 'top bottom',
  end = 'bottom top',
  rootMargin = '300px',
}: Props) {
  const ref = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Chosen once per mount: the Seeker's frame grid and seek strategy have to
    // match the file it drives.
    const source = plateSource(media, rung)
    const seeker = new Seeker(el, { fps: source.fps, intra: source.intra })
    const [from, to] = range
    let attached = false

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !attached) {
          attached = true
          if (!el.poster) el.poster = posterSrc(media)
          loadClip(el, source.src).then(() => seeker.set(from))
        } else if (!e.isIntersecting && attached) {
          attached = false
          unloadClip(el)
        }
      },
      { rootMargin, threshold: 0 },
    )
    io.observe(el)

    const ctx = gsap.context(() => {
      const state = { p: from }
      gsap.to(state, {
        p: to,
        ease: 'none',
        onUpdate: () => seeker.set(state.p),
        scrollTrigger: { trigger: el, start, end, scrub: true },
      })
    }, el)

    return () => {
      io.disconnect()
      ctx.revert()
      seeker.destroy()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [media, rung, start, end, rootMargin])

  return (
    <video
      ref={ref}
      className={cn('h-full w-full object-cover', className)}
      style={style}
      preload="auto"
      muted
      playsInline
      disablePictureInPicture
      aria-hidden
    />
  )
})
