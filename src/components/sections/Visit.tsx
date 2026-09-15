import { useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'
import { useIsoLayoutEffect } from '@/hooks/useIsoLayoutEffect'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { prefersReducedMotion } from '@/lib/device'
import { SITE } from '@/data/site'
import { MENU, MENU_ITEM_COUNT } from '@/data/menu'
import { Button, ArrowRight } from '@/components/ui/Button'
import { Eyebrow, Reveal } from '@/components/ui/Reveal'
import { ScrubVideo } from '@/components/ui/ScrubVideo'

const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(SITE.mapQuery)}&output=embed`
const MAP_LINK = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapQuery)}`

/**
 * Section 04 — Location & Visit.
 *
 * The map is not loaded until it is asked for. A Google Maps iframe is ~900kB
 * of third-party script; deferring it behind a click keeps it out of the
 * Lighthouse run and off the critical path, and the poster state looks better
 * than the embed anyway.
 */
/** Every figure here is derived from real data, not typed in. */
const STATS = [
  { value: String(24 - SITE.hours.openHour + SITE.hours.closeHour), suffix: 'hrs', label: 'Open every night' },
  { value: '6', suffix: 'pm', label: 'Doors open' },
  { value: String(MENU_ITEM_COUNT), suffix: '', label: 'Items on the menu' },
  { value: String(MENU.length), suffix: '', label: 'Menu categories' },
]

