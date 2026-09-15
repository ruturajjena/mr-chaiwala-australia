import { memo } from 'react'

/**
 * Film grain + a very slow vignette breathe. The noise is a single inline SVG
 * turbulence tile (≈1.5kB, no network request) animated by background-position,
 * which the compositor handles on its own thread.
 */
const NOISE =
  "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='220' height='220' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E"

export const Grain = memo(function Grain() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[70]">
      <div
        className="absolute inset-[-18%] opacity-[0.055] will-change-transform mix-blend-overlay motion-safe:animate-[grain_5s_steps(6)_infinite]"
        style={{ backgroundImage: `url("${NOISE}")`, backgroundRepeat: 'repeat' }}
      />
      {/* Optical vignette — keeps the eye centred without darkening the corners
          enough to read as a filter. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 92% 86% at 50% 46%, transparent 42%, rgba(9,9,9,0.42) 88%, rgba(9,9,9,0.72) 100%)',
        }}
      />
    </div>
  )
})
