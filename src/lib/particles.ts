import type { ParticleMode } from '@/data/products'
import { canvasDpr, getTier } from './device'
import { clamp } from './utils'

/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Deterministic particle field
 *
 *  This is not a simulation. A simulation integrates state forward over time —
 *  which means it cannot be run backwards, and it keeps moving after the user
 *  stops scrolling. Both are disqualifying here.
 *
 *  Instead every particle is a *pure function of scroll progress*. Its seed
 *  fixes its angle, speed, size, colour and lifetime window once; its position
 *  at progress `t` is then evaluated in closed form. Nothing accumulates, so:
 *
 *    · scrolling back up replays the explosion in reverse, exactly
 *    · stopping mid-scroll freezes every mote where it stands
 *    · jumping to any progress renders the correct frame with no run-up
 *
 *  `render()` is called from the master timeline's onUpdate. There is no rAF
 *  loop in this file, and no internal clock.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Cheap deterministic hash → [0,1). Stable across reloads and machines. */
const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453123
  return x - Math.floor(x)
}

interface Seed {
  /** Spawn position, 0–1 of the canvas. */
  x0: number
  y0: number
  /** Direction and magnitude, in canvas-fractions per unit of progress. */
  ax: number
  ay: number
  size: number
  hue: number
  spin: number
  /** Window within the segment during which this particle exists. */
  delay: number
  span: number
  /** 0 soft blob · 1 shard · 2 spark */
  kind: number
  /** Free per-mode wobble phase. */
  phase: number
}

interface ModeSpec {
  palette: string[]
  blend: GlobalCompositeOperation
  /** Fraction of the pool this mode uses. */
  density: number
  seed: (r: (k: number) => number) => Seed
  /** Closed-form position at local progress 0–1. */
  at: (s: Seed, u: number) => { x: number; y: number; size: number; rot: number }
}

const TAU = Math.PI * 2

/* ── the eight atmospheres ─────────────────────────────────────────────────── */

