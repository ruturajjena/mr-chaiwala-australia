import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    cssTarget: 'safari15',
    assetsInlineLimit: 2048,
    rollupOptions: {
      // Two real HTML pages rather than a client-side router. /menu/ is a
      // static document any host can serve with no rewrite rules, it has its
      // own title, description and structured data, and a refresh or a shared
      // link can never land on a 404.
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        menu: fileURLToPath(new URL('./menu/index.html', import.meta.url)),
      },
      output: {
        // Split the animation runtime from React so the theatre chunk can be
        // fetched in parallel with hydration.
        manualChunks: {
          react: ['react', 'react-dom'],
          gsap: ['gsap'],
          motion: ['framer-motion'],
        },
      },
    },
  },
})
