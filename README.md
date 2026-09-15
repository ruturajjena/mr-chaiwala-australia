# Mr. Chaiwala — Adelaide

A cinematic two-page site for an Indian chai house on Port Road, Hindmarsh, open
every night from 6 PM until 5 AM: a scroll-driven home page, and the full menu
at `/menu/`.

The organising idea: **the scroll wheel is the playhead, and the page is the
timeline.** Nothing on this site plays. Eight dishes are scrubbed frame by frame
under the visitor's thumb, the way a colourist scrubs a cut — stop scrolling and
the frame freezes; scroll back and the film runs backwards.

```bash
npm install
npm run media     # one-off: masters → scrubbable variants (needs ffmpeg + cwebp)
npm run dev
npm run build && npm run preview
```

---

## Measured results

Lighthouse 12, production build, both pages.

| | Performance | Accessibility | Best practices | SEO |
|---|---|---|---|---|
| **Home — desktop** | **100** | **100** | **100** | **100** |
| **Home — mobile** | **93–96** | **100** | **100** | **100** |
| **Menu — desktop** | **100** | **100** | **100** | **100** |
| **Menu — mobile** | **90–92** | **100** | **100** | **100** |

CLS 0 on both pages. Mobile performance varies a few points run to run.

**Simulated vs real.** Mobile scores come from Lighthouse's simulated slow-4G
model. Measured unthrottled on the same runs, first contentful paint and largest
contentful paint are **~42 ms** on the home page and **~78 ms** on the menu.

**Why the menu scores lower on mobile, on purpose.** `/menu/` is pre-rendered:
all 125 items and prices are in the HTML (15 kB gzipped), so the menu reads
without JavaScript and is fully indexable. That larger document costs a few
simulated points. It is the right trade for a menu.

**Tried and reverted:**
- *Inlining the CSS into both pages.* It removed the render-blocking request
  but grew the HTML, so simulated scores stayed flat on the menu and dropped on
  home. It also made home load its stylesheet twice, because a lazy section
  re-requests it.
- *Dropping the Cormorant preload on `/menu/`.* No measurable gain, and it risks a
  fallback-font flash on the category heading in the first viewport.

---

## The contract

There is exactly one clock on this site, and it is the scroll position.

- **No `autoplay`, no `loop`, no `play()`, nowhere.** `grep -rn "\.play()" src`
  returns nothing. Every `<video>` is `preload="auto" muted playsInline` and its
  playhead is moved only by `Seeker.set()`.
- **No `requestAnimationFrame` animation loops.** The two remaining `rAF` calls
  are one-shot next-frame deferrals for a layout refresh.
- **No infinite CSS animations** except film grain, which is the one deliberate
  exception — it carries no information, reads as a property of the image rather
  than as motion, and freezing it would make the page look like a *paused video*
  rather than a still frame.
- Stop scrolling and every playhead freezes at **exactly 0s of drift**
  (verified, not assumed).
- Scroll back up and the plate transforms, masks, particles and effect clips
  return to byte-identical computed values.

Interaction animations — button hovers, the magnetic cursor, the mobile menu —
are responses to a pointer, not to the passage of time, and are unaffected.

---

## How it works

### One master timeline

`useTheatre` builds a single `gsap.timeline` bound to one ScrollTrigger with
`scrub: true`. Everything hangs off it: video playheads, plate transforms,
masks, blur, the caption copy, the index readout, the selector underline, the
ambient light rays, the particle field, the closing shrink into the nav.

`scrub: true` rather than a scrub *duration*: Lenis already smooths the scroll
itself, and a catch-up tween on top of that is a second, laggier smoothing that
keeps moving after the wheel stops. Binding the playhead directly to position is
both more literal and better-feeling.

The eight products divide 450vh into equal twelve-and-a-half-percent segments.
Within a segment a product holds for 58% and hands off for the remaining 42%.
Its clip is scrubbed across the *whole* time it is on screen — it starts
entering during the previous handoff and leaves during its own.

Two kinds of thing live on the timeline, and the distinction is deliberate:

