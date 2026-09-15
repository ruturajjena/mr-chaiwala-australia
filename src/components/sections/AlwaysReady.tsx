import { useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'
import { useIsoLayoutEffect } from '@/hooks/useIsoLayoutEffect'
import { useSplitReveal } from '@/hooks/useSplitReveal'
import { prefersReducedMotion } from '@/lib/device'
import { DAYPARTS, SITE } from '@/data/site'
import { Eyebrow } from '@/components/ui/Reveal'
import { ScrubVideo } from '@/components/ui/ScrubVideo'

/* ── the dial ──────────────────────────────────────────────────────────────── */

const R = 132
const C = 2 * Math.PI * R
/** 18:00 → 05:00 the next day: eleven hours. */
const START_HOUR = SITE.hours.openHour
const OPEN_HOURS = 24 - SITE.hours.openHour + SITE.hours.closeHour

/** Hour (0–24, fractional) → degrees, with midnight at the top. */
const hourAngle = (h: number) => (h / 24) * 360

/** Local time at the café, as a fractional hour. */
function adelaideHour(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Adelaide',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  }).formatToParts(now)
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return (h % 24) + m / 60
}

function Dial({ hour }: { hour: number }) {
  const openLen = (OPEN_HOURS / 24) * C
  const rotate = hourAngle(START_HOUR) - 90 // put the arc's start at opening time
  const handAngle = hourAngle(hour) - 90

  return (
    <svg viewBox="0 0 320 320" className="h-full w-full overflow-visible" aria-hidden>
      <defs>
        <linearGradient id="dial-arc" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F7EAD7" />
          <stop offset="42%" stopColor="#C89B3C" />
          <stop offset="100%" stopColor="#A9683A" />
        </linearGradient>
        <filter id="dial-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* the full day, unlit */}
      <circle cx="160" cy="160" r={R} fill="none" stroke="rgba(247,234,215,0.08)" strokeWidth="1" />

      {/* hour ticks */}
      {Array.from({ length: 24 }, (_, i) => {
        const a = ((hourAngle(i) - 90) * Math.PI) / 180
        const major = i % 6 === 0
        const r1 = R - (major ? 11 : 5)
        return (
          <line
            key={i}
            x1={160 + Math.cos(a) * r1}
            y1={160 + Math.sin(a) * r1}
            x2={160 + Math.cos(a) * R}
            y2={160 + Math.sin(a) * R}
            stroke={major ? 'rgba(247,234,215,0.34)' : 'rgba(247,234,215,0.13)'}
            strokeWidth="1"
          />
        )
      })}

      {/* the open arc */}
      <circle
        data-arc
        cx="160"
        cy="160"
        r={R}
        fill="none"
        stroke="url(#dial-arc)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray={`${openLen} ${C}`}
        transform={`rotate(${rotate} 160 160)`}
        filter="url(#dial-glow)"
      />

      {/* now */}
      <g transform={`rotate(${handAngle} 160 160)`} data-hand>
        <line x1="160" y1="160" x2={160 + R - 20} y2="160" stroke="rgba(247,234,215,0.22)" strokeWidth="1" />
        <circle cx={160 + R} cy="160" r="4.5" fill="#F7EAD7" filter="url(#dial-glow)" />
      </g>

      {[
        { h: SITE.hours.openHour, label: 'OPEN' },
        { h: SITE.hours.closeHour, label: 'CLOSE' },
      ].map(({ h, label }) => {
        const a = ((hourAngle(h) - 90) * Math.PI) / 180
        return (
          <text
            key={label}
            x={160 + Math.cos(a) * (R + 26)}
            y={160 + Math.sin(a) * (R + 26)}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8.5"
            letterSpacing="2.4"
            fontFamily="Manrope, sans-serif"
            fontWeight="600"
            fill="rgba(247,234,215,0.4)"
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

/* ── section ───────────────────────────────────────────────────────────────── */

/**
 * Section 02 — Always Fresh. Always Ready.
 *
 * Mr. Chaiwala opens at sunset and pours until five. Rather than a closing
 * time, the night is shown as four moods, and the dial carries a live hand set
 * to the café's own timezone — so the page always tells the truth about whether
 * the kettle is on right now.
 */
export function AlwaysReady() {
  const section = useRef<HTMLElement>(null)
  const [hour, setHour] = useState(() => adelaideHour())
  const title = useSplitReveal<HTMLHeadingElement>({ y: 118, stagger: 0.1 })

  useEffect(() => {
    // The one timer left on the site, and it is not an animation: this is a
    // clock, and a clock that only advances when you scroll would be a lie.
    // Thirty seconds is finer than the dial can show.
    const id = window.setInterval(() => setHour(adelaideHour()), 30_000)
    return () => clearInterval(id)
  }, [])

  useIsoLayoutEffect(() => {
    const el = section.current
    if (!el || prefersReducedMotion()) return

    const ctx = gsap.context(() => {
      const arc = el.querySelector('[data-arc]')
      if (arc) {
        gsap.from(arc, {
          strokeDashoffset: C,
          duration: 2.4,
          ease: 'silk',
          scrollTrigger: { trigger: el, start: 'top 78%', end: 'top 30%', scrub: true },
        })
      }
      gsap.from(el.querySelector('[data-hand]'), {
        opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top 50%', end: 'top 30%', scrub: true },
      })

      gsap.from(gsap.utils.toArray<HTMLElement>('[data-part]'), {
        yPercent: 46,
        opacity: 0,
        filter: 'blur(6px)',
        duration: 1.15,
        stagger: 0.11,
        ease: 'silk',
        scrollTrigger: { trigger: '[data-parts]', start: 'top 90%', end: 'top 50%', scrub: true },
      })
    }, el)

    return () => ctx.revert()
  }, [])

  // Open across midnight: from openHour until closeHour the next morning.
  const isOpen = hour >= SITE.hours.openHour || hour < SITE.hours.closeHour
  const timeLabel = new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Adelaide',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date())

  return (
    <section
      ref={section}
      className="relative overflow-clip border-t border-cream/[0.06] bg-ink py-[clamp(6rem,14vh,11rem)]"
    >
      <div className="shell">
        <Eyebrow index="03">Always Fresh. Always Ready.</Eyebrow>

        <div className="mt-10 grid items-end gap-y-10 lg:grid-cols-12 lg:gap-x-[clamp(2rem,5vw,6rem)]">
          <h2
            ref={title}
            className="split-pending font-display text-display-lg font-light leading-[0.9] text-cream lg:col-span-7"
          >
            Open at sunset.
            <br />
            <span className="italic text-gradient-gold">Pouring</span>
            <br />
            until five.
          </h2>
          <p className="max-w-measure text-body text-cream/52 lg:col-span-5">
            Six in the evening until five in the morning, every night. Eleven
            hours of fresh chai and a full kitchen, and the order at three a.m.
            gets the same care as the first one at six.
          </p>
        </div>

        {/* ── dial ── */}
        <div className="mt-[clamp(4rem,10vh,8rem)] grid items-center gap-y-14 lg:grid-cols-12 lg:gap-x-[clamp(2rem,5vw,6rem)]">
          <div className="relative mx-auto w-full max-w-[26rem] lg:col-span-5">
            <div className="relative aspect-square">
              {/* the plate inside the dial */}
              <div className="absolute inset-[20%] overflow-hidden rounded-full opacity-[0.55]">
                <ScrubVideo media="steam" className="scale-[1.35]" />
                <span
                  aria-hidden
                  className="absolute inset-0 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 50%, transparent 30%, rgba(9,9,9,0.9) 100%)',
                  }}
                />
              </div>
              <Dial hour={hour} />

              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span
                  className="flex items-center gap-2 font-sans text-[0.58rem] font-semibold uppercase tracking-[0.3em]"
                  style={{ color: isOpen ? '#C89B3C' : 'rgba(247,234,215,0.4)' }}
                >
                  {/* A steady lamp, not a blinking one. Nothing on this page
                      moves unless the visitor moves it. */}
                  <span
                    className="block h-1.5 w-1.5 rounded-full"
                    style={{
                      background: isOpen ? '#C89B3C' : 'rgba(247,234,215,0.35)',
                      boxShadow: isOpen ? '0 0 10px 1px rgba(200,155,60,0.7)' : 'none',
                    }}
                  />
                  {isOpen ? 'Open now' : 'Opens 6 PM'}
                </span>
                <span className="num mt-3 text-[1.6rem] font-light text-cream">{timeLabel}</span>
                <span className="mt-1 font-sans text-[0.56rem] uppercase tracking-[0.26em] text-cream/54">
                  {SITE.city}
                </span>
              </div>
            </div>
          </div>

          {/* ── the hours, written out ── */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-[auto_1fr] items-baseline gap-x-8 gap-y-2 border-y border-cream/[0.08] py-8">
              <span className="eyebrow text-cream/55">Open Nightly</span>
              <span className="num text-[clamp(1.6rem,3.4vw,2.6rem)] font-light leading-none text-cream">
                {SITE.hours.open} <span className="text-cream/54">—</span> {SITE.hours.close}
              </span>
              <span className="eyebrow text-cream/55">Kitchen</span>
              <span className="num text-[clamp(1.6rem,3.4vw,2.6rem)] font-light leading-none text-cream">
                {OPEN_HOURS} <span className="text-[0.44em] tracking-[0.2em] text-cream/58">HOURS A NIGHT</span>
              </span>
            </div>

            <div data-parts className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2">
              {DAYPARTS.map((d) => (
                <div key={d.label} data-part className="group">
                  <div className="flex items-baseline gap-3">
                    <span className="num text-[0.95rem] text-gold/80">{d.time}</span>
                    <span className="h-px flex-1 bg-cream/10 transition-colors duration-500 group-hover:bg-gold/30" />
                    <span className="font-sans text-[0.56rem] uppercase tracking-[0.28em] text-cream/52">
                      {d.label}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-[clamp(1.4rem,2.2vw,1.9rem)] font-light italic text-cream">
                    {d.title}
                  </h3>
                  <p className="mt-2 max-w-measure text-[0.9rem] leading-relaxed text-cream/55">
                    {d.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
