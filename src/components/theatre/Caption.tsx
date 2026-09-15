import { memo } from 'react'
import { PRODUCTS } from '@/data/products'

/**
 * All eight captions are in the DOM at once, stacked in the same box. Nothing
 * mounts or unmounts and nothing animates itself — `useTheatre` builds real
 * GSAP tweens against `[data-line]`, so the copy rises and leaves in step with
 * the playhead and reverses cleanly when the visitor scrolls back.
 *
 * The pre-tween state is authored here rather than left to GSAP, because this
 * markup paints before the timeline is built. The first caption is visible and
 * the rest are hidden: that is both the correct opening frame and a sensible
 * degraded state if the timeline never builds at all.
 */
export const Caption = memo(function Caption({ active }: { active: number }) {
  return (
    // A single-cell grid with every caption in that same cell. The container
    // takes the height of the tallest one automatically, so no caption is ever
    // clipped and the block never resizes as products change — which is the
    // whole point of a layout that is supposed to be invariant. `items-end`
    // sits them on a shared baseline, so the copy grows upward from a fixed
    // line rather than downward off the screen.
    <div className="grid max-w-[min(92vw,30rem)] select-none items-end">
      {PRODUCTS.map((p, i) => (
        <div
          key={p.id}
          data-caption={i}
          aria-hidden={i !== active}
          style={{ gridArea: '1 / 1' }}
        >
          <Block index={i} hidden={i !== 0} />
        </div>
      ))}
    </div>
  )
})

/** Matches the `from` state of the entrance tween in useTheatre. */
const VEILED: React.CSSProperties = { opacity: 0, visibility: 'hidden' }

function Block({ index, hidden }: { index: number; hidden: boolean }) {
  const p = PRODUCTS[index]
  const s = hidden ? VEILED : undefined
  return (
    <>
      <div className="line-mask mb-3 sm:mb-4">
        <p data-line style={s} className="eyebrow flex items-center gap-3 text-cream/55">
          <span
            className="inline-block h-px w-7"
            style={{ background: 'var(--accent, #C89B3C)' }}
          />
          {p.kicker}
        </p>
      </div>

      <h2 className="font-display text-display-lg font-light leading-[0.88] text-cream">
        <span className="line-mask">
          <span data-line style={s} className="block">
            {p.name}
          </span>
        </span>
        {p.nameAccent && (
          <span className="line-mask">
            <span data-line style={s} className="block italic text-gradient-gold">
              {p.nameAccent}
            </span>
          </span>
        )}
      </h2>

      <div className="line-mask mt-5 sm:mt-7">
        <p
          data-line
          style={s}
          className="max-w-prose text-[0.92rem] leading-relaxed text-cream/58 sm:text-body"
        >
          {p.description}
        </p>
      </div>

      <div className="line-mask mt-4 hidden sm:block">
        <p
          data-line
          style={s}
          className="flex items-baseline gap-4 font-sans text-[0.68rem] uppercase tracking-[0.2em] text-cream/55"
        >
          <span className="num text-cream/78">{p.price}</span>
          <span className="h-px w-5 bg-cream/20" />
          {p.detail}
        </p>
      </div>
    </>
  )
}