- **Real property tweens** for discrete reveals (caption lines, the index
  digits, the selector bar). GSAP owns their state, so it is correct at any
  playhead position including one it jumped to.
- **Proxy tweens driving pure functions** for the continuous layer — masks,
  blur, particle fields, effect-clip position. `transitionFrame(kind, u)` in
  `lib/transitions.ts` is a pure function of `u`, which is what makes the whole
  bespoke choreography reverse exactly rather than approximately.

Every transition is authored so its `enter` state resolves to *exactly* the idle
state at `u = 1`. The incoming product cannot land anywhere except the pixel the
outgoing one left, which is what makes the layout an invariant.

The eight handoffs never repeat a technique:

| | Dish | Handoff |
|---|---|---|
| 01 | Signature Chai | steam expands, fills the frame, the next forms inside a widening aperture |
| 02 | KitKat Shake | the glass empties top-down through a clip, cocoa ribbons pour, the next tilts up on `rotateX` |
| 03 | Vada Pav | the plate shatters into golden bands, spices fly, the next closes in complementary bands |
| 04 | Paneer Sandwich | the cheese-pull — vertical stretch plus grill smoke — into a feathered letterbox iris |
| 05 | Pasta | cream splash, the plate rotates out, the next wipes in on a conic gradient |
| 06 | Masala Maggi | twin steam ribbons scrubbed *against each other*, into a circular iris |
| 07 | Stuffed Paratha | butter melts the plate away from the top edge, golden flakes fall, warm bloom |
| 08 | Street Chaat | everything detonates, steam floods, the theatre shrinks into the nav |

### Scrubbable video

`scripts/media.sh` encodes two kinds of scrubbable clip: a standard ladder that
is **all-intra** (`keyint=1`, `bframes=0`), and a full-resolution **hero rung**
for the eight product clips (below).

This is the whole ballgame. With a normal 250-frame GOP, seeking to frame 249
costs 249 decodes — and scrubbing *backwards* re-pays that on every step, which
is exactly why naive scroll-video stutters. At `keyint=1` every seek is O(1) and
reverse costs the same as forward. `bframes=0` because a B-frame depends on a
*future* frame, which is the one thing you never want when the playhead can move
either direction.

On the standard ladder the size that buys is paid back by dropping to 12fps and
a modest resolution. The hero started there too, and it was too soft: the theatre
draws its plate at ~2400 device pixels on a 2× laptop, so a 960×540 clip was
stretched 2.5×, and 12fps read as stepped.

The **hero rung** (`.hd` 1920×1080, `.hd-mobile` 1280×720) keeps all 24 frames
at full resolution with a keyframe every 12 frames. Measured on the hardest clip,
centre-crop VMAF against the master rose from **37.5 to ~68**. A seek into the
middle of a GOP costs ~6–11ms median in Chrome and WebKit, forwards and
backwards — inside one display frame. All-intra at 1080p would have cost 12MB a
clip, more than the master, for no visible gain; GOP-24 pushed p95 seek time past
13ms. `lib/media.ts#heroSrc` picks the rung from the plate's drawn size in device
pixels, so phones, tablets and 1× laptops get 720p.

`lib/scrub.ts` then solves the two runtime problems:

- **Seek backpressure.** Assigning `currentTime` starts an async seek; assigning
  again before it finishes makes browsers queue or drop. The governor keeps at
  most one seek in flight and always holds the *latest* target, so the playhead
  converges on where the scroll actually is instead of replaying a backlog.
- **Redundant seeks.** Most scroll deltas land inside the frame already on
  screen. Snapping to the clip's frame grid (12fps or 24fps) turns those into
  no-ops.

`fastSeek()` goes to the nearest *keyframe*, so it is only used on all-intra
clips, where that is exact. On the GOP-12 hero rung it would snap the plate to
every half second, so those Seekers are built with `intra: false` and assign
`currentTime`. A Seeker resets on the video's `emptied` event, which fires
once per teardown, so a re-attached clip always re-seeks to the playhead.

### Particles that reverse

