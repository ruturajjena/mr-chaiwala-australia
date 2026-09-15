import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { LazyMotion, domAnimation } from 'framer-motion'
import { initScroll, scrollTo } from '@/lib/scroll'
import { ScrollTrigger } from '@/lib/gsap'
import { restoreHashTarget } from '@/lib/nav'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { HOUSE_RULES, MENU, MENU_ITEM_COUNT, type MenuCategory } from '@/data/menu'
import { SITE } from '@/data/site'
import { Cursor } from '@/components/chrome/Cursor'
import { Grain } from '@/components/chrome/Grain'
import { Nav } from '@/components/chrome/Nav'
import { Footer } from '@/components/sections/Footer'
import { Button, ArrowRight } from '@/components/ui/Button'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { CategoryRail } from '@/components/menu/CategoryRail'
import { CategorySection } from '@/components/menu/CategorySection'

const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')

/** Filters by item name or description; drops categories left empty. */
function filterMenu(query: string): MenuCategory[] {
  const q = norm(query.trim())
  if (!q) return MENU
  return MENU.flatMap((c) => {
    const catHit = norm(c.title).includes(q)
    const groups = c.groups
      .map((g) => ({
        ...g,
        items: catHit
          ? g.items
          : g.items.filter((it) => norm(it.name).includes(q) || norm(it.description ?? '').includes(q)),
      }))
      .filter((g) => g.items.length)
    return groups.length ? [{ ...c, groups }] : []
  })
}

/**
 * /menu/ — the full menu as its own page.
 *
 * Search is instant and local (125 items need no index), the category rail
 * follows the reader down the page, and a shared link like /menu/#chaat opens
 * straight on that category.
 */
