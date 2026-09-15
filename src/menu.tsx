import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { MenuPage } from './pages/MenuPage'
import './index.css'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <MenuPage />
  </StrictMode>
)

// Production ships this page pre-rendered, so the menu is readable (and
// indexable) before any JavaScript runs; React then attaches to that markup.
// The dev server has no pre-render, so it falls back to a normal mount.
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
