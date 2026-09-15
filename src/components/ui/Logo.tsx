import { forwardRef, memo, useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * Mr. Chaiwala lockup, rebuilt as vector art.
 *
 * Drawn rather than bitmapped so it stays crisp at any size, weighs ~3kB, and —
 * crucially — can be animated: the preloader draws the kettle outline on with a
 * dash offset, then pours the stream into the glass that stands in for the "A"
 * of CHAIWALA.
 *
 * Geometry notes:
 *   The kettle is authored upright around its own origin and placed with
 *   `translate(468 140) rotate(-20)`. That puts the spout opening at
 *   (336,216)–(353,222) in user space, which is where the pour path begins so
 *   the two always meet exactly.
 *
 * Animation hooks:
 *   [data-logo="kettle"] > *  — outline paths (pathLength normalised to 1)
 *   [data-logo="stream"]      — the pour
 *   [data-logo="glass"]       — the tumbler
 *   [data-logo="word"]        — wordmark
 *   [data-logo="tagline"]     — script line
 */

export type LogoVariant = 'full' | 'compact' | 'mark'

interface LogoProps {
  variant?: LogoVariant
  className?: string
  title?: string
}

const KETTLE_PLACEMENT = 'translate(468 140) rotate(-20)'

const Kettle = () => (
  <g
    data-logo="kettle"
    transform={KETTLE_PLACEMENT}
    fill="none"
    stroke="currentColor"
    strokeWidth={6.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* handle */}
    <path pathLength={1} d="M-44-72C-49-148 49-148 44-72" />
    {/* knob + stem */}
    <circle pathLength={1} cx={0} cy={-94} r={6.5} />
    <path pathLength={1} d="M0-87.5V-80" />
    {/* domed lid */}
    <path pathLength={1} d="M-36-62C-34-72-19-80 0-80C19-80 34-72 36-62" />
    <ellipse pathLength={1} cx={0} cy={-58} rx={62} ry={12} />
    {/* body */}
    <path
      pathLength={1}
      d="M-58-56C-72-36-80-16-78 4C-76 32-70 56-52 70C-30 82 30 82 52 70C70 56 76 32 78 4C80-16 72-36 58-56"
    />
    {/* spout */}
    <path pathLength={1} d="M-74-30C-104-30-132-6-150 26L-136 38C-120 10-98-6-72-4" />
  </g>
)

/** Cutting-chai tumbler that replaces the letter A. */
const Glass = ({ uid }: { uid: string }) => (
  <g data-logo="glass">
    <clipPath id={`${uid}-glass`}>
      <path d="M299 290L345 290L339 347L305 347Z" />
    </clipPath>
    <g clipPath={`url(#${uid}-glass)`}>
      <rect x={295} y={286} width={54} height={64} fill={`url(#${uid}-chai)`} />
      {/* pressed-glass flutes */}
      {[308, 318, 328].map((x) => (
        <rect key={x} x={x} y={286} width={2.4} height={64} fill="#090909" opacity={0.34} />
      ))}
    </g>
    <path
      d="M295 286L349 286L341 350L303 350Z"
      fill="none"
      stroke="currentColor"
      strokeWidth={6.5}
      strokeLinejoin="round"
      pathLength={1}
    />
  </g>
)

const Stream = ({ uid }: { uid: string }) => (
  <path
    data-logo="stream"
    d="M340 217C335 242 327 266 324 292L332 292C337 266 345 242 351 221Z"
    fill={`url(#${uid}-stream)`}
  />
)

const Wordmark = () => (
  <g data-logo="word" fill="currentColor" fontFamily="Manrope, sans-serif" fontWeight={800}>
    <text x={294} y={350} fontSize={78} letterSpacing="1" textAnchor="end">
      MR.CH
    </text>
    <text x={350} y={350} fontSize={78} letterSpacing="1" textAnchor="start">
      IWALA
    </text>
  </g>
)

const Defs = ({ uid }: { uid: string }) => (
  <defs>
    <linearGradient id={`${uid}-chai`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#E6B871" />
      <stop offset="55%" stopColor="#C89B3C" />
      <stop offset="100%" stopColor="#8E6B22" />
    </linearGradient>
    <linearGradient id={`${uid}-stream`} x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#E6B871" stopOpacity={0.6} />
      <stop offset="40%" stopColor="#D8B564" />
      <stop offset="100%" stopColor="#C89B3C" />
    </linearGradient>
  </defs>
)

export const Logo = memo(
  forwardRef<SVGSVGElement, LogoProps>(function Logo(
    { variant = 'full', className, title = 'Mr. Chaiwala' },
    ref,
  ) {
    // Gradient ids must be unique — several logos can share a page.
    const uid = useId().replace(/:/g, '')

    const shared = {
      ref,
      role: 'img' as const,
      'aria-label': title,
      xmlns: 'http://www.w3.org/2000/svg',
    }

    /* ---- compact: wordmark + glass, for the nav bar and footer ---- */
    if (variant === 'compact') {
      return (
        <svg {...shared} viewBox="24 280 582 76" className={cn('block text-cream', className)}>
          <Defs uid={uid} />
          <Wordmark />
          <Glass uid={uid} />
        </svg>
      )
    }

    /* ---- mark: kettle, pour and glass, no type ---- */
    if (variant === 'mark') {
      return (
        <svg {...shared} viewBox="300 -16 270 380" className={cn('block text-cream', className)}>
          <Defs uid={uid} />
          <Kettle />
          <Stream uid={uid} />
          <Glass uid={uid} />
        </svg>
      )
    }

    /* ---- full stacked lockup ---- */
    return (
      <svg {...shared} viewBox="0 -16 640 456" className={cn('block text-cream', className)}>
        <Defs uid={uid} />
        <Kettle />
        <Stream uid={uid} />
        <Wordmark />
        <Glass uid={uid} />
        <text
          data-logo="tagline"
          x={314}
          y={412}
          textAnchor="middle"
          fontFamily='"Cormorant Garamond", serif'
          fontStyle="italic"
          fontWeight={400}
          fontSize={40}
          letterSpacing="1.5"
          fill="currentColor"
          opacity={0.82}
        >
          Ek Chai Ho Jaye
        </text>
      </svg>
    )
  }),
)
