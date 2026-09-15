import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { MenuPage } from './pages/MenuPage'
import { menuJsonLd } from './data/menuSchema'

/**
 * Build-time render of /menu/ (see scripts/prerender-menu.mjs).
 * The tree must match src/menu.tsx exactly, or hydration will mismatch.
 */
export function render() {
  return renderToString(
    <StrictMode>
      <MenuPage />
    </StrictMode>,
  )
}

/** JSON-LD, escaped so no string in the menu can close the script tag. */
export function jsonLd() {
  return JSON.stringify(menuJsonLd()).replace(/</g, '\\u003c')
}
