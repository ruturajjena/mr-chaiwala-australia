/**
 * ─────────────────────────────────────────────────────────────────────────────
 *  Video scrubbing
 *
 *  A <video> here is an image sequence with a decoder attached. It is never
 *  played — no autoplay, no loop, no play(). The only thing that ever moves the
 *  playhead is scroll progress, through `Seeker.set()`.
 *
 *  Two problems have to be solved for that to feel like scrubbing film rather
 *  than dragging a progress bar:
 *
 *  1. SEEK BACKPRESSURE. Assigning `currentTime` starts an asynchronous seek.
 *     Assign it again before the first one finishes and browsers queue or drop
 *     the request — under a fast scroll you end up either a long way behind the
 *     scroll position or skipping frames unevenly. The governor below keeps at
 *     most one seek in flight and always holds the *latest* target, so the
 *     playhead converges on wherever the scroll actually is instead of
 *     replaying a backlog.
 *
 *  2. REDUNDANT SEEKS. Most scroll deltas land inside the frame that is already
 *     on screen. Snapping the target to the clip's frame grid turns those into
 *     no-ops, which is most of them.
 *
 *  Two kinds of clip are scrubbed here (see scripts/media.sh):
 *
 *  - The standard ladder: 12fps, all-intra. Every frame is a keyframe.
 *  - The hero rung: 24fps, a keyframe every 12 frames. Full resolution needs
 *    the GOP to stay a sane size; a seek into the middle of a GOP measures
 *    ~6–11ms median in Chrome and WebKit, forwards and backwards alike.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Frame rate of the standard all-intra ladder. */
export const CLIP_FPS = 12

export interface SeekerOptions {
  /** Frame rate the clip was encoded at. Defaults to the standard ladder. */
  fps?: number
  /**
   * Whether every frame is a keyframe. Only then is `fastSeek` safe: it lands
   * on the nearest *keyframe*, which on a GOP-12 clip would snap the plate to
   * every half second and make Safari scrub in visible jumps.
   */
  intra?: boolean
}

export class Seeker {
  private pending = false
  private target = -1
  /** The frame index currently displayed, so repeats can be skipped. */
  private shown = -1
  private detach: Array<() => void> = []
  private ready = false
  private readonly fps: number
  private readonly intra: boolean

  constructor(
    private readonly video: HTMLVideoElement,
    opts: SeekerOptions = {},
  ) {
    this.fps = opts.fps ?? CLIP_FPS
    this.intra = opts.intra ?? true

    const onReady = () => {
      this.ready = true
      // Apply whatever the scroll position asked for while we were loading.
      if (this.target >= 0) this.flush()
    }
    const onSeeked = () => {
      this.pending = false
      this.flush()
    }
    /**
     * The element's media was torn down — `unloadClip`, or a new `src` being
     * loaded over an old one. Whatever frame we last showed is gone, and a seek
     * that was in flight will never report `seeked`, so reset both. Without
     * this a re-attached clip would think its frame was already on screen and
     * skip the seek, and a governor caught mid-seek would stay shut forever.
     *
     * Hung off `emptied`, which fires exactly once per teardown, rather than
     * inferred from `readyState` inside flush(): a clip can sit below
     * HAVE_CURRENT_DATA after a seek completes, and a reset keyed on that
     * could re-arm the same seek.
     */
    const onEmptied = () => {
      this.ready = false
      this.pending = false
      this.shown = -1
    }
    video.addEventListener('loadedmetadata', onReady)
    video.addEventListener('seeked', onSeeked)
    video.addEventListener('emptied', onEmptied)
    // A seek that errors must not wedge the governor shut.
    video.addEventListener('error', onSeeked)
    this.detach.push(() => {
      video.removeEventListener('loadedmetadata', onReady)
      video.removeEventListener('seeked', onSeeked)
      video.removeEventListener('emptied', onEmptied)
      video.removeEventListener('error', onSeeked)
    })
    if (video.readyState >= 1) this.ready = true
  }

  /** @param p 0–1 position within the clip. */
  set(p: number) {
    this.target = p < 0 ? 0 : p > 1 ? 1 : p
    if (!this.pending) this.flush()
  }

  private flush() {
    const v = this.video
    if (!this.ready || this.target < 0) return

    const duration = v.duration
    if (!duration || !Number.isFinite(duration)) return

    // Land in the middle of a frame's interval, never on its boundary, so
    // rounding never straddles two frames.
    const frameDur = 1 / this.fps
    const lastFrame = Math.max(0, Math.round(duration * this.fps) - 1)
    const frame = Math.min(lastFrame, Math.round(this.target * lastFrame))
    if (frame === this.shown) return

    this.shown = frame
    this.pending = true
    const t = frame * frameDur + frameDur * 0.5

    if (this.intra && typeof v.fastSeek === 'function') v.fastSeek(t)
    else v.currentTime = t
  }

  /** Paint the first frame so the plate is never blank before it is scrubbed. */
  prime() {
    this.set(0)
  }

  destroy() {
    this.detach.forEach((fn) => fn())
    this.detach = []
  }
}

/**
 * Attaches a source and resolves once one frame has been decoded — the point at
 * which the element can actually be seen, which is earlier than `canplay`.
 */
export function loadClip(video: HTMLVideoElement, src: string): Promise<void> {
  if (video.dataset.loaded === src) return Promise.resolve()
  video.dataset.loaded = src
  return new Promise((resolve) => {
    const done = () => {
      video.removeEventListener('loadeddata', done)
      video.removeEventListener('error', done)
      resolve()
    }
    video.addEventListener('loadeddata', done)
    video.addEventListener('error', done)
    video.preload = 'auto'
    video.src = src
    video.load()
  })
}

/** Releases the decoder while keeping the bytes in the HTTP cache. */
export function unloadClip(video: HTMLVideoElement) {
  if (!video.src) return
  delete video.dataset.loaded
  video.removeAttribute('src')
  video.load()
}
