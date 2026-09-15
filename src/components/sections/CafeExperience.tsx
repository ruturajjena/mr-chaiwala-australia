import { useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { useIsoLayoutEffect } from '@/hooks/useIsoLayoutEffect'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { prefersReducedMotion } from '@/lib/device'
import { TESTIMONIALS } from '@/data/site'
import { ScrubVideo } from '@/components/ui/ScrubVideo'
import { Eyebrow } from '@/components/ui/Reveal'

/**
 * Section 03 — The Café Experience.
 *
 * The street plate is pinned behind the whole section and slowly pushes in,
 * while four glass cards drift past it at four different depths. The depth
 * value drives travel, blur and opacity together, so a card that moves slower
 * also sits further back optically — a real parallax, not just a y-offset.
 */
export function CafeExperience() {
  const section = useRef<HTMLElement>(null)
  const title = useSplitReveal<HTMLHeadingElement>({ y: 118, stagger: 0.1 })

  useIsoLayoutEffect(() => {
    const el = section.current
    if (!el || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-bg]',
        { scale: 1.24, yPercent: -5 },
        {
          scale: 1.04,
          yPercent: 5,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.7 },
        },
      )

      gsap.utils.toArray<HTMLElement>('[data-card]').forEach((card) => {
        const depth = Number(card.dataset.depth ?? 0.5)
        gsap.fromTo(
          card,
          { yPercent: 26 * (1.35 - depth) },
          {
            yPercent: -26 * (1.35 - depth),
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.5 },
          },
        )
        gsap.from(card, {
          opacity: 0,
          scale: 0.94,
          filter: 'blur(14px)',
          duration: 1.4,
          ease: 'silk',
          scrollTrigger: { trigger: card, start: 'top 92%', end: 'top 58%', scrub: true },
        })
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={section}
      id="experience"
      className="relative isolate overflow-clip border-t border-cream/[0.06] py-[clamp(7rem,18vh,14rem)]"
    >
      {/* ── the room ── */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div data-bg className="h-full w-full will-change-transform">
          <ScrubVideo media="night-cafe" rootMargin="500px" />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #090909 0%, rgba(9,9,9,0.72) 22%, rgba(9,9,9,0.58) 50%, rgba(9,9,9,0.78) 78%, #090909 100%)',
          }}
        />
        <div
          className="absolute inset-0 mix-blend-soft-light"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 46%, rgba(200,155,60,0.5), transparent 70%)' }}
        />
      </div>

      <div className="shell">
        <Eyebrow index="04">The Café Experience</Eyebrow>
        <div className="mt-10 grid items-end gap-y-8 lg:grid-cols-12 lg:gap-x-[clamp(2rem,5vw,6rem)]">
          <h2
            ref={title}
            className="split-pending font-display text-display-lg font-light leading-[0.9] text-cream lg:col-span-7"
          >
            The room does
            <br />
            <span className="italic text-gradient-gold">half the work.</span>
          </h2>
          <p className="max-w-measure text-body text-cream/58 lg:col-span-5">
            Warm light, loud enough to talk, quiet enough to think. Nobody has
            ever been asked to leave because the table was needed.
          </p>
        </div>

        {/* ── floating testimonials ── */}
        <div className="mt-[clamp(4rem,11vh,9rem)] grid gap-x-8 gap-y-8 md:grid-cols-2 lg:grid-cols-12">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              data-card
              data-depth={t.depth}
              data-cursor="drag"
              className={[
                'glass group relative rounded-[18px] p-7 will-change-transform sm:p-9',
                'transition-[transform,box-shadow,border-color] duration-[700ms] ease-silk',
                'hover:-translate-y-1.5 hover:border-cream/20',
                'lg:col-span-6',
                i === 0 ? 'lg:col-start-1' : '',
                i === 1 ? 'lg:col-start-7 lg:mt-[clamp(1rem,7vh,5rem)]' : '',
                i === 2 ? 'lg:col-start-2 lg:mt-[-2vh]' : '',
                i === 3 ? 'lg:col-start-8 lg:mt-[clamp(0rem,3vh,3rem)]' : '',
              ].join(' ')}
              // Depth also dims the card, but never below the point where the quote
              // stops being comfortable to read.
              style={{ opacity: 0.78 + t.depth * 0.22 }}
            >
              <span
                aria-hidden
                className="absolute -top-3 left-7 font-display text-[4.5rem] leading-none text-gold/25 transition-colors duration-700 group-hover:text-gold/85"
              >
                “
              </span>
              <blockquote className="relative font-display text-[clamp(1.2rem,2vw,1.7rem)] font-light italic leading-[1.36] text-cream/90">
                {t.quote}
              </blockquote>
              <figcaption className="mt-7 flex items-baseline gap-4 border-t border-cream/[0.09] pt-5">
                <span className="font-sans text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-cream">
                  {t.name}
                </span>
                <span className="h-px flex-1 bg-cream/10" />
                <span className="font-sans text-[0.62rem] uppercase tracking-[0.18em] text-cream/57">
                  {t.meta}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