const MODES: Record<ParticleMode | 'dust' | 'burst', ModeSpec> = {
  /* Ambient. Drifts with the page rather than looping on a timer. */
  dust: {
    palette: ['#F7EAD7', '#C89B3C', '#A9683A'],
    blend: 'lighter',
    density: 0.18,
    seed: (r) => ({
      x0: r(1), y0: r(2), ax: (r(3) - 0.5) * 0.1, ay: -0.12 - r(4) * 0.2,
      size: 0.7 + r(5) * 1.5, hue: (r(6) * 3) | 0, spin: 0,
      delay: r(7) * 0.6, span: 0.5 + r(8) * 0.5, kind: 2, phase: r(9) * TAU,
    }),
    at: (s, u) => ({
      x: s.x0 + s.ax * u + Math.sin(u * 3 + s.phase) * 0.012,
      y: s.y0 + s.ay * u,
      size: s.size, rot: 0,
    }),
  },

  /* 01 Chai — steam columns lifting out of the glass. */
  steam: {
    palette: ['#F7EAD7', '#E8D6B8', '#C89B3C'],
    blend: 'lighter',
    density: 1,
    seed: (r) => ({
      x0: 0.5 + (r(1) - 0.5) * 0.16, y0: 0.52 + r(2) * 0.12,
      ax: (r(3) - 0.5) * 0.1, ay: -0.5 - r(4) * 0.45,
      size: 26 + r(5) * 54, hue: (r(6) * 3) | 0, spin: 0,
      delay: r(7) * 0.72, span: 0.28 + r(8) * 0.34, kind: 0, phase: r(9) * TAU,
    }),
    at: (s, u) => ({
      x: s.x0 + s.ax * u + Math.sin(u * 4.5 + s.phase) * 0.035 * u,
      // decelerating rise — steam loses momentum as it cools
      y: s.y0 + s.ay * (u - u * u * 0.34),
      size: s.size * (1 + u * 1.7), rot: 0,
    }),
  },

  /* 02 Shake — heavy cocoa grit falling under gravity, plus ribbon shards. */
  cocoa: {
    palette: ['#6B4226', '#A9683A', '#3C2517', '#E0BE86'],
    blend: 'source-over',
    density: 0.95,
    seed: (r) => ({
      x0: 0.5 + (r(1) - 0.5) * 0.62, y0: -0.05 + r(2) * 0.26,
      ax: (r(3) - 0.5) * 0.14, ay: 0.34 + r(4) * 0.3,
      size: 2 + r(5) * 5, hue: (r(6) * 4) | 0, spin: (r(7) - 0.5) * 9,
      delay: r(8) * 0.6, span: 0.34 + r(9) * 0.4,
      kind: r(10) < 0.25 ? 1 : 2, phase: r(11) * TAU,
    }),
    at: (s, u) => ({
      x: s.x0 + s.ax * u,
      y: s.y0 + s.ay * u + 0.42 * u * u,
      size: s.size, rot: s.spin * u,
    }),
  },

  /* 03 Vada Pav — angular golden crumbs thrown outward, then falling. */
  crumb: {
    palette: ['#E2B461', '#C8873C', '#8E5A24', '#F2DFB4'],
    blend: 'source-over',
    density: 1,
    seed: (r) => {
      const a = r(1) * TAU
      const sp = 0.22 + r(2) * 0.5
      return {
        x0: 0.5 + (r(3) - 0.5) * 0.34, y0: 0.5 + (r(4) - 0.5) * 0.28,
        ax: Math.cos(a) * sp, ay: Math.sin(a) * sp * 0.6,
        size: 2.5 + r(5) * 5.5, hue: (r(6) * 4) | 0, spin: (r(7) - 0.5) * 14,
        delay: r(8) * 0.5, span: 0.3 + r(9) * 0.36, kind: 1, phase: r(10) * TAU,
      }
    },
    at: (s, u) => {
      // ballistic with drag: fast throw, quick decay, then gravity takes over
      const d = 1 - Math.exp(-3.2 * u)
      return {
        x: s.x0 + s.ax * d,
        y: s.y0 + s.ay * d + 0.3 * u * u,
        size: s.size, rot: s.spin * d,
      }
    },
  },

  /* 04 Sandwich — wide, low grill smoke drifting sideways. */
  smoke: {
    palette: ['#8C8377', '#B9A98F', '#5A5147'],
    blend: 'lighter',
    density: 0.7,
    seed: (r) => ({
      x0: 0.5 + (r(1) - 0.5) * 0.56, y0: 0.54 + r(2) * 0.18,
      ax: (r(3) < 0.5 ? -1 : 1) * (0.06 + r(4) * 0.3), ay: -0.3 - r(5) * 0.24,
      size: 58 + r(6) * 96, hue: (r(7) * 3) | 0, spin: 0,
      delay: r(8) * 0.66, span: 0.34 + r(9) * 0.4, kind: 0, phase: r(10) * TAU,
    }),
    at: (s, u) => ({
      x: s.x0 + s.ax * (1 - Math.exp(-2 * u)),
      y: s.y0 + s.ay * u,
      size: s.size * (1 + u * 1.25), rot: 0,
    }),
  },

  /* 05 Pasta — cream droplets floating, herb flecks turning. */
  cream: {
    palette: ['#F4EADA', '#E8D9BC', '#96A46A', '#FFFFFF'],
    blend: 'lighter',
    density: 0.85,
    seed: (r) => ({
      x0: 0.16 + r(1) * 0.68, y0: 0.5 + (r(2) - 0.5) * 0.44,
      ax: (r(3) - 0.5) * 0.14, ay: -0.16 - r(4) * 0.16,
      size: 2 + r(5) * 6, hue: (r(6) * 4) | 0, spin: (r(7) - 0.5) * 5,
      delay: r(8) * 0.62, span: 0.32 + r(9) * 0.4,
      kind: r(10) < 0.24 ? 1 : 2, phase: r(11) * TAU,
    }),
    at: (s, u) => ({
      x: s.x0 + s.ax * u + Math.sin(u * 3.4 + s.phase) * 0.02,
      y: s.y0 + s.ay * u,
      size: s.size, rot: s.spin * u,
    }),
  },

  /* 06 Maggi — fine steam plus a saffron shimmer riding the noodles. */
  noodle: {
    palette: ['#F0D89A', '#D9B45C', '#F7EAD7', '#A87B2A'],
    blend: 'lighter',
    density: 0.95,
    seed: (r) => {
      const big = r(1) < 0.42
      return {
        x0: 0.5 + (r(2) - 0.5) * 0.42, y0: 0.44 + r(3) * 0.24,
        ax: (r(4) - 0.5) * 0.12, ay: -0.42 - r(5) * 0.3,
        size: big ? 24 + r(6) * 36 : 1.4 + r(6) * 2.6,
        hue: (r(7) * 4) | 0, spin: 0,
        delay: r(8) * 0.7, span: 0.28 + r(9) * 0.36,
        kind: big ? 0 : 2, phase: r(10) * TAU,
      }
    },
    at: (s, u) => ({
      x: s.x0 + s.ax * u + Math.sin(u * 6 + s.phase) * 0.026 * u,
      y: s.y0 + s.ay * (u - u * u * 0.28),
      size: s.kind === 0 ? s.size * (1 + u * 1.4) : s.size,
      rot: 0,
    }),
  },

  /* 07 Paratha — buttery flakes falling slowly with a lot of spin. */
  flake: {
    palette: ['#F2D79B', '#C8873C', '#8E5A24', '#FFF0D0'],
    blend: 'source-over',
    density: 0.85,
    seed: (r) => ({
      x0: 0.08 + r(1) * 0.84, y0: -0.08 + r(2) * 0.34,
      ax: (r(3) - 0.5) * 0.12, ay: 0.24 + r(4) * 0.26,
      size: 3 + r(5) * 7, hue: (r(6) * 4) | 0, spin: (r(7) - 0.5) * 11,
      delay: r(8) * 0.6, span: 0.36 + r(9) * 0.4, kind: 1, phase: r(10) * TAU,
    }),
    at: (s, u) => ({
      // falling leaf: the sideways sway is what sells the weightlessness
      x: s.x0 + s.ax * u + Math.sin(u * 5 + s.phase) * 0.045,
      y: s.y0 + s.ay * u,
      size: s.size, rot: s.spin * u,
    }),
  },

  /* 08 Chaat — dry spice powder thrown outward, then settling. */
  masala: {
    palette: ['#C8873C', '#96A46A', '#B23A2A', '#F2DFB4', '#7A5236'],
    blend: 'source-over',
    density: 1,
    seed: (r) => {
      const a = r(1) * TAU
      const sp = 0.14 + r(2) * 0.62
      return {
        x0: 0.5 + (r(3) - 0.5) * 0.3, y0: 0.48 + (r(4) - 0.5) * 0.24,
        ax: Math.cos(a) * sp, ay: Math.sin(a) * sp * 0.7,
        size: 1.4 + r(5) * 4, hue: (r(6) * 5) | 0, spin: (r(7) - 0.5) * 10,
        delay: r(8) * 0.42, span: 0.3 + r(9) * 0.42, kind: 2, phase: r(10) * TAU,
      }
    },
    at: (s, u) => {
      const d = 1 - Math.exp(-4 * u)
      return {
        x: s.x0 + s.ax * d,
        y: s.y0 + s.ay * d + 0.16 * u * u,
        size: s.size, rot: s.spin * d,
      }
    },
  },

  /* Detonation, layered over whichever atmosphere is running, at each handoff. */
  burst: {
    palette: ['#F7EAD7', '#C89B3C', '#A9683A', '#E2B461'],
    blend: 'lighter',
    density: 1,
    seed: (r) => {
      const a = r(1) * TAU
      const sp = 0.2 + r(2) * 0.8
      return {
        x0: 0.5, y0: 0.5,
        ax: Math.cos(a) * sp, ay: Math.sin(a) * sp * 0.62,
        size: 1.5 + r(3) * 3.5, hue: (r(4) * 4) | 0, spin: 0,
        delay: r(5) * 0.12, span: 0.4 + r(6) * 0.4, kind: 2, phase: 0,
      }
    },
    at: (s, u) => {
      const d = 1 - Math.exp(-5 * u)
      return { x: s.x0 + s.ax * d, y: s.y0 + s.ay * d, size: s.size * (1 - u * 0.5), rot: 0 }
    },
  },
}

