export const cn = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(' ')

export const clamp = (v: number, min = 0, max = 1) => (v < min ? min : v > max ? max : v)

/** Normalise `v` from [a,b] into [0,1], clamped. */
export const norm = (v: number, a: number, b: number) => clamp((v - a) / (b - a))

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Smoothstep — the workhorse easing for scroll-driven values. */
export const smooth = (t: number) => {
  const x = clamp(t)
  return x * x * (3 - 2 * x)
}

/** Ease that rises then falls: 0 at both ends, 1 in the middle. */
export const arc = (t: number) => {
  const x = clamp(t)
  return Math.sin(x * Math.PI)
}

/** Frame-rate independent damping factor. */
export const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)

export const round = (v: number, p = 3) => {
  const m = 10 ** p
  return Math.round(v * m) / m
}
