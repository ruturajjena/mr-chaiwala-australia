import { forwardRef, memo } from 'react'

/**
 * All ambient light for the theatre, in three layers:
 *   1. a key bloom behind the plate, positioned and coloured per product
 *   2. two light rays that keep the black from going flat
 *   3. a full-screen flash used at the peak of each handoff
 *
 * Every value is a CSS custom property written by the master timeline, so
 * re-grading the whole screen costs one style write. Nothing here animates on
 * its own clock — the rays used to run on an infinite CSS rotation and are now
 * turned by the playhead, so the screen is completely still when the visitor is.
 */
export const Bloom = memo(
  forwardRef<HTMLDivElement, { raysRef?: (el: HTMLDivElement | null) => void }>(
    function Bloom({ raysRef }, ref) {
      return (
        <div
          ref={ref}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={
            {
              '--accent': '#C89B3C',
              '--accent-soft': 'rgba(200,155,60,0.42)',
              '--bloom': '0.55',
              '--kx': '50%',
              '--ky': '45%',
            } as React.CSSProperties
          }
        >
          {/* key light — sized to the plate, not the viewport (see stage.css) */}
          <div
            className="bloom-key"
            style={{
              background:
                'radial-gradient(ellipse 62% 60% at var(--kx) var(--ky), var(--accent-soft), transparent 76%)',
              opacity: 'calc(var(--bloom) * 0.72)',
              // No blur: the gradient's own falloff is already smooth, and a
              // filter here would cost a full-viewport pass every frame.
              transform: 'scale(1.28)',
            }}
          />

          {/* rim / horizon */}
          <div
            className="absolute inset-x-0 bottom-0 h-[46%]"
            style={{
              background:
                'linear-gradient(0deg, color-mix(in oklab, var(--accent) 16%, transparent), transparent 78%)',
              opacity: 'calc(var(--bloom) * 0.5)',
            }}
          />

          {/* Rays. Softness comes from wide colour stops rather than a filter —
              a blurred 190vmax element is one of the most expensive things you
              can put on a page and looks identical to this. */}
          <div
            ref={raysRef}
            className="absolute left-1/2 top-1/2 h-[190vmax] w-[190vmax] -translate-x-1/2 -translate-y-1/2 opacity-[0.14] mix-blend-screen will-change-transform"
            style={{
              background:
                'conic-gradient(from 0deg at 50% 50%,' +
                ' transparent 0deg,' +
                ' color-mix(in oklab, var(--accent) 8%, transparent) 8deg,' +
                ' color-mix(in oklab, var(--accent) 34%, transparent) 22deg,' +
                ' color-mix(in oklab, var(--accent) 8%, transparent) 36deg,' +
                ' transparent 52deg,' +
                ' transparent 168deg,' +
                ' color-mix(in oklab, var(--accent) 7%, transparent) 182deg,' +
                ' color-mix(in oklab, var(--accent) 22%, transparent) 198deg,' +
                ' color-mix(in oklab, var(--accent) 7%, transparent) 214deg,' +
                ' transparent 230deg)',
            }}
          />
        </div>
      )
    },
  ),
)

export const Flash = memo(
  forwardRef<HTMLDivElement>(function Flash(_, ref) {
    return (
      <div
        ref={ref}
        aria-hidden
        className="pointer-events-none absolute inset-0 mix-blend-screen"
        style={{
          opacity: 0,
          visibility: 'hidden',
          background:
            'radial-gradient(ellipse 70% 62% at 50% 48%, rgba(247,234,215,0.85), rgba(200,155,60,0.34) 46%, transparent 76%)',
        }}
      />
    )
  }),
)
