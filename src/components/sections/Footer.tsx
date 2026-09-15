import { useRef } from 'react'
import { gsap } from '@/lib/gsap'
import { useIsoLayoutEffect } from '@/hooks/useIsoLayoutEffect'
import { prefersReducedMotion } from '@/lib/device'
import { NAV, SITE } from '@/data/site'
import { scrollTo } from '@/lib/scroll'
import { followLink } from '@/lib/nav'
import { Logo } from '@/components/ui/Logo'
import { ScrubVideo } from '@/components/ui/ScrubVideo'

/**
 * The closing frame. The wordmark is set as large as the viewport allows and
 * masked by the steam plate, so the last thing on the page is the logo made out
 * of the same material as the first thing.
 */
export function Footer() {
  const el = useRef<HTMLElement>(null)

  useIsoLayoutEffect(() => {
    const node = el.current
    if (!node || prefersReducedMotion()) return
    const ctx = gsap.context(() => {
      gsap.from('[data-mark]', {
        yPercent: 26,
        opacity: 0,
        filter: 'blur(16px)',
        duration: 1.8,
        ease: 'silk',
        scrollTrigger: { trigger: node, start: 'top 88%', end: 'top 48%', scrub: true },
      })
      gsap.fromTo(
        '[data-steam]',
        { yPercent: 14, scale: 1.2 },
        {
          yPercent: -6,
          scale: 1,
          ease: 'none',
          scrollTrigger: { trigger: node, start: 'top bottom', end: 'bottom bottom', scrub: 0.7 },
        },
      )
    }, node)
    return () => ctx.revert()
  }, [])

  return (
    <footer ref={el} className="relative overflow-clip border-t border-cream/[0.06] bg-ink">
      <div className="shell relative pb-10 pt-[clamp(4rem,10vh,8rem)]">
        <div className="grid gap-y-10 border-b border-cream/[0.08] pb-14 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="eyebrow mb-4 text-cream/55">Find us</p>
            <p className="max-w-[22ch] text-[0.92rem] leading-relaxed text-cream/62">
              {SITE.address}
            </p>
          </div>
          <div>
            <p className="eyebrow mb-4 text-cream/55">Hours</p>
            <p className="num text-[0.95rem] text-cream/78">
              {SITE.hours.open} — {SITE.hours.close}
            </p>
            <p className="mt-1 text-[0.82rem] text-cream/58">{SITE.hours.days}</p>
            <a
              href="/menu/#house-rules"
              data-cursor="link"
              className="mt-3 block text-[0.82rem] text-cream/58 transition-colors hover:text-cream"
            >
              Allergens &amp; house rules
            </a>
          </div>
          <div>
            <p className="eyebrow mb-4 text-cream/55">Contact</p>
            <a
              href={SITE.phoneHref}
              data-cursor="link"
              className="block text-[0.92rem] text-cream/72 transition-colors hover:text-cream"
            >
              {SITE.phone}
            </a>
            <a
              href={SITE.reviewHref}
              target="_blank"
              rel="noreferrer"
              data-cursor="link"
              className="mt-1 block text-[0.92rem] text-cream/72 transition-colors hover:text-cream"
            >
              Review us on Google
            </a>
          </div>
          <div>
            <p className="eyebrow mb-4 text-cream/55">Elsewhere</p>
            <nav className="flex flex-col gap-1.5">
              {NAV.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  data-cursor="link"
                  onClick={(e) => followLink(l.href, e)}
                  className="group w-fit text-[0.92rem] text-cream/62 transition-colors hover:text-cream"
                >
                  {l.label}
                  <span className="ml-2 inline-block translate-x-0 opacity-0 transition-all duration-500 ease-silk group-hover:translate-x-1 group-hover:opacity-100">
                    ↗
                  </span>
                </a>
              ))}
              <a
                href={SITE.instagramHref}
                target="_blank"
                rel="noreferrer"
                data-cursor="link"
                className="w-fit text-[0.92rem] text-cream/62 transition-colors hover:text-cream"
              >
                {SITE.instagram}
              </a>
              <a
                href={SITE.facebookHref}
                target="_blank"
                rel="noreferrer"
                data-cursor="link"
                className="w-fit text-[0.92rem] text-cream/62 transition-colors hover:text-cream"
              >
                Facebook
              </a>
            </nav>
          </div>
        </div>

        {/* ── the mark ── */}
        <div data-mark className="relative mt-14 select-none">
          {/* steam behind the wordmark, feathered so it only ever suggests a
              shape rather than becoming a video panel */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-[6%] -top-[40%] bottom-[10%] overflow-hidden opacity-[0.3]"
            style={{
              WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 50% 70%, #000 10%, transparent 72%)',
              maskImage: 'radial-gradient(ellipse 60% 70% at 50% 70%, #000 10%, transparent 72%)',
            }}
          >
            <div data-steam className="h-full w-full will-change-transform">
              <ScrubVideo media="steam" />
            </div>
          </div>

          <Logo
            variant="compact"
            className="relative h-auto w-full text-cream opacity-[0.15]"
            title={SITE.name}
          />
          <p className="relative mt-6 text-center font-display text-[clamp(1rem,1.8vw,1.5rem)] font-light italic text-cream/58">
            {SITE.tagline}
          </p>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-cream/[0.08] pt-8 sm:flex-row">
          <p className="font-sans text-[0.6rem] uppercase tracking-[0.22em] text-cream/55">
            © {new Date().getFullYear()} {SITE.name} · {SITE.city}
          </p>
          <button
            onClick={() => scrollTo(0, { duration: 2 })}
            data-cursor="link"
            className="group flex items-center gap-3 font-sans text-[0.6rem] uppercase tracking-[0.22em] text-cream/58 transition-colors hover:text-cream"
          >
            Back to the top
            <span className="inline-block transition-transform duration-500 ease-silk group-hover:-translate-y-1">
              ↑
            </span>
          </button>
        </div>
      </div>
    </footer>
  )
}
