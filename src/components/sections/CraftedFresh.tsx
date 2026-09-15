import { useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'
import { useIsoLayoutEffect } from '@/hooks/useIsoLayoutEffect'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { prefersReducedMotion } from '@/lib/device'
import { INGREDIENTS } from '@/data/site'
import { ScrubVideo } from '@/components/ui/ScrubVideo'
import { Eyebrow, Parallax, Reveal } from '@/components/ui/Reveal'
import { cn } from '@/lib/utils'

/**
 * Section 01 — Crafted Fresh.
 *
 * An editorial two-column: a tall pinned spice plate on the left, an index of
 * what goes into the pot on the right. Hovering an ingredient re-grades the
 * plate, so the video is not decoration — it is the answer to the list.
 */
export function CraftedFresh() {
  const section = useRef<HTMLElement>(null)
  const plate = useRef<HTMLDivElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const title = useSplitReveal<HTMLHeadingElement>({ kind: 'lines', y: 118, stagger: 0.1 })
  const lede = useSplitReveal<HTMLParagraphElement>({ kind: 'lines', y: 60, stagger: 0.05, blur: 4 })

  useIsoLayoutEffect(() => {
    const el = section.current
    const p = plate.current
    if (!el || !p || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      // The plate rotates a few degrees and comes into focus as it arrives —
      // enough to feel alive, never enough to notice as an animation.
      //
      // Keyed to the plate, not the section. On a phone the section is one tall
      // column (headline, plate, then the whole ingredient list), so its centre
      // only crosses the viewport after the plate has scrolled half away — the
      // clip stayed blurred for the entire time it was on screen. Now it is
      // fully sharp by the time its top reaches 40% of the viewport, at every
      // breakpoint, and the starting blur is gentler.
      gsap.fromTo(
        p,
        { rotate: -2.4, scale: 1.08, filter: 'blur(3px) saturate(0.8)' },
        {
          rotate: 0,
          scale: 1,
          filter: 'blur(0px) saturate(1.05)',
          ease: 'none',
          scrollTrigger: { trigger: p, start: 'top 95%', end: 'top 40%', scrub: 0.8 },
        },
      )

      const rows = gsap.utils.toArray<HTMLElement>('[data-ing]')
      gsap.from(rows, {
        yPercent: 60,
        opacity: 0,
        filter: 'blur(5px)',
        duration: 1.1,
        stagger: 0.08,
        ease: 'silk',
        scrollTrigger: { trigger: rows[0], start: 'top 92%', end: 'top 52%', scrub: true },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  return (
    <section
      ref={section}
      id="story"
      className="relative overflow-clip border-t border-cream/[0.06] bg-ink py-[clamp(6rem,14vh,11rem)]"
    >
      {/* one warm light, top-left, so the section reads as a room */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-[15%] top-0 h-[70vh] w-[70vw] opacity-40"
        style={{
          background: 'radial-gradient(circle at 30% 30%, rgba(169,104,58,0.3), transparent 62%)',
          filter: 'blur(60px)',
        }}
      />

      <div className="shell relative">
        <Eyebrow index="02">Crafted Fresh</Eyebrow>

        <div className="mt-10 grid gap-y-14 lg:grid-cols-12 lg:gap-x-[clamp(2rem,5vw,6rem)]">
          {/* ── headline ── */}
          <div className="lg:col-span-7">
            <h2
              ref={title}
              className="split-pending font-display text-display-lg font-light leading-[0.9] text-cream"
            >
              Nothing here
              <br />
              waits for you.
              <br />
              <span className="italic text-gradient-gold">It begins when you do.</span>
            </h2>
          </div>

          <div className="flex items-end lg:col-span-5">
            <p
              ref={lede}
              className="split-pending max-w-measure text-body text-cream/52"
            >
              No heat lamps, no holding trays, no pot that has been sitting since
              the doors opened. The masala is ground in-house, the dough is rolled to
              order, and the kettle goes back on the flame every twenty minutes —
              because chai that has waited is simply a different drink.
            </p>
          </div>
        </div>

        {/* ── plate + index ── */}
        <div className="mt-[clamp(3.5rem,9vh,7rem)] grid gap-y-12 lg:grid-cols-12 lg:gap-x-[clamp(2rem,5vw,6rem)]">
          <div className="lg:col-span-6">
            <Reveal dir="up">
              <div
                ref={plate}
                className="relative aspect-[4/5] w-full overflow-hidden rounded-[2px] will-change-transform"
                data-cursor="view"
                data-cursor-label="Spices"
              >
                <ScrubVideo media="spice" rung="portrait" className="scale-[1.04]" />
                <div
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    background:
                      'linear-gradient(180deg, rgba(9,9,9,0.45), transparent 26%, transparent 62%, rgba(9,9,9,0.82))',
                  }}
                />
                {/* the hovered ingredient's name, drawn over the plate */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 p-7">
                  <p
                    className={cn(
                      'font-display text-[clamp(1.8rem,3.4vw,3.2rem)] font-light italic leading-none transition-all duration-[700ms] ease-silk',
                      hover === null
                        ? 'translate-y-3 opacity-0 blur-[6px]'
                        : 'translate-y-0 opacity-100 blur-0',
                    )}
                    style={{ color: '#F7EAD7' }}
                  >
                    {hover !== null ? INGREDIENTS[hover].hindi : ''}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-6 lg:pt-[clamp(1rem,6vw,5rem)]">
            <p className="eyebrow mb-8 text-cream/52">In the pot</p>
            <ul>
              {INGREDIENTS.map((ing, i) => (
                <li
                  key={ing.name}
                  data-ing
                  data-cursor="link"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  className="group relative grid cursor-default grid-cols-[auto_1fr] items-baseline gap-x-5 border-t border-cream/[0.08] py-5 transition-colors duration-500 last:border-b"
                >
                  {/* the row's own light, revealed on hover */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-x-0 -inset-y-px origin-left scale-x-0 bg-gradient-to-r from-gold/[0.07] to-transparent transition-transform duration-[750ms] ease-silk group-hover:scale-x-100"
                  />
                  <span className="num relative text-[0.62rem] text-gold/85">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="relative">
                    <div className="flex flex-wrap items-baseline gap-x-4">
                      <span className="font-display text-[clamp(1.5rem,2.6vw,2.35rem)] font-light leading-tight text-cream transition-transform duration-[650ms] ease-silk group-hover:translate-x-2">
                        {ing.name}
                      </span>
                      <span className="font-sans text-[0.72rem] tracking-wide text-cream/55">
                        {ing.hindi}
                      </span>
                    </div>
                    <p className="mt-1.5 max-w-measure text-[0.88rem] leading-relaxed text-cream/58 transition-colors duration-500 group-hover:text-cream/60">
                      {ing.note}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <Parallax amount={8} className="mt-12">
              <p className="max-w-measure font-display text-[clamp(1.15rem,1.8vw,1.6rem)] font-light italic leading-snug text-cream/55">
                “Six things. Nothing you cannot pronounce, and nothing you would
                not put in your own kettle.”
              </p>
            </Parallax>
          </div>
        </div>
      </div>
    </section>
  )
}