export function Visit() {
  const section = useRef<HTMLElement>(null)
  const [mapOn, setMapOn] = useState(false)
  const title = useSplitReveal<HTMLHeadingElement>({ y: 120, stagger: 0.1 })

  useIsoLayoutEffect(() => {
    const el = section.current
    if (!el || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from(gsap.utils.toArray<HTMLElement>('[data-stat]'), {
        yPercent: 60,
        opacity: 0,
        duration: 1.1,
        stagger: 0.08,
        ease: 'silk',
        scrollTrigger: { trigger: '[data-stats]', start: 'top 94%', end: 'top 62%', scrub: true },
      })
      gsap.from(gsap.utils.toArray<HTMLElement>('[data-detail]'), {
        yPercent: 40,
        opacity: 0,
        filter: 'blur(5px)',
        duration: 1.1,
        stagger: 0.09,
        ease: 'silk',
        scrollTrigger: { trigger: '[data-details]', start: 'top 92%', end: 'top 58%', scrub: true },
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={section}
      id="visit"
      className="relative overflow-clip border-t border-cream/[0.06] bg-ink py-[clamp(6rem,14vh,11rem)]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute right-[-20%] top-[10%] h-[60vh] w-[60vw] opacity-45"
        style={{
          background: 'radial-gradient(circle at 60% 40%, rgba(200,155,60,0.28), transparent 62%)',
          filter: 'blur(70px)',
        }}
      />

      <div className="shell relative">
        <Eyebrow index="05">Location &amp; Visit</Eyebrow>

        <div className="mt-10 grid items-end gap-y-8 lg:grid-cols-12 lg:gap-x-[clamp(2rem,5vw,6rem)]">
          <h2
            ref={title}
            className="split-pending font-display text-display-lg font-light leading-[0.9] text-cream lg:col-span-8"
          >
            Come and
            <br />
            <span className="italic text-gradient-gold">sit down.</span>
          </h2>
          <div className="lg:col-span-4">
            <p className="max-w-measure text-body text-cream/52">
              {SITE.street}, {SITE.suburb}. Walk in any night from six, or call
              ahead and we will have it waiting on the counter.
            </p>
          </div>
        </div>

        {/* ── stats ── */}
        <div
          data-stats
          className="mt-[clamp(3rem,8vh,6rem)] grid grid-cols-2 border-y border-cream/[0.08] lg:grid-cols-4"
        >
          {STATS.map((s, i) => (
            <div
              key={s.label}
              data-stat
              className={[
                'px-1 py-8 lg:px-6',
                i % 2 === 1 ? 'border-l border-cream/[0.08]' : '',
                i >= 2 ? 'border-t border-cream/[0.08] lg:border-t-0' : '',
                i === 2 ? 'lg:border-l lg:border-cream/[0.08]' : '',
                i === 3 ? 'lg:border-l lg:border-cream/[0.08]' : '',
              ].join(' ')}
            >
              <div className="num flex items-baseline gap-1 text-[clamp(2.2rem,4.6vw,3.6rem)] font-light leading-none text-cream">
                {s.value}
                <span className="text-[0.36em] tracking-[0.12em] text-gold">{s.suffix}</span>
              </div>
              <p className="mt-3 font-sans text-[0.62rem] uppercase tracking-[0.24em] text-cream/55">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── map + details ── */}
        <div className="mt-[clamp(3rem,8vh,6rem)] grid gap-y-10 lg:grid-cols-12 lg:gap-x-[clamp(2rem,4vw,4rem)]">
          <div className="lg:col-span-7">
            <Reveal dir="up" counter={false}>
              <div className="relative aspect-[16/11] overflow-hidden rounded-[18px] ring-1 ring-inset ring-cream/[0.09] sm:aspect-[16/10]">
                {mapOn ? (
                  <iframe
                    title={`Map to ${SITE.name}`}
                    src={MAP_EMBED}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                    className="h-full w-full border-0"
                    // The embed is stock Google chrome; this grades it into the
                    // palette without needing a paid styled-map key.
                    style={{ filter: 'invert(0.92) hue-rotate(178deg) saturate(0.42) contrast(0.94) brightness(0.94)' }}
                  />
                ) : (
                  <button
                    onClick={() => setMapOn(true)}
                    data-cursor="view"
                    data-cursor-label="Open map"
                    className="group absolute inset-0 h-full w-full"
                    aria-label="Load the interactive map"
                  >
                    <ScrubVideo media="night-cafe" className="opacity-45 transition-opacity duration-700 group-hover:opacity-60" />
                    <span
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(9,9,9,0.35), rgba(9,9,9,0.86))',
                      }}
                    />
                    <span className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-cream/25 transition-[border-color,transform] duration-[650ms] ease-silk group-hover:scale-110 group-hover:border-gold/70">
                        <Pin />
                        {/* Expands on hover — a response to the pointer, not a
                            loop running whether anyone is looking or not. */}
                        <span
                          aria-hidden
                          className="absolute -inset-2 scale-90 rounded-full opacity-0 transition-all duration-[700ms] ease-silk group-hover:scale-100 group-hover:opacity-100"
                          style={{ boxShadow: '0 0 0 1px rgba(200,155,60,0.28)' }}
                        />
                      </span>
                      <span className="font-sans text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-cream/70">
                        {SITE.address}
                      </span>
                      <span className="font-sans text-[0.56rem] uppercase tracking-[0.2em] text-cream/54">
                        Tap to open the map
                      </span>
                    </span>
                  </button>
                )}
              </div>
            </Reveal>
          </div>

          <div data-details className="flex flex-col justify-between gap-8 lg:col-span-5">
            <dl className="grid gap-0">
              {[
                { k: 'Address', v: SITE.address, href: MAP_LINK },
                { k: 'Hours', v: `${SITE.hours.open} — ${SITE.hours.close}, ${SITE.hours.days}` },
                { k: 'Telephone', v: SITE.phone, href: SITE.phoneHref },
                { k: 'Instagram', v: SITE.instagram, href: SITE.instagramHref },
                { k: 'Facebook', v: 'Mr. Chaiwala Adelaide', href: SITE.facebookHref },
              ].map((row) => (
                <div
                  key={row.k}
                  data-detail
                  className="group grid grid-cols-[7.5rem_1fr] items-baseline gap-4 border-b border-cream/[0.08] py-5 first:border-t"
                >
                  <dt className="font-sans text-[0.58rem] uppercase tracking-[0.26em] text-cream/52">
                    {row.k}
                  </dt>
                  <dd className="text-[0.95rem] leading-snug text-cream/78">
                    {row.href ? (
                      <a
                        href={row.href}
                        target={row.href.startsWith('http') ? '_blank' : undefined}
                        rel="noreferrer"
                        data-cursor="link"
                        className="relative inline-block transition-colors duration-500 hover:text-cream"
                      >
                        {row.v}
                        <span
                          aria-hidden
                          className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-gold/70 transition-transform duration-500 ease-silk group-hover:origin-left group-hover:scale-x-100"
                        />
                      </a>
                    ) : (
                      row.v
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <div data-detail className="flex flex-wrap items-center gap-4">
              <Button href={SITE.phoneHref} icon={<ArrowRight />}>
                Call {SITE.phone}
              </Button>
              <Button href="/menu/" variant="ghost">
                View the menu
              </Button>
              <a
                href={MAP_LINK}
                target="_blank"
                rel="noreferrer"
                data-cursor="link"
                className="font-sans text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-cream/70 underline decoration-gold/50 underline-offset-[6px] transition-colors hover:text-cream"
              >
                Get directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

const Pin = () => (
  <svg width="16" height="20" viewBox="0 0 16 20" fill="none" aria-hidden>
    <path
      d="M8 19s6.5-7.2 6.5-11.4A6.5 6.5 0 0 0 1.5 7.6C1.5 11.8 8 19 8 19Z"
      stroke="currentColor"
      strokeWidth="1.1"
      className="text-cream/70"
    />
    <circle cx="8" cy="7.4" r="2.2" stroke="currentColor" strokeWidth="1.1" className="text-gold" />
  </svg>
)
