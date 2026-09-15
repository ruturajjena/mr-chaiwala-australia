import { memo, useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { useIsoLayoutEffect } from '@/hooks/useIsoLayoutEffect'
import { prefersReducedMotion } from '@/lib/device'
import { allItems, formatPrice, fromPrice, type MenuCategory } from '@/data/menu'
import { ScrubVideo } from '@/components/ui/ScrubVideo'

interface Props {
  category: MenuCategory
  index: number
  /** Present while searching: the full list is replaced by matches. */
  query: string
}

/**
 * One category of the menu.
 *
 * Categories with footage get a wide plate scrubbed by scroll position, the
 * same contract as the rest of the site. Items are set like a printed menu:
 * name, a hairline leader, the price, then the description — so the eye can run
 * straight down the prices without reading every line.
 */
export const CategorySection = memo(function CategorySection({ category: c, index, query }: Props) {
  const ref = useRef<HTMLElement>(null)

  useIsoLayoutEffect(() => {
    const el = ref.current
    if (!el || prefersReducedMotion() || query) return
    const ctx = gsap.context(() => {
      // An aperture, not a fade. Fading from opacity 0 left the first category
      // half-transparent at load (it starts mid-reveal) — unreadable, and a
      // contrast failure. A clip keeps every visible glyph at full colour while
      // still opening with the scroll.
      gsap.fromTo(
        el.querySelectorAll('[data-reveal]'),
        { yPercent: 16, clipPath: 'inset(0% 0% 100% 0%)' },
        {
          yPercent: 0,
          clipPath: 'inset(0% 0% 0% 0%)',
          ease: 'none',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 98%', end: 'top 62%', scrub: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [query])

  const count = allItems(c).length

  return (
    <section
      ref={ref}
      id={c.id}
      aria-labelledby={`${c.id}-title`}
      className="scroll-mt-40 border-t border-cream/[0.07] py-[clamp(3.5rem,9vh,6.5rem)]"
    >
      <header className="grid gap-y-4 lg:grid-cols-12 lg:items-end lg:gap-x-10">
        <div className="lg:col-span-8" data-reveal>
          <p className="num text-[0.66rem] text-gold/90">{String(index + 1).padStart(2, '0')}</p>
          <h2
            id={`${c.id}-title`}
            className="mt-3 font-display text-display-md font-light leading-[0.95] text-cream"
          >
            {c.title}
          </h2>
          <p className="mt-3 font-display text-[clamp(1.1rem,1.6vw,1.45rem)] font-light italic text-cream/60">
            {c.lede}
          </p>
        </div>
        <p
          data-reveal
          className="font-sans text-[0.62rem] uppercase tracking-[0.22em] text-cream/55 lg:col-span-4 lg:text-right"
        >
          From <span className="num text-[0.9rem] tracking-normal text-cream/85">{formatPrice(fromPrice(c))}</span>
          <span className="mx-3 text-cream/25">/</span>
          {count} {count === 1 ? 'item' : 'items'}
        </p>
      </header>

      {c.media && !query && (
        <div
          data-reveal
          className="relative mt-10 hidden aspect-[21/8] overflow-hidden rounded-[18px] bg-surface ring-1 ring-inset ring-cream/[0.07] md:block"
        >
          <ScrubVideo media={c.media} className="scale-[1.12]" />
          <span
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg, rgba(9,9,9,0.55), transparent 30%, transparent 70%, rgba(9,9,9,0.55)), linear-gradient(180deg, transparent 55%, rgba(9,9,9,0.7))',
            }}
          />
        </div>
      )}

      <div className="mt-10 flex flex-col gap-10">
        {c.groups.map((g, gi) => (
          <div key={g.title ?? gi}>
            {g.title && (
              <h3 className="mb-2 flex items-center gap-4 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.3em] text-gold/90">
                {g.title}
                <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
              </h3>
            )}
            <ul className="grid gap-x-12 md:grid-cols-2">
              {g.items.map((item) => (
                <li
                  key={item.name}
                  className="group border-b border-cream/[0.06] py-5 transition-colors duration-500 hover:border-gold/25"
                >
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-[clamp(1.2rem,1.55vw,1.45rem)] font-normal leading-snug text-cream transition-transform duration-[600ms] ease-silk group-hover:translate-x-1">
                      {item.name}
                    </span>
                    {item.note && (
                      <span className="shrink-0 rounded-full border border-cream/[0.12] px-2 py-0.5 font-sans text-[0.55rem] uppercase tracking-[0.16em] text-cream/60">
                        {item.note}
                      </span>
                    )}
                    <span
                      aria-hidden
                      className="min-w-6 flex-1 translate-y-[-0.28em] border-b border-dotted border-cream/20 transition-colors duration-500 group-hover:border-gold/45"
                    />
                    <span className="num shrink-0 text-[1rem] text-cream/90 transition-colors duration-500 group-hover:text-gold">
                      {formatPrice(item.price)}
                    </span>
                  </div>
                  {item.description && (
                    <p className="mt-1.5 max-w-[52ch] text-[0.88rem] leading-relaxed text-cream/58">
                      {item.description}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  )
})
