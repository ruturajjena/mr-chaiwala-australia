import { useEffect, useRef } from 'react'
import { PRODUCTS } from '@/data/products'
import { posterSrc } from '@/lib/media'
import { FX_KEYS, type FxKey } from '@/lib/transitions'
import { Bloom, Flash } from './Ambient'
import { Selector } from './Selector'
import { Caption } from './Caption'
import { Counter } from './Counter'
import { useTheatre, TOTAL_VH, type Handles } from './useTheatre'
import './stage.css'

interface Props {
  onDock?: (docked: boolean) => void
  onActive?: (i: number) => void
}

/**
 * The pinned theatre.
 *
 * Every <video> here is an image sequence: `preload="auto"`, `muted`,
 * `playsInline`, and no `autoplay`, no `loop`, no `play()` anywhere in the
 * codebase. Their playheads are moved only by `Seeker`, which is driven only by
 * the master GSAP timeline, which is driven only by scroll position.
 */
export function HeroTheatre({ onDock, onActive }: Props) {
  const handles = useRef<Handles>({
    plates: [],
    videos: [],
    fx: {},
    fxVideos: {},
    flash: null,
    bloom: null,
    rays: null,
    stage: null,
    chrome: null,
    canvas: null,
    root: null,
  })

  const { wrapRef, active, docked, goTo, resize } = useTheatre(handles)

  useEffect(() => onDock?.(docked), [docked, onDock])
  useEffect(() => onActive?.(active), [active, onActive])

  useEffect(() => {
    const el = handles.current.canvas
    if (!el) return
    const ro = new ResizeObserver(resize)
    ro.observe(el)
    return () => ro.disconnect()
  }, [resize])

  /* ── hand off from the static hero still in index.html ────────────────────── */
  useEffect(() => {
    const still = document.getElementById('hero-still')
    const v = handles.current.videos[0]
    if (!still) return
    const drop = () => {
      still.dataset.off = ''
      window.setTimeout(() => still.remove(), 440)
    }
    if (v && v.readyState >= 2) drop()
    else {
      v?.addEventListener('loadeddata', drop, { once: true })
      const t = window.setTimeout(drop, 4000)
      return () => {
        v?.removeEventListener('loadeddata', drop)
        window.clearTimeout(t)
      }
    }
  }, [])

  return (
    <section
      ref={wrapRef}
      id="dishes"
      aria-label="Featured dishes"
      className="relative"
      style={{ height: `${TOTAL_VH}vh` }}
    >
      {/* Pinned with position:sticky rather than ScrollTrigger's pin. No
          pin-spacer, no forced reflow on refresh, zero layout shift. */}
      <div
        ref={(el) => (handles.current.root = el)}
        className="sticky top-0 dvh w-full overflow-hidden bg-ink"
      >
        <Bloom
          ref={(el) => (handles.current.bloom = el)}
          raysRef={(el) => (handles.current.rays = el)}
        />

        <div
          ref={(el) => (handles.current.stage = el)}
          className="absolute inset-0 will-change-transform"
        >
          <div className="theatre-stage">
            {/* ── the invariant plate box ── */}
            <div className="plate-frame">
              {PRODUCTS.map((p, i) => (
                <div
                  key={p.id}
                  className="plate"
                  ref={(el) => (handles.current.plates[i] = el)}
                  style={{ opacity: i === 0 ? 1 : 0, visibility: i === 0 ? 'visible' : 'hidden' }}
                >
                  <video
                    ref={(el) => (handles.current.videos[i] = el)}
                    // Only the first plate ships a poster; the browser fetches
                    // every `poster` attribute eagerly regardless of `preload`.
                    {...(i === 0 ? { poster: posterSrc(p.media) } : {})}
                    style={{ filter: p.grade }}
                    preload="auto"
                    muted
                    playsInline
                    disablePictureInPicture
                    aria-hidden
                  />
                </div>
              ))}
            </div>

            {/* ── effect deck ── */}
            {FX_KEYS.map((k: FxKey) => (
              <div
                key={k}
                className="fx-layer"
                ref={(el) => (handles.current.fx[k] = el)}
                style={{ display: 'none' }}
              >
                <video
                  ref={(el) => (handles.current.fxVideos[k] = el)}
                  preload="auto"
                  muted
                  playsInline
                  disablePictureInPicture
                  aria-hidden
                />
              </div>
            ))}

            <canvas
              ref={(el) => (handles.current.canvas = el)}
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full"
            />
            <Flash ref={(el) => (handles.current.flash = el)} />
          </div>
        </div>

        {/* Legibility scrims. The chrome sits over a moving photographic plate,
            so type needs a floor to stand on — but a flat bar would kill the
            depth, hence two very soft directional washes instead. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[9]"
          style={{
            background:
              'linear-gradient(180deg, rgba(9,9,9,0.72) 0%, rgba(9,9,9,0.28) 11%, transparent 22%),' +
              'linear-gradient(0deg, rgba(9,9,9,0.9) 0%, rgba(9,9,9,0.6) 18%, rgba(9,9,9,0.2) 34%, transparent 48%),' +
              'radial-gradient(ellipse 46% 40% at 0% 100%, rgba(9,9,9,0.72), transparent 72%)',
          }}
        />

        {/* ── fixed chrome — nothing here ever moves ── */}
        <div
          ref={(el) => (handles.current.chrome = el)}
          className="pointer-events-none absolute inset-0 z-theatre flex flex-col justify-end p-gutter"
        >
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-16">
            <Caption active={active} />
            <div className="pointer-events-auto flex shrink-0 flex-col items-start gap-5 md:items-end md:gap-6">
              <Counter active={active} onSelect={goTo} />
              <div className="w-full max-w-[min(94vw,30rem)] md:w-auto md:max-w-none">
                <Selector active={active} onSelect={goTo} />
              </div>
            </div>
          </div>
        </div>

        <ScrollHint />
      </div>
    </section>
  )
}

/**
 * The one piece of chrome that is allowed a life of its own — and even then only
 * until the visitor proves they do not need it.
 */
function ScrollHint() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      if (window.scrollY > 60) {
        el.style.opacity = '0'
        window.removeEventListener('scroll', onScroll)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2.5 transition-opacity duration-700 lg:flex"
      style={{ bottom: 'clamp(1.25rem, 4.5vw, 4.5rem)' }}
    >
      <span className="font-sans text-[0.56rem] uppercase tracking-[0.4em] text-cream/50">
        Scroll
      </span>
      <span className="block h-9 w-px bg-gradient-to-b from-gold/70 to-transparent" />
    </div>
  )
}