`lib/particles.ts` is **not a simulation**. A simulation integrates state
forward, so it cannot run backwards and it keeps moving after the visitor stops.

Instead each particle is a pure function of progress: a seed fixes its angle,
speed, size, colour and lifetime window once, and its position at progress `t`
is evaluated in closed form. Scroll back and the explosion plays in reverse,
exactly. Verified: the canvas is byte-identical arriving at a position from
either direction.

---

## Performance decisions worth knowing about

**Effect plates were once the entire frame budget.** They carry a colour grade
and a `screen` blend, so every pixel they cover is filtered and blended per
frame. At the 3.5× we first authored, one plate was compositing 5000px across.
Capped at `FX_MAX_SCALE`, with the grade moved off the transformed wrapper onto
the unscaled `<video>` so the filter runs at layout size.

**Blurring a gradient is pure waste.** The ambient rays were a 190vmax element
under `blur(70px)`. Replaced with wider colour stops — same picture, no
per-frame filter pass over the viewport.

**Masks are not free.** Transform and opacity are composited; any change to a
`mask-image` re-rasterises the whole plate. Values bound for a mask string are
quantised to ~0.4% steps, so the string repeats for several frames and the write
is skipped entirely.

**Media follows the scroll position, not the tween callbacks.** GSAP renders a
timeline backwards through every child as tweens are added to it, so each
segment's `onUpdate` fires once during construction. Hanging network work off
that requested the entire media library before the visitor had scrolled a pixel.
Attachment is driven from the ScrollTrigger's own progress instead.

**Scrubbing requires buffered media, so the lever is *when*, not *how much*.**
Only the hero clip is fetched on load — it is the LCP element and the only thing
on screen. Everything else waits for a sign the visitor intends to move
(scroll, wheel, touch, pointer, key), with a 4.5s fallback for someone who is
reading. After that the playhead pulls clips in one segment ahead.

**First paint without React.** `#boot` in `index.html` is inline-styled and
dependency-free, so something is on screen before 140kB of JS has parsed.
`#hero-still` is a real `<img>` of the first frame, which makes the LCP element
the product itself. Its geometry and `.plate-frame`'s come from the *same* CSS
custom properties (`--plate-w/h/top/fit`, declared in `index.html`) so the still
and the video can never disagree about where the plate is — and posters are
generated at each clip's **first frame**, so the handoff is invisible rather than
a jump-cut to a different moment.

**LCP ignores what covers an element, but not `display`.** An invisible steam
plate was reported as the LCP element until inactive effect layers were switched
from `visibility: hidden` to `display: none`.

---

## Media pipeline

`npm run media` — `scripts/media.sh`

Every master carries a generator ✦ watermark at a fixed position. Rather than
crop 22% of the frame away, `delogo=x=1694:y=852:w=122:h=92` removes it and the
**full 1920×1080 composition survives**. Verified numerically against all 13
clips.

Three roles on the all-intra 12fps ladder, plus the hero rung:

- **product** (the 8 dishes) — 960×540 / 640×360 for the menu page's category
  plates, **plus** the hero rung: 1920×1080 CRF 24 / 1280×720 CRF 23, 24fps,
  GOP-12, ~5.2MB / ~3.3MB a clip.
- **effect** (steam, spice, splash, ingredients) — 800×450 / 512×288. Heavily
  masked and blended. Spice **also** has a portrait rung for Crafted Fresh's
  "In the pot" plate: that plate is a fixed 4:5 `object-cover` box, which only
  ever shows the centre 4:5 of the frame, so exactly that crop is encoded at the
  master's full 1080 lines — `spice.portrait.mp4`, 864×1080, 24fps, GOP-12,
  CRF 22, 2.9MB. VMAF on the visible region rose from 30 (laptop) and 9 (phone)
  to 69. See `plateSource` in `lib/media.ts`.
- **ambient** (night café) — 960×540 / 640×360, trimmed to the street exterior.