type Key = keyof typeof MODES

export class ParticleField {
  private ctx: CanvasRenderingContext2D
  private w = 0
  private h = 0
  private dpr = 1
  private count: number
  /** Seeds are generated once per mode and reused forever — that is what makes
   *  the field reproducible at any progress. */
  private seeds = new Map<Key, Seed[]>()

  constructor(private canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    if (!ctx) throw new Error('2d context unavailable')
    this.ctx = ctx
    const tier = getTier()
    this.count = tier === 'high' ? 260 : tier === 'mid' ? 150 : 70
    this.dpr = canvasDpr()
    this.resize()
  }

  resize = () => {
    const r = this.canvas.getBoundingClientRect()
    this.w = r.width
    this.h = r.height
    this.canvas.width = Math.round(r.width * this.dpr)
    this.canvas.height = Math.round(r.height * this.dpr)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private pool(key: Key): Seed[] {
    let s = this.seeds.get(key)
    if (!s) {
      const spec = MODES[key]
      const n = Math.round(this.count * spec.density)
      s = Array.from({ length: n }, (_, i) =>
        spec.seed((k) => rand(i * 17.3 + k * 91.7 + key.length * 3.1)),
      )
      this.seeds.set(key, s)
    }
    return s
  }

  /**
   * @param mode      atmosphere for the product currently on stage
   * @param t         0–1 through that product's segment
   * @param intensity 0–1 overall strength
   * @param burst     0–1 through a handoff detonation, or 0
   * @param scroll    0–1 through the whole theatre, for the ambient dust drift
   */
  render(mode: ParticleMode, t: number, intensity: number, burst: number, scroll: number) {
    const { ctx, w, h } = this
    if (!w || !h) return
    ctx.clearRect(0, 0, w, h)
    if (intensity <= 0.002) return

    this.paint('dust', scroll, 0.5)
    this.paint(mode, t, intensity)
    if (burst > 0.001) this.paint('burst', burst, intensity)
  }

  private paint(key: Key, t: number, intensity: number) {
    const spec = MODES[key]
    const pool = this.pool(key)
    const { ctx, w, h } = this

    ctx.globalCompositeOperation = spec.blend

    for (let i = 0; i < pool.length; i++) {
      const s = pool[i]
      const u = (t - s.delay) / s.span
      if (u <= 0 || u >= 1) continue

      const p = spec.at(s, u)
      if (p.x < -0.25 || p.x > 1.25 || p.y < -0.25 || p.y > 1.25) continue

      // Rise-and-fall envelope: nothing ever pops into or out of existence.
      const alpha = Math.sin(u * Math.PI) ** 0.75 * intensity
      const x = p.x * w
      const y = p.y * h
      const color = spec.palette[s.hue % spec.palette.length]

      if (s.kind === 0) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, p.size)
        g.addColorStop(0, color)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.globalAlpha = alpha * 0.1
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(x, y, p.size, 0, TAU)
        ctx.fill()
      } else if (s.kind === 1) {
        ctx.globalAlpha = alpha * 0.82
        ctx.fillStyle = color
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(p.rot)
        ctx.fillRect(-p.size * 0.5, -p.size * 0.28, p.size, p.size * 0.56)
        ctx.restore()
      } else {
        ctx.globalAlpha = alpha * 0.72
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(x, y, p.size, 0, TAU)
        ctx.fill()
      }
    }

    ctx.globalAlpha = 1
    ctx.globalCompositeOperation = 'source-over'
  }

  clear() {
    this.ctx.clearRect(0, 0, this.w, this.h)
  }

  destroy() {
    this.seeds.clear()
  }
}

export const particleIntensity = (dwell: number, lift: number) =>
  clamp(0.55 + dwell * 0.45 + lift * 0.6, 0, 1.4)
