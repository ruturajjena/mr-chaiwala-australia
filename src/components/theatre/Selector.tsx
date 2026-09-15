import { memo, useEffect, useRef } from 'react'
import { PRODUCTS } from '@/data/products'

interface Props {
  active: number
  onSelect: (i: number) => void
}

/**
 * The horizontal product selector.
 *
 * The gold underline is a single element measured against the tabs and moved by
 * the master timeline — so it slides between products as the visitor scrubs,
 * rather than snapping when an index changes. Tab opacity and scale are tweened
 * on the same timeline; the only thing left to CSS is the hover rule, which is
 * a pointer interaction and not part of the scroll story.
 */
export const Selector = memo(function Selector({ active, onSelect }: Props) {
  const list = useRef<HTMLDivElement>(null)

  // On narrow screens the strip scrolls; keep the active tab in view.
  useEffect(() => {
    const el = list.current
    if (!el) return
    const tab = el.querySelector<HTMLElement>(`[data-tab="${active}"]`)
    if (!tab) return
    const pad = 48
    const left = tab.offsetLeft - pad
    const right = tab.offsetLeft + tab.offsetWidth + pad
    if (left < el.scrollLeft) el.scrollTo({ left, behavior: 'smooth' })
    else if (right > el.scrollLeft + el.clientWidth)
      el.scrollTo({ left: right - el.clientWidth, behavior: 'smooth' })
  }, [active])

  return (
    <div className="pointer-events-auto relative">
      <div
        ref={list}
        role="tablist"
        aria-label="Featured dishes"
        className="no-scrollbar relative flex items-center gap-1 overflow-x-auto"
      >
        {PRODUCTS.map((p, i) => (
          <button
            key={p.id}
            data-tab={i}
            role="tab"
            aria-selected={i === active}
            data-cursor="link"
            onClick={() => onSelect(i)}
            className="group relative shrink-0 px-3 py-2.5 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.26em] text-cream will-change-transform"
          >
            {p.tab}
            <span
              aria-hidden
              className="absolute inset-x-2 -bottom-px h-px origin-left scale-x-0 bg-cream/25 transition-transform duration-500 ease-silk group-hover:scale-x-100"
            />
          </button>
        ))}
        {/* 1px wide, scaled to the width of whichever tab the playhead is on. */}
        <span
          data-bar
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-px w-px origin-left will-change-transform"
          style={{
            background: 'var(--accent, #C89B3C)',
            boxShadow: '0 0 18px 1px var(--accent, #C89B3C)',
          }}
        />
      </div>
      <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-cream/10" />
    </div>
  )
})
