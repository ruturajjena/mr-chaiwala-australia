import { memo } from 'react'
import { COUNT, PRODUCTS } from '@/data/products'

/**
 * The index readout and the tick scrubber. Like the caption, every digit is
 * present at once and the master timeline rolls them past the window — no
 * presence animation, nothing with its own clock.
 */
export const Counter = memo(function Counter({
  active,
  onSelect,
}: {
  active: number
  onSelect: (i: number) => void
}) {
  return (
    <div className="flex items-center gap-5 sm:gap-7">
      <div className="flex items-baseline gap-1.5">
        <span
          className="relative block h-[1.05em] w-[1.35em] overflow-hidden font-mono text-[2.1rem] font-light leading-none text-cream sm:text-[2.75rem]"
          aria-live="polite"
          aria-atomic="true"
        >
          {PRODUCTS.map((p, i) => (
            <span
              key={p.id}
              data-index={i}
              aria-hidden={i !== active}
              className="absolute inset-0 block tabular-nums"
              style={i === 0 ? undefined : { opacity: 0, visibility: 'hidden' }}
            >
              {p.index}
            </span>
          ))}
        </span>
        <span className="font-mono text-[0.72rem] font-light text-cream/50">
          / {String(COUNT).padStart(2, '0')}
        </span>
      </div>

      {/* 24px minimum touch target each; the visible tick stays 1px wide. */}
      <div className="-mx-1 flex items-center" role="group" aria-label="Jump to dish">
        {PRODUCTS.map((p, i) => (
          <button
            key={p.id}
            data-cursor="link"
            aria-label={`${p.name} ${p.nameAccent ?? ''}`.trim()}
            aria-current={i === active}
            onClick={() => onSelect(i)}
            className="group relative h-11 w-6 p-0"
          >
            <span
              data-tick={i}
              className={[
                'absolute left-1/2 top-1/2 block w-px -translate-x-1/2 -translate-y-1/2 origin-center',
                'transition-[height,background-color,box-shadow] duration-[600ms] ease-silk',
                i === active
                  ? 'h-7 bg-[var(--accent,#C89B3C)]'
                  : 'h-3 bg-cream/28 group-hover:h-5 group-hover:bg-cream/60',
              ].join(' ')}
              style={i === active ? { boxShadow: '0 0 14px 0.5px var(--accent, #C89B3C)' } : undefined}
            />
          </button>
        ))}
      </div>
    </div>
  )
})
