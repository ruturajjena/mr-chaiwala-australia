import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { scrollTo } from '@/lib/scroll'
import { COUNT, PRODUCTS } from '@/data/products'
import {
  calibrateBlur,
  hiddenPlate,
  restingPlate,
  transitionFrame,
  FX_MAX_SCALE,
  FX_KEYS,
  fxSource,
  type FxKey,
  type FxLayer,
  type PlateStyle,
} from '@/lib/transitions'
import { clamp, norm, round } from '@/lib/utils'
import { HERO_FPS, heroSrc, videoSrc } from '@/lib/media'
import { Seeker, loadClip, unloadClip } from '@/lib/scrub'
import { ParticleField, particleIntensity } from '@/lib/particles'
import { prefersReducedMotion } from '@/lib/device'

/* ── timeline geometry ─────────────────────────────────────────────────────────
 *
 * The eight products divide 450vh of scroll into equal twelve-and-a-half-percent
 * segments, exactly as specified:
 *
 *   00.0–12.5%  Signature Chai      50.0–62.5%  Pasta
 *   12.5–25.0%  KitKat Shake        62.5–75.0%  Masala Maggi
 *   25.0–37.5%  Vada Pav            75.0–87.5%  Stuffed Paratha
 *   37.5–50.0%  Paneer Sandwich     87.5–100%   Chaat
 *
 * The closing movement (detonation, steam, the shrink into the nav) follows on
 * its own 100vh, still inside the same pinned container.
 * ---------------------------------------------------------------------------- */

export const PRODUCT_VH = 450
export const OUTRO_VH = 100
export const TOTAL_VH = PRODUCT_VH + OUTRO_VH

/** One timeline unit = one product segment. */
const SEG_VH = PRODUCT_VH / COUNT
const OUTRO_UNITS = OUTRO_VH / SEG_VH

/** Share of a segment the product holds before its handoff begins. */
const DWELL = 0.58
const TRANS = 1 - DWELL

export const TL_DURATION = COUNT + OUTRO_UNITS

/** Timeline time at which product `i` sits at rest, mid-hold. */
const restAt = (i: number) => i + DWELL * 0.5

/**
 * The earliest segment whose handoff needs each effect plate.
 *
 * Scrubbing requires buffered data, so these are `preload="auto"` — which makes
 * *when* they are requested the only lever on initial page weight. Loading the
 * whole deck up front costs ~3MB before the visitor has scrolled a pixel, and
 * four of the five are not needed until they are several segments away.
 */
const FX_NEEDED_AT: Record<FxKey, number> = {
  steam: 0,        // chai → shake, and again at sandwich → pasta
  splash: 1,       // shake → vada
  ingredients: 1,  // shake → vada, then vada → sandwich
  spice: 2,        // vada → sandwich, and the closing detonation
  steam2: 5,       // maggi → paratha, and the closing steam
}

/* ── style writers ───────────────────────────────────────────────────────────
 * Everything the timeline drives is written through these. They are the only
 * code in the theatre that touches the DOM, which is what keeps the render
 * order predictable no matter which tween fired last.
 * ---------------------------------------------------------------------------- */

const styleCache = new WeakMap<HTMLElement, string>()

function write(el: HTMLElement, css: Record<string, string>) {
  const sig = JSON.stringify(css)
  if (styleCache.get(el) === sig) return
  styleCache.set(el, sig)
  for (const k in css) el.style.setProperty(k, css[k])
}

/**
 * Quantiser for values that end up inside a `mask-image` string.
 *
 * transform and opacity are composited — free to change every frame. A mask is
 * not: any change re-rasterises the whole plate. Rounding to ~0.4% steps makes
 * the string repeat for several frames, which `write()` then skips entirely.
 */
const q = (v: number) => Math.round(v * 2.5) / 2.5
const snap = (css: string | null) =>
  css === null ? null : css.replace(/-?\d+\.\d+/g, (n) => String(q(parseFloat(n))))

