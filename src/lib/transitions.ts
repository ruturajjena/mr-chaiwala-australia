import type { MediaKey } from './media'
import type { TransitionKind } from '@/data/products'
import { arc, clamp, norm, round, smooth } from './utils'
import { getTier } from './device'

/* ── eases ─────────────────────────────────────────────────────────────────── */
const outQuart = (t: number) => 1 - Math.pow(1 - clamp(t), 4)
const inQuart = (t: number) => Math.pow(clamp(t), 4)
const inOut = (t: number) => smooth(t)

/** Blur is the single most expensive thing on screen; budget it by tier. */
let blurScale = 1
export const calibrateBlur = () => {
  const t = getTier()
  blurScale = t === 'high' ? 1 : t === 'mid' ? 0.55 : 0
}
const B = (px: number) => px * blurScale

/**
 * Master level for the effect deck. Authored per-transition values are relative
 * to each other; this one number sets how much of the screen the effects are
 * allowed to take, and was tuned against the plate feather in stage.css.
 */
const G = 0.62

/**
 * Hard ceiling on how far an effect plate may be scaled up.
 *
 * These layers carry a colour grade and a `screen` blend, so every pixel they
 * cover is filtered and blended on every video frame. At the 3.5x we originally
 * authored, a single plate was compositing more than five thousand pixels
 * across — which was, on its own, the whole frame budget. Capped at 2x the
 * effect is indistinguishable and the theatre holds its frame rate.
 */
export const FX_MAX_SCALE = 2.1
const gain = (v: number) => v * G

/* ── shapes ────────────────────────────────────────────────────────────────── */

/** Every effect plate the deck can hold. `steam2` is a second, independently
 *  seekable decoder over the same file, so two ribbon layers can run against
 *  each other. */
export const FX_KEYS = ['steam', 'splash', 'ingredients', 'spice', 'steam2'] as const
export type FxKey = (typeof FX_KEYS)[number]
export const fxSource = (k: FxKey): MediaKey => (k === 'steam2' ? 'steam' : (k as MediaKey))

export interface PlateStyle {
  scale: number
  scaleX: number
  scaleY: number
  x: number // % of stage width
  y: number // % of stage height
  rotate: number
  rotateX: number
  z: number // px, for perspective depth
  blur: number
  opacity: number
  brightness: number
  saturate: number
  mask: string | null
  clip: string | null
}

export interface FxLayer {
  key: FxKey
  opacity: number
  scale: number
  x: number
  y: number
  rotate: number
  filter: string
  blend: 'screen' | 'lighten' | 'plus-lighter' | 'normal'
  /** 0–1 position within the clip, driven by scroll. */
  seek: number
}

export interface TransitionFrame {
  out: PlateStyle
  enter: PlateStyle
  fx: FxLayer[]
  /** Full-screen warm light bloom, 0–1. */
  flash: number
  /** Extra push on the ambient bloom behind the plate. */
  lift: number
}

const IDLE: PlateStyle = {
  scale: 1, scaleX: 1, scaleY: 1, x: 0, y: 0, rotate: 0, rotateX: 0, z: 0,
  blur: 0, opacity: 1, brightness: 1, saturate: 1, mask: null, clip: null,
}

const plate = (p: Partial<PlateStyle>): PlateStyle => ({ ...IDLE, ...p })

/**
 * The resting state of the featured plate.
 *
 * `t` is the product's hold progress, 0–1. The plate creeps forward across it,
 * so a held moment still has direction — but the motion comes entirely from the
 * scroll position. There is deliberately no time-based "breath" term here: it
 * would keep moving after the visitor stopped, which is the one thing the whole
 * architecture exists to prevent.
 */
export function restingPlate(t: number): PlateStyle {
  return plate({
    scale: 1 + t * 0.045,
    y: -t * 1.1,
    z: t * 18,
  })
}

const HIDDEN: PlateStyle = plate({ opacity: 0, scale: 1.1, blur: B(14) })
export const hiddenPlate = () => HIDDEN

