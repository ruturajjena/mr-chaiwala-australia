import { memo, useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'framer-motion'
import { NAV, SITE } from '@/data/site'
import { PRODUCTS } from '@/data/products'
import { posterSrc } from '@/lib/media'
import { lockScroll } from '@/lib/scroll'
import { followLink } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/ui/Logo'
import { Magnetic } from '@/components/ui/Magnetic'

const EASE = [0.22, 1, 0.36, 1] as const

interface Props {
  docked: boolean
  active: number
  /** The dish chip only makes sense on the home page, next to the theatre. */
  chip?: boolean
  /** Marks the current page's link for assistive tech and styling. */
  current?: string
}

/**
 * One nav for the whole site. During the theatre it is weightless — type on
 * black, in the exact corner positions the hero layout reserves for it. Once the
 * hero shrinks away it gains a glass bar and the dish that was on stage becomes
 * a small live chip beside the wordmark.
 */
export const Nav = memo(function Nav({ docked, active, chip = true, current }: Props) {
  const [open, setOpen] = useState(false)
  const product = PRODUCTS[active]
  const bar = useRef<HTMLElement>(null)

  // Publish the bar's real height as --nav-h, so anything sticky underneath
  // (the menu's category rail) sits exactly against it at every breakpoint and
  // font size, instead of guessing a pixel value that drifts.
  useEffect(() => {
    const el = bar.current
    if (!el) return
    const set = () => document.documentElement.style.setProperty('--nav-h', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    lockScroll(open)
    return () => lockScroll(false)
  }, [open])

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [])

  const go = (href: string, e?: { preventDefault: () => void }) => {
    setOpen(false)
    followLink(href, e)
  }

  return (
    <>
      <header
        ref={bar}
        className={cn(
          'fixed inset-x-0 top-0 z-chrome transition-[background-color,backdrop-filter,border-color] duration-700 ease-silk',
          docked
            ? 'border-b border-cream/[0.07] bg-ink/[0.97] backdrop-blur-xl'
            : 'border-b border-transparent bg-transparent',
        )}
      >
        <div className="flex items-center justify-between px-gutter py-5 sm:py-6">
          {/* ── left ── */}
          <div className="flex items-center gap-4">
            <AnimatePresence>
              {docked && chip && (
                <m.button
                  key="chip"
                  data-cursor="view"
                  data-cursor-label="Menu"
                  onClick={() => go('/#dishes')}
                  initial={{ width: 0, opacity: 0, scale: 0.6 }}
                  animate={{ width: 40, opacity: 1, scale: 1 }}
                  exit={{ width: 0, opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.85, ease: EASE }}
                  className="relative h-10 shrink-0 overflow-hidden rounded-full ring-1 ring-cream/15"
                  aria-label="Back to the dishes"
                >
                  <ChipVideo index={active} />
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full"
                    style={{
                      boxShadow: `inset 0 0 14px -2px ${product.accent}`,
                    }}
                  />
                </m.button>
              )}
            </AnimatePresence>

            <a
              href="/"
              onClick={(e) => go('/', e)}
              data-cursor="link"
              /* No aria-label: the wordmark inside already exposes
                 "Mr. Chaiwala". Overriding it with different words breaks voice
                 control, because "click Mr. Chaiwala" would stop matching. */
              title={`${SITE.name} — home`}
              className="group relative block"
            >
              <Logo variant="compact" className="h-[13px] w-auto sm:h-[15px]" />
              <span
                aria-hidden
                className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-gold/70 transition-transform duration-[650ms] ease-silk group-hover:scale-x-100"
              />
            </a>
          </div>

          {/* ── right ── */}
          <nav className="hidden items-center gap-9 md:flex">
            {NAV.map((l) => (
              <Magnetic key={l.href} strength={0.2}>
                <a
                  href={l.href}
                  data-cursor="link"
                  onClick={(e) => go(l.href, e)}
                  aria-current={current === l.href ? 'page' : undefined}
                  className="group relative block py-1 font-sans text-[0.68rem] font-medium uppercase tracking-[0.24em] text-cream/55 transition-colors duration-500 hover:text-cream"
                >
                  {l.label}
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 left-0 h-px w-full origin-right scale-x-0 bg-gold transition-transform duration-500 ease-silk group-hover:origin-left group-hover:scale-x-100"
                  />
                </a>
              </Magnetic>
            ))}
            <a
              href={SITE.phoneHref}
              data-cursor="link"
              className="rounded-full border border-cream/15 px-5 py-2.5 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-cream/80 transition-[border-color,color,box-shadow] duration-500 ease-silk hover:border-gold/60 hover:text-cream hover:shadow-[0_10px_40px_-16px_rgba(200,155,60,0.7)]"
            >
              Call {SITE.phone}
            </a>
          </nav>

          <button
            onClick={() => setOpen((v) => !v)}
            data-cursor="link"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            className="relative z-[110] flex h-9 w-9 flex-col items-end justify-center gap-[6px] md:hidden"
          >
            <span
              className={cn(
                'block h-px bg-cream transition-all duration-500 ease-silk',
                open ? 'w-6 translate-y-[3.5px] rotate-45' : 'w-6',
              )}
            />
            <span
              className={cn(
                'block h-px bg-cream transition-all duration-500 ease-silk',
                open ? 'w-6 -translate-y-[3.5px] -rotate-45' : 'w-4',
              )}
            />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <m.div
            className="fixed inset-0 z-[105] bg-ink/95 backdrop-blur-2xl md:hidden"
            initial={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0)' }}
            exit={{ opacity: 0, clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <div className="flex h-full flex-col justify-center gap-2 px-gutter">
              {NAV.map((l, i) => (
                <m.a
                  key={l.href}
                  href={l.href}
                  onClick={(e) => go(l.href, e)}
                  aria-current={current === l.href ? 'page' : undefined}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.18 + i * 0.07, duration: 0.8, ease: EASE }}
                  className="border-b border-cream/[0.07] py-5 font-display text-display-sm font-light text-cream"
                >
                  <span className="mr-4 font-mono text-[0.6rem] text-gold/88">
                    0{i + 1}
                  </span>
                  {l.label}
                </m.a>
              ))}
              <m.a
                href={SITE.phoneHref}
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
                className="mt-10 self-start rounded-full bg-cream px-8 py-4 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-ink"
              >
                {SITE.phone}
              </m.a>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </>
  )
})

/**
 * The dish that was last on stage, reduced to a chip beside the wordmark.
 *
 * A still, not a loop. Nothing on this page plays on its own clock, and a 40px
 * circle running a video forever would be both a contradiction and a pointless
 * decoder. The poster is the frame the plate rests on, which is exactly the
 * image this is standing in for.
 */
function ChipVideo({ index }: { index: number }) {
  const media = PRODUCTS[index].media
  return (
    <img
      src={posterSrc(media)}
      alt=""
      aria-hidden
      className="h-full w-full scale-[1.6] object-cover"
      decoding="async"
    />
  )
}