function applyPlate(el: HTMLElement, s: PlateStyle) {
  const sx = round(s.scale * s.scaleX, 4)
  const sy = round(s.scale * s.scaleY, 4)
  const hidden = s.opacity < 0.006
  const filters: string[] = []
  if (s.blur > 0.15 && s.opacity > 0.12) filters.push(`blur(${round(s.blur, 2)}px)`)
  if (Math.abs(s.brightness - 1) > 0.004) filters.push(`brightness(${round(s.brightness, 3)})`)
  if (Math.abs(s.saturate - 1) > 0.004) filters.push(`saturate(${round(s.saturate, 3)})`)

  const mask = hidden ? null : snap(s.mask)
  write(el, {
    transform:
      `translate3d(${round(s.x, 3)}%, ${round(s.y, 3)}%, ${round(s.z, 1)}px)` +
      ` rotateX(${round(s.rotateX, 2)}deg) rotate(${round(s.rotate, 3)}deg)` +
      ` scale(${sx}, ${sy})`,
    opacity: String(round(s.opacity, 3)),
    filter: filters.length ? filters.join(' ') : 'none',
    '-webkit-mask-image': mask ?? 'none',
    'mask-image': mask ?? 'none',
    'clip-path': hidden ? 'none' : (snap(s.clip) ?? 'none'),
    visibility: hidden ? 'hidden' : 'visible',
  })
}

/**
 * The grade goes on the <video>, the motion on its wrapper. Both on one element
 * makes Chrome run the filter over the *scaled* raster; split, the filter runs
 * once at layout size and the scale is a free composite.
 */
function applyFx(el: HTMLElement, l: FxLayer | null) {
  const vid = el.firstElementChild as HTMLElement | null
  if (!l || l.opacity < 0.004) {
    // `display`, not `visibility`: a hidden-but-laid-out full-bleed video still
    // counts as a Largest Contentful Paint candidate.
    //
    // Opacity is reset too, so a hidden layer's computed style is identical no
    // matter which direction the playhead arrived from. Leaving it stale is
    // invisible, but it makes the DOM lie about the timeline's state.
    write(el, { display: 'none', opacity: '0' })
    return
  }
  write(el, {
    display: 'block',
    opacity: String(round(l.opacity, 3)),
    'mix-blend-mode': l.blend,
    transform:
      `translate3d(${round(l.x, 2)}%, ${round(l.y, 2)}%, 0)` +
      ` rotate(${round(l.rotate, 2)}deg) scale(${round(Math.min(l.scale, FX_MAX_SCALE), 4)})`,
  })
  if (vid) write(vid, { filter: l.filter })
}

/* ── handles ─────────────────────────────────────────────────────────────────── */

export interface Handles {
  plates: (HTMLDivElement | null)[]
  videos: (HTMLVideoElement | null)[]
  fx: Partial<Record<FxKey, HTMLDivElement | null>>
  fxVideos: Partial<Record<FxKey, HTMLVideoElement | null>>
  flash: HTMLDivElement | null
  bloom: HTMLDivElement | null
  rays: HTMLDivElement | null
  stage: HTMLDivElement | null
  chrome: HTMLDivElement | null
  canvas: HTMLCanvasElement | null
  root: HTMLDivElement | null
}

/* ── the driver ──────────────────────────────────────────────────────────────── */