/* ── the eight handoffs ────────────────────────────────────────────────────── */
/*
 * Every one is authored against `u` (0 → 1 across the handoff window) and must
 * finish with `enter` exactly equal to IDLE, so the incoming product lands on
 * the same pixel every time. That invariant is what keeps the layout from ever
 * appearing to move.
 */

export function transitionFrame(kind: TransitionKind, u: number): TransitionFrame {
  const e = inOut(u)
  const a = arc(u)

  switch (kind) {
    /* 1 ─ CHAI → SHAKE  ·  steam expands, fills the frame, the next forms in it */
    case 'steam': {
      const v = norm(u, 0.4, 1)
      return {
        out: plate({
          scale: 1 + outQuart(u) * 0.36,
          y: -outQuart(u) * 7,
          blur: B(outQuart(u) * 24),
          opacity: 1 - inQuart(norm(u, 0.05, 0.62)),
          brightness: 1 + a * 0.25,
        }),
        enter: plate({
          scale: 0.78 + outQuart(v) * 0.22,
          blur: B((1 - outQuart(v)) * 26),
          opacity: outQuart(norm(v, 0, 0.5)),
          // A wide falloff — a tight one leaves a visible ring where the aperture ends.
          mask: `radial-gradient(circle at 50% 54%, #000 ${outQuart(v) * 118}%, transparent ${outQuart(v) * 118 + 62}%)`,
        }),
        fx: [
          {
            key: 'steam', seek: u, blend: 'screen',
            opacity: gain(a * 0.95),
            scale: 1.05 + e * 0.92, x: 0, y: -e * 12, rotate: 0,
            filter: 'brightness(1.1) contrast(1.05) saturate(0.6)',
          },
        ],
        flash: a * 0.14,
        lift: a * 0.5,
      }
    }

    /* 2 ─ SHAKE → VADA  ·  the shake pours away, cocoa ribbons, the next tilts up */
    case 'cocoa': {
      const v = norm(u, 0.46, 1)
      const pour = outQuart(norm(u, 0, 0.72))
      return {
        out: plate({
          y: pour * 16,
          scale: 1 - pour * 0.12,
          blur: B(pour * 12),
          opacity: 1 - inQuart(norm(u, 0.15, 0.78)),
          // eaten away from the top, like the glass emptying downward
          clip: `inset(${pour * 100}% 0% 0% 0%)`,
        }),
        enter: plate({
          rotateX: -52 * (1 - outQuart(v)),
          y: (1 - outQuart(v)) * 26,
          scale: 0.86 + outQuart(v) * 0.14,
          z: -220 * (1 - outQuart(v)),
          blur: B((1 - outQuart(v)) * 18),
          opacity: outQuart(norm(v, 0, 0.45)),
        }),
        fx: [
          {
            key: 'splash', seek: u, blend: 'screen',
            opacity: gain(a * 0.8),
            scale: 1.3 + e * 0.42, x: 0, y: -6 + e * 10, rotate: 180,
            filter: 'sepia(1) saturate(2.6) hue-rotate(-14deg) brightness(0.52) contrast(1.15)',
          },
          {
            key: 'ingredients', seek: u * 0.8, blend: 'screen',
            opacity: gain(arc(norm(u, 0.25, 1)) * 0.4),
            scale: 1.42, x: 0, y: 0, rotate: 0,
            filter: 'sepia(0.9) saturate(1.8) hue-rotate(-20deg) brightness(0.6)',
          },
        ],
        flash: a * 0.07,
        lift: a * 0.32,
      }
    }

    /* 3 ─ VADA → SANDWICH  ·  the plate shatters into golden bands, spices fly */
    case 'crumbs': {
      const v = norm(u, 0.42, 1)
      const band = 6.5
      const openW = (1 - outQuart(norm(u, 0, 0.8))) * band
      const closeW = outQuart(v) * band
      return {
        out: plate({
          scale: 1 + e * 0.08,
          x: e * 2.2,
          rotate: e * 1.6,
          blur: B(e * 10),
          opacity: 1 - inQuart(norm(u, 0.3, 0.9)),
          mask: `repeating-linear-gradient(100deg, #000 0 ${openW}%, transparent ${openW}% ${band}%)`,
        }),
        enter: plate({
          scale: 1.08 - outQuart(v) * 0.08,
          x: -(1 - outQuart(v)) * 2.2,
          blur: B((1 - outQuart(v)) * 14),
          opacity: 1,
          mask: `repeating-linear-gradient(100deg, transparent 0 ${band - closeW}%, #000 ${band - closeW}% ${band}%)`,
        }),
        fx: [
          {
            key: 'ingredients', seek: u, blend: 'screen',
            opacity: gain(a * 0.85),
            scale: 1.12 + e * 0.3, x: 0, y: 0, rotate: 0,
            filter: 'saturate(1.5) brightness(1.05) contrast(1.05)',
          },
          {
            key: 'spice', seek: norm(u, 0.2, 1), blend: 'screen',
            opacity: gain(arc(norm(u, 0.2, 1)) * 0.55),
            scale: 1.34 + e * 0.34, x: 0, y: 0, rotate: -6,
            filter: 'saturate(1.3) brightness(0.95)',
          },
        ],
        flash: a * 0.1,
        lift: a * 0.4,
      }
    }

    /* 4 ─ SANDWICH → PASTA  ·  the cheese pull, grill smoke, a letterbox iris */
    case 'grill': {
      const v = norm(u, 0.44, 1)
      const pull = outQuart(norm(u, 0, 0.7))
      return {
        out: plate({
          scaleY: 1 + pull * 0.62,
          scaleX: 1 - pull * 0.14,
          y: -pull * 4,
          blur: B(pull * 22),
          opacity: 1 - inQuart(norm(u, 0.28, 0.86)),
          brightness: 1 + a * 0.18,
        }),
        enter: plate({
          scale: 1.14 - outQuart(v) * 0.14,
          opacity: 1,
          // Feathered bands rather than clip-path: an aperture with hard edges
          // reads as a UI rectangle, not as a shutter opening.
          mask: (() => {
            const g = (1 - outQuart(v)) * 50
            return `linear-gradient(180deg, transparent ${round(g, 2)}%, #000 ${round(g + 9, 2)}%, #000 ${round(100 - g - 9, 2)}%, transparent ${round(100 - g, 2)}%)`
          })(),
          blur: B((1 - outQuart(v)) * 8),
        }),
        fx: [
          {
            key: 'steam', seek: 1 - u, blend: 'screen',
            opacity: gain(a * 0.72),
            scale: 1.42 + e * 0.56, x: 0, y: -e * 8, rotate: 0,
            filter: 'brightness(0.72) contrast(1.3) sepia(0.42) saturate(1.4)',
          },
        ],
        flash: a * 0.06,
        lift: a * 0.28,
      }
    }

    /* 5 ─ PASTA → MAGGI  ·  cream splash, a conic wipe, herbs settling */
    case 'cream': {
      const v = norm(u, 0.45, 1)
      return {
        out: plate({
          rotate: -e * 8,
          scale: 1 + e * 0.24,
          blur: B(e * 20),
          opacity: 1 - inQuart(norm(u, 0.2, 0.8)),
          brightness: 1 + a * 0.3,
          saturate: 1 - a * 0.35,
        }),
        enter: plate({
          rotate: (1 - outQuart(v)) * 11,
          scale: 0.82 + outQuart(v) * 0.18,
          blur: B((1 - outQuart(v)) * 20),
          opacity: 1,
          mask: `conic-gradient(from -90deg at 50% 50%, #000 ${outQuart(v) * 360}deg, transparent 0deg)`,
        }),
        fx: [
          {
            key: 'splash', seek: u, blend: 'screen',
            opacity: gain(a * 0.9),
            scale: 1.48 + e * 0.5, x: 0, y: 0, rotate: 0,
            filter: 'brightness(1.25) saturate(0.42) contrast(0.95)',
          },
        ],
        flash: a * 0.2,
        lift: a * 0.36,
      }
    }

    /* 6 ─ MAGGI → PARATHA  ·  twin steam ribbons running against each other,
                                then a circular iris */
    case 'ribbons': {
      const v = norm(u, 0.42, 1)
      return {
        out: plate({
          scaleX: 1 + e * 0.3,
          scaleY: 1 - e * 0.2,
          rotate: e * 2.5,
          blur: B(e * 18),
          opacity: 1 - inQuart(norm(u, 0.22, 0.84)),
        }),
        enter: plate({
          scale: 1.26 - outQuart(v) * 0.26,
          opacity: 1,
          clip: `circle(${outQuart(v) * 82}% at 50% 52%)`,
          blur: B((1 - outQuart(v)) * 10),
        }),
        fx: [
          {
            key: 'steam', seek: u, blend: 'screen',
            opacity: gain(a * 0.6), scale: 1.35 + e * 0.6, x: -6, y: 0, rotate: 8,
            filter: 'brightness(1.05) sepia(0.35) saturate(1.6)',
          },
          {
            // counter-scrubbed, so the two ribbon layers never move together
            key: 'steam2', seek: 1 - u, blend: 'screen',
            opacity: gain(a * 0.5), scale: 1.68 + e * 0.34, x: 8, y: 0, rotate: -14,
            filter: 'brightness(0.9) sepia(0.5) saturate(1.2)',
          },
        ],
        flash: a * 0.09,
        lift: a * 0.34,
      }
    }

    /* 7 ─ PARATHA → CHAAT  ·  butter melts the plate away from the top,
                                golden flakes fall, warm bloom */
    case 'butter': {
      const v = norm(u, 0.48, 1)
      const melt = outQuart(norm(u, 0, 0.82))
      const edge = 118 - melt * 150
      return {
        out: plate({
          scale: 1 - melt * 0.04,
          y: melt * 3,
          blur: B(melt * 8),
          opacity: 1,
          brightness: 1 + a * 0.22,
          saturate: 1 + a * 0.2,
          mask: `linear-gradient(180deg, transparent ${edge}%, #000 ${edge + 16}%)`,
        }),
        enter: plate({
          scale: 1.42 - outQuart(v) * 0.42,
          blur: B((1 - outQuart(v)) * 28),
          opacity: outQuart(norm(v, 0, 0.4)),
          saturate: 0.42 + outQuart(v) * 0.58,
        }),
        fx: [
          {
            key: 'ingredients', seek: 1 - u * 0.9, blend: 'screen',
            opacity: gain(a * 0.8), scale: 1.26 + e * 0.32, x: 0, y: 0, rotate: 0,
            filter: 'sepia(0.75) saturate(2.1) hue-rotate(-8deg) brightness(1.08)',
          },
        ],
        flash: a * 0.24,
        lift: a * 0.55,
      }
    }

    /* 8 ─ CHAAT → the room  ·  everything detonates, then settles into stillness */
    case 'spice': {
      return {
        out: plate({
          scale: 1 + outQuart(u) * 0.5,
          blur: B(outQuart(u) * 30),
          opacity: 1 - inQuart(norm(u, 0.1, 0.72)),
          brightness: 1 + a * 0.2,
        }),
        enter: HIDDEN,
        fx: [
          {
            key: 'spice', seek: u, blend: 'screen',
            opacity: gain(a * 0.95), scale: 1 + e * 0.98, x: 0, y: 0, rotate: 0,
            filter: 'saturate(1.35) brightness(1.05) contrast(1.05)',
          },
        ],
        flash: a * 0.16,
        lift: a * 0.6,
      }
    }
  }
}
