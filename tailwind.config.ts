import type { Config } from 'tailwindcss'

/**
 * The palette is deliberately narrow: one near-black, one surface, one cream and
 * three metals. Anything "bright" is achieved with light (blur + opacity), never
 * with saturation.
 */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#090909',
        surface: '#151515',
        cream: '#F7EAD7',
        gold: '#C89B3C',
        copper: '#A9683A',
        umber: '#544132',
      },
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        mono: ['"Space Grotesk"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        // Fluid ramp — every heading scales with the viewport, so the layout
        // never needs a breakpoint just to stop type colliding.
        'display-xl': ['clamp(3rem, 12vw, 13rem)', { lineHeight: '0.86', letterSpacing: '-0.03em' }],
        'display-lg': ['clamp(2.55rem, 8.5vw, 8.5rem)', { lineHeight: '0.9', letterSpacing: '-0.025em' }],
        'display-md': ['clamp(2.25rem, 5.5vw, 5rem)', { lineHeight: '0.98', letterSpacing: '-0.02em' }],
        'display-sm': ['clamp(1.75rem, 3.2vw, 3rem)', { lineHeight: '1.06', letterSpacing: '-0.015em' }],
        eyebrow: ['clamp(0.6rem, 0.72vw, 0.72rem)', { lineHeight: '1', letterSpacing: '0.34em' }],
        body: ['clamp(0.95rem, 1.05vw, 1.0625rem)', { lineHeight: '1.68' }],
        'body-lg': ['clamp(1.05rem, 1.35vw, 1.375rem)', { lineHeight: '1.6' }],
      },
      spacing: { gutter: 'clamp(1.25rem, 4.5vw, 4.5rem)' },
      maxWidth: { shell: '110rem', prose: '38ch', measure: '54ch' },
      transitionTimingFunction: {
        silk: 'cubic-bezier(0.22, 1, 0.36, 1)',
        swift: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      backdropBlur: { xs: '2px' },
      zIndex: { theatre: '10', chrome: '60', cursor: '90', veil: '100' },
    },
  },
  plugins: [],
} satisfies Config