export function MenuPage() {
  const [query, setQuery] = useState('')
  const deferred = useDeferredValue(query)
  const results = useMemo(() => filterMenu(deferred), [deferred])
  const [active, setActive] = useState(MENU[0].id)
  const title = useSplitReveal<HTMLHeadingElement>({ y: 118, stagger: 0.1, start: 'top 95%', end: 'top 40%' })
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initScroll()
    // Someone who has been on the menu has met the brand; skip the home intro.
    try {
      sessionStorage.setItem('mc:intro', '1')
    } catch {
      /* private mode */
    }
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    if (window.location.hash.length > 1) restoreHashTarget()
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)
    window.addEventListener('load', refresh)
    return () => window.removeEventListener('load', refresh)
  }, [])

  // Layout changes when the result set changes; re-measure scroll-driven work.
  useEffect(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [results])

  // Scroll-spy for the rail.
  useEffect(() => {
    const root = listRef.current
    if (!root) return
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting)
        if (!hit.length) return
        const id = (hit[0].target as HTMLElement).id
        // Past the last category nothing in the rail is "current".
        setActive(id === 'house-rules' ? '' : id)
      },
      { rootMargin: '-35% 0px -60% 0px' },
    )
    root.querySelectorAll('section[id]').forEach((s) => io.observe(s))
    const rules = document.getElementById('house-rules')
    if (rules) io.observe(rules)
    return () => io.disconnect()
  }, [results])

  const matches = results.reduce((n, c) => n + c.groups.reduce((m, g) => m + g.items.length, 0), 0)

  return (
    <LazyMotion features={domAnimation} strict>
      <Cursor />
      <Grain />
      <Nav docked active={0} chip={false} current="/menu/" />

      <main id="top" className="relative">
        {/* ── hero ── */}
        <header className="relative overflow-clip pb-[clamp(3rem,7vh,5rem)] pt-[clamp(8rem,22vh,13rem)]">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-[70vh] w-[90vw] -translate-x-1/2"
            style={{ background: 'radial-gradient(ellipse at 50% 20%, rgba(200,155,60,0.2), transparent 65%)' }}
          />
          <div className="shell relative">
            <p className="eyebrow flex items-center gap-4 text-cream/58">
              <span className="h-px w-10 bg-gradient-to-r from-gold/70 to-transparent" />
              {SITE.name} · {SITE.suburb}
            </p>
            <h1
              ref={title}
              className="split-pending mt-8 font-display text-display-xl font-light leading-[0.86] text-cream"
            >
              The <span className="italic text-gradient-gold">Menu</span>
            </h1>

            <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end">
              <p className="max-w-measure text-body-lg text-cream/65 lg:col-span-6">
                {MENU_ITEM_COUNT} dishes and drinks, made to order every night from{' '}
                {SITE.hours.open} to {SITE.hours.close}.
              </p>

              <div className="lg:col-span-6 lg:justify-self-end">
                <label htmlFor="menu-search" className="sr-only">
                  Search the menu
                </label>
                <div className="glass flex w-full items-center gap-3 rounded-full px-5 py-3.5 lg:w-[26rem]">
                  <SearchIcon />
                  <input
                    id="menu-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search — chai, paneer, cheese…"
                    autoComplete="off"
                    className="w-full bg-transparent font-sans text-[0.95rem] text-cream placeholder:text-cream/45 focus:outline-none"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery('')}
                      data-cursor="link"
                      className="shrink-0 font-sans text-[0.6rem] uppercase tracking-[0.2em] text-cream/60 hover:text-cream"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <p aria-live="polite" className="mt-3 h-4 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-cream/55 lg:text-right">
                  {query ? `${matches} ${matches === 1 ? 'match' : 'matches'}` : ''}
                </p>
              </div>
            </div>
          </div>
        </header>

        {!query && <CategoryRail categories={MENU} active={active} />}

        <div ref={listRef} className="shell">
          <ErrorBoundary>
            {results.length ? (
              results.map((c) => (
                <CategorySection
                  key={c.id}
                  category={c}
                  index={MENU.findIndex((m) => m.id === c.id)}
                  query={deferred}
                />
              ))
            ) : (
              <div className="border-t border-cream/[0.07] py-24 text-center">
                <p className="font-display text-display-sm font-light italic text-cream/80">
                  Nothing matches “{query}”.
                </p>
                <button
                  onClick={() => {
                    setQuery('')
                    scrollTo(0, { duration: 1 })
                  }}
                  data-cursor="link"
                  className="mt-6 font-sans text-[0.68rem] uppercase tracking-[0.22em] text-gold underline underline-offset-[6px]"
                >
                  Show the full menu
                </button>
              </div>
            )}
          </ErrorBoundary>
        </div>

        {/* ── house rules ── */}
        <section id="house-rules" className="shell scroll-mt-32 border-t border-cream/[0.07] py-[clamp(4rem,10vh,7rem)]">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <p className="eyebrow text-gold/90">Before you order</p>
              <h2 className="mt-5 font-display text-display-sm font-light text-cream">
                Allergens &amp; <span className="italic">house rules</span>
              </h2>
            </div>
            <div className="grid gap-10 sm:grid-cols-2 lg:col-span-8">
              <div className="glass rounded-[16px] p-7 sm:col-span-2">
                <p className="eyebrow text-cream/60">Allergy information</p>
                <p className="mt-4 text-body text-cream/78">{HOUSE_RULES.allergy}</p>
              </div>
              {[
                { t: 'Terms', l: HOUSE_RULES.terms },
                { t: 'On the premises', l: HOUSE_RULES.premises },
              ].map((b) => (
                <div key={b.t}>
                  <p className="eyebrow text-cream/60">{b.t}</p>
                  <ul className="mt-4 space-y-3">
                    {b.l.map((r) => (
                      <li key={r} className="flex gap-3 text-[0.9rem] leading-relaxed text-cream/65">
                        <span aria-hidden className="mt-[0.7em] h-px w-3 shrink-0 bg-gold/60" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── visit ── */}
        <section className="shell border-t border-cream/[0.07] py-[clamp(4rem,10vh,7rem)]">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <h2 className="font-display text-display-md font-light leading-[0.95] text-cream lg:col-span-7">
              Open tonight from <span className="italic text-gradient-gold">six.</span>
            </h2>
            <div className="lg:col-span-5">
              <p className="text-body text-cream/65">
                {SITE.address}
                <br />
                {SITE.hours.open} — {SITE.hours.close}, {SITE.hours.days.toLowerCase()}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button href={SITE.phoneHref} icon={<ArrowRight />}>
                  Call {SITE.phone}
                </Button>
                <Button href="/#visit" variant="ghost">
                  Find us
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </LazyMotion>
  )
}

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className="shrink-0 text-gold/80">
    <circle cx="7" cy="7" r="5.25" stroke="currentColor" strokeWidth="1.2" />
    <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
)
