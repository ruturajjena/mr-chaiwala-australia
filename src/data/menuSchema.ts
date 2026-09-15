import { MENU } from './menu'
import { SITE } from './site'

/**
 * schema.org Menu, built from the same data the page renders so the two can
 * never drift. Written into the pre-rendered /menu/ HTML at build time, so
 * crawlers see it without executing any JavaScript.
 */
export function menuJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    name: `${SITE.name} Menu`,
    url: 'https://mrchaiwala.com.au/menu/',
    inLanguage: 'en-AU',
    hasMenuSection: MENU.map((c) => ({
      '@type': 'MenuSection',
      name: c.title,
      hasMenuItem: c.groups.flatMap((g) =>
        g.items.map((it) => ({
          '@type': 'MenuItem',
          name: it.name,
          ...(it.description ? { description: it.description } : {}),
          offers: { '@type': 'Offer', price: it.price.toFixed(2), priceCurrency: 'AUD' },
        })),
      ),
    })),
  }
}
