import { scrollTo } from './scroll'

/**
 * Cross-page navigation for a two-page site.
 *
 * Links are written as real paths ("/menu/", "/#visit") so they work with no
 * JavaScript, open correctly in a new tab, and survive any static host without
 * rewrite rules. On the page that already contains the target, the click is
 * intercepted and becomes a smooth scroll instead of a reload.
 */

const isHome = () => {
  const p = window.location.pathname
  return p === '/' || p === '/index.html'
}

/** Handles a click on an internal link. Returns true if it was consumed. */
export function followLink(href: string, e?: { preventDefault: () => void }) {
  const url = new URL(href, window.location.origin)
  const samePath =
    url.pathname === window.location.pathname || (url.pathname === '/' && isHome())

  if (samePath && url.hash) {
    e?.preventDefault()
    scrollTo(url.hash, { duration: 1.5, offset: -20 })
    history.replaceState(null, '', url.hash)
    return true
  }
  if (samePath && !url.hash) {
    e?.preventDefault()
    scrollTo(0, { duration: 1.6 })
    return true
  }
  return false // let the browser navigate (and the view transition run)
}

/**
 * Arriving at "/#visit" from another page: the browser's own jump happens
 * before lazy sections exist, so it lands short. Re-run it once the page has
 * laid out, without animation, so the visitor is simply there.
 */
export function restoreHashTarget(attempts = 40) {
  const hash = window.location.hash
  if (!hash || hash.length < 2) return
  let n = 0
  const jump = (el: Element) => scrollTo(el as HTMLElement, { immediate: true, force: true, offset: -20 })
  const tryScroll = () => {
    const el = document.querySelector(hash)
    if (!el) {
      if (++n < attempts) window.setTimeout(tryScroll, 100)
      return
    }
    jump(el)
    // Sections above the target are lazy and measure themselves after mount;
    // re-anchor a few times as they settle so the visitor ends up exactly there.
    ;[250, 700, 1400].forEach((t) => window.setTimeout(() => jump(el), t))
  }
  window.setTimeout(tryScroll, 60)
}