The standard ladder is **27MB** across 13 clips, two resolutions and a
first-frame poster each. The hero rung adds 46MB (1080p) and 30MB (720p). A
visitor only ever pulls one rung, and only the clips within a segment of the
playhead.

Plates use `object-fit: contain` on desktop. Every master is a centred subject on
pure black, so letterboxing is invisible against the page — and nothing is
cropped, which keeps the steam plume and the outer ring of flying spices.

---

## Structure

```
src/
├─ lib/
│  ├─ scrub.ts         Seeker — the only code that touches currentTime
│  ├─ transitions.ts   the eight handoffs; pure functions of u → style
│  ├─ particles.ts     deterministic field; pure function of progress
│  ├─ scroll.ts        Lenis + ScrollTrigger on one shared ticker
│  ├─ media.ts         resolution ladder + connection-aware prefetch
│  └─ device.ts        capability tiering (blur radii, particle counts, DPR)
├─ components/
│  ├─ theatre/         useTheatre (the master timeline), stage.css (the box)
│  ├─ sections/        MenuPreview + four storytelling sections, lazily loaded
│  ├─ menu/            CategoryRail, CategorySection, Menu JSON-LD
│  ├─ ui/              …also ErrorBoundary around every lazy section
│  ├─ ui/              ScrubVideo — the same contract, applied to section media
│  └─ chrome/          cursor, grain, nav, intro
└─ data/
   ├─ products.ts      the eight dishes: copy, grade, key light, particles
   └─ site.ts          ← business details live here and nowhere else
```

## The menu page (`/menu/`)

A second real HTML page, not a client-side route: `menu/index.html` is its own
Vite entry (`src/menu.tsx`), so any static host serves it with no rewrite
rules, a refresh or shared link can never 404, and it carries its own title,
description and canonical URL.

**Pre-rendered at build time.** `npm run build` runs
`scripts/prerender-menu.mjs` after `vite build`: it builds
`src/entry-menu-server.tsx` for Node, renders `<MenuPage/>` to HTML, and writes
that markup plus the schema.org `Menu` JSON-LD straight into
`dist/menu/index.html`. All 125 dishes and prices are in the document before any
JavaScript runs — readable without JS and fully indexable — and React hydrates
the existing markup rather than replacing it. The dev server has no pre-render
and simply mounts the page as normal.

Cross-page links are real paths (`/menu/`, `/#visit`). On the page that already
holds the target, `lib/nav.ts` turns the click into a smooth scroll; arriving at
`/#visit` from another page skips the intro and lands on the section once the
lazy sections have laid out.

## Changing the business details

`src/data/site.ts` holds the address, phone, hours, Instagram, Facebook and the
Google review link — all taken from the client's printed menu (the social links
were decoded from its QR codes). The nav, footer, map, CTAs and both pages read
from it. The JSON-LD in `index.html` repeats the same values for search engines.

## Updating the menu

Edit `src/data/menu.ts`. The menu page, the home page's menu index, the item
and category counts, the "from $x" labels and the schema.org `Menu` data are all
generated from it. If a featured dish's price changes, update
`src/data/products.ts` too — it carries the eight theatre captions.

Transcribed from `MR.CHAIWALA MENU update.pdf`. One item was deliberately left
out: **Redbull $4.50** is in the PDF's hidden text layer but not on the printed
page. The testimonials in `site.ts` are placeholder copy and should be replaced
with real reviews before launch.

## Tuning the pacing

`PRODUCT_VH` and `OUTRO_VH` in `components/theatre/useTheatre.ts` are the only
two numbers that set how much scroll the theatre occupies. `DWELL` sets the
hold-to-handoff ratio within each segment. Everything else derives from them.

## Accessibility

100/100, and not by suppressing the design: every small-text tint sits at or
above the measured contrast floor against `#090909`, all controls meet the 24px
target minimum, the custom cursor and every scroll-driven animation are disabled
under `prefers-reduced-motion`, and copy is never revealed by animation alone —
`useSplitReveal` removes its `.split-pending` guard on every path, including the
failure ones, and the first caption is authored visible in the markup so the
hero reads even if the timeline never builds.
