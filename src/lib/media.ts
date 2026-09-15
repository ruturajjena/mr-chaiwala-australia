import { getTier } from './device'
import { CLIP_FPS } from './scrub'

export const MEDIA = [
  'signature-chai',
  'kitkat-shake',
  'vada-pav',
  'paneer-sandwich',
  'pasta',
  'masala-maggi',
  'stuffed-paratha',
  'chaat',
  'steam',
  'spice',
  'splash',
  'ingredients',
  'night-cafe',
] as const

export type MediaKey = (typeof MEDIA)[number]

interface NetworkInformation {
  effectiveType?: string
  saveData?: boolean
}

const connection = () =>
  typeof navigator === 'undefined'
    ? undefined
    : (navigator as Navigator & { connection?: NetworkInformation }).connection

/** A weak device or a metered connection: always take the smallest rung. */
const constrained = () => !!connection()?.saveData || getTier() === 'low'

const useMobileCut = () => {
  if (typeof window === 'undefined') return false
  if (getTier() === 'low') return true
  return window.matchMedia('(max-width: 820px)').matches
}

/**
 * `size` forces a rung of the ladder. Used by anything drawn small enough that
 * the desktop encode would be a waste of a decoder — the nav chip is 40px
 * across and would otherwise pull the same clip as a full-width plate.
 */
export const videoSrc = (key: MediaKey, size?: 'mobile' | 'desktop') =>
  `/media/video/${key}.${size ?? (useMobileCut() ? 'mobile' : 'desktop')}.mp4`

/**
 * The hero theatre's own rung: full resolution, 24fps, short-GOP.
 *
 * The standard ladder (960x540, 12fps, all-intra) is sized for plates that sit
 * inside a layout — the menu page's category plates still use it. The theatre
 * is different: on a 2x laptop its plate covers ~2400 device pixels, so a 960px
 * clip was being stretched 2.5x and read as soft, and 12fps read as stepped.
 * These files carry the masters' full 1920x1080 and all 24 frames.
 *
 * Phones get 720p. Their plate covers ~1580 device pixels, so 720p sits within
 * 1.25x of native at about 60% of the bytes. So does any desktop whose plate is
 * drawn small enough that 1080p would only be downsampled, and anything on a
 * weak device or a Save-Data connection.
 */
export const HERO_FPS = 24

const heroRung = (): 'hd' | 'hd-mobile' => {
  if (typeof window === 'undefined') return 'hd'
  if (constrained()) return 'hd-mobile'
  // Mirrors stage.css: at 900px and below the plate uses the phone layout.
  if (window.matchMedia('(max-width: 900px)').matches) return 'hd-mobile'
  // Desktop plate: a 16:9 clip contained in min(94vw, 1520px) x min(80dvh, 53vw).
  const w = window.innerWidth
  const h = window.innerHeight
  const drawn = Math.min(w * 0.94, 1520, (Math.min(h * 0.8, w * 0.53) * 16) / 9)
  return drawn * (window.devicePixelRatio || 1) > 1400 ? 'hd' : 'hd-mobile'
}

export const heroSrc = (key: MediaKey) => `/media/video/${key}.${heroRung()}.mp4`

/**
 * A scrubbed plate's source, and how its Seeker must drive it.
 *
 * `portrait` is for plates drawn in a fixed 4:5 box with `object-fit: cover`
 * (Crafted Fresh's "In the pot" spice plate). Cover only ever shows the centre
 * 4:5 of a 16:9 frame, so that crop is encoded at the master's full 1080 lines —
 * 864x1080, 24fps, GOP-12. Every visible pixel is native resolution, at well
 * under half the pixel count of a full 1080p frame. The standard ladder's
 * 800x450 file was being stretched ~3.9x on a 2x laptop and ~5x on a 3x phone.
 *
 * Constrained devices fall back to the standard ladder, which `cover` still
 * frames identically.
 */
const PORTRAIT: ReadonlySet<MediaKey> = new Set<MediaKey>(['spice'])

export interface PlateSource {
  src: string
  fps: number
  /** Every frame a keyframe — see SeekerOptions.intra. */
  intra: boolean
}

export const plateSource = (key: MediaKey, rung?: 'portrait'): PlateSource => {
  if (rung === 'portrait' && PORTRAIT.has(key) && !constrained()) {
    return { src: `/media/video/${key}.portrait.mp4`, fps: HERO_FPS, intra: false }
  }
  return { src: videoSrc(key), fps: CLIP_FPS, intra: true }
}

export const posterSrc = (key: MediaKey) => `/media/poster/${key}.webp`

/** Speculative fetching is only ever a win on a link that can spare it. */
const canSpeculate = () => {
  const c = connection()
  if (!c) return true
  if (c.saveData) return false
  return c.effectiveType === '4g' || c.effectiveType === undefined
}

/**
 * Warm the HTTP cache for a clip without creating a decoder, so the transition
 * two products ahead never waits on the network.
 *
 * Skipped entirely on slow or metered connections — a multi-megabyte
 * speculative fetch on 3G costs more than the stall it was meant to avoid.
 */
const warmed = new Set<string>()
export const prefetch = (key: MediaKey) => {
  if (!canSpeculate()) return
  const url = videoSrc(key)
  if (warmed.has(url)) return
  warmed.add(url)
  const l = document.createElement('link')
  l.rel = 'prefetch'
  l.as = 'video'
  l.href = url
  document.head.appendChild(l)
}
