import type { AnchorHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Magnetic } from './Magnetic'

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  children: ReactNode
  variant?: 'solid' | 'ghost'
  icon?: ReactNode
}

/**
 * The label is duplicated and stacked; on hover the top copy slides out and the
 * bottom copy slides in, so the type itself moves rather than just recolouring.
 */
export function Button({ children, variant = 'solid', icon, className, ...rest }: Props) {
  const solid = variant === 'solid'
  return (
    <Magnetic strength={0.24}>
      <a
        {...rest}
        data-cursor="link"
        className={cn(
          'group relative inline-flex items-center gap-3 overflow-hidden rounded-full px-8 py-4',
          'font-sans text-[0.78rem] font-semibold uppercase tracking-[0.22em]',
          'transition-[color,box-shadow,border-color] duration-500 ease-silk will-change-transform',
          solid
            ? 'bg-cream text-ink shadow-[0_0_0_0_rgba(200,155,60,0)] hover:shadow-[0_18px_60px_-16px_rgba(200,155,60,0.55)]'
            : 'border border-cream/20 text-cream hover:border-gold/60 hover:shadow-[0_18px_60px_-22px_rgba(200,155,60,0.5)]',
          className,
        )}
      >
        {/* warm wash that grows from the centre on hover */}
        <span
          aria-hidden
          className={cn(
            'absolute inset-0 origin-center scale-x-0 rounded-full transition-transform duration-[650ms] ease-silk group-hover:scale-x-100',
            solid ? 'bg-gold' : 'bg-cream/[0.07]',
          )}
        />
        {/* 1.25em window with a matching line-height: a bare 1em box shaves the
            bottom off capitals in Manrope, whose ascent+descent exceed its em. */}
        <span className="relative block h-[1.25em] overflow-hidden leading-[1.25em]">
          <span className="block transition-transform duration-[550ms] ease-silk group-hover:-translate-y-full">
            {children}
          </span>
          <span className="absolute left-0 top-full block transition-transform duration-[550ms] ease-silk group-hover:-translate-y-full">
            {children}
          </span>
        </span>
        {icon && (
          <span className="relative transition-transform duration-500 ease-silk group-hover:translate-x-1">
            {icon}
          </span>
        )}
      </a>
    </Magnetic>
  )
}

export const ArrowRight = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
    <path d="M0 5h12M8.5 1L12.5 5L8.5 9" stroke="currentColor" strokeWidth="1.2" />
  </svg>
)