export function useTheatre(handles: React.MutableRefObject<Handles>) {
  const [active, setActive] = useState(0)
  const [docked, setDocked] = useState(false)
  const wrapRef = useRef<HTMLElement>(null)
  const master = useRef<gsap.core.Timeline | null>(null)

  const seekers = useRef<(Seeker | null)[]>([])
  /**
   * The position each clip's tween last asked for. A clip that scrolls out of
   * range is unloaded to free its decoder; when the visitor comes back it must
   * resume on the frame the timeline is actually asking for. Priming it to zero
   * instead would show the first frame of the wrong moment until the next
   * scroll event nudged the tween.
   */
  const clipAt = useRef<number[]>(Array(COUNT).fill(0))
  const fxSeekers = useRef<Partial<Record<FxKey, Seeker>>>({})
  const field = useRef<ParticleField | null>(null)
  const shown = useRef(-1)
  const attached = useRef(new Set<number>())
  const fxAttached = useRef(new Set<FxKey>())
  const armed = useRef(false)

  /* ── clip attachment ───────────────────────────────────────────────────────
   * A clip must be decoded before it can be scrubbed, so the two neighbours of
   * the current segment are always attached. Nothing plays; attaching only
   * costs a demuxer and the bytes.
   * -------------------------------------------------------------------------- */
  const syncClips = useCallback(
    (i: number) => {
      const { videos } = handles.current
      videos.forEach((v, idx) => {
        if (!v) return
        const dist = Math.abs(idx - i)
        if (dist <= 1) {
          if (!attached.current.has(idx)) {
            attached.current.add(idx)
            loadClip(v, heroSrc(PRODUCTS[idx].media)).then(() =>
              seekers.current[idx]?.set(clipAt.current[idx]),
            )
          }
        } else if (dist > 2 && attached.current.has(idx)) {
          attached.current.delete(idx)
          unloadClip(v)
        }
      })
    },
    [handles],
  )

  /** Attaches any effect plate whose handoff is now within one segment. */
  const syncFx = useCallback(
    (i: number) => {
      for (const k of FX_KEYS) {
        if (fxAttached.current.has(k)) continue
        // Entering the segment whose handoff needs it. That is roughly 58% of a
        // segment of scroll — a comfortable lead at any realistic scroll speed,
        // without paying for four effect plates on the initial load.
        if (i < FX_NEEDED_AT[k]) continue
        const v = handles.current.fxVideos[k]
        if (!v) continue
        fxAttached.current.add(k)
        loadClip(v, videoSrc(fxSource(k))).then(() => fxSeekers.current[k]?.prime())
      }
    },
    [handles],
  )

  /* ── the stage renderer ────────────────────────────────────────────────────
   * Called from timeline tweens only. Writes the complete state of every plate
   * on every call, so a scrub that jumps several segments can never leave a
   * stale one on screen.
   * -------------------------------------------------------------------------- */

  const paintStage = useCallback(
    (i: number, next: number | null, styleI: PlateStyle, styleNext: PlateStyle | null) => {
      const { plates } = handles.current
      for (let k = 0; k < COUNT; k++) {
        const el = plates[k]
        if (!el) continue
        if (k === i) applyPlate(el, styleI)
        else if (k === next && styleNext) applyPlate(el, styleNext)
        else applyPlate(el, hiddenPlate())
      }
    },
    [handles],
  )

  const paintLight = useCallback(
    (idx: number, lift: number, flash: number) => {
      const h = handles.current
      const p = PRODUCTS[idx]
      if (h.bloom) {
        write(h.bloom, {
          '--accent': p.accent,
          '--accent-soft': p.accentSoft,
          '--bloom': String(round(p.bloom + lift * 0.35, 3)),
          '--kx': `${p.key.x}%`,
          '--ky': `${p.key.y}%`,
        })
      }
      if (h.flash) {
        write(h.flash, {
          opacity: String(round(flash, 3)),
          visibility: flash < 0.004 ? 'hidden' : 'visible',
        })
      }
    },
    [handles],
  )

  const paintFx = useCallback(
    (layers: FxLayer[]) => {
      const h = handles.current
      const seen = new Set<FxKey>()
      for (const l of layers) {
        seen.add(l.key)
        const el = h.fx[l.key]
        if (el) applyFx(el, l)
        fxSeekers.current[l.key]?.set(l.seek)
      }
      for (const k of FX_KEYS) {
        if (!seen.has(k) && h.fx[k]) applyFx(h.fx[k]!, null)
      }
    },
    [handles],
  )

  /**
   * Which product the chrome is currently describing. Purely a readout of the
   * playhead — deliberately *not* where clips get attached.
   *
   * GSAP renders a timeline backwards through every child as tweens are added
   * to it, so each segment's onUpdate fires once during construction. Hanging
   * network work off that means the whole media library is requested before the
   * visitor has scrolled a pixel. Attachment is driven from the ScrollTrigger's
   * own progress instead, which only ever reflects real scroll position.
   */
  const setShown = useCallback((i: number) => {
    if (i === shown.current) return
    shown.current = i
    setActive(i)
  }, [])

  /* ── build the master timeline ─────────────────────────────────────────────── */

  useEffect(() => {
    calibrateBlur()
    const section = wrapRef.current
    const root = handles.current.root
    if (!section || !root) return

    fxAttached.current.clear()
    attached.current.clear()

    // Seekers wrap each element's playhead; nothing else ever touches
    // currentTime.
    // Product clips are the 24fps short-GOP hero rung (see heroSrc); effect
    // plates stay on the 12fps all-intra ladder, so their Seekers keep the
    // defaults.
    seekers.current = handles.current.videos.map((v) =>
      v ? new Seeker(v, { fps: HERO_FPS, intra: false }) : null,
    )
    for (const k of FX_KEYS) {
      const v = handles.current.fxVideos[k]
      if (v) fxSeekers.current[k] = new Seeker(v)
    }

    if (handles.current.canvas && !prefersReducedMotion()) {
      field.current = new ParticleField(handles.current.canvas)
    }

    const ctx = gsap.context(() => {
      /**
       * ONE timeline. Scroll is its only clock — `scrub: true` binds playhead to
       * scroll position with no easing of its own, so stopping the wheel stops
       * the timeline on the exact frame and reversing runs it backwards.
       * (The glide the visitor feels is Lenis smoothing the scroll itself; a
       * scrub duration on top of that would be a second, laggier smoothing.)
       */
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            // Chrome state that is a plain readout of position.
            setDocked(self.progress > (PRODUCT_VH + OUTRO_VH * 0.55) / TOTAL_VH)
            // Media follows the scroll position, never the tween callbacks.
            if (!armed.current) return
            const seg = Math.min(COUNT - 1, Math.max(0, Math.floor(self.progress * TL_DURATION)))
            syncClips(seg)
            syncFx(seg)
          },
        },
      })
      master.current = tl

      const caption = (i: number) =>
        gsap.utils.toArray<HTMLElement>(root.querySelectorAll(`[data-caption="${i}"] [data-line]`))
      const digit = (i: number) => root.querySelector<HTMLElement>(`[data-index="${i}"]`)

      PRODUCTS.forEach((product, i) => {
        const at = i
        const last = i === COUNT - 1

        /* ── 1. the clip ──────────────────────────────────────────────────────
         * Scrubbed across the whole time the plate is on screen: it starts
         * entering during the previous handoff and leaves during its own.
         * ------------------------------------------------------------------- */
        const clip = { p: 0 }
        const clipFrom = Math.max(0, at - TRANS)
        const clipDur = (at - clipFrom) + 1 + (last ? OUTRO_UNITS : 0)
        tl.to(
          clip,
          {
            p: 1,
            duration: clipDur,
            onUpdate: () => {
              clipAt.current[i] = clip.p
              seekers.current[i]?.set(clip.p)
            },
          },
          clipFrom,
        )

        /* ── 2. the hold ──────────────────────────────────────────────────── */
        const hold = { u: 0 }
        tl.to(
          hold,
          {
            u: 1,
            duration: DWELL,
            onUpdate: () => {
              setShown(i)
              paintStage(i, null, restingPlate(hold.u), null)
              paintLight(i, 0, 0)
              paintFx([])
              field.current?.render(
                product.particles,
                hold.u * DWELL,
                particleIntensity(hold.u, 0),
                0,
                tl.progress(),
              )
            },
          },
          at,
        )

        /* ── 3. the handoff ───────────────────────────────────────────────────
         * `transitionFrame` is a pure function of u, so the whole bespoke
         * choreography — masks, blur, particles, effect-clip position — reverses
         * exactly when the visitor scrolls back up.
         * ------------------------------------------------------------------- */
        if (!last) {
          const hand = { u: 0 }
          tl.to(
            hand,
            {
              u: 1,
              duration: TRANS,
              onUpdate: () => {
                const u = hand.u
                const f = transitionFrame(product.out, u)
                // The caption swaps at the midpoint, where the screen is busiest.
                setShown(u > 0.46 ? i + 1 : i)
                paintStage(i, i + 1, f.out, f.enter)
                paintLight(u > 0.5 ? i + 1 : i, f.lift, f.flash)
                paintFx(f.fx)
                field.current?.render(
                  (u > 0.5 ? PRODUCTS[i + 1] : product).particles,
                  DWELL + u * TRANS,
                  particleIntensity(1, f.lift),
                  u,
                  tl.progress(),
                )
              },
            },
            at + DWELL,
          )
        }

        /* ── 4. the copy ──────────────────────────────────────────────────────
         * Real property tweens, so GSAP owns their state at any playhead
         * position — including one it jumped to.
         * ------------------------------------------------------------------- */
        const lines = caption(i)
        if (lines.length) {
          // The first product is already on stage when the theatre opens, so it
          // has no entrance here — animating it in would mean the hero's first
          // frame, at scroll position zero, had no copy on it at all. Its
          // arrival belongs to the intro veil lifting, not to the timeline.
          if (i > 0) {
            tl.fromTo(
              lines,
              { yPercent: 108, autoAlpha: 0, filter: 'blur(8px)' },
              {
                yPercent: 0,
                autoAlpha: 1,
                filter: 'blur(0px)',
                duration: TRANS * 0.55,
                stagger: { each: 0.045, from: 'start' },
              },
              at - TRANS * 0.55,
            )
          }
          if (!last) {
            tl.to(
              lines,
              {
                yPercent: -96,
                autoAlpha: 0,
                filter: 'blur(7px)',
                duration: TRANS * 0.5,
                stagger: { each: 0.03, from: 'start' },
              },
              at + DWELL,
            )
          }
        }

        const d = digit(i)
        if (d) {
          if (i > 0) {
            tl.fromTo(
              d,
              { yPercent: 112, autoAlpha: 0 },
              { yPercent: 0, autoAlpha: 1, duration: TRANS * 0.5 },
              at - TRANS * 0.5,
            )
          }
          if (!last) {
            tl.to(d, { yPercent: -112, autoAlpha: 0, duration: TRANS * 0.5 }, at + DWELL)
          }
        }
      })

      /* ── 5. the selector underline ──────────────────────────────────────────
       * Measured once, then tweened between tabs. Because these are real
       * tweens the bar tracks the playhead in both directions.
       * ---------------------------------------------------------------------- */
      const bar = root.querySelector<HTMLElement>('[data-bar]')
      const tabs = gsap.utils.toArray<HTMLElement>(root.querySelectorAll('[data-tab]'))
      if (bar && tabs.length === COUNT) {
        // Function-based values: re-measured on every ScrollTrigger refresh
        // (resize, rotation, late font swap). Measured once, the underline stays
        // wherever the tabs were at build time and drifts off them.
        const at = (i: number) => () => tabs[i].offsetLeft
        const w = (i: number) => () => tabs[i].offsetWidth
        gsap.set(bar, { x: at(0), scaleX: w(0) })
        gsap.set(tabs[0], { opacity: 1, scale: 1.06 })
        tabs.slice(1).forEach((t) => gsap.set(t, { opacity: 0.34, scale: 1 }))
        tabs.forEach((tab, i) => {
          if (i === 0) return
          const when = (i - 1) + DWELL
          tl.fromTo(bar, { x: at(i - 1), scaleX: w(i - 1) }, { x: at(i), scaleX: w(i), duration: TRANS, immediateRender: false }, when)
          tl.to(tabs[i - 1], { opacity: 0.34, scale: 1, duration: TRANS }, when)
          tl.to(tab, { opacity: 1, scale: 1.06, duration: TRANS }, when)
        })
      }

      /* ── 6. the closing movement ──────────────────────────────────────────── */
      const outro = { u: 0 }
      tl.to(
        outro,
        {
          u: 1,
          duration: OUTRO_UNITS,
          onUpdate: () => {
            const u = outro.u
            const f = transitionFrame('spice', u)
            setShown(COUNT - 1)
            paintStage(COUNT - 1, null, f.out, null)
            paintLight(COUNT - 1, f.lift, f.flash)
            // Steam floods the frame over the detonation as the theatre closes.
            paintFx([
              ...f.fx,
              {
                key: 'steam2',
                seek: norm(u, 0.1, 0.9),
                blend: 'screen',
                opacity: Math.sin(norm(u, 0.12, 0.9) * Math.PI) ** 0.7 * 0.62,
                scale: 1.2 + u * 0.85,
                x: 0,
                y: -u * 10,
                rotate: 0,
                filter: 'brightness(1.15) saturate(0.5) contrast(0.95)',
              },
            ])
            field.current?.render(
              PRODUCTS[COUNT - 1].particles,
              clamp(0.6 + u * 0.4),
              particleIntensity(1, f.lift),
              u,
              tl.progress(),
            )
          },
        },
        COUNT,
      )

      // Stage and chrome leave together but not in step: the plate pulls back
      // first, the type follows a beat later.
      const stage = handles.current.stage
      const chrome = handles.current.chrome
      if (stage) {
        tl.fromTo(
          stage,
          { scale: 1, yPercent: 0, filter: 'blur(0px)', autoAlpha: 1 },
          { scale: 0.64, yPercent: -10, filter: 'blur(8px)', autoAlpha: 0, duration: OUTRO_UNITS * 0.6 },
          COUNT + OUTRO_UNITS * 0.4,
        )
      }
      if (chrome) {
        tl.fromTo(
          chrome,
          { scale: 1, yPercent: 0, filter: 'blur(0px)', autoAlpha: 1 },
          { scale: 0.94, yPercent: 3.5, filter: 'blur(10px)', autoAlpha: 0, duration: OUTRO_UNITS * 0.54 },
          COUNT + OUTRO_UNITS * 0.24,
        )
      }

      /* ── 7. ambient light, also on the playhead ────────────────────────────
       * The rays used to rotate on an infinite CSS animation. Now they turn
       * with the scroll, so the whole screen is still when the visitor is.
       * ---------------------------------------------------------------------- */
      const rays = handles.current.rays
      if (rays) tl.fromTo(rays, { rotate: 0 }, { rotate: 78, duration: TL_DURATION }, 0)
    }, section)

    /*
     * Only the hero clip is fetched on load — it is the LCP element and the
     * only thing on screen. Everything else waits for a sign that the visitor
     * intends to move.
     *
     * Scrubbed video has to be buffered before it can be seeked, so this is the
     * one real cost of the architecture; the answer is not to fetch less, it is
     * to fetch later. The second clip and the first effect plate are not needed
     * until 58% of the way through the first segment, which is a few hundred
     * pixels of scroll after the first wheel event — ample lead time, and
     * nothing at all is spent on a visitor who never scrolls.
     */
    const arm = () => {
      if (armed.current) return
      armed.current = true
      syncClips(0)
      syncFx(0)
    }
    const INTENT = ['scroll', 'wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    INTENT.forEach((e) => window.addEventListener(e, arm, { once: true, passive: true }))

    // Fallback for someone who is reading rather than scrolling, well after the
    // page has settled.
    const idleTimer = window.setTimeout(arm, 4500)

    const cancelIdle = () => {
      window.clearTimeout(idleTimer)
      INTENT.forEach((e) => window.removeEventListener(e, arm))
    }

    // The hero plate itself cannot wait.
    const first = handles.current.videos[0]
    if (first) {
      attached.current.add(0)
      loadClip(first, heroSrc(PRODUCTS[0].media)).then(() => seekers.current[0]?.set(clipAt.current[0]))
    }

    return () => {
      cancelIdle()
      ctx.revert()
      master.current = null
      seekers.current.forEach((s) => s?.destroy())
      seekers.current = []
      Object.values(fxSeekers.current).forEach((s) => s?.destroy())
      fxSeekers.current = {}
      field.current?.destroy()
      field.current = null
      attached.current.clear()
      fxAttached.current.clear()
      armed.current = false
    }
  }, [handles, paintStage, paintLight, paintFx, setShown, syncClips, syncFx])

  /* ── navigation ───────────────────────────────────────────────────────────── */
  const goTo = useCallback((i: number) => {
    const el = wrapRef.current
    if (!el) return
    const range = el.offsetHeight - window.innerHeight
    const target = el.offsetTop + (restAt(i) / TL_DURATION) * range
    // Distance-aware, so a jump from the first dish to the last still scrubs
    // through every transition in between instead of cutting.
    const delta = Math.abs(target - window.scrollY) / window.innerHeight
    scrollTo(target, { duration: clamp(0.9 + delta * 0.26, 0.9, 3.2) })
  }, [])

  const resize = useCallback(() => {
    field.current?.resize()
    ScrollTrigger.refresh()
  }, [])

  return { wrapRef, active, docked, goTo, resize }
}
