import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { LazyMotion, domAnimation } from 'framer-motion'
import { initScroll } from '@/lib/scroll'
import { ScrollTrigger } from '@/lib/gsap'
import { Cursor } from '@/components/chrome/Cursor'
import { Grain } from '@/components/chrome/Grain'
import { Nav } from '@/components/chrome/Nav'
import { Preloader, isFirstVisit, dismissBoot } from '@/components/chrome/Preloader'
import { HeroTheatre } from '@/components/theatre/HeroTheatre'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { restoreHashTarget } from '@/lib/nav'

/* Everything below the fold is a separate chunk. The first paint only needs the
   theatre, which is the only thing on screen for the first 550vh of scroll. */
const MenuPreview = lazy(() =>
  import('@/components/sections/MenuPreview').then((m) => ({ default: m.MenuPreview })),
)
const CraftedFresh = lazy(() =>
  import('@/components/sections/CraftedFresh').then((m) => ({ default: m.CraftedFresh })),
)
const AlwaysReady = lazy(() =>
  import('@/components/sections/AlwaysReady').then((m) => ({ default: m.AlwaysReady })),
)
const CafeExperience = lazy(() =>
  import('@/components/sections/CafeExperience').then((m) => ({ default: m.CafeExperience })),
)
const Visit = lazy(() =>
  import('@/components/sections/Visit').then((m) => ({ default: m.Visit })),
)
const Footer = lazy(() =>
  import('@/components/sections/Footer').then((m) => ({ default: m.Footer })),
)

export default function App() {
  // The intro is a first-impression, not a toll booth: it plays once per tab.
  // …and not for a deep link like /#visit: that visitor came to go somewhere.
  const [loading, setLoading] = useState(() => isFirstVisit() && window.location.hash.length < 2)
  const [docked, setDocked] = useState(false)
  const [active, setActive] = useState(0)

  useEffect(() => {
    // On a repeat visit the intro never mounts, so the first-paint frame has to
    // be cleared here instead.
    if (!loading) dismissBoot()
    initScroll()
    // The browser will otherwise restore a mid-theatre scroll position before
    // the timeline exists, which lands the visitor inside a transition.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    // …unless the visitor arrived on purpose at an anchor, e.g. /#visit from the
    // menu page, in which case take them there once the sections exist.
    if (window.location.hash.length > 1) restoreHashTarget()
    else window.scrollTo(0, 0)

    const onLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  // Sections mount lazily; each one changes the document height, so the pinned
  // theatre needs its measurements re-taken once they land.
  const onChunk = useCallback(() => {
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  const handleDock = useCallback((v: boolean) => setDocked(v), [])

  return (
    // `LazyMotion` + the `m` component ship only the DOM animation feature set
    // (~17kB gz) instead of the whole of Framer Motion (~40kB gz). Nothing here
    // needs layout projection or drag, so the rest is dead weight on first load.
    <LazyMotion features={domAnimation} strict>
      {loading && <Preloader onDone={() => setLoading(false)} />}

      <Cursor />
      <Grain />
      <Nav docked={docked} active={active} />

      <main id="top">
        <HeroTheatre onDock={handleDock} onActive={setActive} />

        <ErrorBoundary>
        <Suspense fallback={<SectionSkeleton />}>
          <Deferred onMount={onChunk}>
            <MenuPreview />
            <CraftedFresh />
            <AlwaysReady />
            <CafeExperience />
            <Visit />
            <Footer />
          </Deferred>
        </Suspense>
        </ErrorBoundary>
      </main>
    </LazyMotion>
  )
}

function Deferred({ children, onMount }: { children: React.ReactNode; onMount: () => void }) {
  useEffect(onMount, [onMount])
  return <>{children}</>
}

/** Reserves the right amount of room so the lazy chunks cause no layout shift. */
const SectionSkeleton = () => <div aria-hidden style={{ height: '100vh' }} />
