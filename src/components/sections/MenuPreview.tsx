import { useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { useIsoLayoutEffect } from '@/hooks/useIsoLayoutEffect'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { prefersReducedMotion } from '@/lib/device'
import { MENU, MENU_ITEM_COUNT, allItems, formatPrice, fromPrice } from '@/data/menu'
import { PRODUCTS } from '@/data/products'
import { posterSrc } from '@/lib/media'
import { SITE } from '@/data/site'
import { Button, ArrowRight } from '@/components/ui/Button'
import { Eyebrow, Reveal } from '@/components/ui/Reveal'

/** Four dishes with footage, shown as stills. Prices come from the menu data. */
const FAVOURITES = ['signature-chai', 'vada-pav', 'chaat', 'masala-maggi'] as const

/**
 * Section 01 — The Menu.
 *
 * The first thing after the theatre, because the theatre shows eight dishes and
 * the obvious next question is "what else?". This is a table of contents for
 * the full menu page rather than a second copy of it: every category, its
 * starting price and how many items it holds, each linking straight to that
 * category on /menu/.
 */
export function MenuPreview() {
  const section = useRef<HTMLElement>(null)
  const title = useSplitReveal<HTMLHeadingElement>({ y: 118, stagger: 0.1 })

  useIsoLayoutEffect(() => {
    const el = section.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from(gsap.utils.toArray<HTMLElement>('[data-cat]'), {
        yPercent: 40,
        opacity: 0,
        ease: 'none',
        stagger: 0.12,
        scrollTrigger: { trigger: '[data-cats]', start: 'top 90%', end: 'top 35%', scrub: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={section}
      id="menu"
      className="relative overflow-clip border-t border-cream/[0.06] bg-ink py-[clamp(6rem,14vh,11rem)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[60vh] w-[80vw] -translate-x-1/2 opacity-40"
        style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(200,155,60,0.22), transparent 65%)' }}
      />

      <div className="shell relative">
        <Eyebrow index="01">The Menu</Eyebrow>

        <div className="mt-10 grid items-end gap-y-8 lg:grid-cols-12 lg:gap-x-[clamp(2rem,5vw,6rem)]">
          <h2
            ref={title}
            className="split-pending font-display text-display-lg font-light leading-[0.9] text-cream lg:col-span-7"
          >
            The whole menu,
            <br />
            <span className="italic text-gradient-gold">made to order.</span>
          </h2>
          <div className="lg:col-span-5">
            <p className="max-w-measure text-body text-cream/58">
              {MENU_ITEM_COUNT} items across {MENU.length} categories — chai and
              shakes, Mumbai street food, pav bhaji, Maggi, chaat and kulfi.
              Served {SITE.hours.open} to {SITE.hours.close}, every night.
            </p>
            <div className="mt-8">
              <Button href="/menu/" icon={<ArrowRight />}>
                Explore the full menu
              </Button>
            </div>
          </div>
        </div>

        {/* ── favourites ── */}
        <div className="mt-[clamp(3.5rem,9vh,7rem)] grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {FAVOURITES.map((id) => {
            const p = PRODUCTS.find((x) => x.id === id)!
            const cat = MENU.find((c) => c.media === p.media)
            return (
              <Reveal key={id} dir="up" counter>
                <a
                  href={cat ? `/menu/#${cat.id}` : '/menu/'}
                  data-cursor="view"
                  data-cursor-label="Menu"
                  className="group relative block aspect-[4/5] overflow-hidden rounded-[14px] bg-surface ring-1 ring-inset ring-cream/[0.08]"
                >
                  <img
                    src={posterSrc(p.media)}
                    alt={`${p.name} ${p.nameAccent ?? ''}`.trim()}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full scale-[1.35] object-cover transition-transform duration-[1200ms] ease-silk group-hover:scale-[1.45]"
                  />
                  <span
                    aria-hidden
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(9,9,9,0.92) 100%)' }}
                  />
                  <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 sm:p-5">
                    <span className="font-display text-[clamp(1.15rem,1.9vw,1.7rem)] font-light leading-tight text-cream">
                      {p.name} <span className="italic text-gradient-gold">{p.nameAccent}</span>
                    </span>
                    <span className="num shrink-0 text-[0.85rem] text-cream/80">{p.price}</span>
                  </span>
                </a>
              </Reveal>
            )
          })}
        </div>

        {/* ── the index ── */}
        <nav
          data-cats
          aria-label="Menu categories"
          className="mt-[clamp(3.5rem,9vh,7rem)] grid border-t border-cream/[0.08] sm:grid-cols-2 sm:gap-x-10 lg:grid-cols-3"
        >
          {MENU.map((c, n) => (
            <a
              key={c.id}
              data-cat
              href={`/menu/#${c.id}`}
              data-cursor="link"
              className="group flex items-baseline gap-4 border-b border-cream/[0.08] py-5"
            >
              <span className="num w-6 shrink-0 text-[0.62rem] text-gold/85">
                {String(n + 1).padStart(2, '0')}
              </span>
              <span className="font-display text-[clamp(1.3rem,1.9vw,1.75rem)] font-light leading-tight text-cream/88 transition-[color,transform] duration-[650ms] ease-silk group-hover:translate-x-1.5 group-hover:text-cream">
                {c.title}
              </span>
              <span aria-hidden className="h-px min-w-4 flex-1 translate-y-[-0.3em] bg-cream/10 transition-colors duration-500 group-hover:bg-gold/40" />
              <span className="shrink-0 text-right font-sans text-[0.6rem] uppercase tracking-[0.18em] text-cream/55">
                <span className="num text-[0.8rem] tracking-normal text-cream/78">{formatPrice(fromPrice(c))}</span>
                <span className="ml-2">· {allItems(c).length}</span>
              </span>
            </a>
          ))}
        </nav>
      </div>
    </section>
  )
}
