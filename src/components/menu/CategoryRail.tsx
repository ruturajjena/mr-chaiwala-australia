import { memo, useEffect, useRef } from 'react'
import type { MenuCategory } from '@/data/menu'
import { scrollTo } from '@/lib/scroll'
import { cn } from '@/lib/utils'

interface Props {
  categories: MenuCategory[]
  active: string
}

/**
 * Sticky category rail. Horizontal at every width — twenty-one categories do
 * not fit a sidebar on a phone, and one pattern everywhere is easier to learn.
 * The active chip is kept in view inside the rail as the page scrolls.
 */
export const CategoryRail = memo(function CategoryRail({ categories, active }: Props) {
  const list = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = list.current
    if (!el || !active) return
    const chip = el.querySelector<HTMLElement>(`[data-chip="${active}"]`)
    if (!chip) return
    const target = chip.offsetLeft - el.clientWidth / 2 + chip.offsetWidth / 2
    el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [active])

  return (
    <nav
      aria-label="Menu categories"
      className="sticky z-40 border-y border-cream/[0.07] bg-ink/[0.97] backdrop-blur-xl"
      style={{ top: 'var(--nav-h, 76px)' }}
    >
      <div
        ref={list}
        className="no-scrollbar flex gap-1 overflow-x-auto px-gutter py-3"
        style={{
          WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 3%, #000 97%, transparent)',
          maskImage: 'linear-gradient(90deg, transparent, #000 3%, #000 97%, transparent)',
        }}
      >
        {categories.map((c) => {
          const on = c.id === active
          return (
            <a
              key={c.id}
              href={`#${c.id}`}
              data-chip={c.id}
              data-cursor="link"
              aria-current={on ? 'true' : undefined}
              onClick={(e) => {
                e.preventDefault()
                // No offset: Lenis honours the section's scroll-margin-top, which
                // is sized to clear the nav and this rail. Adding one here doubled it.
                scrollTo(`#${c.id}`, { duration: 1.2 })
                history.replaceState(null, '', `#${c.id}`)
              }}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 font-sans text-[0.62rem] font-semibold uppercase tracking-[0.2em]',
                'transition-[color,background-color,border-color,box-shadow] duration-500 ease-silk',
                on
                  ? 'border-gold/50 bg-gold/[0.12] text-cream shadow-[0_0_24px_-8px_rgba(200,155,60,0.6)]'
                  : 'border-cream/[0.08] text-cream/60 hover:border-cream/25 hover:text-cream',
              )}
            >
              {c.title}
            </a>
          )
        })}
      </div>
    </nav>
  )
})
