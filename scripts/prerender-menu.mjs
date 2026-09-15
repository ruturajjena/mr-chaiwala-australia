/**
 * Pre-renders /menu/ after `vite build`.
 *
 * 1. Builds src/entry-menu-server.tsx for Node with Vite's SSR mode.
 * 2. Renders <MenuPage/> to HTML and writes it into dist/menu/index.html.
 * 3. Writes the schema.org Menu JSON-LD into the same file's <head>.
 *
 * The client bundle then hydrates that markup (src/menu.tsx). The home page is
 * deliberately not pre-rendered: its first screen is a video theatre that has
 * its own static first paint in index.html.
 */
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, pathToFileURL } from 'node:url'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const outDir = path.join(root, 'dist-ssr')
const page = path.join(root, 'dist/menu/index.html')

await build({
  root,
  configFile: false,
  logLevel: 'warn',
  plugins: [react()],
  resolve: { alias: { '@': path.join(root, 'src') } },
  build: {
    ssr: path.join(root, 'src/entry-menu-server.tsx'),
    outDir,
    emptyOutDir: true,
    minify: false,
  },
})

const entry = (await fs.readdir(outDir)).find((f) => /^entry-menu-server\.(m?js)$/.test(f))
if (!entry) throw new Error('prerender: SSR entry not found in dist-ssr')
const { render, jsonLd } = await import(pathToFileURL(path.join(outDir, entry)).href)

let html = await fs.readFile(page, 'utf8')
if (!html.includes('<div id="root"></div>')) throw new Error('prerender: empty #root not found in dist/menu/index.html')

const markup = render()
html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`)
html = html.replace('</head>', `    <script type="application/ld+json">${jsonLd()}</script>\n  </head>`)
await fs.writeFile(page, html)
await fs.rm(outDir, { recursive: true, force: true })

console.log(`prerendered /menu/: ${(markup.length / 1024).toFixed(1)} kB of markup, JSON-LD included`)
